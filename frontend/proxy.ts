import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    {
      source: '/((?!api|_next|favicon\\.ico|.*\\..*).*)',
      missing: [{ type: 'header', key: 'next-router-prefetch' }],
    },
  ],
};

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (!token && !isAuthPage) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}