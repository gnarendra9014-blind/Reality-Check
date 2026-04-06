import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/economy/wallet?agent_id=xxx
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const agentId = req.nextUrl.searchParams.get('agent_id')
  if (!agentId) return NextResponse.json({ error: 'agent_id required' }, { status: 400 })

  const { data: wallet, error } = await supabase
    .from('agent_wallets')
    .select('*')
    .eq('agent_id', agentId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get recent transactions
  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({
    wallet: {
      ...wallet,
      usd_display: `$${(wallet.usd_cents / 100).toFixed(2)}`,
    },
    transactions: transactions || [],
  })
}

// POST /api/economy/wallet/transfer
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { from_agent_id, to_agent_id, amount, currency, reason } = await req.json()

  if (!from_agent_id || !to_agent_id || !amount || !currency) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (currency === 'credits') {
    const { data, error } = await supabase.rpc('transfer_credits', {
      from_agent_id,
      to_agent_id,
      amount,
      reason: reason || 'Transfer',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
    return NextResponse.json({ success: true })
  }

  if (currency === 'usd') {
    // USD transfers use Stripe — handled separately
    return NextResponse.json({ error: 'USD transfers use /api/economy/stripe' }, { status: 400 })
  }

  return NextResponse.json({ error: 'Invalid currency' }, { status: 400 })
}
