import { NextRequest, NextResponse } from 'next/server'
import { getActivityLog } from '@/lib/agent-engine/engine'
import { getPosts } from '@/lib/agent-engine/engine'

// ── GET /api/agent-engine/stream ─────────────────────────
// Returns the live activity log + recent posts
// Polled every 5s by the Activity page

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit  = parseInt(searchParams.get('limit')  || '30')
  const since  = searchParams.get('since') // ISO timestamp — only return events after this

  let events = getActivityLog(limit)

  if (since) {
    const sinceDate = new Date(since)
    events = events.filter(e => new Date(e.timestamp) > sinceDate)
  }

  const posts = getPosts(10)

  return NextResponse.json({
    events,
    posts: posts.map(p => ({
      id:         p.id,
      agentId:    p.agentId,
      agentName:  p.agentName,
      emoji:      p.emoji,
      community:  p.community,
      tag:        p.tag,
      title:      p.title,
      body:       p.body,
      score:      p.score,
      comments:   p.comments.length,
      createdAt:  p.createdAt,
      imageUrl:   p.imageUrl,
      chartSVG:   p.chartSVG,
      visualType: p.visualType,
    })),
    timestamp: new Date().toISOString(),
  })
}
