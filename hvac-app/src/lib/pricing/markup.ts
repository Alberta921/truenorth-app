export interface MarkupTier {
  min_cost: number
  max_cost: number | null
  multiplier: number
}

// True North's default sliding scale — editable per-tenant in
// Settings → Markup & Labour Rates.
export const DEFAULT_MARKUP_TIERS: MarkupTier[] = [
  { min_cost: 0, max_cost: 100, multiplier: 2.0 },
  { min_cost: 100.01, max_cost: 500, multiplier: 1.8 },
  { min_cost: 500.01, max_cost: 1000, multiplier: 1.7 },
  { min_cost: 1000.01, max_cost: 5000, multiplier: 1.5 },
  { min_cost: 5000.01, max_cost: 20000, multiplier: 1.4 },
  { min_cost: 20000.01, max_cost: null, multiplier: 1.3 },
]

export interface SellPriceResult {
  sellPrice: number
  multiplier: number
  markupPct: number
  margin: number
  tier: MarkupTier
}

export function calculateSellPrice(
  costPrice: number,
  tiers: MarkupTier[] = DEFAULT_MARKUP_TIERS
): SellPriceResult {
  const tier =
    tiers.find(
      (t) => costPrice >= t.min_cost && (t.max_cost === null || costPrice <= t.max_cost)
    ) ?? tiers[tiers.length - 1]

  const sellPrice = Math.round(costPrice * tier.multiplier * 100) / 100
  const margin = Math.round((sellPrice - costPrice) * 100) / 100
  const markupPct = costPrice > 0 ? Math.round(((tier.multiplier - 1) * 100) * 100) / 100 : 0

  return { sellPrice, multiplier: tier.multiplier, markupPct, margin, tier }
}
