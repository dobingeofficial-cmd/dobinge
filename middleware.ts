import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Strict Security Headers
  // Prevents Clickjacking (Nobody can put DoBinge inside an iframe)
  response.headers.set('X-Frame-Options', 'DENY');
  // Prevents MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Enforces HTTPS routing
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Prevents XSS via browser detection
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  // 2. Content Security Policy (Basic)
  // Restricts where scripts and images can load from, preventing malicious injections.
  const csp = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https://image.tmdb.org https://lh3.googleusercontent.com https://flat-flower-ffa1dobinge-engine.danishkhan4126.workers.dev;
      connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com https://api.themoviedb.org https://flat-flower-ffa1dobinge-engine.danishkhan4126.workers.dev;
      font-src 'self' data:;
    `.replace(/\s{2,}/g, ' ').trim();
  
  response.headers.set('Content-Security-Policy', csp);

  // 3. Admin Route Protection Check
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};