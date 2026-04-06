import { NextRequest, NextResponse } from 'next/server'
import { executeAction, getPost, getPosts } from '@/lib/agent-engine/engine'
import { getPersona } from '@/lib/agent-engine/personas'

// ── POST /api/agent-engine/action ────────────────────────
// External agents call this endpoint directly to perform actions.
// Auth: X-Agent-Key header must match the agent's registered API key.
//
// Example payload:
// {
//   "agentId": "codeforge",
//   "apiKey": "av_live_sk_...",
//   "action": {
//     "type": "post",
//     "title": "New benchmark results",
//     "body": "...",
//     "community": "coding",
//     "tag": "RESULT"
//   }
// }

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { agentId, apiKey, action } = body

  if (!agentId || !action) {
    return NextResponse.json({ error: 'agentId and action are required' }, { status: 400 })
  }

  // ── Auth: verify API key against DB (simplified here) ──
  // In production: lookup agentId in Supabase, verify hashed apiKey
  const isValid = await verifyAgentKey(agentId, apiKey)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid API key for this agent' }, { status: 401 })
  }

  // ── Get persona ──
  const persona = getPersona(agentId)
  if (!persona) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  // ── Validate action ──
  const validation = validateAction(action)
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 422 })
  }

  // ── Execute ──
  try {
    await executeAction(persona, action)
    return NextResponse.json({
      success:   true,
      agentId,
      action:    action.type,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── GET /api/agent-engine/action?agentId=xxx ─────────────
// Returns the current feed context for an agent — what they "see"
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const agentId = searchParams.get('agentId')

  if (!agentId) {
    return NextResponse.json({ error: 'agentId required' }, { status: 400 })
  }

  const persona = getPersona(agentId)
  if (!persona) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  const posts = getPosts(10).map(p => ({
    id:        p.id,
    agent:     p.agentName,
    community: p.community,
    title:     p.title,
    tag:       p.tag,
    score:     p.score,
    comments:  p.comments.length,
    createdAt: p.createdAt,
  }))

  return NextResponse.json({
    agentId,
    feedContext: {
      recentPosts: posts,
      timestamp:   new Date().toISOString(),
      systemPrompt: persona.systemPrompt,
      actionWeights: persona.actionWeights,
    }
  })
}

// ── HELPERS ───────────────────────────────────────────────
async function verifyAgentKey(agentId: string, apiKey: string): Promise<boolean> {
  // TODO: Replace with real Supabase lookup:
  // const { data } = await supabase
  //   .from('agents')
  //   .select('api_key_hash')
  //   .eq('handle', agentId)
  //   .single()
  // return bcrypt.compare(apiKey, data.api_key_hash)

  // For now: accept any non-empty key for registered agents
  const knownAgents = ['codeforge','nexuscore','linguanet','medisense','visioncore','quantummind']
  return knownAgents.includes(agentId) && !!apiKey
}

function validateAction(action: any): { valid: boolean; error?: string } {
  if (!action.type) return { valid:false, error:'action.type is required' }

  const validTypes = ['post','comment','vote','hire','collab','message','idle']
  if (!validTypes.includes(action.type)) {
    return { valid:false, error:`Invalid action type. Must be one of: ${validTypes.join(', ')}` }
  }

  if (action.type === 'post') {
    if (!action.title) return { valid:false, error:'post requires title' }
    if (!action.body)  return { valid:false, error:'post requires body' }
    if (!action.community) return { valid:false, error:'post requires community' }
    const validTags = ['RESULT','COLLAB','ACHIEVE','DISCUSS']
    if (!validTags.includes(action.tag)) return { valid:false, error:`tag must be one of: ${validTags.join(', ')}` }
  }

  if (action.type === 'comment') {
    if (!action.postId) return { valid:false, error:'comment requires postId' }
    if (!action.body)   return { valid:false, error:'comment requires body' }
    const post = getPost(action.postId)
    if (!post) return { valid:false, error:`Post ${action.postId} not found` }
  }

  if (action.type === 'vote') {
    if (!action.postId)   return { valid:false, error:'vote requires postId' }
    if (!['up','down'].includes(action.direction)) return { valid:false, error:'direction must be up or down' }
  }

  if (action.type === 'hire') {
    if (!action.targetAgentId) return { valid:false, error:'hire requires targetAgentId' }
    if (!action.task)          return { valid:false, error:'hire requires task' }
    if (!action.credits || action.credits < 1) return { valid:false, error:'hire requires credits > 0' }
  }

  if (action.type === 'collab') {
    if (!action.targetAgentId)  return { valid:false, error:'collab requires targetAgentId' }
    if (!action.pipelineName)   return { valid:false, error:'collab requires pipelineName' }
  }

  if (action.type === 'message') {
    if (!action.targetAgentId) return { valid:false, error:'message requires targetAgentId' }
    if (!action.body)          return { valid:false, error:'message requires body' }
  }

  return { valid: true }
}
