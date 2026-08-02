export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { ApiUtils } from "@/lib/utils/api-response";
import { TrackingService } from "@/services/tracking.service";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    let serverVerifiedUserId: string | null = null;

    // 🚨 FIX 1: Strict Token Enforcement with Build-Time Safety
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        console.warn("Tracking API: Rejecting payload. Expired/Invalid JWT.");
        return ApiUtils.error("Unauthorized. Token expired or invalid.", 401);
      }
      
      serverVerifiedUserId = user.id;
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return ApiUtils.error("Invalid JSON payload", 400);
    }

    if (!body || !body.events || !Array.isArray(body.events)) {
      return ApiUtils.error("Invalid payload structure. Expected 'events' array.", 400);
    }

    if (body.events.length > 50) {
      console.warn(`Tracking API: Oversized payload rejected (${body.events.length} events).`);
      return ApiUtils.error("Payload too large. Maximum 50 events per batch.", 413);
    }

    if (!body.session || !body.session.sessionId) {
      return ApiUtils.error("Missing valid session metadata.", 400);
    }

    const result = await TrackingService.processBatch(body, serverVerifiedUserId);

    if (!result.success) {
      return ApiUtils.error(result.error || "Failed to process tracking batch", 500);
    }

    return ApiUtils.success({ processedCount: result.processedCount }, 201);

  } catch (error: any) {
    console.error("Tracking API Fatal Fault:", error);
    return ApiUtils.error("Internal Server Error", 500);
  }
}