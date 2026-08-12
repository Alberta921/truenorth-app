import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

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
