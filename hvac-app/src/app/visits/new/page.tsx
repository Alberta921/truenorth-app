'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getCurrentSeason } from '@/lib/maintenance/checklists'
import { SEASON_LABELS } from '@/types'
import type { Season } from '@/types'

export default function NewVisitPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [facilities, setFacilities] = useState<any[]>([])
  const [technicians, setTechnicians] = useState<any[]>([])
  const [form, setForm] = useState({
    facility_id: '', season: getCurrentSeason() as Season,
    scheduled_date: '', technician_id: '', notes: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      const { data: fac } = await supabase.from('facilities').select('id, name').eq('tenant_id', profile?.tenant_id).eq('is_active', true).order('name')
      setFacilities(fac ?? [])
      const { data: techs } = await supabase.from('users').select('id, full_name').eq('tenant_id', profile?.tenant_id).eq('role', 'technician')
      setTechnicians(techs ?? [])
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()

    const { data: visit } = await supabase.from('maintenance_visits').insert({
      tenant_id: profile?.tenant_id,
      facility_id: form.facility_id,
      season: form.season,
      scheduled_date: form.scheduled_date,
      technician_id: form.technician_id || null,
      notes: form.notes || null,
      status: 'scheduled',
    }).select().single()

    router.push(`/visits/${visit?.id}`)
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <Link href="/visits" className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Visits
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Schedule Visit</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select required className="w-full border rounded-lg px-3 py-2" value={form.facility_id}
          onChange={(e) => setForm({ ...form, facility_id: e.target.value })}>
          <option value="">Select facility</option>
          {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select className="w-full border rounded-lg px-3 py-2" value={form.season}
          onChange={(e) => setForm({ ...form, season: e.target.value as Season })}>
          {Object.entries(SEASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input required type="date" className="w-full border rounded-lg px-3 py-2" value={form.scheduled_date}
          onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
        <select className="w-full border rounded-lg px-3 py-2" value={form.technician_id}
          onChange={(e) => setForm({ ...form, technician_id: e.target.value })}>
          <option value="">Unassigned</option>
          {technicians.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
        </select>
        <textarea placeholder="Notes" className="w-full border rounded-lg px-3 py-2" value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <p className="text-xs text-gray-400">
          Parts pre-ordering runs automatically each morning for visits within your lead-time window (Settings → Markup shows the default; procurement lead days is set per-tenant).
        </p>
        <button disabled={saving} className="w-full bg-[#193140] text-white py-2.5 rounded-lg font-medium disabled:opacity-50">
          {saving ? 'Scheduling…' : 'Schedule Visit'}
        </button>
      </form>
    </div>
  )
}
