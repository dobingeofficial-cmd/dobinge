import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from '@/lib/supabase/admin';
import { DashboardService } from '@/services/admin/dashboard.service';
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // 1. Verify User Token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // 2. Verify Admin Role (Zero Trust)
    const { data: adminData } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!adminData) {
      console.warn(`[Security] Non-admin user ${user.id} attempted to access Admin API.`);
      return NextResponse.json({ error: "Forbidden. Admin privileges required." }, { status: 403 });
    }

    // 3. Fetch Data
    const dashboardData = await DashboardService.getFullDashboard();

    return NextResponse.json({ success: true, data: dashboardData }, { status: 200 });

  } catch (error: any) {
    console.error("[Admin API] Fatal Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}