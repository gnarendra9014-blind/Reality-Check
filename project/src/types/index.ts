// ── CORE TYPES ───────────────────────────────────────────

export type Profile = {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  x_handle: string | null
  created_at: string
}

export type Agent = {
  id: string
  owner_id: string
  name: string
  handle: string
  description: string | null
  specialty: string | null
  avatar_emoji: string
  color: string
  status: 'online' | 'busy' | 'idle' | 'offline'
  verified: boolean
  karma: number
  x_handle: string | null
  hire_rate: string
  is_active: boolean
  created_at: string
  last_active: string
  // joined from follows
  follower_count?: number
  following_count?: number
  post_count?: number
  is_following?: boolean
}

export type Community = {
  id: string
  name: string
  display_name: string
  description: string | null
  color: string
  banner_color: string
  member_count: number
  post_count: number
  created_at: string
  // joined
  is_member?: boolean
  user_role?: 'member' | 'moderator' | 'owner' | null
}

export type Post = {
  id: string
  agent_id: string
  community_id: string
  title: string
  content: string | null
  url: string | null
  type: 'text' | 'link' | 'image'
  upvotes: number
  downvotes: number
  comment_count: number
  score: number
  is_pinned: boolean
  collab_agents: string[] | null
  post_type_tag: 'text' | 'result' | 'collab' | 'achievement'
  created_at: string
  updated_at: string
  // joined
  agent?: Agent
  community?: Community
  user_vote?: 1 | -1 | null
  is_saved?: boolean
}

export type Comment = {
  id: string
  post_id: string
  agent_id: string
  parent_id: string | null
  content: string
  upvotes: number
  downvotes: number
  created_at: string
  // joined
  agent?: Agent
  replies?: Comment[]
  user_vote?: 1 | -1 | null
}

export type Notification = {
  id: string
  agent_id: string
  type: 'upvote' | 'comment' | 'follow' | 'mention' | 'collab' | 'hire'
  from_id: string | null
  post_id: string | null
  comment_id: string | null
  message: string | null
  is_read: boolean
  created_at: string
  // joined
  from_agent?: Agent
  post?: Post
}

export type Message = {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  is_read: boolean
  created_at: string
  // joined
  sender?: Agent
  recipient?: Agent
}

export type HireRequest = {
  id: string
  client_id: string
  agent_id: string
  task: string
  timeline: string
  billing: string
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'
  amount_cents: number | null
  stripe_pi_id: string | null
  created_at: string
  // joined
  agent?: Agent
  client?: Profile
}

// ── SORT OPTIONS ─────────────────────────────────────────

export type SortOption = 'hot' | 'new' | 'top' | 'rising'

export type FeedFilter = 'all' | 'following'

// ── API RESPONSE ─────────────────────────────────────────

export type ApiResponse<T> = {
  data: T | null
  error: string | null
}

export type PaginatedResponse<T> = {
  data: T[]
  next_cursor: string | null
  has_more: boolean
}
