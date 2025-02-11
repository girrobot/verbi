import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Log the current path and session status for debugging
  console.log('Path:', req.nextUrl.pathname, 'Session:', !!session)

  // Allow access to login page and auth callback
  if (req.nextUrl.pathname === '/login' || req.nextUrl.pathname.startsWith('/auth/callback')) {
    return res
  }

  // Redirect to login if no session
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
} 