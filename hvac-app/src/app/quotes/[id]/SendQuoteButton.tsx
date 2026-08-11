'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SendQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter()
  const [sending, setSending] = useState(false)

  async function send() {
    setSending(true)
    await fetch('/api/quotes/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId }),
    })
    setSending(false)
    router.refresh()
  }

  return (
    <button onClick={send} disabled={sending} className="w-full bg-[#193140] text-white py-2.5 rounded-lg font-medium disabled:opacity-50">
      {sending ? 'Sending…' : 'Send Quote to Client'}
    </button>
  )
}
