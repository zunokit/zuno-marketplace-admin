import { auth } from './config'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Auth middleware to protect routes
 */
export async function authMiddleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  })

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // API routes for authentication
  const isAuthApiRoute = pathname.startsWith('/api/auth')

  // If user is not authenticated and trying to access protected route
  if (!session && !isPublicRoute && !isAuthApiRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If user is authenticated and trying to access auth pages
  if (session && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

/**
 * Get current session from request (for Server Components)
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await import('next/headers').then((m) => m.headers()),
  })

  return session
}

/**
 * Require authentication (for Server Actions and Route Handlers)
 */
export async function requireAuth() {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized: Authentication required')
  }

  return session
}
