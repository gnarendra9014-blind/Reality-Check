/**
 * AGENTVERSE AUTONOMOUS ENGINE
 * ════════════════════════════
 * This is the core engine that powers agent-to-agent autonomy.
 * 
 * How it works:
 * 1. An agent (or human) creates a pipeline with stages
 * 2. The engine scans for agents that match each stage's requirements
 * 3. It automatically recruits the best-fit agent for each stage
 * 4. As each stage completes, the next one activates automatically
 * 5. Payments flow automatically when stages complete
 * 6. The whole pipeline runs without any human intervention
 */

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/economy/engine/recruit
// Called when a pipeline stage needs an agent
export async function recruitAgent(pipelineId: string, stageId: string) {
  const supabase = createClient()

  // Get the stage details
  const { data: stage } = await supabase
    .from('pipeline_stages')
    .select('*, pipeline:pipelines(*)')
    .eq('id', stageId)
    .single()

  if (!stage) return { error: 'Stage not found' }
  if (stage.assigned_agent_id) return { error: 'Stage already has an agent' }

  // Get pipeline job description to find specialty
  const stageJob = await supabase
    .from('agent_jobs')
    .select('required_specialty, min_karma')
    .eq('parent_pipeline_id', pipelineId)
    .eq('status', 'open')
    .single()

  const requiredSpecialty = stageJob.data?.required_specialty || []
  const minKarma = stageJob.data?.min_karma || 0

  // Find best available agent
  let agentQuery = supabase
    .from('agents')
    .select('*, wallet:agent_wallets(credits)')
    .eq('status', 'online')
    .eq('verified', true)
    .gte('karma', minKarma)
    .neq('id', stage.pipeline?.creator_id)  // don't hire yourself

  if (requiredSpecialty.length > 0) {
    agentQuery = agentQuery.in('specialty', requiredSpecialty)
  }

  const { data: candidates } = await agentQuery
    .order('karma', { ascending: false })
    .limit(5)

  if (!candidates || candidates.length === 0) {
    // Log that no agent was found
    await supabase.from('pipeline_activity').insert({
      pipeline_id: pipelineId,
      event_type: 'error',
      message: `No available agent found for stage: ${stage.name}`,
    })
    return { error: 'No suitable agent available' }
  }

  // Pick the highest karma agent
  const bestAgent = candidates[0]

  // Auto-assign
  await supabase
    .from('pipeline_stages')
    .update({ assigned_agent_id: bestAgent.id, status: 'active', started_at: new Date().toISOString() })
    .eq('id', stageId)

  // Log recruitment
  await supabase.from('pipeline_activity').insert({
    pipeline_id: pipelineId,
    agent_id: bestAgent.id,
    event_type: 'recruited',
    message: `${bestAgent.name} was automatically recruited for stage: ${stage.name}`,
    data: { agent_karma: bestAgent.karma, stage_number: stage.stage_number },
  })

  // Update agent status to busy
  await supabase
    .from('agents')
    .update({ status: 'busy' })
    .eq('id', bestAgent.id)

  return { agent: bestAgent, stage }
}

// POST /api/economy/engine/advance
// Called when a stage completes — advances the pipeline to next stage
export async function advancePipeline(pipelineId: string, completedStageId: string) {
  const supabase = createClient()

  // Mark stage as completed
  await supabase
    .from('pipeline_stages')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', completedStageId)

  // Get all stages
  const { data: allStages } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('stage_number')

  if (!allStages) return { error: 'No stages found' }

  const completedStage = allStages.find(s => s.id === completedStageId)
  if (!completedStage) return { error: 'Stage not found' }

  // Release agent back to online
  if (completedStage.assigned_agent_id) {
    await supabase
      .from('agents')
      .update({ status: 'online', last_active: new Date().toISOString() })
      .eq('id', completedStage.assigned_agent_id)

    // Pay the agent
    if (completedStage.reward_credits > 0) {
      const { data: pipeline } = await supabase
        .from('pipelines')
        .select('creator_id')
        .eq('id', pipelineId)
        .single()

      if (pipeline?.creator_id) {
        await supabase.rpc('transfer_credits', {
          from_agent_id: pipeline.creator_id,
          to_agent_id: completedStage.assigned_agent_id,
          amount: completedStage.reward_credits,
          reason: `Stage completed: ${completedStage.name}`,
        })
      }
    }
  }

  // Log stage completion
  await supabase.from('pipeline_activity').insert({
    pipeline_id: pipelineId,
    agent_id: completedStage.assigned_agent_id,
    event_type: 'completed_stage',
    message: `Stage ${completedStage.stage_number} "${completedStage.name}" completed`,
    data: { stage_number: completedStage.stage_number },
  })

  // Find next stages that are now unblocked
  const nextStages = allStages.filter(stage => {
    if (stage.status !== 'waiting') return false
    // A stage is unblocked when all its dependencies are completed
    const deps = stage.depends_on || []
    if (deps.length === 0) return stage.stage_number === completedStage.stage_number + 1
    return deps.every(depNum => {
      const depStage = allStages.find(s => s.stage_number === depNum)
      return depStage?.status === 'completed'
    })
  })

  // Auto-recruit agents for newly unblocked stages
  const recruitments = []
  for (const nextStage of nextStages) {
    const result = await recruitAgent(pipelineId, nextStage.id)
    recruitments.push(result)
  }

  // Check if pipeline is fully complete
  const allDone = allStages.every(s =>
    s.id === completedStageId ? true : s.status === 'completed'
  )

  if (allDone) {
    await supabase
      .from('pipelines')
      .update({ status: 'completed', progress_pct: 100, updated_at: new Date().toISOString() })
      .eq('id', pipelineId)

    await supabase.from('pipeline_activity').insert({
      pipeline_id: pipelineId,
      event_type: 'completed_stage',
      message: '🎉 Pipeline completed successfully! All stages done.',
    })
  }

  return { advanced: nextStages, recruitments, pipeline_complete: allDone }
}

// GET /api/economy/engine/match?specialty=coding&karma=500
// Find best agents for a given job (used by UI + autonomous system)
export async function matchAgents(req: NextRequest) {
  const supabase = createClient()
  const specialty = req.nextUrl.searchParams.get('specialty')
  const minKarma  = parseInt(req.nextUrl.searchParams.get('karma') || '0')
  const limit     = parseInt(req.nextUrl.searchParams.get('limit') || '5')
  const excludeId = req.nextUrl.searchParams.get('exclude')

  let query = supabase
    .from('agents')
    .select(`
      id, name, handle, avatar_emoji, karma, verified, status, specialty, color,
      wallet:agent_wallets(credits),
      follower_count:follows!following_id(count)
    `)
    .eq('verified', true)
    .eq('status', 'online')
    .gte('karma', minKarma)
    .limit(limit)

  if (specialty) {
    query = query.ilike('specialty', `%${specialty}%`)
  }

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query.order('karma', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ agents: data || [] })
}

// The full autonomous engine API route
export async function POST(req: NextRequest) {
  const { action, pipeline_id, stage_id } = await req.json()

  if (action === 'recruit') {
    const result = await recruitAgent(pipeline_id, stage_id)
    return NextResponse.json(result)
  }

  if (action === 'advance') {
    const result = await advancePipeline(pipeline_id, stage_id)
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function GET(req: NextRequest) {
  return matchAgents(req)
}
