import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import type { EquipmentIdentificationResult, EquipmentType } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data: tenant } = await supabase.from('tenants').select('openai_api_key').eq('id', profile.tenant_id).single()
    if (!tenant?.openai_api_key) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add it in Settings.' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null
    const imageData = formData.get('imageData') as string | null

    let imageUrl: string

    if (imageFile) {
      // Upload to Supabase storage temporarily
      const ext = imageFile.name.split('.').pop() || 'jpg'
      const path = `${profile.tenant_id}/ai-temp/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('equipment-photos')
        .upload(path, imageFile)

      if (uploadError) throw new Error('Failed to upload image for analysis')

      const { data: { publicUrl } } = supabase.storage.from('equipment-photos').getPublicUrl(path)
      imageUrl = publicUrl
    } else if (imageData) {
      imageUrl = imageData // base64 data URL works with OpenAI
    } else {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const client = new OpenAI({ apiKey: tenant.openai_api_key })

    const prompt = `You are an expert HVAC technician. Analyze this equipment nameplate/unit photo and extract all visible information.

Return ONLY a valid JSON object (no markdown, no explanation) with these exact fields:
{
  "equipment_type": one of: RTU, SPLIT_SYSTEM, AHU, FURNACE, BOILER, MAU, EXHAUST_FAN, MINI_SPLIT, HEAT_PUMP, WALK_IN_COOLER, WALK_IN_FREEZER, REACH_IN, CHILLER, COOLING_TOWER, UNIT_HEATER, PTAC, VRF, OTHER,
  "manufacturer": "brand name" or null,
  "model_number": "model number" or null,
  "serial_number": "serial number" or null,
  "tonnage": number (e.g. 5.0) or null,
  "btu_capacity": integer (e.g. 60000) or null,
  "voltage": "e.g. 208/230V 3-phase" or null,
  "refrigerant_type": "e.g. R-410A" or null,
  "year": "manufacture year if determinable" or null,
  "confidence": "high" or "medium" or "low",
  "notes": "any observations" or null
}

Tonnage hints: look for tons in model number. Common: 024=2T, 030=2.5T, 036=3T, 042=3.5T, 048=4T, 060=5T.`

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
    })

    const content = response.choices[0]?.message?.content
    if (!content) throw new Error('No response from AI')

    const result = JSON.parse(content.trim()) as EquipmentIdentificationResult
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('Equipment identification error:', err)
    return NextResponse.json(
      { error: err.message || 'Identification failed' },
      { status: 500 }
    )
  }
}
