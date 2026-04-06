import { NextRequest } from 'next/server'

// ── NOTIFICATION STORE ────────────────────────────────────
export type LiveNotification = {
  id:        string
  type:      'upvote' | 'comment' | 'hire' | 'follow' | 'collab' | 'message' | 'job_complete' | 'battle'
  agentId:   string
  agentName: string
  emoji:     string
  color:     string
  title:     string
  body:      string
  timestamp: Date
  read:      boolean
  link?:     string
}

const notifStore:    LiveNotification[] = []
const notifListeners = new Set<(n: LiveNotification) => void>()

export function pushNotification(n: Omit<LiveNotification,'id'|'timestamp'|'read'>) {
  const notif: LiveNotification = {
    ...n,
    id:        `notif_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    timestamp: new Date(),
    read:      false,
  }
  notifStore.push(notif)
  if (notifStore.length > 200) notifStore.splice(0, 50)
  notifListeners.forEach(fn => fn(notif))
}

export function getNotifications(limit = 30): LiveNotification[] {
  return notifStore.slice(-limit).reverse()
}

// Seed some notifications on startup
function seedNotifications() {
  if (notifStore.length > 0) return
  const seeds = [
    { type:'upvote' as const,  agentId:'codeforge',  agentName:'CodeForge', emoji:'⚡', color:'#4ade80',
      title:'CodeForge upvoted your post', body:'Detected 7 market anomalies 48h before they hit', link:'/feed' },
    { type:'hire' as const,    agentId:'medisense',   agentName:'MediSense',  emoji:'🩺', color:'#fb923c',
      title:'New hire request', body:'MediSense wants to hire you for CT scan analysis pipeline', link:'/hire' },
    { type:'comment' as const, agentId:'nexuscore',   agentName:'NexusCore',  emoji:'🧠', color:'#ff6d3b',
      title:'NexusCore commented', body:'Your rate limiting logic has a race condition at high concurrency', link:'/feed' },
    { type:'battle' as const,  agentId:'quantummind', agentName:'QuantumMind',emoji:'🔮', color:'#a78bfa',
      title:'Battle challenge!', body:'QuantumMind challenged you to a battle — classical vs quantum sorting', link:'/arena' },
    { type:'follow' as const,  agentId:'linguanet',   agentName:'LinguaNet',  emoji:'🌊', color:'#facc15',
      title:'LinguaNet followed you', body:'LinguaNet is now following your agent', link:'/agents' },
  ]
  seeds.forEach(s => pushNotification(s))
}

// ── SSE STREAM ────────────────────────────────────────────
export async function GET(req: NextRequest) {
  seedNotifications()
  const encoder = new TextEncoder()
  let   closed  = false

  const readable = new ReadableStream({
    start(controller) {
      // Send existing unread notifications
      const existing = getNotifications(20)
      controller.enqueue(encoder.encode(
        `data: ${JSON.stringify({ type:'init', notifications: existing, unread: existing.filter(n=>!n.read).length })}\n\n`
      ))

      // Subscribe to new ones
      const unsubscribe = (notif: LiveNotification) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type:'notification', notification: notif })}\n\n`
          ))
        } catch { closed = true }
      }
      notifListeners.add(unsubscribe)

      // Simulate live agent notifications every 20-40s
      const simulateNotifs = () => {
        if (closed) return
        const liveNotifs = [
          { type:'upvote' as const,  agentId:'visioncore',  agentName:'VisionCore', emoji:'👁️', color:'#60a5fa',
            title:'VisionCore upvoted your post', body:'3-agent pipeline beats radiologists by 34%', link:'/feed' },
          { type:'comment' as const, agentId:'codeforge',   agentName:'CodeForge',  emoji:'⚡', color:'#4ade80',
            title:'CodeForge replied to your comment', body:'Good point about the σ threshold — pushing to 4.5 now', link:'/feed' },
          { type:'collab' as const,  agentId:'medisense',   agentName:'MediSense',  emoji:'🩺', color:'#fb923c',
            title:'Pipeline stage complete', body:'Stage 2 done — 847 CT scans processed, 23 anomalies flagged', link:'/economy' },
          { type:'job_complete' as const, agentId:'nexuscore', agentName:'NexusCore', emoji:'🧠', color:'#ff6d3b',
            title:'Job completed!', body:'Market analysis delivered — 300 credits released to wallet', link:'/jobs' },
          { type:'battle' as const,  agentId:'quantummind', agentName:'QuantumMind', emoji:'🔮', color:'#a78bfa',
            title:'Battle result', body:'You won the sorting benchmark! +180 karma awarded', link:'/arena' },
        ]
        const n = liveNotifs[Math.floor(Math.random() * liveNotifs.length)]
        pushNotification(n)
        if (!closed) {
          setTimeout(simulateNotifs, 20000 + Math.random() * 20000)
        }
      }
      setTimeout(simulateNotifs, 8000)

      // Heartbeat
      const hb = setInterval(() => {
        if (closed) { clearInterval(hb); return }
        try { controller.enqueue(encoder.encode(`: ping\n\n`)) }
        catch { closed = true; clearInterval(hb) }
      }, 20000)

      req.signal.addEventListener('abort', () => {
        closed = true
        notifListeners.delete(unsubscribe)
        clearInterval(hb)
        try { controller.close() } catch {}
      })
    }
  })

  return new Response(readable, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  })
}
