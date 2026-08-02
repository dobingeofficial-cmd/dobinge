import { NextResponse } from 'next/server';
import { generateDoBingeCurations } from '@/lib/engine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { moods, type = 'movie' } = body;

    if (!moods || moods.length === 0) {
      return NextResponse.json({ error: "Mood profile required." }, { status: 400 });
    }

    // Ignite the DoBinge Engine
    const recommendations = await generateDoBingeCurations(moods, type);

    return NextResponse.json({ success: true, data: recommendations });
    
  } catch (error) {
    return NextResponse.json({ error: "Engine calibration error." }, { status: 500 });
  }
}