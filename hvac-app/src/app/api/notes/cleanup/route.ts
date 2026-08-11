import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

// Takes a technician's raw spoken/typed notes and turns them into a
// professional service-report paragraph. Tech should still review and
// edit before the report goes out — this drafts, it doesn't finalize.
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
  const { data: tenant } = await supabase.from('tenants').select('openai_api_key').eq('id', profile?.tenant_id).single()

  if (!tenant?.openai_api_key) {
    return NextResponse.json({ error: 'No OpenAI API key configured in Settings' }, { status: 400 })
  }

  const { rawText, context } = await request.json()
  if (!rawText) return NextResponse.json({ error: 'rawText is required' }, { status: 400 })

  const openai = new OpenAI({ apiKey: tenant.openai_api_key })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content:
          'You rewrite an HVAC/plumbing technician\'s spoken field notes into a concise, professional maintenance-report paragraph. Keep every technical detail and reading the tech mentioned. Do not invent findings. Use trade-appropriate language. Output only the rewritten paragraph, no preamble.',
      },
      {
        role: 'user',
        content: `${context ? `Equipment context: ${context}\n\n` : ''}Raw notes: ${rawText}`,
      },
    ],
    max_tokens: 400,
  })

  const cleaned = completion.choices[0]?.message?.content?.trim()
  return NextResponse.json({ cleaned })
}
