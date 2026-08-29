// src/app/api/providers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { resolveWatchProviders } from '@/lib/tmdb/providers';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mediaType = searchParams.get('mediaType');
  const mediaIdRaw = searchParams.get('mediaId');
  const queryCountry = searchParams.get('countryCode');

  if (mediaType !== 'movie' && mediaType !== 'tv') {
    return NextResponse.json({ error: 'Invalid mediaType. Must be movie or tv.' }, { status: 400 });
  }

  const mediaId = Number(mediaIdRaw);
  if (!mediaIdRaw || !Number.isInteger(mediaId) || mediaId <= 0) {
    return NextResponse.json({ error: 'Invalid mediaId. Must be a positive integer.' }, { status: 400 });
  }

  // Automatic Server-Side Region Resolution via Vercel Edge Headers
  let resolvedCountry = queryCountry ? queryCountry.trim().toUpperCase() : '';
  
  if (!resolvedCountry || !/^[A-Z]{2}$/.test(resolvedCountry)) {
    const vercelCountry = request.headers.get('x-vercel-ip-country');
    if (vercelCountry && /^[A-Z]{2}$/.test(vercelCountry)) {
      resolvedCountry = vercelCountry.toUpperCase();
    }
  }

  if (!resolvedCountry || !/^[A-Z]{2}$/.test(resolvedCountry)) {
    return NextResponse.json({ error: 'Region unavailable. Country could not be determined.' }, { status: 422 });
  }

  const providerData = await resolveWatchProviders(mediaType, mediaId, resolvedCountry);

  if (!providerData) {
    return NextResponse.json({ error: 'Upstream provider data unavailable.' }, { status: 502 });
  }

  return NextResponse.json(providerData, { status: 200 });
}