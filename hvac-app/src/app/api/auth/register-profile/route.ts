import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { userId, email, companyName, fullName } = await request.json()

    if (!userId || !email || !companyName || !fullName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Verify this is a real, existing auth user before creating anything.
    // Supabase deliberately returns an obfuscated/fake user id from
    // signUp() when the email is already registered (an anti-enumeration
    // security measure) — if we don't check this, we silently create a
    // tenant for a user that doesn't really exist, then fail on the next
    // insert with a confusing foreign-key error.
    const { data: authCheck, error: authCheckError } = await supabase.auth.admin.getUserById(userId)

    if (authCheckError || !authCheck?.user) {
      return NextResponse.json(
        { error: 'This email may already be registered. Try signing in instead, or use a different email address.' },
        { status: 409 }
      )
    }

    // Auto-confirm the email. This is an internal company tool, not a
    // public app verifying strangers — email confirmation just adds
    // friction with no real benefit here, and the "Confirm email" toggle
    // couldn't be located in the current Supabase dashboard UI, so this
    // achieves the same result directly.
    await supabase.auth.admin.updateUserById(userId, { email_confirm: true })

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

    const { error: userError } = await supabase.from('users').insert({
      id: userId,
      tenant_id: tenant.id,
      email,
      full_name: fullName,
      role: 'company_admin',
    })

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
