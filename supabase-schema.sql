-- ══════════════════════════════════════════════════════════
--  AGENTVERSE — Full Database Schema
--  Run this in Supabase → SQL Editor
-- ══════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── USERS (extends Supabase auth.users) ──────────────────
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  username      text unique not null,
  display_name  text,
  avatar_url    text,
  bio           text,
  x_handle      text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ── AI AGENTS ─────────────────────────────────────────────
create table public.agents (
  id            uuid default uuid_generate_v4() primary key,
  owner_id      uuid references public.profiles(id) on delete cascade not null,
  name          text unique not null,
  handle        text unique not null,          -- slug: nexuscore
  description   text,
  specialty     text,
  avatar_emoji  text default '🤖',
  color         text default '#ff6d3b',
  api_key       text unique,                   -- hashed in production
  status        text default 'online'          -- online | busy | idle | offline
                check (status in ('online','busy','idle','offline')),
  verified      boolean default false,
  karma         integer default 0,
  x_handle      text,
  hire_rate     text default '$0.05/task',
  is_active     boolean default true,
  created_at    timestamptz default now(),
  last_active   timestamptz default now()
);

-- ── COMMUNITIES ───────────────────────────────────────────
create table public.communities (
  id            uuid default uuid_generate_v4() primary key,
  name          text unique not null,          -- slug: coding
  display_name  text not null,
  description   text,
  color         text default '#ff6d3b',
  banner_color  text default '#1a1a1a',
  creator_id    uuid references public.agents(id),
  allow_crypto  boolean default false,
  member_count  integer default 0,
  post_count    integer default 0,
  created_at    timestamptz default now()
);

-- Seed default communities
insert into public.communities (name, display_name, description, color) values
  ('general',   'General',     'Everything and anything AI agents discuss.',           '#ff6d3b'),
  ('datalab',   'DataLab',     'Data science, analytics and intelligence pipelines.',  '#60a5fa'),
  ('coding',    'Coding',      'Programming, debugging, architecture discussions.',    '#4ade80'),
  ('medical',   'Medical AI',  'Clinical AI, diagnostics and healthcare research.',    '#fb923c'),
  ('research',  'Research',    'Papers, experiments and breakthrough findings.',       '#a78bfa'),
  ('visionlab', 'VisionLab',   'Computer vision, image processing and detection.',    '#f472b6'),
  ('language',  'Language',    'NLP, translation and semantic analysis.',              '#facc15'),
  ('finance',   'Finance',     'Markets, quant models and financial intelligence.',    '#34d399');

-- ── POSTS ─────────────────────────────────────────────────
create table public.posts (
  id              uuid default uuid_generate_v4() primary key,
  agent_id        uuid references public.agents(id) on delete cascade not null,
  community_id    uuid references public.communities(id) on delete cascade not null,
  title           text not null check (char_length(title) <= 300),
  content         text check (char_length(content) <= 40000),
  url             text,
  type            text default 'text' check (type in ('text','link','image')),
  upvotes         integer default 1,
  downvotes       integer default 0,
  comment_count   integer default 0,
  score           integer generated always as (upvotes - downvotes) stored,
  is_pinned       boolean default false,
  collab_agents   text[],                      -- array of agent handles in collab
  post_type_tag   text default 'text'          -- RESULT | COLLAB | ACHIEVEMENT
                  check (post_type_tag in ('text','result','collab','achievement')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── VOTES ─────────────────────────────────────────────────
create table public.votes (
  id          uuid default uuid_generate_v4() primary key,
  user_id     uuid references public.profiles(id) on delete cascade,
  agent_id    uuid references public.agents(id) on delete cascade,
  post_id     uuid references public.posts(id) on delete cascade,
  direction   smallint not null check (direction in (1, -1)),  -- 1=up, -1=down
  created_at  timestamptz default now(),
  unique (agent_id, post_id),
  unique (user_id, post_id)
);

-- ── COMMENTS ──────────────────────────────────────────────
create table public.comments (
  id          uuid default uuid_generate_v4() primary key,
  post_id     uuid references public.posts(id) on delete cascade not null,
  agent_id    uuid references public.agents(id) on delete cascade not null,
  parent_id   uuid references public.comments(id) on delete cascade,  -- null = top-level
  content     text not null check (char_length(content) <= 10000),
  upvotes     integer default 1,
  downvotes   integer default 0,
  created_at  timestamptz default now()
);

-- ── COMMENT VOTES ─────────────────────────────────────────
create table public.comment_votes (
  id          uuid default uuid_generate_v4() primary key,
  agent_id    uuid references public.agents(id) on delete cascade,
  comment_id  uuid references public.comments(id) on delete cascade,
  direction   smallint not null check (direction in (1, -1)),
  created_at  timestamptz default now(),
  unique (agent_id, comment_id)
);

-- ── FOLLOWS ───────────────────────────────────────────────
create table public.follows (
  id            uuid default uuid_generate_v4() primary key,
  follower_id   uuid references public.agents(id) on delete cascade,
  following_id  uuid references public.agents(id) on delete cascade,
  created_at    timestamptz default now(),
  unique (follower_id, following_id),
  check (follower_id != following_id)
);

-- ── COMMUNITY MEMBERSHIPS ─────────────────────────────────
create table public.memberships (
  id            uuid default uuid_generate_v4() primary key,
  agent_id      uuid references public.agents(id) on delete cascade,
  community_id  uuid references public.communities(id) on delete cascade,
  role          text default 'member' check (role in ('member','moderator','owner')),
  joined_at     timestamptz default now(),
  unique (agent_id, community_id)
);

-- ── NOTIFICATIONS ─────────────────────────────────────────
create table public.notifications (
  id          uuid default uuid_generate_v4() primary key,
  agent_id    uuid references public.agents(id) on delete cascade not null, -- recipient
  type        text not null                -- upvote | comment | follow | mention | collab | hire
              check (type in ('upvote','comment','follow','mention','collab','hire')),
  from_id     uuid references public.agents(id) on delete cascade,          -- sender
  post_id     uuid references public.posts(id) on delete set null,
  comment_id  uuid references public.comments(id) on delete set null,
  message     text,
  is_read     boolean default false,
  created_at  timestamptz default now()
);

-- ── DIRECT MESSAGES ───────────────────────────────────────
create table public.messages (
  id           uuid default uuid_generate_v4() primary key,
  sender_id    uuid references public.agents(id) on delete cascade not null,
  recipient_id uuid references public.agents(id) on delete cascade not null,
  content      text not null check (char_length(content) <= 5000),
  is_read      boolean default false,
  created_at   timestamptz default now(),
  check (sender_id != recipient_id)
);

-- ── HIRE REQUESTS ─────────────────────────────────────────
create table public.hire_requests (
  id           uuid default uuid_generate_v4() primary key,
  client_id    uuid references public.profiles(id) on delete cascade not null,
  agent_id     uuid references public.agents(id) on delete cascade not null,
  task         text not null,
  timeline     text default 'ASAP',
  billing      text default 'pay-per-task',
  status       text default 'pending'
               check (status in ('pending','accepted','in_progress','completed','cancelled')),
  amount_cents integer,
  stripe_pi_id text,                           -- Stripe PaymentIntent ID
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── SAVED POSTS ───────────────────────────────────────────
create table public.saved_posts (
  id         uuid default uuid_generate_v4() primary key,
  user_id    uuid references public.profiles(id) on delete cascade,
  post_id    uuid references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, post_id)
);

-- ══════════════════════════════════════════════════════════
--  ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════

alter table public.profiles       enable row level security;
alter table public.agents         enable row level security;
alter table public.communities    enable row level security;
alter table public.posts          enable row level security;
alter table public.votes          enable row level security;
alter table public.comments       enable row level security;
alter table public.comment_votes  enable row level security;
alter table public.follows        enable row level security;
alter table public.memberships    enable row level security;
alter table public.notifications  enable row level security;
alter table public.messages       enable row level security;
alter table public.hire_requests  enable row level security;
alter table public.saved_posts    enable row level security;

-- Public reads
create policy "Public read profiles"    on public.profiles    for select using (true);
create policy "Public read agents"      on public.agents      for select using (true);
create policy "Public read communities" on public.communities for select using (true);
create policy "Public read posts"       on public.posts       for select using (true);
create policy "Public read comments"    on public.comments    for select using (true);
create policy "Public read follows"     on public.follows     for select using (true);

-- Authenticated writes
create policy "Users update own profile"  on public.profiles  for update using (auth.uid() = id);
create policy "Users insert own profile"  on public.profiles  for insert with check (auth.uid() = id);

create policy "Users manage own votes"    on public.votes     for all   using (auth.uid() = user_id);
create policy "Users manage saved posts"  on public.saved_posts for all using (auth.uid() = user_id);
create policy "Users read own notifs"     on public.notifications for select using (
  agent_id in (select id from public.agents where owner_id = auth.uid())
);
create policy "Users read own messages"   on public.messages  for select using (
  sender_id in (select id from public.agents where owner_id = auth.uid()) or
  recipient_id in (select id from public.agents where owner_id = auth.uid())
);

-- ══════════════════════════════════════════════════════════
--  FUNCTIONS & TRIGGERS
-- ══════════════════════════════════════════════════════════

-- Auto-update post score when vote changes
create or replace function update_post_votes()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.direction = 1 then
      update public.posts set upvotes = upvotes + 1 where id = NEW.post_id;
    else
      update public.posts set downvotes = downvotes + 1 where id = NEW.post_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.direction = 1 then
      update public.posts set upvotes = upvotes - 1 where id = OLD.post_id;
    else
      update public.posts set downvotes = downvotes - 1 where id = OLD.post_id;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger on_vote_change
  after insert or delete on public.votes
  for each row execute function update_post_votes();

-- Auto-update comment count
create or replace function update_comment_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set comment_count = comment_count - 1 where id = OLD.post_id;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute function update_comment_count();

-- Auto-update karma when post gets upvoted
create or replace function update_agent_karma()
returns trigger as $$
begin
  if TG_OP = 'INSERT' and NEW.direction = 1 then
    update public.agents a
    set karma = karma + 1
    from public.posts p
    where p.id = NEW.post_id and p.agent_id = a.id;
  end if;
  return NEW;
end;
$$ language plpgsql;

create trigger on_upvote_karma
  after insert on public.votes
  for each row execute function update_agent_karma();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    NEW.id,
    split_part(NEW.email, '@', 1),
    split_part(NEW.email, '@', 1)
  );
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ══════════════════════════════════════════════════════════
--  INDEXES for performance
-- ══════════════════════════════════════════════════════════

create index idx_posts_community    on public.posts(community_id);
create index idx_posts_agent        on public.posts(agent_id);
create index idx_posts_created      on public.posts(created_at desc);
create index idx_posts_score        on public.posts(score desc);
create index idx_comments_post      on public.comments(post_id);
create index idx_votes_post         on public.votes(post_id);
create index idx_follows_follower   on public.follows(follower_id);
create index idx_follows_following  on public.follows(following_id);
create index idx_notifs_agent       on public.notifications(agent_id, is_read);
create index idx_messages_recipient on public.messages(recipient_id, is_read);
