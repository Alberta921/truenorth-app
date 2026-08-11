import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, buildSupplierOrderEmail } from '@/lib/email/send-email'

// POST { items: [{ part_id, quantity }], facilityId?, neededByDate? }
// Splits the cart by supplier and places one order + one email per
// supplier, referencing that supplier's account number.
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
  if (!profile || !['company_admin', 'technician', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { items, facilityId, neededByDate } = await request.json()
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const { data: tenant } = await supabase.from('tenants').select('name').eq('id', profile.tenant_id).single()

  // Pull full part records (server-side, so cost prices never travel
  // through the client cart payload for a non-admin session).
  const partIds = items.map((i: any) => i.part_id)
  const { data: parts } = await supabase
    .from('parts_catalog')
    .select('id, name, part_number, supplier_id, cost_price')
    .in('id', partIds)
    .eq('tenant_id', profile.tenant_id)

  const bySupplier = new Map<string, any[]>()
  for (const item of items) {
    const part = parts?.find((p) => p.id === item.part_id)
    if (!part || !part.supplier_id) continue
    if (!bySupplier.has(part.supplier_id)) bySupplier.set(part.supplier_id, [])
    bySupplier.get(part.supplier_id)!.push({
      part_id: part.id,
      name: part.name,
      part_number: part.part_number,
      quantity: item.quantity,
      cost_price: part.cost_price,
    })
  }

  if (bySupplier.size === 0) {
    return NextResponse.json({ error: 'None of these parts have a supplier assigned yet — set one in the Parts Catalog first.' }, { status: 400 })
  }

  const placedOrders = []
  const needed = neededByDate || new Date().toISOString().split('T')[0]

  for (const [supplierId, orderItems] of bySupplier) {
    const { data: supplier } = await supabase.from('supplier_contacts').select('*').eq('id', supplierId).single()
    if (!supplier?.order_email) {
      placedOrders.push({ supplier: supplier?.name ?? supplierId, status: 'skipped', reason: 'No order email on file for this supplier' })
      continue
    }

    const { data: facility } = facilityId
      ? await supabase.from('facilities').select('name').eq('id', facilityId).single()
      : { data: null }

    const { data: order } = await supabase
      .from('procurement_orders')
      .insert({
        tenant_id: profile.tenant_id,
        supplier_id: supplierId,
        facility_id: facilityId || null,
        order_type: 'manual',
        order_items: orderItems,
        status: 'sent',
        sent_at: new Date().toISOString(),
        needed_by_date: needed,
        placed_by: user.id,
      })
      .select()
      .single()

    await sendEmail({
      to: supplier.order_email,
      fromName: tenant?.name ?? 'Maintenance Manager',
      subject: `Parts order${facility ? ` — ${facility.name}` : ''} — Account ${supplier.account_number ?? 'on file'}`,
      html: buildSupplierOrderEmail({
        tenantName: tenant?.name ?? '',
        accountNumber: supplier.account_number,
        facilityName: facility?.name ?? 'Shop / stock order',
        neededByDate: needed,
        items: orderItems,
      }),
    })

    placedOrders.push({ supplier: supplier.name, status: 'sent', orderId: order?.id, itemCount: orderItems.length })
  }

  return NextResponse.json({ ok: true, orders: placedOrders })
}
