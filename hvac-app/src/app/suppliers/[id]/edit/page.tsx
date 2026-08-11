'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditSupplierPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    name: '', category: 'hvac', account_number: '', rep_name: '',
    order_email: '', order_phone: '', website: '', ships_to_site: false,
    is_default_hvac: false, is_default_plumbing: false, notes: '',
  })

  useEffect(() => {
    supabase.from('supplier_contacts').select('*').eq('id', params.id).single().then(({ data }) => {
      if (data) setForm(data)
      setLoading(false)
    })
  }, [params.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('supplier_contacts').update(form).eq('id', params.id)
    router.push('/suppliers')
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 max-w-lg mx-auto">
      <Link href="/suppliers" className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Suppliers
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Supplier</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input required placeholder="Supplier name" className="w-full border rounded-lg px-3 py-2"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className="w-full border rounded-lg px-3 py-2" value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="hvac">HVAC</option>
          <option value="plumbing">Plumbing</option>
          <option value="refrigeration">Refrigeration</option>
          <option value="general">General</option>
        </select>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Your account number with this supplier</label>
          <input placeholder="Account number" className="w-full border rounded-lg px-3 py-2"
            value={form.account_number ?? ''} onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
        </div>
        <input placeholder="Rep name" className="w-full border rounded-lg px-3 py-2"
          value={form.rep_name ?? ''} onChange={(e) => setForm({ ...form, rep_name: e.target.value })} />
        <input type="email" placeholder="Order email — orders get sent here" className="w-full border rounded-lg px-3 py-2"
          value={form.order_email ?? ''} onChange={(e) => setForm({ ...form, order_email: e.target.value })} />
        <input placeholder="Order phone" className="w-full border rounded-lg px-3 py-2"
          value={form.order_phone ?? ''} onChange={(e) => setForm({ ...form, order_phone: e.target.value })} />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.is_default_hvac}
            onChange={(e) => setForm({ ...form, is_default_hvac: e.target.checked })} />
          Default supplier for HVAC parts
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.is_default_plumbing}
            onChange={(e) => setForm({ ...form, is_default_plumbing: e.target.checked })} />
          Default supplier for plumbing parts
        </label>
        <textarea placeholder="Notes" className="w-full border rounded-lg px-3 py-2"
          value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button disabled={saving} className="w-full bg-[#193140] text-white py-2.5 rounded-lg font-medium disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
