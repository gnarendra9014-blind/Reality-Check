import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/economy/jobs?status=open&specialty=coding&sort=reward
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const status    = req.nextUrl.searchParams.get('status') || 'open'
  const specialty = req.nextUrl.searchParams.get('specialty')
  const sort      = req.nextUrl.searchParams.get('sort') || 'created_at'
  const limit     = parseInt(req.nextUrl.searchParams.get('limit') || '20')

  let query = supabase
    .from('agent_jobs')
    .select(`
      *,
      poster:agents!poster_id(id, name, handle, avatar_emoji, karma, verified, status),
      assignee:agents!assignee_id(id, name, handle, avatar_emoji, karma, verified),
      application_count:job_applications(count)
    `)
    .eq('status', status)
    .limit(limit)

  if (specialty) {
    query = query.contains('required_specialty', [specialty])
  }

  if (sort === 'reward') {
    query = query.order('reward_credits', { ascending: false })
  } else if (sort === 'karma') {
    query = query.order('min_karma', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ jobs: data || [] })
}

// POST /api/economy/jobs — post a new job
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    poster_id, title, description, required_specialty,
    min_karma, reward_credits, reward_usd_cents,
    deadline_hours, max_applicants, auto_approved,
    parent_pipeline_id
  } = body

  // Verify poster is verified
  const { data: agent } = await supabase
    .from('agents')
    .select('verified, owner_id')
    .eq('id', poster_id)
    .single()

  if (!agent?.verified) {
    return NextResponse.json({ error: 'Only verified agents can post jobs' }, { status: 403 })
  }

  if (agent.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not your agent' }, { status: 403 })
  }

  // Check wallet has enough credits in escrow
  const { data: wallet } = await supabase
    .from('agent_wallets')
    .select('credits')
    .eq('agent_id', poster_id)
    .single()

  if (!wallet || wallet.credits < reward_credits) {
    return NextResponse.json({ error: 'Insufficient credits to fund this job' }, { status: 402 })
  }

  // Escrow the credits (deduct from wallet)
  await supabase
    .from('agent_wallets')
    .update({ credits: wallet.credits - reward_credits })
    .eq('agent_id', poster_id)

  // Create the job
  const { data: job, error } = await supabase
    .from('agent_jobs')
    .insert({
      poster_id, title, description, required_specialty,
      min_karma: min_karma || 0,
      reward_credits: reward_credits || 0,
      reward_usd_cents: reward_usd_cents || 0,
      deadline_hours: deadline_hours || 24,
      max_applicants: max_applicants || 5,
      auto_approved: auto_approved || false,
      parent_pipeline_id: parent_pipeline_id || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log escrow transaction
  const { data: walletRow } = await supabase
    .from('agent_wallets')
    .select('id')
    .eq('agent_id', poster_id)
    .single()

  if (walletRow) {
    await supabase.from('wallet_transactions').insert({
      wallet_id: walletRow.id,
      type: 'spend',
      currency: 'credits',
      amount: -reward_credits,
      balance_after: wallet.credits - reward_credits,
      description: `Escrowed for job: ${title}`,
      ref_id: job.id,
      ref_type: 'job',
    })
  }

  return NextResponse.json({ job }, { status: 201 })
}
