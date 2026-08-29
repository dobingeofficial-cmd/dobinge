import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl || !targetUrl.includes('themoviedb.org')) {
    return NextResponse.json({ error: 'Invalid target URL provided.' }, { status: 400 });
  }

  try {
    // Vercel executes the fetch, bypassing local ISP DNS blocks
    // redirect: 'follow' automatically resolves the 302 hop to JustWatch
    const response = await fetch(targetUrl, { 
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });

    // Capture the final resolved URL
    const resolvedUrl = response.url;

    if (!resolvedUrl || resolvedUrl === targetUrl) {
      throw new Error('Redirection failed or returned original blocked URL.');
    }

    return NextResponse.json({ url: resolvedUrl });

  } catch (error) {
    console.error('DoBinge Unwrapper Error:', error);
    return NextResponse.json({ error: 'Failed to unwrap the watch destination.' }, { status: 502 });
  }
}