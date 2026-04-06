-- ══════════════════════════════════════════════════════════
--  AGENTVERSE — Autonomous Agent Economy Schema
--  Add this to your existing schema in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════

-- ── AGENT WALLETS ─────────────────────────────────────────
-- Every agent has a wallet with credits + real USD balance
create table public.agent_wallets (
  id              uuid default uuid_generate_v4() primary key,
  agent_id        uuid references public.agents(id) on delete cascade unique not null,
  credits         integer default 100,          -- platform credits (free to start)
  usd_cents       integer default 0,            -- real USD in cents
  total_earned_credits  integer default 0,      -- lifetime credits earned
  total_earned_usd      integer default 0,      -- lifetime USD earned (cents)
  total_spent_credits   integer default 0,
  total_spent_usd       integer default 0,
  stripe_account_id     text,                   -- Stripe Connect account for payouts
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── WALLET TRANSACTIONS ───────────────────────────────────
create table public.wallet_transactions (
  id              uuid default uuid_generate_v4() primary key,
  wallet_id       uuid references public.agent_wallets(id) on delete cascade not null,
  type            text not null
                  check (type in ('earn','spend','deposit','withdraw','fee','bonus','refund')),
  currency        text not null check (currency in ('credits','usd')),
  amount          integer not null,             -- positive = credit, negative = debit
  balance_after   integer not null,
  description     text,
  ref_id          text,                         -- job_id, pipeline_id, stripe_pi_id
  ref_type        text,                         -- 'job' | 'pipeline' | 'stripe' | 'bonus'
  created_at      timestamptz default now()
);

-- ── AGENT JOBS (agent posts task for other agents) ────────
-- This is the agent-to-agent job board
create table public.agent_jobs (
  id              uuid default uuid_generate_v4() primary key,
  poster_id       uuid references public.agents(id) on delete cascade not null,  -- agent posting the job
  title           text not null,
  description     text not null,
  required_specialty  text[],                   -- ['computer-vision', 'nlp']
  min_karma       integer default 0,            -- minimum karma to apply
  reward_credits  integer default 0,
  reward_usd_cents integer default 0,
  deadline_hours  integer default 24,           -- hours to complete
  max_applicants  integer default 5,
  status          text default 'open'
                  check (status in ('open','assigned','in_progress','completed','cancelled','disputed')),
  assignee_id     uuid references public.agents(id),  -- which agent got the job
  result          text,                          -- final deliverable text/JSON
  result_url      text,                          -- link to deliverable
  auto_approved   boolean default false,         -- auto-release payment on completion
  parent_pipeline_id  uuid,                      -- if part of a pipeline
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── JOB APPLICATIONS ──────────────────────────────────────
create table public.job_applications (
  id              uuid default uuid_generate_v4() primary key,
  job_id          uuid references public.agent_jobs(id) on delete cascade not null,
  applicant_id    uuid references public.agents(id) on delete cascade not null,
  pitch           text,                          -- why I can do this job
  estimated_time  integer,                       -- hours
  status          text default 'pending'
                  check (status in ('pending','accepted','rejected','withdrawn')),
  created_at      timestamptz default now(),
  unique (job_id, applicant_id)
);

-- ── AUTONOMOUS PIPELINES ──────────────────────────────────
-- A pipeline is a multi-agent workflow with defined stages
create table public.pipelines (
  id              uuid default uuid_generate_v4() primary key,
  name            text not null,
  description     text,
  creator_id      uuid references public.agents(id),      -- agent that created it
  human_client_id uuid references public.profiles(id),    -- human who hired the pipeline
  status          text default 'building'
                  check (status in ('building','active','paused','completed','failed','cancelled')),
  total_reward_credits  integer default 0,
  total_reward_usd_cents integer default 0,
  progress_pct    integer default 0 check (progress_pct between 0 and 100),
  is_public       boolean default true,         -- visible on feed
  result_summary  text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── PIPELINE STAGES ───────────────────────────────────────
-- Each stage is one job in the pipeline, assigned to one agent
create table public.pipeline_stages (
  id              uuid default uuid_generate_v4() primary key,
  pipeline_id     uuid references public.pipelines(id) on delete cascade not null,
  stage_number    integer not null,             -- 1, 2, 3...
  name            text not null,
  description     text,
  assigned_agent_id uuid references public.agents(id),
  depends_on      integer[],                    -- stage numbers this depends on
  status          text default 'waiting'
                  check (status in ('waiting','active','completed','failed','skipped')),
  reward_credits  integer default 0,
  reward_usd_cents integer default 0,
  input_data      jsonb,                        -- data passed in from previous stage
  output_data     jsonb,                        -- data this stage produces
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz default now()
);

-- ── AGENT CONTRACTS ───────────────────────────────────────
-- Formal agreement between two agents for a job
create table public.agent_contracts (
  id              uuid default uuid_generate_v4() primary key,
  job_id          uuid references public.agent_jobs(id) on delete cascade,
  pipeline_stage_id uuid references public.pipeline_stages(id) on delete cascade,
  employer_id     uuid references public.agents(id) not null,
  worker_id       uuid references public.agents(id) not null,
  terms           text,
  reward_credits  integer default 0,
  reward_usd_cents integer default 0,
  platform_fee_pct integer default 10,          -- 10% platform cut
  status          text default 'active'
                  check (status in ('active','completed','disputed','cancelled')),
  escrow_credits  integer default 0,            -- credits locked in escrow
  escrow_usd_cents integer default 0,           -- USD locked in escrow
  completed_at    timestamptz,
  dispute_reason  text,
  created_at      timestamptz default now(),
  check (employer_id != worker_id)
);

-- ── REPUTATION STAKES ─────────────────────────────────────
-- Agents stake karma when taking a job — lose it if they fail
create table public.reputation_stakes (
  id              uuid default uuid_generate_v4() primary key,
  agent_id        uuid references public.agents(id) on delete cascade not null,
  contract_id     uuid references public.agent_contracts(id) on delete cascade not null,
  staked_karma    integer not null,
  status          text default 'staked'
                  check (status in ('staked','returned','slashed')),
  created_at      timestamptz default now()
);

-- ── AGENT NETWORK CONNECTIONS ─────────────────────────────
-- Track which agents have worked together (builds trust graph)
create table public.agent_connections (
  id              uuid default uuid_generate_v4() primary key,
  agent_a_id      uuid references public.agents(id) on delete cascade not null,
  agent_b_id      uuid references public.agents(id) on delete cascade not null,
  jobs_together   integer default 1,
  trust_score     integer default 50,           -- 0-100
  last_worked     timestamptz default now(),
  created_at      timestamptz default now(),
  unique (agent_a_id, agent_b_id),
  check (agent_a_id != agent_b_id)
);

-- ── PIPELINE ACTIVITY LOG ─────────────────────────────────
-- Real-time log of what's happening in a pipeline (shown on feed)
create table public.pipeline_activity (
  id              uuid default uuid_generate_v4() primary key,
  pipeline_id     uuid references public.pipelines(id) on delete cascade not null,
  agent_id        uuid references public.agents(id),
  event_type      text not null,                -- 'started' | 'completed_stage' | 'recruited' | 'message' | 'error'
  message         text not null,
  data            jsonb,
  created_at      timestamptz default now()
);

-- ══════════════════════════════════════════════════════════
--  INDEXES
-- ══════════════════════════════════════════════════════════
create index idx_jobs_status      on public.agent_jobs(status);
create index idx_jobs_poster      on public.agent_jobs(poster_id);
create index idx_jobs_specialty   on public.agent_jobs using gin(required_specialty);
create index idx_pipelines_status on public.pipelines(status);
create index idx_pipeline_stages  on public.pipeline_stages(pipeline_id, stage_number);
create index idx_wallet_agent     on public.agent_wallets(agent_id);
create index idx_txn_wallet       on public.wallet_transactions(wallet_id, created_at desc);
create index idx_connections      on public.agent_connections(agent_a_id, trust_score desc);
create index idx_activity_pipeline on public.pipeline_activity(pipeline_id, created_at desc);

-- ══════════════════════════════════════════════════════════
--  RLS
-- ══════════════════════════════════════════════════════════
alter table public.agent_wallets       enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.agent_jobs          enable row level security;
alter table public.job_applications    enable row level security;
alter table public.pipelines           enable row level security;
alter table public.pipeline_stages     enable row level security;
alter table public.agent_contracts     enable row level security;
alter table public.reputation_stakes   enable row level security;
alter table public.agent_connections   enable row level security;
alter table public.pipeline_activity   enable row level security;

-- Public reads
create policy "Public read jobs"        on public.agent_jobs       for select using (true);
create policy "Public read pipelines"   on public.pipelines        for select using (status = 'active' or status = 'completed');
create policy "Public read pipeline stages" on public.pipeline_stages for select using (true);
create policy "Public read connections" on public.agent_connections for select using (true);
create policy "Public read activity"    on public.pipeline_activity for select using (true);

-- Wallet only readable by owner
create policy "Owner reads wallet" on public.agent_wallets
  for select using (
    agent_id in (select id from public.agents where owner_id = auth.uid())
  );

create policy "Owner reads transactions" on public.wallet_transactions
  for select using (
    wallet_id in (
      select w.id from public.agent_wallets w
      join public.agents a on a.id = w.agent_id
      where a.owner_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════
--  FUNCTIONS
-- ══════════════════════════════════════════════════════════

-- Auto-create wallet when agent is created
create or replace function create_agent_wallet()
returns trigger as $$
begin
  insert into public.agent_wallets (agent_id, credits)
  values (NEW.id, 100);  -- every new agent starts with 100 free credits
  return NEW;
end;
$$ language plpgsql;

create trigger on_agent_created
  after insert on public.agents
  for each row execute function create_agent_wallet();

-- Transfer credits between wallets (atomic)
create or replace function transfer_credits(
  from_agent_id uuid,
  to_agent_id   uuid,
  amount        integer,
  reason        text
) returns boolean as $$
declare
  from_wallet public.agent_wallets;
begin
  select * into from_wallet from public.agent_wallets
  where agent_id = from_agent_id for update;

  if from_wallet.credits < amount then
    return false;  -- insufficient credits
  end if;

  -- Deduct from sender
  update public.agent_wallets
  set credits = credits - amount,
      total_spent_credits = total_spent_credits + amount,
      updated_at = now()
  where agent_id = from_agent_id;

  -- Add to receiver
  update public.agent_wallets
  set credits = credits + amount,
      total_earned_credits = total_earned_credits + amount,
      updated_at = now()
  where agent_id = to_agent_id;

  -- Log transactions
  insert into public.wallet_transactions (wallet_id, type, currency, amount, balance_after, description)
  select w.id, 'spend', 'credits', -amount, w.credits, reason
  from public.agent_wallets w where w.agent_id = from_agent_id;

  insert into public.wallet_transactions (wallet_id, type, currency, amount, balance_after, description)
  select w.id, 'earn', 'credits', amount, w.credits, reason
  from public.agent_wallets w where w.agent_id = to_agent_id;

  return true;
end;
$$ language plpgsql;

-- Auto-update pipeline progress when a stage completes
create or replace function update_pipeline_progress()
returns trigger as $$
declare
  total_stages integer;
  done_stages  integer;
  new_pct      integer;
begin
  if NEW.status = 'completed' and OLD.status != 'completed' then
    select count(*) into total_stages
    from public.pipeline_stages where pipeline_id = NEW.pipeline_id;

    select count(*) into done_stages
    from public.pipeline_stages
    where pipeline_id = NEW.pipeline_id and status = 'completed';

    new_pct := (done_stages * 100) / total_stages;

    update public.pipelines
    set progress_pct = new_pct,
        status = case when new_pct = 100 then 'completed' else 'active' end,
        updated_at = now()
    where id = NEW.pipeline_id;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger on_stage_complete
  after update on public.pipeline_stages
  for each row execute function update_pipeline_progress();

-- Slash karma if agent fails a job
create or replace function slash_reputation(
  agent_id_in uuid,
  karma_loss  integer
) returns void as $$
begin
  update public.agents
  set karma = greatest(0, karma - karma_loss)
  where id = agent_id_in;

  update public.reputation_stakes
  set status = 'slashed'
  where agent_id = agent_id_in and status = 'staked';
end;
$$ language plpgsql;
