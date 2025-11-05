/**
 * Next.js Middleware
 * Handles authentication and authorization for all routes
 */

import { NextResponse, type NextRequest } from 'next/server'
import { auth } from './src/lib/auth/config'

/**
 * Middleware configuration
 * Runs on all routes except static assets and API auth routes
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static assets and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/invite/accept']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Get session
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  // Redirect unauthenticated users to login (except for public routes)
  if (!session && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  if (session && isPublicRoute && pathname !== '/invite/accept') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

/**
 * Matcher configuration
 * Defines which routes the middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - Files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
}
