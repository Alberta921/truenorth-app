import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes clients are allowed to reach. Everything else under an
// authenticated session is staff-only.
const CLIENT_ALLOWED_PREFIXES = ['/client/portal']

// Routes reachable without being logged in at all.
const PUBLIC_ROUTES = ['/auth/login', '/auth/register']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // API routes handle their own authorization internally (or, like
  // register-profile, intentionally run before a session fully exists)
  // — they should never get redirected to the login page. A redirected
  // POST turning into a POST against an HTML page is exactly what was
  // producing the confusing 405 errors.
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route))

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Role-gate: clients must never reach internal/staff pages.
    // We look up the role server-side on every request — this cannot
    // be bypassed from the browser, unlike a client-side check.
    if (!isPublicRoute) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      const isClient = profile?.role === 'client'
      const isAllowedForClient = CLIENT_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))

      if (isClient && !isAllowedForClient) {
        const url = request.nextUrl.clone()
        url.pathname = '/client/portal'
        return NextResponse.redirect(url)
      }

      // Staff (admin/technician/super_admin) should not be dropped into
      // the client portal shell — send them to their dashboard instead.
      if (!isClient && pathname.startsWith('/client/portal')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }
  } else if (!isPublicRoute) {
    // Unauthenticated + not a public route: already redirected above,
    // but guard client/portal explicitly since it requires a client login.
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
