import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Routes that don't require authentication
const publicRoutes = ['/login', '/reset-password', '/verify-pin']

// Routes that require admin permissions
const adminRoutes = ['/admin', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if route is public
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Get session token from cookies
  const sessionToken = request.cookies.get('session-token')?.value

  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    // Validate session
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    })

    if (!session || session.expires < new Date()) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('session-token')
      return response
    }

    // Check admin routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (!['ADMIN', 'CHIEF_COUNCIL'].includes(session.user.role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    // Add user info to headers for use in components
    const response = NextResponse.next()
    response.headers.set('x-user-id', session.user.id)
    response.headers.set('x-user-role', session.user.role)
    
    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}