import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import OrderStatusControl from './OrderStatusControl'

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
  if (!profile || profile.role === 'client') redirect('/dashboard')

  const { data: order } = await supabase
    .from('parts_orders')
    .select('*, facility:facilities(name, contact_email, contact_phone)')
    .eq('id', params.id)
    .single()

  if (!order) notFound()

  const isAdmin = ['company_admin', 'super_admin'].includes(profile.role)

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{order.facility?.name}</h1>
        <p className="text-sm text-gray-500 mb-4">Ordered {new Date(order.created_at).toLocaleDateString()}</p>

        <table className="w-full text-sm mb-4">
          <thead className="text-gray-400 text-xs uppercase">
            <tr><th className="text-left py-2">Part</th><th className="text-right">Qty</th><th className="text-right">Sell</th><th className="text-right">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(order.order_items ?? []).map((i: any, idx: number) => (
              <tr key={idx}>
                <td className="py-2">{i.name}</td>
                <td className="text-right">{i.quantity}</td>
                <td className="text-right">${Number(i.sell_price).toFixed(2)}</td>
                <td className="text-right">${Number(i.line_total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="text-right font-bold text-gray-900 mb-4">Client pays: ${Number(order.subtotal).toFixed(2)}</p>

        {isAdmin && (
          <p className="text-right text-sm text-gray-500 mb-4">
            Cost: ${Number(order.total_cost ?? 0).toFixed(2)} · Margin: ${Number(order.total_margin ?? 0).toFixed(2)}
            <br /><span className="text-xs text-gray-400">(Enter after you order these parts from your supplier)</span>
          </p>
        )}

        <OrderStatusControl orderId={order.id} currentStatus={order.status} isAdmin={isAdmin} />
      </div>
    </div>
  )
}
