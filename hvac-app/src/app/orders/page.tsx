import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700', confirmed: 'bg-blue-50 text-blue-700',
  ordered: 'bg-purple-50 text-purple-700', fulfilled: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
}

export default async function OrdersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
  if (!profile || profile.role === 'client') redirect('/dashboard')

  const { data: orders } = await supabase
    .from('parts_orders')
    .select('*, facility:facilities(name)')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Client Parts Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Orders placed by clients through their portal, at your sell price</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-600 font-medium">No client orders yet</h3>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map((o: any) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300">
              <div>
                <p className="font-semibold text-gray-900">{o.facility?.name}</p>
                <p className="text-sm text-gray-500">{o.order_items?.length ?? 0} item(s) · ${Number(o.subtotal).toFixed(2)}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLE[o.status]}`}>{o.status}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
