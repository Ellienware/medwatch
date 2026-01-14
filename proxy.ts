import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Define public paths that don't require authentication
  const isPublicPath = 
    path === '/' ||
    path === '/auth/sign-in' ||
    path === '/auth/sign-up' ||
    path === '/auth/onboarding' ||
    path === '/auth/reset-password' ||
    path === '/auth/forgot-password' ||
    path.startsWith('/api/') ||
    path.startsWith('/_next') ||
    path.startsWith('/static') ||
    path.startsWith('/public') ||
    path.includes('.')
  
  // If it's a public path, allow access
  if (isPublicPath) {
    return NextResponse.next()
  }
  
  // Check if user has user-id cookie
  const hasUserId = request.cookies.get('appwrite-user-id')?.value
  
  if (!hasUserId) {
    // No user ID - redirect to sign in
    const url = new URL('/auth/sign-in', request.url)
    url.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(url)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}