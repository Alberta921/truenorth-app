'use client'

import { useEffect, useState, useCallback } from 'react'
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { flushOutbox, getOutboxCount } from '@/lib/offline/sync'

// Sits at the top of every staff page. Shows connection state and
// pending-sync count — a technician working in a dead basement should
// never wonder "did that save?"
export default function SyncStatusBar() {
  const [online, setOnline] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [justSynced, setJustSynced] = useState(false)

  const refreshCount = useCallback(() => {
    getOutboxCount().then(setPendingCount)
  }, [])

  const runSync = useCallback(async () => {
    if (!navigator.onLine) return
    setSyncing(true)
    const result = await flushOutbox()
    setSyncing(false)
    refreshCount()
    if (result.synced > 0) {
      setJustSynced(true)
      setTimeout(() => setJustSynced(false), 3000)
    }
  }, [refreshCount])

  useEffect(() => {
    setOnline(navigator.onLine)
    refreshCount()

    const handleOnline = () => { setOnline(true); runSync() }
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Register service worker + wire its Background Sync wake-up
    // message to the same flush function.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        if ('sync' in reg) {
          // Chromium only; harmless no-op elsewhere
          ;(reg as any).sync?.register('flush-maintenance-outbox').catch(() => {})
        }
      })
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'FLUSH_OUTBOX') runSync()
      })
    }

    const interval = setInterval(refreshCount, 5000)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [refreshCount, runSync])

  if (online && pendingCount === 0 && !justSynced) return null

  return (
    <div
      className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium ${
        !online ? 'bg-amber-500 text-white' : justSynced ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
      }`}
    >
      {!online ? (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          Offline — {pendingCount > 0 ? `${pendingCount} entr${pendingCount === 1 ? 'y' : 'ies'} will sync automatically` : 'your work is saving on this device'}
        </>
      ) : justSynced ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5" /> Synced
        </>
      ) : (
        <>
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          {pendingCount} pending —{' '}
          <button onClick={runSync} disabled={syncing} className="underline">
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        </>
      )}
    </div>
  )
}
