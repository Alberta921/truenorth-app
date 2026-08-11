'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShoppingCart, Plus, Minus, X, Package } from 'lucide-react'

interface CatalogPart {
  id: string
  name: string
  part_number?: string
  manufacturer?: string
  category: string
  sell_price: number
  unit: string
  in_stock: boolean
  lead_time_days: number
}

interface Props {
  facilityId: string
  // isClient=true hard-disables anything cost-related in this component,
  // independent of what the server sends — belt-and-suspenders with the
  // parts_catalog_public view and the DB trigger.
  isClient: boolean
}

export default function PartsOrderSheet({ facilityId, isClient }: Props) {
  const supabase = createClient()
  const [parts, setParts] = useState<CatalogPart[]>([])
  const [cart, setCart] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadParts()
  }, [])

  async function loadParts() {
    setLoading(true)
    // Clients query the public view — cost_price/markup_pct/supplier fields
    // physically do not exist in this view's result set.
    const table = isClient ? 'parts_catalog_public' : 'parts_catalog'
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user!.id).single()
    const { data } = await supabase
      .from(table)
      .select('id, name, part_number, manufacturer, category, sell_price, unit, in_stock, lead_time_days')
      .eq('tenant_id', profile?.tenant_id)
      .eq('in_stock', true)
      .order('name')
    setParts((data as CatalogPart[]) ?? [])
    setLoading(false)
  }

  const filtered = useMemo(
    () => parts.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [parts, search]
  )

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([partId, qty]) => {
          const part = parts.find((p) => p.id === partId)!
          return { part, qty, lineTotal: part.sell_price * qty }
        }),
    [cart, parts]
  )

  const subtotal = cartItems.reduce((sum, i) => sum + i.lineTotal, 0)

  function setQty(partId: string, qty: number) {
    setCart((prev) => ({ ...prev, [partId]: Math.max(0, qty) }))
  }

  async function submitOrder() {
    if (cartItems.length === 0) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('tenant_id').eq('id', user!.id).single()

    // showCost is hardcoded false for clients — never computed from a prop
    // that could be flipped. The order_items shape sent here contains only
    // sell_price; cost_price/markup_pct never enter this component's state.
    const orderItems = cartItems.map((i) => ({
      part_id: i.part.id,
      name: i.part.name,
      quantity: i.qty,
      sell_price: i.part.sell_price,
      line_total: i.lineTotal,
    }))

    await supabase.from('parts_orders').insert({
      tenant_id: profile?.tenant_id,
      facility_id: facilityId,
      ordered_by: user!.id,
      order_items: orderItems,
      subtotal,
      // total_cost / total_margin intentionally omitted — the DB trigger
      // zeroes them for client-role inserts regardless, but staff-placed
      // orders (isClient=false) can fill them in separately after ordering.
      status: 'pending',
    })

    setSubmitting(false)
    setSubmitted(true)
    setCart({})
  }

  if (loading) return <div className="text-sm text-gray-400 py-8 text-center">Loading parts…</div>

  if (submitted) {
    return (
      <div className="text-center py-8 bg-green-50 rounded-xl border border-green-100">
        <Package className="w-10 h-10 text-green-500 mx-auto mb-2" />
        <p className="font-medium text-green-800">Order submitted</p>
        <p className="text-sm text-green-600 mt-1">We'll confirm availability and pricing shortly.</p>
        <button onClick={() => setSubmitted(false)} className="text-sm text-green-700 underline mt-3">Order more</button>
      </div>
    )
  }

  return (
    <div>
      <input
        placeholder="Search parts…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3"
      />
      <div className="grid gap-2 max-h-96 overflow-y-auto mb-4">
        {filtered.map((part) => (
          <div key={part.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{part.name}</p>
              <p className="text-xs text-gray-400">{part.part_number} · ${part.sell_price.toFixed(2)} / {part.unit}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setQty(part.id, (cart[part.id] ?? 0) - 1)} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-6 text-center text-sm">{cart[part.id] ?? 0}</span>
              <button onClick={() => setQty(part.id, (cart[part.id] ?? 0) + 1)} className="w-7 h-7 rounded-full bg-[#193140] text-white flex items-center justify-center">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No parts found</p>}
      </div>

      {cartItems.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 sticky bottom-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600 flex items-center gap-1.5"><ShoppingCart className="w-4 h-4" /> {cartItems.length} item(s)</span>
            <span className="font-bold text-gray-900">${subtotal.toFixed(2)}</span>
          </div>
          <button
            onClick={submitOrder}
            disabled={submitting}
            className="w-full bg-[#193140] text-white py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {submitting ? 'Placing order…' : 'Place Order'}
          </button>
        </div>
      )}
    </div>
  )
}
