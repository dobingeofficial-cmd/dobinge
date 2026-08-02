import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // 🚨 THE FIX: Look for a specific 'next' route, but always default to the root Traffic Controller (/)
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(new URL('/auth?error=missing_code', requestUrl.origin));
  }

  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Silently swallow edge-case hydration blocks
          }
        },
      },
    }
  );

  try {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;

    // 🚨 PASSING THE BATON: 
    // We do NOT check the database here anymore. 
    // We send them to the root page, and the Traffic Controller takes over natively!
    return NextResponse.redirect(new URL(next, requestUrl.origin));

  } catch (error) {
    console.error('DoBinge Auth Engine Error:', error);
    return NextResponse.redirect(new URL('/auth?error=auth_failed', requestUrl.origin));
  }
}