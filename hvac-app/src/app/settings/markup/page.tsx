'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Save, Plus, Trash2, Loader2, Check } from 'lucide-react'
import { DEFAULT_MARKUP_TIERS } from '@/lib/pricing/markup'

interface TierRow { id?: string; min_cost: string; max_cost: string; multiplier: string }

export default function MarkupSettingsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [tenantId, setTenantId] = useState('')
  const [tiers, setTiers] = useState<TierRow[]>([])
  const [rates, setRates] = useState({
    default_regular_rate: '125', default_overtime_rate: '165', default_weekend_rate: '175',
    default_emergency_rate: '195', default_holiday_rate: '220',
  })

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user!.id).single()
    setTenantId(profile!.tenant_id)

    const { data: existing } = await supabase
      .from('markup_tiers')
      .select('*')
      .eq('tenant_id', profile!.tenant_id)
      .order('sort_order')

    if (existing && existing.length > 0) {
      setTiers(existing.map((t: any) => ({
        id: t.id,
        min_cost: String(t.min_cost),
        max_cost: t.max_cost === null ? '' : String(t.max_cost),
        multiplier: String(t.multiplier),
      })))
    } else {
      // Seed with True North's default sliding scale — nothing saved yet
      setTiers(DEFAULT_MARKUP_TIERS.map((t) => ({
        min_cost: String(t.min_cost),
        max_cost: t.max_cost === null ? '' : String(t.max_cost),
        multiplier: String(t.multiplier),
      })))
    }

    const { data: tenant } = await supabase.from('tenants').select('*').eq('id', profile!.tenant_id).single()
    if (tenant) {
      setRates({
        default_regular_rate: String(tenant.default_regular_rate ?? 125),
        default_overtime_rate: String(tenant.default_overtime_rate ?? 165),
        default_weekend_rate: String(tenant.default_weekend_rate ?? 175),
        default_emergency_rate: String(tenant.default_emergency_rate ?? 195),
        default_holiday_rate: String(tenant.default_holiday_rate ?? 220),
      })
    }
    setLoading(false)
  }

  function updateTier(idx: number, field: keyof TierRow, value: string) {
    setTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, [field]: value } : t)))
  }

  function addTier() {
    setTiers((prev) => [...prev, { min_cost: '', max_cost: '', multiplier: '' }])
  }

  function removeTier(idx: number) {
    setTiers((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSave() {
    setSaving(true)

    // Replace the whole tier set: delete then re-insert in order.
    // Simplest way to keep sort_order correct without diffing.
    await supabase.from('markup_tiers').delete().eq('tenant_id', tenantId)
    const rows = tiers
      .filter((t) => t.min_cost !== '' && t.multiplier !== '')
      .map((t, i) => ({
        tenant_id: tenantId,
        min_cost: parseFloat(t.min_cost),
        max_cost: t.max_cost === '' ? null : parseFloat(t.max_cost),
        multiplier: parseFloat(t.multiplier),
        sort_order: i,
      }))
    if (rows.length > 0) {
      await supabase.from('markup_tiers').insert(rows)
    }

    await supabase.from('tenants').update({
      default_regular_rate: parseFloat(rates.default_regular_rate) || null,
      default_overtime_rate: parseFloat(rates.default_overtime_rate) || null,
      default_weekend_rate: parseFloat(rates.default_weekend_rate) || null,
      default_emergency_rate: parseFloat(rates.default_emergency_rate) || null,
      default_holiday_rate: parseFloat(rates.default_holiday_rate) || null,
    }).eq('id', tenantId)

    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 3000)
    load()
  }

  if (loading) return <div className="flex items-center justify-center min-h-64"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/settings" className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Settings
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Markup & Labour Rates</h1>
        <p className="text-gray-500 text-sm mt-1">This is what actually prices every part in the catalog — editable anytime, no code changes needed</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-1">Parts Markup Tiers</h2>
        <p className="text-xs text-gray-400 mb-4">Sliding scale by cost — cheaper parts get marked up more, expensive equipment gets a tighter margin</p>

        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-gray-500 mb-2">
          <span>Min cost ($)</span><span>Max cost ($, blank = no limit)</span><span>Multiplier</span><span></span>
        </div>
        {tiers.map((t, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2">
            <input type="number" step="0.01" className="border rounded-lg px-2 py-1.5 text-sm" value={t.min_cost}
              onChange={(e) => updateTier(idx, 'min_cost', e.target.value)} />
            <input type="number" step="0.01" placeholder="No limit" className="border rounded-lg px-2 py-1.5 text-sm" value={t.max_cost}
              onChange={(e) => updateTier(idx, 'max_cost', e.target.value)} />
            <input type="number" step="0.1" className="border rounded-lg px-2 py-1.5 text-sm" value={t.multiplier}
              onChange={(e) => updateTier(idx, 'multiplier', e.target.value)} />
            <button onClick={() => removeTier(idx)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        <button onClick={addTier} className="flex items-center gap-1 text-sm text-blue-600 mt-2">
          <Plus className="w-4 h-4" /> Add tier
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Default Labour Rates ($/hr)</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries({
            default_regular_rate: 'Regular', default_overtime_rate: 'Overtime',
            default_weekend_rate: 'Weekend', default_emergency_rate: 'Emergency',
            default_holiday_rate: 'Holiday',
          }).map(([key, label]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm"
                value={(rates as any)[key]} onChange={(e) => setRates({ ...rates, [key]: e.target.value })} />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">Override per facility under Facilities → [Name] → Labour Rates</p>
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 bg-[#193140] text-white py-3 rounded-xl font-semibold disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved' : saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  )
}
