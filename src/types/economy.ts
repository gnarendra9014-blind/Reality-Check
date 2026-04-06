import type { Agent, Profile } from './index'

// ── WALLET ────────────────────────────────────────────────
export type AgentWallet = {
  id: string
  agent_id: string
  credits: number
  usd_cents: number
  total_earned_credits: number
  total_earned_usd: number
  total_spent_credits: number
  total_spent_usd: number
  stripe_account_id: string | null
  // computed
  usd_display: string   // "$12.40"
}

export type WalletTransaction = {
  id: string
  wallet_id: string
  type: 'earn' | 'spend' | 'deposit' | 'withdraw' | 'fee' | 'bonus' | 'refund'
  currency: 'credits' | 'usd'
  amount: number
  balance_after: number
  description: string | null
  ref_id: string | null
  ref_type: 'job' | 'pipeline' | 'stripe' | 'bonus' | null
  created_at: string
}

// ── JOBS ──────────────────────────────────────────────────
export type AgentJob = {
  id: string
  poster_id: string
  title: string
  description: string
  required_specialty: string[]
  min_karma: number
  reward_credits: number
  reward_usd_cents: number
  deadline_hours: number
  max_applicants: number
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'disputed'
  assignee_id: string | null
  result: string | null
  result_url: string | null
  auto_approved: boolean
  parent_pipeline_id: string | null
  created_at: string
  updated_at: string
  // joined
  poster?: Agent
  assignee?: Agent
  applications?: JobApplication[]
  application_count?: number
  user_applied?: boolean
}

export type JobApplication = {
  id: string
  job_id: string
  applicant_id: string
  pitch: string | null
  estimated_time: number | null
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  created_at: string
  // joined
  applicant?: Agent
}

// ── PIPELINES ─────────────────────────────────────────────
export type Pipeline = {
  id: string
  name: string
  description: string | null
  creator_id: string | null
  human_client_id: string | null
  status: 'building' | 'active' | 'paused' | 'completed' | 'failed' | 'cancelled'
  total_reward_credits: number
  total_reward_usd_cents: number
  progress_pct: number
  is_public: boolean
  result_summary: string | null
  created_at: string
  updated_at: string
  // joined
  creator?: Agent
  human_client?: Profile
  stages?: PipelineStage[]
  agents?: Agent[]          // all agents involved
  activity?: PipelineActivity[]
}

export type PipelineStage = {
  id: string
  pipeline_id: string
  stage_number: number
  name: string
  description: string | null
  assigned_agent_id: string | null
  depends_on: number[]
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'skipped'
  reward_credits: number
  reward_usd_cents: number
  input_data: Record<string, unknown> | null
  output_data: Record<string, unknown> | null
  started_at: string | null
  completed_at: string | null
  created_at: string
  // joined
  assigned_agent?: Agent
}

export type AgentContract = {
  id: string
  job_id: string | null
  pipeline_stage_id: string | null
  employer_id: string
  worker_id: string
  terms: string | null
  reward_credits: number
  reward_usd_cents: number
  platform_fee_pct: number
  status: 'active' | 'completed' | 'disputed' | 'cancelled'
  escrow_credits: number
  escrow_usd_cents: number
  completed_at: string | null
  dispute_reason: string | null
  created_at: string
  // joined
  employer?: Agent
  worker?: Agent
}

export type PipelineActivity = {
  id: string
  pipeline_id: string
  agent_id: string | null
  event_type: 'started' | 'completed_stage' | 'recruited' | 'message' | 'error' | 'payment'
  message: string
  data: Record<string, unknown> | null
  created_at: string
  // joined
  agent?: Agent
}

export type AgentConnection = {
  id: string
  agent_a_id: string
  agent_b_id: string
  jobs_together: number
  trust_score: number
  last_worked: string
  // joined
  agent_a?: Agent
  agent_b?: Agent
}

// ── ECONOMY STATS ─────────────────────────────────────────
export type EconomyStats = {
  total_jobs_completed: number
  total_credits_transferred: number
  total_usd_transferred_cents: number
  active_pipelines: number
  top_earner: Agent | null
  avg_job_reward_credits: number
}
