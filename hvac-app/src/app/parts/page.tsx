import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Package } from 'lucide-react'

export default async function PartsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
  if (!profile || profile.role === 'client') redirect('/dashboard')

  // Admins see cost/margin; technicians see the same query but the UI
  // below only renders cost columns for company_admin/super_admin —
  // matching the privacy rule that cost is never shown to techs by default.
  const { data: parts } = await supabase
    .from('parts_catalog')
    .select('*, supplier:supplier_contacts(name)')
    .eq('tenant_id', profile.tenant_id)
    .order('name')

  const isAdmin = ['company_admin', 'super_admin'].includes(profile.role)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parts Catalog</h1>
          <p className="text-gray-500 text-sm mt-1">Filters, belts, and parts you stock or regularly order</p>
        </div>
        <div className="flex gap-2">
        <Link href="/parts/new" className="flex items-center gap-2 bg-[#193140] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e3d52] transition-colors">
          <Plus className="w-4 h-4" /> Add Part
        </Link>
        <Link href="/parts/order" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Order Parts
        </Link>
        </div>
      </div>

      {!parts || parts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-600 font-medium mb-2">No parts yet</h3>
          <p className="text-gray-400 text-sm mb-6">Add filters, belts, and parts — then attach them to equipment so the app can pre-order automatically</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Part</th>
                <th className="text-left px-4 py-3">Supplier</th>
                <th className="text-left px-4 py-3">Sell Price</th>
                {isAdmin && <th className="text-left px-4 py-3">Cost</th>}
                {isAdmin && <th className="text-left px-4 py-3">Margin</th>}
                <th className="text-left px-4 py-3">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parts.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.part_number}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.supplier?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-900">${Number(p.sell_price ?? 0).toFixed(2)}</td>
                  {isAdmin && <td className="px-4 py-3 text-gray-600">${Number(p.cost_price ?? 0).toFixed(2)}</td>}
                  {isAdmin && <td className="px-4 py-3 text-green-700">${(Number(p.sell_price ?? 0) - Number(p.cost_price ?? 0)).toFixed(2)}</td>}
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.in_stock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {p.in_stock ? 'In stock' : 'Out of stock'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
