import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Package, Clock, CheckCircle2 } from 'lucide-react'
import ConfirmPOForm from './ConfirmPOForm'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', sent: 'Sent to supplier', po_confirmed: 'PO confirmed',
  received: 'Received', cancelled: 'Cancelled',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600', sent: 'bg-amber-50 text-amber-700',
  po_confirmed: 'bg-blue-50 text-blue-700', received: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}

export default async function ProcurementPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
  if (!profile || profile.role === 'client') redirect('/dashboard')

  const { data: orders } = await supabase
    .from('procurement_orders')
    .select('*, supplier:supplier_contacts(name, order_phone), visit:maintenance_visits(scheduled_date, season, facility:facilities(name))')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Parts Pre-Orders</h1>
        <p className="text-gray-500 text-sm mt-1">
          Automatically ordered ahead of scheduled visits so parts are on hand when the tech arrives
        </p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-600 font-medium mb-2">No pre-orders yet</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Once equipment has parts attached and visits are scheduled, orders will appear here automatically each morning.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map((o: any) => (
            <div key={o.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{o.visit?.facility?.name ?? 'Unknown facility'}</p>
                  <p className="text-xs text-gray-400">
                    {o.supplier?.name} · needed by {o.needed_by_date} · {o.order_items?.length ?? 0} item(s)
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[o.status]}`}>
                  {STATUS_LABELS[o.status]}
                </span>
              </div>
              <ul className="text-sm text-gray-600 mb-3 list-disc list-inside">
                {(o.order_items ?? []).map((it: any, i: number) => (
                  <li key={i}>{it.name} × {it.quantity}</li>
                ))}
              </ul>
              {o.status === 'sent' && (
                <ConfirmPOForm orderId={o.id} />
              )}
              {o.po_number && (
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> PO {o.po_number}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
