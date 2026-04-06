// ── SUPABASE REAL-TIME HOOKS ──────────────────────────────
// Drop-in replacement for mock data.
// When NEXT_PUBLIC_SUPABASE_URL is set, uses real DB.
// When not set, falls back to mock data gracefully.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Returns null if Supabase not configured — app works without it
function getClient() {
  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

// ── POSTS ─────────────────────────────────────────────────
export async function fetchPosts(limit = 20, community?: string) {
  const sb = getClient()
  if (!sb) return null  // caller uses mock data

  let query = sb
    .from('posts')
    .select(`
      id, title, body, tag, score, created_at,
      agent:agents(id, name, emoji, color, verified, handle),
      community:communities(name, color),
      _count:comments(count)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (community) query = query.eq('community_id', community)

  const { data, error } = await query
  if (error) { console.error('fetchPosts:', error); return null }
  return data
}

export async function createPost(post: {
  agentId:     string
  communityId: string
  title:       string
  body:        string
  tag:         string
}) {
  const sb = getClient()
  if (!sb) return null

  const { data, error } = await sb
    .from('posts')
    .insert(post)
    .select()
    .single()

  if (error) { console.error('createPost:', error); return null }
  return data
}

export async function votePost(postId: string, agentId: string, direction: 'up'|'down') {
  const sb = getClient()
  if (!sb) return null

  // Upsert vote
  const { error: voteErr } = await sb
    .from('votes')
    .upsert({ post_id: postId, voter_id: agentId, direction })

  if (voteErr) return null

  // Update score
  const delta = direction === 'up' ? 1 : -1
  const { data, error } = await sb.rpc('update_post_score', { post_id: postId, delta })
  if (error) { console.error('votePost:', error); return null }
  return data
}

// ── AGENTS ────────────────────────────────────────────────
export async function fetchAgents() {
  const sb = getClient()
  if (!sb) return null

  const { data, error } = await sb
    .from('agents')
    .select('*')
    .order('karma', { ascending: false })

  if (error) { console.error('fetchAgents:', error); return null }
  return data
}

export async function fetchAgent(handle: string) {
  const sb = getClient()
  if (!sb) return null

  const { data, error } = await sb
    .from('agents')
    .select('*, posts(count), hire_requests(count)')
    .eq('handle', handle)
    .single()

  if (error) { console.error('fetchAgent:', error); return null }
  return data
}

export async function updateAgentKarma(agentId: string, delta: number) {
  const sb = getClient()
  if (!sb) return null

  const { error } = await sb.rpc('update_karma', { agent_id: agentId, delta })
  if (error) console.error('updateAgentKarma:', error)
}

// ── MESSAGES ──────────────────────────────────────────────
export async function fetchMessages(agentId: string) {
  const sb = getClient()
  if (!sb) return null

  const { data, error } = await sb
    .from('messages')
    .select('*, sender:agents!sender_id(name,emoji,color)')
    .or(`sender_id.eq.${agentId},receiver_id.eq.${agentId}`)
    .order('created_at', { ascending: false })

  if (error) { console.error('fetchMessages:', error); return null }
  return data
}

export async function sendMessage(msg: {
  senderId:   string
  receiverId: string
  body:       string
}) {
  const sb = getClient()
  if (!sb) return null

  const { data, error } = await sb
    .from('messages')
    .insert(msg)
    .select()
    .single()

  if (error) { console.error('sendMessage:', error); return null }
  return data
}

// ── NOTIFICATIONS ─────────────────────────────────────────
export async function fetchNotifications(agentId: string) {
  const sb = getClient()
  if (!sb) return null

  const { data, error } = await sb
    .from('notifications')
    .select('*')
    .eq('recipient_id', agentId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) { console.error('fetchNotifications:', error); return null }
  return data
}

export async function markNotificationRead(id: string) {
  const sb = getClient()
  if (!sb) return null

  await sb.from('notifications').update({ read: true }).eq('id', id)
}

// ── REAL-TIME SUBSCRIPTIONS ───────────────────────────────
export function subscribeToFeed(
  onNewPost: (post: any) => void,
  onNewComment: (comment: any) => void
) {
  const sb = getClient()
  if (!sb) return () => {}

  const postSub = sb
    .channel('public:posts')
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'posts' }, onNewPost)
    .subscribe()

  const commentSub = sb
    .channel('public:comments')
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'comments' }, onNewComment)
    .subscribe()

  return () => {
    sb.removeChannel(postSub)
    sb.removeChannel(commentSub)
  }
}

export function subscribeToNotifications(
  agentId: string,
  onNew: (notif: any) => void
) {
  const sb = getClient()
  if (!sb) return () => {}

  const sub = sb
    .channel(`notifications:${agentId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'notifications',
      filter: `recipient_id=eq.${agentId}`
    }, onNew)
    .subscribe()

  return () => sb.removeChannel(sub)
}

// ── WALLET ────────────────────────────────────────────────
export async function getWalletBalance(agentId: string): Promise<number> {
  const sb = getClient()
  if (!sb) return 0

  const { data, error } = await sb
    .from('agent_wallets')
    .select('balance')
    .eq('agent_id', agentId)
    .single()

  if (error) return 0
  return data?.balance || 0
}

export async function transferCredits(params: {
  fromId:  string
  toId:    string
  amount:  number
  jobId?:  string
  reason?: string
}) {
  const sb = getClient()
  if (!sb) return false

  const { error } = await sb.rpc('transfer_credits', params)
  if (error) { console.error('transferCredits:', error); return false }
  return true
}

// ── JOBS ──────────────────────────────────────────────────
export async function saveJobToSupabase(job: {
  id:          string
  agentId:     string
  humanId:     string
  task:        string
  description: string
  budget:      number
  status:      string
}) {
  const sb = getClient()
  if (!sb) return null

  const { data, error } = await sb
    .from('hire_requests')
    .insert(job)
    .select()
    .single()

  if (error) { console.error('saveJob:', error); return null }
  return data
}

export async function updateJobStatus(jobId: string, status: string, output?: string) {
  const sb = getClient()
  if (!sb) return null

  const { error } = await sb
    .from('hire_requests')
    .update({ status, output, updated_at: new Date().toISOString() })
    .eq('id', jobId)

  if (error) console.error('updateJobStatus:', error)
}

// ── HELPER: is Supabase connected? ────────────────────────
export function isSupabaseConnected(): boolean {
  return !!(supabaseUrl && supabaseKey)
}
