'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const STATUSES = ['pending', 'confirmed', 'ordered', 'fulfilled', 'cancelled']

export default function OrderStatusControl({ orderId, currentStatus, isAdmin }: { orderId: string; currentStatus: string; isAdmin: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [cost, setCost] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const update: any = { status }
    // total_cost/total_margin are only ever set here by staff — the DB
    // trigger prevents a client session from writing these regardless.
    if (isAdmin && cost) {
      update.total_cost = parseFloat(cost)
    }
    await supabase.from('parts_orders').update(update).eq('id', orderId)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="space-y-2">
      <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      {isAdmin && (
        <input type="number" step="0.01" placeholder="Actual cost once ordered ($)" value={cost} onChange={(e) => setCost(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
      )}
      <button onClick={save} disabled={saving} className="w-full bg-[#193140] text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
        {saving ? 'Saving…' : 'Update Order'}
      </button>
    </div>
  )
}
