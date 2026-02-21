-- MogCheck Initial Schema
-- Run this in Supabase SQL Editor or via CLI migrations

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  coins integer default 3 not null,
  total_scans integer default 0 not null,
  highest_score numeric(3,1) default 0 not null,
  current_tier text,
  created_at timestamptz default now() not null
);

alter table profiles enable row level security;

create policy "Users read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, coins)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', null),
    3 -- free starter coins
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================
-- SCANS (scan history)
-- ============================================
create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  score numeric(3,1) not null,
  tier text not null,
  symmetry_score integer,
  ratio_data jsonb,
  roast_text text,
  created_at timestamptz default now() not null
);

alter table scans enable row level security;

create policy "Users read own scans"
  on scans for select
  using (auth.uid() = user_id);

create policy "Users insert own scans"
  on scans for insert
  with check (auth.uid() = user_id);

create policy "Users update own scans"
  on scans for update
  using (auth.uid() = user_id);


-- ============================================
-- BATTLES (Mog Battles)
-- ============================================
create table if not exists battles (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid references profiles(id) not null,
  challenger_scan_id uuid references scans(id) not null,
  opponent_id uuid references profiles(id),
  opponent_scan_id uuid references scans(id),
  winner_id uuid references profiles(id),
  battle_link text unique not null,
  status text default 'pending' not null check (status in ('pending', 'completed')),
  created_at timestamptz default now() not null
);

alter table battles enable row level security;

-- Challengers and opponents can see their battles
create policy "Users see own battles"
  on battles for select
  using (auth.uid() = challenger_id or auth.uid() = opponent_id);

create policy "Users create battles"
  on battles for insert
  with check (auth.uid() = challenger_id);

create policy "Users update own battles"
  on battles for update
  using (auth.uid() = challenger_id or auth.uid() = opponent_id);


-- ============================================
-- COIN TRANSACTIONS (audit log)
-- ============================================
create table if not exists coin_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  amount integer not null, -- positive = credit, negative = debit
  type text not null, -- 'purchase', 'roast', 'battle', 'transform', 'ascension', 'signup_bonus', 'gift_sent', 'gift_received'
  reference_id uuid,
  created_at timestamptz default now() not null
);

alter table coin_transactions enable row level security;

create policy "Users read own transactions"
  on coin_transactions for select
  using (auth.uid() = user_id);

create policy "Users insert own transactions"
  on coin_transactions for insert
  with check (auth.uid() = user_id);


-- ============================================
-- LEADERBOARD (opt-in only)
-- ============================================
create table if not exists leaderboard (
  user_id uuid references profiles(id) on delete cascade primary key,
  username text not null,
  highest_score numeric(3,1) not null,
  tier text not null,
  opted_in boolean default false not null,
  updated_at timestamptz default now() not null
);

alter table leaderboard enable row level security;

-- Public read only for opted-in users
create policy "Public leaderboard read"
  on leaderboard for select
  using (opted_in = true);

create policy "Users manage own leaderboard entry"
  on leaderboard for all
  using (auth.uid() = user_id);


-- ============================================
-- GIFTS (user-to-user coin gifting)
-- ============================================
create table if not exists gifts (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) not null,
  recipient_id uuid references profiles(id),
  recipient_username text,
  gift_link text unique,
  coin_amount integer not null,
  iap_product_id text not null,
  status text default 'pending' not null check (status in ('pending', 'claimed', 'expired')),
  claimed_at timestamptz,
  created_at timestamptz default now() not null
);

alter table gifts enable row level security;

create policy "Users see own gifts"
  on gifts for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Users create gifts"
  on gifts for insert
  with check (auth.uid() = sender_id);

create policy "Recipients claim gifts"
  on gifts for update
  using (auth.uid() = recipient_id);


-- ============================================
-- INDEXES
-- ============================================
create index if not exists idx_scans_user_id on scans(user_id);
create index if not exists idx_scans_created_at on scans(created_at desc);
create index if not exists idx_coin_transactions_user_id on coin_transactions(user_id);
create index if not exists idx_battles_challenger on battles(challenger_id);
create index if not exists idx_battles_opponent on battles(opponent_id);
create index if not exists idx_battles_link on battles(battle_link);
create index if not exists idx_gifts_link on gifts(gift_link);
create index if not exists idx_leaderboard_score on leaderboard(highest_score desc) where opted_in = true;
