import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Unwrapping the cookie store promise asynchronously for safe reading
        async getAll() {
          const resolvedStore = await cookieStore
          return resolvedStore.getAll()
        },
        // Unwrapping the cookie store promise asynchronously for batch mutation
        async setAll(cookiesToSet) {
          try {
            const resolvedStore = await cookieStore
            cookiesToSet.forEach(({ name, value, options }) =>
              resolvedStore.set(name, value, options)
            )
          } catch (error) {
            // Handled safely. Next.js explicitly prevents cookie mutation 
            // during layout rendering phases unless executing within a Server Action or API Route.
          }
        },
      },
    }
  )
}