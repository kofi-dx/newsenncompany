// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const userRole = request.cookies.get('user-role')?.value;

  // Protect all /admin routes
  if (!token && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Role-based protection
  if (
    request.nextUrl.pathname.startsWith('/admin/ceo-only') &&
    userRole !== 'ceo'
  ) {
    return NextResponse.redirect(new URL('/admin/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
