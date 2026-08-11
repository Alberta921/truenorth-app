import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Truck, Mail, Phone } from 'lucide-react'

export default async function SuppliersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('tenant_id, role').eq('id', user.id).single()
  if (!profile || profile.role === 'client') redirect('/dashboard')

  const { data: suppliers } = await supabase
    .from('supplier_contacts')
    .select('*')
    .eq('tenant_id', profile.tenant_id)
    .order('name')

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-500 text-sm mt-1">Where parts get pre-ordered from, ahead of each visit</p>
        </div>
        <Link href="/suppliers/new" className="flex items-center gap-2 bg-[#193140] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1e3d52] transition-colors">
          <Plus className="w-4 h-4" /> Add Supplier
        </Link>
      </div>

      {!suppliers || suppliers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-600 font-medium mb-2">No suppliers yet</h3>
          <p className="text-gray-400 text-sm mb-6">Add BGE Filters, Sinclair Supply, Wolseley, or any supplier you order from</p>
          <Link href="/suppliers/new" className="inline-flex items-center gap-2 bg-[#193140] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1e3d52] transition-colors">
            <Plus className="w-4 h-4" /> Add First Supplier
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {suppliers.map((s: any) => (
            <Link key={s.id} href={`/suppliers/${s.id}/edit`} className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mt-0.5">{s.category}</p>
                </div>
                <div className="flex gap-2">
                  {s.is_default_hvac && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">Default HVAC</span>}
                  {s.is_default_plumbing && <span className="text-xs bg-teal-50 text-teal-600 px-2 py-1 rounded-full">Default Plumbing</span>}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                {s.order_email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{s.order_email}</span>}
                {s.order_phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{s.order_phone}</span>}
                {s.account_number && <span>Acct: {s.account_number}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
