import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Creates the tenant + user profile rows using the service role key
// (server-side, bypasses RLS entirely) instead of the client's own
// just-created session. This sidesteps a timing issue where a brand
// new signup isn't fully "confirmed" yet at the exact moment the
// profile needs to be created, which RLS was correctly blocking.
export async function POST(request: Request) {
  try {
    const { userId, email, companyName, fullName } = await request.json()

    if (!userId || !email || !companyName || !fullName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({ name: companyName, contact_email: email })
      .select()
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: `Failed to create company profile: ${tenantError?.message || 'unknown error'}` },
        { status: 500 }
      )
    }

    // Occasionally there's a brief moment right after signUp() where
    // auth.users hasn't fully settled from this connection's point of
    // view yet, which the users.id foreign key check catches as a
    // false "doesn't exist." Retry briefly instead of failing outright.
    let userError: any = null
    for (let attempt = 0; attempt < 4; attempt++) {
      const { error } = await supabase.from('users').insert({
        id: userId,
        tenant_id: tenant.id,
        email,
        full_name: fullName,
        role: 'company_admin',
      })
      userError = error
      if (!error) break
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 500))
    }

    if (userError) {
      return NextResponse.json(
        { error: `Failed to create user profile: ${userError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, tenantId: tenant.id })
  } catch (err: any) {
    console.error('register-profile error:', err)
    return NextResponse.json(
      { error: `Unexpected server error: ${err?.message || 'unknown'}` },
      { status: 500 }
    )
  }
}
