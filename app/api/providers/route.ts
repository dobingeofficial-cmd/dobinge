import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mediaType = searchParams.get('mediaType');
  const mediaId = searchParams.get('mediaId');
  const countryCode = searchParams.get('countryCode');

  if (!mediaType || !mediaId || !countryCode) {
    return NextResponse.json(
      { error: 'Missing required parameters: mediaType, mediaId, countryCode are required.' }, 
      { status: 400 }
    );
  }

  // Use the secure server-side TMDB API token. 
  // If you only have NEXT_PUBLIC_TMDB_PROXY_URL, you can use that, but a direct TMDB API key is cleaner for backend routes.
  const tmdbBaseUrl = 'https://api.themoviedb.org/3';
  const tmdbApiKey = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY; // Ensure you have this in .env.local

  if (!tmdbApiKey) {
    return NextResponse.json({ error: 'Server configuration error: Missing TMDB API Key' }, { status: 500 });
  }

  try {
    const tmdbRes = await fetch(
      `${tmdbBaseUrl}/${mediaType}/${mediaId}/watch/providers?api_key=${tmdbApiKey}`,
      { next: { revalidate: 3600 } } // Cache at the Edge for 1 hour to optimize performance
    );

    if (!tmdbRes.ok) {
      throw new Error(`TMDB upstream failure: ${tmdbRes.status}`);
    }

    const tmdbData = await tmdbRes.json();
    
    // Strict Regional Isolation: Extract ONLY the data for the active country Code
    // No fallback to US or Object.values()[0]
    const regionData = tmdbData.results?.[countryCode.toUpperCase()] || null;

    if (!regionData) {
      return NextResponse.json({ 
        message: 'No streaming providers found for this region.',
        providers: [],
        link: null
      }, { status: 200 });
    }

    // Normalize payload to keep the frontend clean
    return NextResponse.json({
      link: regionData.link || null,
      flatrate: regionData.flatrate || [],
      rent: regionData.rent || [],
      buy: regionData.buy || [],
      ads: regionData.ads || []
    });

  } catch (error) {
    console.error('Provider API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch provider data' }, { status: 502 });
  }
}