import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();

  try {
    // 1. Safely parse payload to prevent JSON parse crashes
    const text = await request.text();
    if (!text) {
      return NextResponse.json(
        { error: "Empty request body received." },
        { status: 400 }
      );
    }
    
    const body = JSON.parse(text);
    const { mediaId, mediaType, action, reaction } = body;

    // 2. Resolve Auth Session securely
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized access. Interaction rejected." },
        { status: 401 }
      );
    }

    if (!mediaId || !mediaType || !action) {
      return NextResponse.json(
        { error: "Missing required telemetry fields: mediaId, mediaType, or action." },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // 3. Perform Upsert Operation inside Supabase
    const { data, error } = await supabase
      .from("interactions")
      .upsert({
        user_id: userId,
        media_id: parseInt(mediaId, 10),
        media_type: mediaType,
        action: action, // "watchlist" | "watched" | "skip"
        reaction: reaction || null, // "liked" | null
        created_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,media_id"
      })
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (err: any) {
    console.error("DoBinge Interaction API System Error:", err.message);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 }
    );
  }
}