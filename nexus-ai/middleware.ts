// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Check auth state
  const { data: { session } } = await supabase.auth.getSession()

  // If the user is not signed in and trying to access protected routes
  if (!session && req.nextUrl.pathname.startsWith('/workspace')) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/sign-in'
    return NextResponse.redirect(redirectUrl)
  }

  // If the user is signed in and trying to access auth pages
  if (session && (req.nextUrl.pathname.startsWith('/sign-in') || req.nextUrl.pathname.startsWith('/sign-up'))) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/workspace'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)']
}