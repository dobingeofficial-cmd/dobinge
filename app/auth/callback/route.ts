import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  // 1. Defend against missing codes
  if (!code) {
    return NextResponse.redirect(new URL('/auth?error=missing_code', requestUrl.origin));
  }

  const cookieStore = await cookies();
  
  // 2. Initialize the strictly-typed Supabase SSR Client
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
    // 3. Exchange the secure code for a session token
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) throw exchangeError;

    // 4. Fetch the authenticated user's identity
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw userError || new Error("User validation failed.");

    // 5. The Zero-Cost Smart Routing Interceptor (UPGRADED)
    // 🎯 HARD FIX: Changed .single() to .maybeSingle() to prevent crash on 0 rows
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('taste_profile')
      .eq('user_id', user.id)
      .maybeSingle();

    // 🎯 HARD FIX: The Omni-Check. Look for ANY existing taste data (moods, genres, or favorites)
    let hasOnboarded = false;
    
    if (prefs && prefs.taste_profile) {
      const profile = prefs.taste_profile;
      
      const hasMoods = Array.isArray(profile.moods) && profile.moods.length > 0;
      // Checks both array and object formats for legacy genre saves
      const hasGenres = (Array.isArray(profile.genres) && profile.genres.length > 0) || 
                        (typeof profile.genres === 'object' && profile.genres !== null && Object.keys(profile.genres).length > 0);
      const hasFavorites = Array.isArray(profile.favorites) && profile.favorites.length > 0;

      if (hasMoods || hasGenres || hasFavorites) {
        hasOnboarded = true;
      }
    }

    // STRICT ROUTING: Existing users to /home, New/Guest users to /mood
    const targetRoute = hasOnboarded ? '/home' : '/mood';

    return NextResponse.redirect(new URL(targetRoute, requestUrl.origin));

  } catch (error) {
    console.error('DoBinge Auth Engine Error:', error);
    return NextResponse.redirect(new URL('/auth?error=auth_failed', requestUrl.origin));
  }
}