import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  console.log('Middleware: checking path:', req.nextUrl.pathname)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log('Middleware: session status:', !!session)

  // Allow all routes except dashboard when not authenticated
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('Middleware: redirecting to home - no session')
    return NextResponse.redirect(new URL('/', req.url))
  }

  console.log('Middleware: allowing request')
  return res
}

export const config = {
  matcher: ['/dashboard/:path*']
} 