// Pulls a reasonable logo + brand color from a company's own website.
// This runs server-side (API route) so it isn't limited by browser CORS.
// It is a best-effort heuristic, not a guarantee — always let the tenant
// review and swap the logo manually in Settings afterward.

export interface ScrapedBranding {
  logoUrl: string | null
  brandColor: string | null
  siteName: string | null
}

function resolveUrl(base: string, maybeRelative: string): string {
  try {
    return new URL(maybeRelative, base).toString()
  } catch {
    return maybeRelative
  }
}

function extractMeta(html: string, attrPatterns: RegExp[]): string | null {
  for (const pattern of attrPatterns) {
    const match = html.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

export async function scrapeBranding(rawUrl: string): Promise<ScrapedBranding> {
  const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MaintenanceApp/1.0)' },
    // Don't hang forever on a slow/dead site
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`Site returned ${res.status}`)
  const html = await res.text()

  // 1. Prefer an explicit og:image (most sites set this to their logo or a brand image)
  const ogImage = extractMeta(html, [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
  ])

  // 2. Apple touch icon is usually a clean square logo
  const appleTouchIcon = extractMeta(html, [
    /<link[^>]+rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
  ])

  // 3. SVG or high-res favicon as last resort
  const favicon = extractMeta(html, [
    /<link[^>]+rel=["'](?:shortcut icon|icon)["'][^>]*href=["']([^"']+)["']/i,
  ])

  // 4. theme-color meta tag often matches brand color
  const themeColor = extractMeta(html, [
    /<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i,
  ])

  const siteName = extractMeta(html, [
    /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i,
    /<title>([^<]+)<\/title>/i,
  ])

  const chosenLogo = appleTouchIcon || ogImage || favicon
  return {
    logoUrl: chosenLogo ? resolveUrl(url, chosenLogo) : null,
    brandColor: themeColor,
    siteName: siteName ? siteName.trim() : null,
  }
}
