import { NextResponse } from 'next/server';
import { normalizeProviders } from '@/lib/tmdb/providers';

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

  const tmdbBaseUrl = 'https://api.themoviedb.org/3';
  const tmdbApiKey = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;

  if (!tmdbApiKey) {
    return NextResponse.json({ error: 'Server configuration error: Missing TMDB API Key' }, { status: 500 });
  }

  try {
    const tmdbRes = await fetch(
      `${tmdbBaseUrl}/${mediaType}/${mediaId}/watch/providers?api_key=${tmdbApiKey}`,
      { next: { revalidate: 3600 } }
    );

    if (!tmdbRes.ok) {
      throw new Error(`TMDB upstream failure: ${tmdbRes.status}`);
    }

    const tmdbData = await tmdbRes.json();
    
    // Pass raw TMDB data through the single normalization layer
    const normalizedData = normalizeProviders(tmdbData, countryCode);

    return NextResponse.json(normalizedData);

  } catch (error) {
    console.error('Provider API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch provider data' }, { status: 502 });
  }
}