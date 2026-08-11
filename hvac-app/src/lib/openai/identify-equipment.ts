import OpenAI from 'openai'
import type { EquipmentIdentificationResult, EquipmentType } from '@/types'

export async function identifyEquipmentFromPhoto(
  imageUrl: string,
  apiKey: string
): Promise<EquipmentIdentificationResult> {
  const client = new OpenAI({ apiKey })

  const prompt = `You are an expert HVAC technician. Analyze this equipment nameplate/unit photo and extract all information you can see.

Return a JSON object with these exact fields:
{
  "equipment_type": one of: RTU, SPLIT_SYSTEM, AHU, FURNACE, BOILER, MAU, EXHAUST_FAN, MINI_SPLIT, HEAT_PUMP, WALK_IN_COOLER, WALK_IN_FREEZER, REACH_IN, CHILLER, COOLING_TOWER, UNIT_HEATER, PTAC, VRF, OTHER,
  "manufacturer": "brand name if visible",
  "model_number": "model number if visible",
  "serial_number": "serial number if visible",
  "tonnage": number (e.g. 5 for 5-ton) or null,
  "btu_capacity": number (e.g. 60000) or null,
  "voltage": "voltage if visible (e.g. 208/230V 3-phase)" or null,
  "refrigerant_type": "R-410A" etc or null,
  "year": "year of manufacture if determinable from serial" or null,
  "confidence": "high" if nameplate clearly visible, "medium" if partially visible, "low" if guessing from unit shape only,
  "notes": "any other relevant observations about the equipment condition or identification"
}

Common tonnage indicators: 024=2ton, 030=2.5ton, 036=3ton, 042=3.5ton, 048=4ton, 060=5ton in model numbers.
For York: model numbers often contain tonnage directly.
Respond with ONLY valid JSON, no markdown, no explanation.`

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
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  try {
    const result = JSON.parse(content.trim()) as EquipmentIdentificationResult
    return result
  } catch {
    throw new Error('Failed to parse equipment identification response')
  }
}

export async function uploadImageToSupabase(
  file: File,
  supabaseUrl: string,
  supabaseKey: string,
  bucket: string,
  path: string
): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${bucket}/${path}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: formData,
    }
  )

  if (!response.ok) {
    throw new Error('Failed to upload image')
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`
}
