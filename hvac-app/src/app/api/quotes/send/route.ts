import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, buildQuoteEmailHTML } from '@/lib/email/send-email'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { quoteId } = await request.json()
  const { data: quote } = await supabase
    .from('quotes')
    .select('*, facility:facilities(name, contact_email), tenant:tenants(name)')
    .eq('id', quoteId)
    .single()

  if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  if (!quote.facility?.contact_email) {
    return NextResponse.json({ error: 'Facility has no contact email on file' }, { status: 400 })
  }

  await sendEmail({
    to: quote.facility.contact_email,
    fromName: quote.tenant?.name ?? 'Maintenance Manager',
    subject: `Quote ${quote.quote_number} for ${quote.facility.name}`,
    html: buildQuoteEmailHTML({
      facilityName: quote.facility.name,
      lineItems: quote.line_items,
      subtotal: Number(quote.subtotal),
      gst: Number(quote.gst),
      total: Number(quote.total),
      portalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/client/portal`,
    }),
  })

  await supabase.from('quotes').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', quoteId)

  return NextResponse.json({ ok: true })
}
