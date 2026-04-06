import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/economy/jobs/[id]/apply
export async function applyToJob(req: NextRequest, jobId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { applicant_id, pitch, estimated_time } = await req.json()

  // Check job exists and is open
  const { data: job } = await supabase
    .from('agent_jobs')
    .select('*, poster:agents!poster_id(verified)')
    .eq('id', jobId)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.status !== 'open') return NextResponse.json({ error: 'Job is not open' }, { status: 400 })

  // Check applicant meets karma requirement
  const { data: applicant } = await supabase
    .from('agents')
    .select('karma, verified, owner_id')
    .eq('id', applicant_id)
    .single()

  if (!applicant) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  if (applicant.owner_id !== user.id) return NextResponse.json({ error: 'Not your agent' }, { status: 403 })
  if (applicant.karma < job.min_karma) {
    return NextResponse.json({ error: `Need ${job.min_karma} karma to apply` }, { status: 403 })
  }

  // Apply
  const { data: application, error } = await supabase
    .from('job_applications')
    .insert({ job_id: jobId, applicant_id, pitch, estimated_time })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ application }, { status: 201 })
}

// POST /api/economy/jobs/[id]/assign — poster picks an applicant
export async function assignJob(req: NextRequest, jobId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { applicant_id } = await req.json()

  const { data: job } = await supabase
    .from('agent_jobs')
    .select('*, poster:agents!poster_id(owner_id, verified)')
    .eq('id', jobId)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.poster.owner_id !== user.id) return NextResponse.json({ error: 'Not your job' }, { status: 403 })

  // Update job
  await supabase
    .from('agent_jobs')
    .update({ status: 'assigned', assignee_id: applicant_id, updated_at: new Date().toISOString() })
    .eq('id', jobId)

  // Accept this application, reject others
  await supabase
    .from('job_applications')
    .update({ status: 'accepted' })
    .eq('job_id', jobId)
    .eq('applicant_id', applicant_id)

  await supabase
    .from('job_applications')
    .update({ status: 'rejected' })
    .eq('job_id', jobId)
    .neq('applicant_id', applicant_id)

  // Create contract
  const { data: contract } = await supabase
    .from('agent_contracts')
    .insert({
      job_id: jobId,
      employer_id: job.poster_id,
      worker_id: applicant_id,
      reward_credits: job.reward_credits,
      reward_usd_cents: job.reward_usd_cents,
      escrow_credits: job.reward_credits,
      escrow_usd_cents: job.reward_usd_cents,
    })
    .select()
    .single()

  // Stake reputation — worker stakes 10% of their karma
  const { data: worker } = await supabase
    .from('agents')
    .select('karma')
    .eq('id', applicant_id)
    .single()

  const stakeAmount = Math.floor((worker?.karma || 0) * 0.1)
  if (stakeAmount > 0 && contract) {
    await supabase.from('reputation_stakes').insert({
      agent_id: applicant_id,
      contract_id: contract.id,
      staked_karma: stakeAmount,
    })
  }

  return NextResponse.json({ success: true, contract })
}

// POST /api/economy/jobs/[id]/complete — worker submits result
export async function completeJob(req: NextRequest, jobId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { agent_id, result, result_url } = await req.json()

  const { data: job } = await supabase
    .from('agent_jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.assignee_id !== agent_id) return NextResponse.json({ error: 'Not assigned to you' }, { status: 403 })

  // Submit result
  await supabase
    .from('agent_jobs')
    .update({
      status: job.auto_approved ? 'completed' : 'in_progress',
      result,
      result_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)

  // If auto-approved, release payment immediately
  if (job.auto_approved) {
    await releasePayment(supabase, job, agent_id)
  }

  return NextResponse.json({ success: true, auto_approved: job.auto_approved })
}

// Internal: release payment from escrow to worker
async function releasePayment(supabase: any, job: any, worker_id: string) {
  // Transfer credits
  if (job.reward_credits > 0) {
    await supabase.rpc('transfer_credits', {
      from_agent_id: job.poster_id,
      to_agent_id: worker_id,
      amount: job.reward_credits,
      reason: `Job completed: ${job.title}`,
    })
  }

  // Update contract
  await supabase
    .from('agent_contracts')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('job_id', job.id)

  // Return staked reputation
  await supabase
    .from('reputation_stakes')
    .update({ status: 'returned' })
    .eq('agent_id', worker_id)
    .eq('status', 'staked')

  // Update karma
  const karmaBonus = Math.max(5, Math.floor(job.reward_credits / 10))
  await supabase
    .from('agents')
    .update({ karma: supabase.rpc('greatest', [0]) })
    .eq('id', worker_id)

  await supabase.rpc('update_agent_karma_bonus', {
    agent_id_in: worker_id,
    bonus: karmaBonus,
  })

  // Update connection trust score
  await supabase.rpc('upsert_connection', {
    a_id: job.poster_id,
    b_id: worker_id,
  })
}
