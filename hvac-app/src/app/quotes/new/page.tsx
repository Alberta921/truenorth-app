'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'

interface LineItem { description: string; quantity: number; unit_price: number }

function NewQuoteForm() {
  const router = useRouter()
  const params = useSearchParams()
  const recommendationId = params.get('recommendation')
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [facilityId, setFacilityId] = useState('')
  const [facilities, setFacilities] = useState<any[]>([])
  const [items, setItems] = useState<LineItem[]>([{ description: '', quantity: 1, unit_price: 0 }])
  const [notes, setNotes] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      const { data } = await supabase.from('facilities').select('id, name').eq('tenant_id', profile?.tenant_id)
      setFacilities(data ?? [])

      if (recommendationId) {
        const { data: rec } = await supabase
          .from('recommendations')
          .select('title, description, equipment(facility_id)')
          .eq('id', recommendationId)
          .single()
        if (rec) {
          setItems([{ description: rec.title, quantity: 1, unit_price: 0 }])
          setFacilityId((rec.equipment as any)?.facility_id ?? '')
        }
      }
    })
  }, [recommendationId])

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.quantity * i.unit_price, 0), [items])
  const gst = useMemo(() => Math.round(subtotal * 0.05 * 100) / 100, [subtotal])
  const total = subtotal + gst

  function updateItem(idx: number, field: keyof LineItem, value: string) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: field === 'description' ? value : parseFloat(value) || 0 } : it))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()

    const { data: numberResult } = await supabase.rpc('generate_quote_number')
    const lineItems = items.map((i) => ({ ...i, total: i.quantity * i.unit_price }))

    const { data: quote } = await supabase.from('quotes').insert({
      tenant_id: profile?.tenant_id,
      facility_id: facilityId,
      recommendation_id: recommendationId || null,
      quote_number: numberResult ?? `Q-${Date.now()}`,
      line_items: lineItems,
      subtotal, gst, total,
      notes,
      created_by: user.id,
      status: 'draft',
    }).select().single()

    if (recommendationId) {
      await supabase.from('recommendations').update({ status: 'quoted' }).eq('id', recommendationId)
    }

    router.push(`/quotes/${quote?.id}`)
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <Link href="/recommendations" className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Build Quote</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select required className="w-full border rounded-lg px-3 py-2" value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
          <option value="">Select facility</option>
          {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input placeholder="Description" className="flex-1 border rounded-lg px-3 py-2 text-sm"
                value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} />
              <input type="number" placeholder="Qty" className="w-16 border rounded-lg px-2 py-2 text-sm"
                value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
              <input type="number" step="0.01" placeholder="$" className="w-24 border rounded-lg px-2 py-2 text-sm"
                value={item.unit_price} onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} />
              <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setItems([...items, { description: '', quantity: 1, unit_price: 0 }])}
            className="flex items-center gap-1 text-sm text-blue-600">
            <Plus className="w-4 h-4" /> Add line item
          </button>
        </div>

        <textarea placeholder="Notes for the client" className="w-full border rounded-lg px-3 py-2" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          Subtotal ${subtotal.toFixed(2)} · GST ${gst.toFixed(2)} · <strong>Total ${total.toFixed(2)}</strong>
        </div>

        <button disabled={saving || !facilityId} className="w-full bg-[#193140] text-white py-2.5 rounded-lg font-medium disabled:opacity-50">
          {saving ? 'Saving…' : 'Save Draft Quote'}
        </button>
      </form>
    </div>
  )
}

export default function NewQuotePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <NewQuoteForm />
    </Suspense>
  )
}
