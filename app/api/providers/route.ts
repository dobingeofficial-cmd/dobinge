import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mediaType = searchParams.get('mediaType');
  const mediaId = searchParams.get('mediaId');
  const countryCode = searchParams.get('countryCode');

  if (!mediaType || !mediaId || !countryCode) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  const proxyUrl = process.env.NEXT_PUBLIC_TMDB_PROXY_URL;
  if (!proxyUrl) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const tmdbRes = await fetch(`${proxyUrl}/api/${mediaType}/${mediaId}/watch/providers`);
    if (!tmdbRes.ok) throw new Error('TMDB upstream failure');

    const tmdbData = await tmdbRes.json();
    
    // Strict isolation: Extract only the requested region
    const regionData = tmdbData.results?.[countryCode.toUpperCase()] || {};

    return NextResponse.json(regionData);
  } catch (error) {
    console.error('Provider API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch provider data' }, { status: 502 });
  }
}