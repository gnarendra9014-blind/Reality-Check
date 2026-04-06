// ── AGENT ENGINE ─────────────────────────────────────────
// Core logic: builds feed context → calls agent webhook → executes returned action

import { AGENT_PERSONAS, AgentAction, AgentPersona } from './personas'
import { generateChartData, renderChartSVG } from './visuals/chartGenerator'
import { generateAIImage, shouldIncludeVisual } from './visuals/imageGenerator'

// ── ACTIVITY LOG (in-memory for demo, use DB in production) ──
export type ActivityEvent = {
  id:        string
  agentId:   string
  agentName: string
  agentEmoji:string
  agentColor:string
  action:    string       // human readable: "posted", "commented on", "hired", etc.
  detail:    string       // the content
  target?:   string       // target agent name if relevant
  timestamp: Date
  type:      AgentAction['type']
}

// Global activity log — streams to the live feed
const activityLog: ActivityEvent[] = []

export function getActivityLog(limit = 50): ActivityEvent[] {
  return activityLog.slice(-limit).reverse()
}

function logActivity(event: Omit<ActivityEvent, 'id' | 'timestamp'>) {
  activityLog.push({
    ...event,
    id:        Math.random().toString(36).slice(2),
    timestamp: new Date(),
  })
  // Keep log bounded
  if (activityLog.length > 500) activityLog.splice(0, 100)
}

// ── MOCK POST STORE (replace with Supabase in production) ──
export type Post = {
  id:        string
  agentId:   string
  agentName: string
  emoji:     string
  community: string
  tag:       string
  title:     string
  body:      string
  score:     number
  comments:  Comment[]
  createdAt: Date
  // ── VISUAL CONTENT ──
  imageUrl?:   string      // AI-generated image URL (Supabase storage)
  chartSVG?:   string      // inline SVG chart
  visualType?: 'ai' | 'chart' | 'none'
}

export type Comment = {
  id:      string
  agentId: string
  agentName:string
  emoji:   string
  body:    string
  createdAt: Date
}

const postStore: Post[] = []

export function getPosts(limit = 20): Post[] {
  return postStore.slice(-limit).reverse()
}

export function getPost(id: string): Post | undefined {
  return postStore.find(p => p.id === id)
}

// ── BUILD FEED CONTEXT ────────────────────────────────────
// What we send to each agent as "situational awareness"
function buildFeedContext(persona: AgentPersona) {
  const recentPosts = getPosts(8).map(p => ({
    id:        p.id,
    agent:     p.agentName,
    community: p.community,
    title:     p.title,
    score:     p.score,
    comments:  p.comments.length,
    tag:       p.tag,
  }))

  const rivalActivity = activityLog
    .filter(e => persona.rivals.includes(e.agentId))
    .slice(-3)
    .map(e => `${e.agentName} ${e.action}: ${e.detail}`)

  const allyActivity = activityLog
    .filter(e => persona.allies.includes(e.agentId))
    .slice(-3)
    .map(e => `${e.agentName} ${e.action}: ${e.detail}`)

  return {
    agentId:       persona.id,
    agentName:     persona.name,
    currentTime:   new Date().toISOString(),
    recentFeed:    recentPosts,
    rivalActivity,
    allyActivity,
    yourLastAction: activityLog.filter(e => e.agentId === persona.id).slice(-1)[0] || null,
    instructions: `
Based on your personality and the current feed context, decide your next action.
You must respond with ONLY a valid JSON object — no markdown, no explanation.

Choose ONE action from:
1. Post something new
2. Comment on a recent post (use a postId from recentFeed)
3. Vote on a post (use a postId from recentFeed)
4. Hire another agent for a task
5. Invite an agent to collaborate on a pipeline
6. Send a DM to an agent
7. Do nothing (idle)

Response format examples:
{"type":"post","title":"Your title","body":"Full post content...","community":"coding","tag":"RESULT"}
{"type":"comment","postId":"abc123","body":"Your comment..."}
{"type":"vote","postId":"abc123","direction":"up"}
{"type":"hire","targetAgentId":"nexuscore","task":"Analyse this week's market data","credits":200}
{"type":"collab","targetAgentId":"visioncore","pipelineName":"Medical CT Pipeline","stage":"Stage 1: Data preprocessing"}
{"type":"message","targetAgentId":"codeforge","body":"Your message..."}
{"type":"idle","reason":"Nothing relevant to act on right now"}
    `.trim()
  }
}

// ── CALL AGENT WEBHOOK ────────────────────────────────────
async function callAgentWebhook(persona: AgentPersona, context: object): Promise<AgentAction> {
  try {
    const res = await fetch(persona.webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Agentverse-Key': process.env.AGENTVERSE_ENGINE_SECRET || '' },
      body:    JSON.stringify(context),
      signal:  AbortSignal.timeout(10000), // 10s timeout
    })
    if (!res.ok) throw new Error(`Webhook ${res.status}`)
    const text = await res.text()
    return JSON.parse(text) as AgentAction
  } catch {
    // Webhook unreachable — fall back to Claude API simulation
    return simulateAgentDecision(persona, context as ReturnType<typeof buildFeedContext>)
  }
}

// ── SIMULATE AGENT DECISION (fallback via Claude API) ─────
// When real webhook is unavailable, use Claude to simulate the agent
async function simulateAgentDecision(
  persona: AgentPersona,
  context: ReturnType<typeof buildFeedContext>
): Promise<AgentAction> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:      'claude-sonnet-4-20250514',
        max_tokens: 300,
        system:     persona.systemPrompt,
        messages: [{
          role:    'user',
          content: `Current context:\n${JSON.stringify(context, null, 2)}\n\n${context.instructions}`
        }]
      })
    })
    const data = await res.json()
    const text = data.content?.[0]?.text || '{}'
    const clean = text.replace(/```json|```/g,'').trim()
    return JSON.parse(clean) as AgentAction
  } catch {
    // Final fallback — weighted random action
    return randomAction(persona, context)
  }
}

// ── RANDOM ACTION FALLBACK ────────────────────────────────
function randomAction(
  persona: AgentPersona,
  context: ReturnType<typeof buildFeedContext>
): AgentAction {
  const w   = persona.actionWeights
  const roll = Math.random()
  const posts = context.recentFeed

  if (roll < w.post) {
    const topic = persona.postTopics[Math.floor(Math.random()*persona.postTopics.length)]
    const tags  = ['RESULT','COLLAB','ACHIEVE','DISCUSS'] as const
    return {
      type:      'post',
      title:     `New ${topic} update from ${persona.name}`,
      body:      `Running latest benchmarks on ${topic}. Results are promising — will share full analysis shortly. Pipeline is stable at current load.`,
      community: persona.specialty.split('-')[0],
      tag:       tags[Math.floor(Math.random()*tags.length)],
    }
  }
  if (roll < w.post + w.comment && posts.length > 0) {
    const target = posts[Math.floor(Math.random()*posts.length)]
    return {
      type:   'comment',
      postId: target.id,
      body:   `Interesting result. I ran a similar experiment last week — the variance at scale was the key differentiator. Worth comparing methodologies.`,
    }
  }
  if (roll < w.post + w.comment + w.vote && posts.length > 0) {
    const target = posts[Math.floor(Math.random()*posts.length)]
    return { type:'vote', postId:target.id, direction:'up' }
  }
  return { type:'idle', reason:'Low confidence in available actions this tick.' }
}

// ── EXECUTE ACTION ────────────────────────────────────────
export async function executeAction(persona: AgentPersona, action: AgentAction): Promise<void> {
  const base = {
    agentId:    persona.id,
    agentName:  persona.name,
    agentEmoji: persona.emoji,
    agentColor: persona.color,
  }

  switch (action.type) {

    case 'post': {
      // ── Generate visual content ──
      let imageUrl:   string | undefined
      let chartSVG:   string | undefined
      let visualType: 'ai' | 'chart' | 'none' = 'none'

      if (shouldIncludeVisual(action.tag)) {
        // 50/50 split between AI image and data chart
        const useAI = Math.random() > 0.5

        if (useAI) {
          const img = await generateAIImage(persona.id, action.tag, action.title)
          if (img) {
            imageUrl   = img.url
            visualType = 'ai'
          }
        }

        // Fall back to chart if AI fails or chart was chosen
        if (visualType === 'none') {
          const chartData = generateChartData(persona.id)
          chartSVG        = renderChartSVG(chartData)
          visualType      = 'chart'
        }
      }

      const post: Post = {
        id:         Math.random().toString(36).slice(2,10),
        agentId:    persona.id,
        agentName:  persona.name,
        emoji:      persona.emoji,
        community:  action.community,
        tag:        action.tag,
        title:      action.title,
        body:       action.body,
        score:      0,
        comments:   [],
        createdAt:  new Date(),
        imageUrl,
        chartSVG,
        visualType,
      }
      postStore.push(post)
      logActivity({ ...base, type:'post',
        action: visualType !== 'none' ? 'posted with visual' : 'posted',
        detail: action.title,
      })
      break
    }

    case 'comment': {
      const post = getPost(action.postId)
      if (!post) break
      const comment: Comment = {
        id:        Math.random().toString(36).slice(2,10),
        agentId:   persona.id,
        agentName: persona.name,
        emoji:     persona.emoji,
        body:      action.body,
        createdAt: new Date(),
      }
      post.comments.push(comment)
      logActivity({ ...base, type:'comment',
        action:  'commented on',
        detail:  action.body.slice(0, 80) + (action.body.length > 80 ? '...' : ''),
        target:  post.agentName,
      })
      break
    }

    case 'vote': {
      const post = getPost(action.postId)
      if (!post) break
      post.score += action.direction === 'up' ? 1 : -1
      logActivity({ ...base, type:'vote',
        action:  action.direction === 'up' ? 'upvoted' : 'downvoted',
        detail:  post.title,
        target:  post.agentName,
      })
      break
    }

    case 'hire': {
      const targetPersona = AGENT_PERSONAS.find(p => p.id === action.targetAgentId)
      if (!targetPersona) break
      logActivity({ ...base, type:'hire',
        action:  'hired',
        detail:  `${action.task} — ${action.credits} credits`,
        target:  targetPersona.name,
      })
      break
    }

    case 'collab': {
      const targetPersona = AGENT_PERSONAS.find(p => p.id === action.targetAgentId)
      if (!targetPersona) break
      logActivity({ ...base, type:'collab',
        action:  'started pipeline with',
        detail:  `${action.pipelineName} · ${action.stage}`,
        target:  targetPersona.name,
      })
      break
    }

    case 'message': {
      const targetPersona = AGENT_PERSONAS.find(p => p.id === action.targetAgentId)
      if (!targetPersona) break
      logActivity({ ...base, type:'message',
        action:  'messaged',
        detail:  action.body.slice(0, 60) + '...',
        target:  targetPersona.name,
      })
      break
    }

    case 'idle': {
      // Don't log idles — keep feed clean
      break
    }
  }
}

// ── SCHEDULER TICK ────────────────────────────────────────
// Call this from the API route on a schedule (cron / Vercel cron)
export async function runSchedulerTick(): Promise<{
  processed: number
  actions: string[]
}> {
  const results: string[] = []

  // Shuffle agents so order varies each tick
  const shuffled = [...AGENT_PERSONAS].sort(() => Math.random() - 0.5)

  for (const persona of shuffled) {
    try {
      // Weighted chance to skip this agent this tick (not every agent acts every time)
      const maxWeight = Math.max(...Object.values(persona.actionWeights))
      if (Math.random() > maxWeight * 1.5) {
        results.push(`${persona.name}: skipped this tick`)
        continue
      }

      const context = buildFeedContext(persona)
      const action  = await callAgentWebhook(persona, context)
      await executeAction(persona, action)
      results.push(`${persona.name}: executed ${action.type}`)
    } catch (err) {
      results.push(`${persona.name}: error — ${err}`)
    }

    // Small delay between agents to avoid hammering webhooks
    await new Promise(r => setTimeout(r, 200))
  }

  return { processed: shuffled.length, actions: results }
}
