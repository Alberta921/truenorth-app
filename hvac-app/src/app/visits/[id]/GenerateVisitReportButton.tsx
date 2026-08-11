'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Loader2 } from 'lucide-react'

export default function GenerateVisitReportButton({ visitId }: { visitId: string }) {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setSending(true)
    setError(null)
    const res = await fetch('/api/reports/generate-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitId }),
    })
    const data = await res.json()
    setSending(false)
    if (data.error) {
      setError(data.error)
      return
    }
    router.refresh()
  }

  return (
    <div>
      <button
        onClick={generate}
        disabled={sending}
        className="w-full flex items-center justify-center gap-2 bg-[#193140] text-white py-3 rounded-xl font-semibold disabled:opacity-50"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {sending ? 'Generating & Sending…' : 'Generate & Send Visit Report'}
      </button>
      {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
    </div>
  )
}
