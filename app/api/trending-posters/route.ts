import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key configuration parameter" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}&page=1`,
      { next: { revalidate: 3600 } } // Edge cache responses for 1 hour to optimize performance limits
    );
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed server-side fetch" }, { status: 500 });
  }
}