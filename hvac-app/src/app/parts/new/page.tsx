'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateSellPrice, DEFAULT_MARKUP_TIERS, type MarkupTier } from '@/lib/pricing/markup'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewPartPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [tenantId, setTenantId] = useState('')
  const [tiers, setTiers] = useState<MarkupTier[]>(DEFAULT_MARKUP_TIERS)
  const [form, setForm] = useState({
    name: '', part_number: '', supplier_part_number: '', manufacturer: '',
    category: 'filter', supplier_id: '', cost_price: '', unit: 'each',
    lead_time_days: 3, in_stock: true,
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      setTenantId(profile?.tenant_id ?? '')
      const { data } = await supabase.from('supplier_contacts').select('id, name').eq('tenant_id', profile?.tenant_id)
      setSuppliers(data ?? [])

      // Use the tenant's saved markup tiers if they've customized them
      // in Settings → Markup; otherwise fall back to the built-in default.
      const { data: savedTiers } = await supabase
        .from('markup_tiers')
        .select('min_cost, max_cost, multiplier')
        .eq('tenant_id', profile?.tenant_id)
        .order('sort_order')
      if (savedTiers && savedTiers.length > 0) {
        setTiers(savedTiers.map((t: any) => ({ min_cost: Number(t.min_cost), max_cost: t.max_cost === null ? null : Number(t.max_cost), multiplier: Number(t.multiplier) })))
      }
    })
  }, [])

  const preview = useMemo(() => {
    const cost = parseFloat(form.cost_price)
    if (isNaN(cost) || cost <= 0) return null
    return calculateSellPrice(cost, tiers)
  }, [form.cost_price, tiers])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
    const cost = parseFloat(form.cost_price) || 0
    const result = calculateSellPrice(cost, tiers)
    await supabase.from('parts_catalog').insert({
      ...form,
      supplier_id: form.supplier_id || null,
      cost_price: cost,
      sell_price: result.sellPrice,
      markup_pct: result.markupPct,
      tenant_id: profile?.tenant_id,
    })
    router.push('/parts')
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <Link href="/parts" className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Parts
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Part</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input required placeholder="Name (e.g. 16x25x4 MERV-11 Filter)" className="w-full border rounded-lg px-3 py-2"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <select className="w-full border rounded-lg px-3 py-2" value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}>
          <option value="filter">Filter</option>
          <option value="belt">Belt</option>
          <option value="refrigerant">Refrigerant</option>
          <option value="electrical">Electrical</option>
          <option value="plumbing_part">Plumbing Part</option>
          <option value="valve">Valve</option>
          <option value="pump">Pump</option>
          <option value="other">Other</option>
        </select>
        <select className="w-full border rounded-lg px-3 py-2" value={form.supplier_id}
          onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
          <option value="">No supplier assigned</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input placeholder="Our part number" className="w-full border rounded-lg px-3 py-2"
          value={form.part_number} onChange={(e) => setForm({ ...form, part_number: e.target.value })} />
        <input placeholder="Supplier's part number" className="w-full border rounded-lg px-3 py-2"
          value={form.supplier_part_number} onChange={(e) => setForm({ ...form, supplier_part_number: e.target.value })} />
        <input type="number" step="0.01" required placeholder="Cost price ($)" className="w-full border rounded-lg px-3 py-2"
          value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
        {preview && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-900">
            Sell price: <strong>${preview.sellPrice.toFixed(2)}</strong> ({preview.multiplier}× — {preview.tier.min_cost}–{preview.tier.max_cost ?? '∞'} tier), margin ${preview.margin.toFixed(2)}
          </div>
        )}
        <button disabled={saving} className="w-full bg-[#193140] text-white py-2.5 rounded-lg font-medium disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Part'}
        </button>
      </form>
    </div>
  )
}
