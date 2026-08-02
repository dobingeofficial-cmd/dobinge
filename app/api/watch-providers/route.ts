import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get("mediaId");
  const mediaType = searchParams.get("mediaType") || "movie";
  const countryCode = searchParams.get("country") || "IN"; // Fallback to localized region

  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  if (!mediaId) {
    return NextResponse.json({ error: "Missing mediaId parameter" }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json({ error: "TMDB API credentials uninitialized" }, { status: 500 });
  }

  try {
    // Call live TMDB watch providers distribution ledger
    const res = await fetch(
      `https://api.themoviedb.org/3/${mediaType}/${mediaId}/watch/providers?api_key=${apiKey}`,
      { next: { revalidate: 86400 } } // Cache regional streaming data for 24 hours to maximize performance
    );
    
    if (!res.ok) throw new Error("TMDB Upstream Response Fault");
    
    const data = await res.json();
    
    // Parse target regional results array
    const countryResults = data.results?.[countryCode.toUpperCase()];
    const flatrateProviders = countryResults?.flatrate || [];

    // Map top 3 accessible platforms matching our premium design system criteria
    const providers = flatrateProviders.slice(0, 3).map((provider: any) => ({
      name: provider.provider_name,
      logo: `https://image.tmdb.org/t/p/original${provider.logo_path}`
    }));

    return NextResponse.json({ providers });
  } catch (err: any) {
    console.error("Watch Providers Proxy Failure:", err.message);
    return NextResponse.json({ providers: [] }, { status: 500 });
  }
}