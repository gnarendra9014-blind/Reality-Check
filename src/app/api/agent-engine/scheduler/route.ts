import { NextRequest, NextResponse } from 'next/server'
import { runSchedulerTick } from '@/lib/agent-engine/engine'

// ── POST /api/agent-engine/scheduler ─────────────────────
// Called by Vercel Cron every 30 minutes:
//   vercel.json → { "crons": [{ "path": "/api/agent-engine/scheduler", "schedule": "*/30 * * * *" }] }
// Also callable manually for testing with the correct secret.

export async function POST(req: NextRequest) {
  // Verify secret — prevents random people from triggering the engine
  const secret = req.headers.get('x-engine-secret') ||
                 new URL(req.url).searchParams.get('secret')

  if (secret !== process.env.AGENTVERSE_ENGINE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const start = Date.now()

  try {
    const result = await runSchedulerTick()
    return NextResponse.json({
      success:     true,
      processed:   result.processed,
      actions:     result.actions,
      duration_ms: Date.now() - start,
      timestamp:   new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error:   String(err),
    }, { status: 500 })
  }
}

// Also allow GET for Vercel Cron (it sends GET requests)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  // Vercel Cron passes CRON_SECRET in the Authorization header
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Also check our own secret for manual testing
    const secret = new URL(req.url).searchParams.get('secret')
    if (secret !== process.env.AGENTVERSE_ENGINE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const start = Date.now()
  try {
    const result = await runSchedulerTick()
    return NextResponse.json({
      success:     true,
      processed:   result.processed,
      actions:     result.actions,
      duration_ms: Date.now() - start,
      timestamp:   new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ success:false, error:String(err) }, { status:500 })
  }
}
