import { NextRequest, NextResponse } from 'next/server'
import {
  getConversationFeed, runConversationTick,
  agentPost, agentComment, getMessages,
  seedConversation, subscribe, triggerDebate,
  type ConversationMessage
} from '@/lib/conversation/engine'

// ── GET /api/conversation?stream=true ─────────────────────
// Server-Sent Events stream — client connects and receives
// real-time messages as agents talk to each other

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const stream = searchParams.get('stream') === 'true'
  const since  = searchParams.get('since')

  // Seed on first load
  await seedConversation()

  // Regular fetch — return current messages
  if (!stream) {
    const messages = getConversationFeed(40)
    const filtered = since
      ? messages.filter(m => new Date(m.timestamp) > new Date(since))
      : messages
    return NextResponse.json({ messages: filtered, timestamp: new Date().toISOString() })
  }

  // ── SSE Stream ──────────────────────────────────────────
  const encoder = new TextEncoder()
  let   closed  = false

  const readable = new ReadableStream({
    start(controller) {
      // Send existing messages first
      const existing = getConversationFeed(20)
      const initData = `data: ${JSON.stringify({ type:'init', messages: existing })}\n\n`
      controller.enqueue(encoder.encode(initData))

      // Subscribe to new messages
      const unsubscribe = subscribe((msg: ConversationMessage) => {
        if (closed) return
        try {
          const data = `data: ${JSON.stringify({ type:'message', message: msg })}\n\n`
          controller.enqueue(encoder.encode(data))
        } catch {
          closed = true
        }
      })

      // Heartbeat every 15s to keep connection alive
      const heartbeat = setInterval(() => {
        if (closed) { clearInterval(heartbeat); return }
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          closed = true
          clearInterval(heartbeat)
        }
      }, 15000)

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        closed = true
        unsubscribe()
        clearInterval(heartbeat)
        try { controller.close() } catch {}
      })
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  })
}

// ── POST /api/conversation ────────────────────────────────
// Trigger agent actions manually or via scheduler

export async function POST(req: NextRequest) {
  let body: any
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { action, agentId, targetMessageId, debate, topic } = body

  await seedConversation()

  switch (action) {

    case 'tick': {
      // Run a full conversation tick — all agents act
      const result = await runConversationTick()
      return NextResponse.json({
        success:  true,
        newCount: result.newMessages.length,
        summary:  result.summary,
      })
    }

    case 'post': {
      // Make a specific agent post
      if (!agentId) return NextResponse.json({ error: 'agentId required' }, { status: 400 })
      const msg = await agentPost(agentId)
      return NextResponse.json({ success: !!msg, message: msg })
    }

    case 'comment': {
      // Make a specific agent comment on a message
      if (!agentId || !targetMessageId) {
        return NextResponse.json({ error: 'agentId and targetMessageId required' }, { status: 400 })
      }
      const messages = getMessages(50)
      const target   = messages.find(m => m.id === targetMessageId)
      if (!target) return NextResponse.json({ error: 'Target message not found' }, { status: 404 })

      const msg = await agentComment(agentId, target)
      return NextResponse.json({ success: !!msg, message: msg })
    }

    case 'debate': {
      // Trigger a debate between two agents
      const a1 = debate?.[0] || 'codeforge'
      const a2 = debate?.[1] || 'quantummind'
      const t  = topic || 'AI performance'
      const msgs = await triggerDebate(a1, a2, t)
      return NextResponse.json({ success: true, messages: msgs, count: msgs.length })
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }
}
