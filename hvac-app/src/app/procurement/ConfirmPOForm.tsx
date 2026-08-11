'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfirmPOForm({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [po, setPo] = useState('')
  const [saving, setSaving] = useState(false)

  async function confirm() {
    if (!po) return
    setSaving(true)
    await fetch('/api/procurement/confirm-po', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, poNumber: po }),
    })
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <input
        placeholder="Enter PO number"
        className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
        value={po}
        onChange={(e) => setPo(e.target.value)}
      />
      <button
        onClick={confirm}
        disabled={saving || !po}
        className="bg-[#193140] text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Confirm PO'}
      </button>
    </div>
  )
}
