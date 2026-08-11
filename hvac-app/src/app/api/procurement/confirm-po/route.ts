import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { orderId, poNumber } = await request.json()
  if (!orderId || !poNumber) {
    return NextResponse.json({ error: 'orderId and poNumber are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('procurement_orders')
    .update({
      po_number: poNumber,
      po_confirmed_at: new Date().toISOString(),
      po_confirmed_by: user.id,
      status: 'po_confirmed',
    })
    .eq('id', orderId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ order: data })
}
