import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scrapeBranding } from '@/lib/branding/fetch-logo'

// POST { website: string }
// Only company_admin/super_admin may pull branding for their own tenant.
export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['company_admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  const { website } = await request.json()
  if (!website || typeof website !== 'string') {
    return NextResponse.json({ error: 'website is required' }, { status: 400 })
  }

  try {
    const branding = await scrapeBranding(website)
    return NextResponse.json({ branding })
  } catch (err) {
    return NextResponse.json(
      {
        error:
          'Could not read that site automatically. You can still upload a logo file manually below.',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 200 } // 200 so the UI shows the friendly message, not a crash
    )
  }
}
