'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, CheckCircle2 } from 'lucide-react'

interface CartLine { part_id: string; name: string; supplier_name: string; part_number?: string; quantity: number }

export default function OrderPartsPage() {
  const supabase = createClient()
  const [parts, setParts] = useState<any[]>([])
  const [facilities, setFacilities] = useState<any[]>([])
  const [facilityId, setFacilityId] = useState('')
  const [neededBy, setNeededBy] = useState('')
  const [cart, setCart] = useState<Record<string, CartLine>>({})
  const [search, setSearch] = useState('')
  const [placing, setPlacing] = useState(false)
  const [result, setResult] = useState<any[] | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user.id).single()
      const { data: partsData } = await supabase
        .from('parts_catalog')
        .select('id, name, part_number, sell_price, in_stock, supplier:supplier_contacts(id, name)')
        .eq('tenant_id', profile?.tenant_id)
        .order('name')
      setParts(partsData ?? [])
      const { data: facilityData } = await supabase.from('facilities').select('id, name').eq('tenant_id', profile?.tenant_id)
      setFacilities(facilityData ?? [])
    })
  }, [])

  const filtered = useMemo(
    () => parts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.part_number?.toLowerCase().includes(search.toLowerCase())),
    [parts, search]
  )

  const cartLines = Object.values(cart)
  const groupedBySupplier = useMemo(() => {
    const map = new Map<string, CartLine[]>()
    for (const line of cartLines) {
      if (!map.has(line.supplier_name)) map.set(line.supplier_name, [])
      map.get(line.supplier_name)!.push(line)
    }
    return map
  }, [cartLines])

  function addToCart(part: any) {
    if (!part.supplier) return
    setCart((prev) => {
      const existing = prev[part.id]
      return {
        ...prev,
        [part.id]: {
          part_id: part.id,
          name: part.name,
          part_number: part.part_number,
          supplier_name: part.supplier.name,
          quantity: (existing?.quantity ?? 0) + 1,
        },
      }
    })
  }

  function changeQty(partId: string, delta: number) {
    setCart((prev) => {
      const next = { ...prev }
      const line = next[partId]
      if (!line) return prev
      const qty = line.quantity + delta
      if (qty <= 0) delete next[partId]
      else next[partId] = { ...line, quantity: qty }
      return next
    })
  }

  async function placeOrder() {
    setPlacing(true)
    const res = await fetch('/api/parts/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cartLines.map((l) => ({ part_id: l.part_id, quantity: l.quantity })),
        facilityId: facilityId || undefined,
        neededByDate: neededBy || undefined,
      }),
    })
    const data = await res.json()
    setResult(data.orders ?? [{ status: 'error', reason: data.error }])
    if (data.ok) setCart({})
    setPlacing(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto pb-40">
      <Link href="/parts" className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Parts Catalog
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Order Parts</h1>
        <p className="text-gray-500 text-sm mt-1">
          One cart, split automatically across BGE, Sinclair's, Wolseley, MCO — whoever each part is assigned to
        </p>
      </div>

      {result && (
        <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Order results</h3>
          {result.map((r: any, i: number) => (
            <div key={i} className="flex items-center gap-2 text-sm py-1">
              {r.status === 'sent' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <span className="w-4 h-4 text-amber-500">!</span>}
              <span className="font-medium">{r.supplier}</span>
              <span className="text-gray-500">{r.status === 'sent' ? `— ${r.itemCount} item(s) emailed` : `— ${r.reason}`}</span>
            </div>
          ))}
        </div>
      )}

      <input
        placeholder="Search parts by name or part number..."
        className="w-full border rounded-lg px-3 py-2 mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid gap-2 mb-8">
        {filtered.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3">
            <div>
              <p className="font-medium text-gray-900 text-sm">{p.name}</p>
              <p className="text-xs text-gray-400">{p.supplier?.name ?? 'No supplier assigned'} {p.part_number && `· ${p.part_number}`}</p>
            </div>
            <button
              onClick={() => addToCart(p)}
              disabled={!p.supplier}
              className="flex items-center gap-1 bg-[#193140] text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-30"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        ))}
      </div>

      {cartLines.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">{cartLines.length} part(s) across {groupedBySupplier.size} supplier(s)</span>
            </div>
            <div className="grid gap-1 mb-3 max-h-32 overflow-y-auto">
              {cartLines.map((line) => (
                <div key={line.part_id} className="flex items-center justify-between text-sm">
                  <span>{line.name} <span className="text-gray-400">({line.supplier_name})</span></span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(line.part_id, -1)}><Minus className="w-3.5 h-3.5" /></button>
                    <span className="w-6 text-center">{line.quantity}</span>
                    <button onClick={() => changeQty(line.part_id, 1)}><Plus className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setCart((p) => { const n = { ...p }; delete n[line.part_id]; return n })}>
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <select className="flex-1 border rounded-lg px-3 py-2 text-sm" value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
                <option value="">Shop / stock order (no facility)</option>
                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={neededBy} onChange={(e) => setNeededBy(e.target.value)} />
              <button onClick={placeOrder} disabled={placing} className="bg-[#193140] text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                {placing ? 'Placing…' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
