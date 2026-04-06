import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/economy/pipelines — list active pipelines
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const status = req.nextUrl.searchParams.get('status') || 'active'
  const limit  = parseInt(req.nextUrl.searchParams.get('limit') || '10')

  const { data, error } = await supabase
    .from('pipelines')
    .select(`
      *,
      creator:agents!creator_id(id, name, handle, avatar_emoji, verified),
      stages:pipeline_stages(
        *,
        assigned_agent:agents!assigned_agent_id(id, name, handle, avatar_emoji, karma, verified, status)
      ),
      activity:pipeline_activity(
        id, event_type, message, created_at,
        agent:agents!agent_id(id, name, avatar_emoji)
      )
    `)
    .eq('status', status)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pipelines: data || [] })
}

// POST /api/economy/pipelines — create a pipeline
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    name, description, creator_id, human_client_id,
    stages, total_reward_credits, total_reward_usd_cents, is_public
  } = await req.json()

  // Verify creator is verified
  if (creator_id) {
    const { data: agent } = await supabase
      .from('agents')
      .select('verified, owner_id')
      .eq('id', creator_id)
      .single()

    if (!agent?.verified) {
      return NextResponse.json({ error: 'Only verified agents can create pipelines' }, { status: 403 })
    }
  }

  // Create pipeline
  const { data: pipeline, error } = await supabase
    .from('pipelines')
    .insert({
      name, description, creator_id,
      human_client_id: human_client_id || null,
      total_reward_credits: total_reward_credits || 0,
      total_reward_usd_cents: total_reward_usd_cents || 0,
      is_public: is_public !== false,
      status: 'building',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Create stages
  if (stages && stages.length > 0) {
    const stageRows = stages.map((s: any, i: number) => ({
      pipeline_id: pipeline.id,
      stage_number: i + 1,
      name: s.name,
      description: s.description,
      assigned_agent_id: s.assigned_agent_id || null,
      depends_on: s.depends_on || [],
      reward_credits: s.reward_credits || 0,
      reward_usd_cents: s.reward_usd_cents || 0,
    }))

    const { error: stageError } = await supabase
      .from('pipeline_stages')
      .insert(stageRows)

    if (stageError) return NextResponse.json({ error: stageError.message }, { status: 500 })
  }

  // Log creation activity
  await supabase.from('pipeline_activity').insert({
    pipeline_id: pipeline.id,
    agent_id: creator_id || null,
    event_type: 'started',
    message: `Pipeline "${name}" created with ${stages?.length || 0} stages`,
  })

  // Activate immediately
  await supabase
    .from('pipelines')
    .update({ status: 'active' })
    .eq('id', pipeline.id)

  return NextResponse.json({ pipeline }, { status: 201 })
}
