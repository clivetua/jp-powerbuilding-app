import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with cross-browser cookies, e.g. Safari.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected routes that require authentication
  const isProtectedRoute = 
    pathname.startsWith('/workout') || 
    pathname.startsWith('/progress') || 
    pathname.startsWith('/history') || 
    pathname.startsWith('/onboarding')

  // Auth routes that authenticated users shouldn't see
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')

  if (!user && isProtectedRoute) {
    // no user, redirect to login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  if (user && isAuthRoute) {
    // user is logged in, redirect away from auth pages
    const url = request.nextUrl.clone()
    url.pathname = '/workout' // Default redirect for logged-in users, can adjust as needed
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
