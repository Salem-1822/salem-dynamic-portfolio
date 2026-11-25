import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Edge Middleware for Stealth Route Protection.
 * Any unauthorized or suspicious access attempt to /admin/* is rewritten to /not-found (404),
 * completely concealing the existence of the administrative interface.
 */
export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('admin_session')

  // Stealth Security Requirement:
  // Validate token presence and hexadecimal structure (64 hex characters)
  if (!sessionCookie?.value || !/^[0-9a-f]{64}$/i.test(sessionCookie.value)) {
    // Rewrite to /not-found with 404 status instead of 401/403 or redirecting
    return NextResponse.rewrite(new URL('/not-found', request.url), {
      status: 404,
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
