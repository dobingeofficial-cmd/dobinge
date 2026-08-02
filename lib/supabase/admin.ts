import { createClient } from '@supabase/supabase-js';

// 🎯 HARD FIX: Fallback strings to bypass Next.js static build module evaluation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

if (supabaseUrl === "https://placeholder.supabase.co" || supabaseServiceKey === "placeholder-key") {
  console.warn("Neural Core Warning: Missing Supabase Admin credentials during build phase. Using placeholders.");
}

/**
 * Server-side ONLY Supabase client.
 * Bypasses Row Level Security (RLS). NEVER use this in client components.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});