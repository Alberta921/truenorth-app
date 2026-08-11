import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendEmail, buildSupplierOrderEmail, buildManagerProcurementEmail } from '@/lib/email/send-email'
import { addDays, format } from 'date-fns'

// GET /api/procurement — run daily by Vercel Cron (see vercel.json).
// Secured with CRON_SECRET so it can't be triggered by randoms.
//
// Logic: for every tenant with auto-ordering on, find visits scheduled
// within the lead-time window that don't have parts on order yet, work
// out what parts each piece of equipment on that visit needs (from
// equipment_parts), group by supplier, and email each supplier the order.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const results: Record<string, unknown>[] = []

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, manager_email')
    .eq('auto_procurement_enabled', true)

  for (const tenant of tenants ?? []) {
    const { data: tenantRow } = await supabase
      .from('tenants')
      .select('procurement_lead_days')
      .eq('id', tenant.id)
      .single()
    const leadDays = tenantRow?.procurement_lead_days ?? 5
    const cutoff = format(addDays(new Date(), leadDays), 'yyyy-MM-dd')

    const { data: visits } = await supabase
      .from('maintenance_visits')
      .select('id, facility_id, scheduled_date, season, facilities(name)')
      .eq('tenant_id', tenant.id)
      .eq('status', 'scheduled')
      .lte('scheduled_date', cutoff)
      .gte('scheduled_date', format(new Date(), 'yyyy-MM-dd'))

    for (const visit of visits ?? []) {
      // Already ordered for this visit? Skip (unique index also protects this).
      const { data: existingOrders } = await supabase
        .from('procurement_orders')
        .select('id')
        .eq('visit_id', visit.id)
      if (existingOrders && existingOrders.length > 0) continue

      // Which equipment is at this facility, and what parts does each need?
      const { data: equipment } = await supabase
        .from('equipment')
        .select('id')
        .eq('facility_id', visit.facility_id)
        .eq('is_active', true)

      const equipmentIds = (equipment ?? []).map((e) => e.id)
      if (equipmentIds.length === 0) continue

      const { data: neededParts } = await supabase
        .from('equipment_parts')
        .select('quantity_per_service, applies_seasons, part:parts_catalog(id, name, part_number, supplier_id, cost_price)')
        .in('equipment_id', equipmentIds)

      const relevant = (neededParts ?? []).filter((np: any) =>
        np.applies_seasons?.includes(visit.season)
      )
      if (relevant.length === 0) continue

      // Group by supplier
      const bySupplier = new Map<string, any[]>()
      for (const np of relevant as any[]) {
        const supplierId = np.part?.supplier_id ?? 'unassigned'
        if (!bySupplier.has(supplierId)) bySupplier.set(supplierId, [])
        bySupplier.get(supplierId)!.push(np)
      }

      for (const [supplierId, items] of bySupplier) {
        if (supplierId === 'unassigned') continue // needs manual assignment first

        const { data: supplier } = await supabase
          .from('supplier_contacts')
          .select('*')
          .eq('id', supplierId)
          .single()
        if (!supplier?.order_email) continue

        const orderItems = items.map((i: any) => ({
          part_id: i.part.id,
          name: i.part.name,
          part_number: i.part.part_number,
          quantity: i.quantity_per_service,
          cost_price: i.part.cost_price,
        }))

        const { data: order } = await supabase
          .from('procurement_orders')
          .insert({
            tenant_id: tenant.id,
            visit_id: visit.id,
            supplier_id: supplierId,
            order_items: orderItems,
            status: 'sent',
            sent_at: new Date().toISOString(),
            needed_by_date: visit.scheduled_date,
          })
          .select()
          .single()

        const facilityName = (visit as any).facilities?.name ?? 'facility'

        await sendEmail({
          to: supplier.order_email,
          fromName: tenant.name,
          subject: `Parts order — ${facilityName} — needed by ${visit.scheduled_date}`,
          html: buildSupplierOrderEmail({
            tenantName: tenant.name,
            accountNumber: supplier.account_number,
            facilityName,
            neededByDate: visit.scheduled_date,
            items: orderItems,
          }),
        })

        if (tenant.manager_email) {
          await sendEmail({
            to: tenant.manager_email,
            fromName: tenant.name,
            subject: `Parts ordered for ${facilityName} — call in PO`,
            html: buildManagerProcurementEmail({
              supplierName: supplier.name,
              supplierPhone: supplier.order_phone,
              accountNumber: supplier.account_number,
              facilityName,
              confirmUrl: `${process.env.NEXT_PUBLIC_APP_URL}/procurement/${order?.id}`,
            }),
          })
        }

        results.push({ tenant: tenant.name, visit: visit.id, supplier: supplier.name, itemCount: orderItems.length })
      }
    }
  }

  return NextResponse.json({ ok: true, orders: results })
}
