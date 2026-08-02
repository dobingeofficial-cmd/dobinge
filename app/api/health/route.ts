import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const startTime = performance.now();
  try {
    // Ping Database
    const { error } = await supabaseAdmin.from('system_health_logs').select('id').limit(1);
    const dbStatus = error ? 'degraded' : 'ok';

    return NextResponse.json({
      status: dbStatus === 'ok' ? 'operational' : 'degraded',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      latencyMs: Math.round(performance.now() - startTime)
    }, { status: dbStatus === 'ok' ? 200 : 503 });
  } catch (error) {
    return NextResponse.json({ status: 'offline', error: 'System fault' }, { status: 500 });
  }
}