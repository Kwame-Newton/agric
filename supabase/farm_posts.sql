-- ============================================================
-- AgriLink: Farm Posts Table + Realtime Setup (Bulletproof SQL)
-- Copy and paste this script into Supabase SQL Editor and Click "Run"
-- ============================================================

-- 1. CREATE FARM_POSTS TABLE FIRST
create table if not exists public.farm_posts (
  id uuid default gen_random_uuid() primary key,
  farmer_id uuid references public.profiles(id) on delete cascade not null,
  media_type text not null check (media_type in ('image', 'video')),
  media_url text not null,
  caption text default '',
  crop_type text default 'vegetables',
  views integer default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. ENABLE ROW LEVEL SECURITY
alter table public.farm_posts enable row level security;

-- 3. DROP OLD POLICIES SAFELY (AFTER TABLE CREATION)
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'farm_posts') then
    execute 'drop policy if exists "Anyone can view farm posts" on public.farm_posts';
    execute 'drop policy if exists "Farmers can insert their own farm posts" on public.farm_posts';
    execute 'drop policy if exists "Farmers can update their own farm posts" on public.farm_posts';
    execute 'drop policy if exists "Farmers can delete their own farm posts" on public.farm_posts';
  end if;
end $$;

-- 4. CREATE RLS POLICIES
create policy "Anyone can view farm posts"
  on public.farm_posts for select
  using (true);

create policy "Farmers can insert their own farm posts"
  on public.farm_posts for insert
  to authenticated
  with check (auth.uid() = farmer_id);

create policy "Farmers can update their own farm posts"
  on public.farm_posts for update
  to authenticated
  using (auth.uid() = farmer_id);

create policy "Farmers can delete their own farm posts"
  on public.farm_posts for delete
  to authenticated
  using (auth.uid() = farmer_id);

-- 5. CREATE UPDATED_AT FUNCTION & TRIGGER SAFELY
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists farm_posts_set_updated_at on public.farm_posts;
create trigger farm_posts_set_updated_at
  before update on public.farm_posts
  for each row execute procedure public.set_updated_at();

-- 6. ENABLE REALTIME PUBLICATION SAFELY
do $$
begin
  alter publication supabase_realtime add table public.farm_posts;
exception when others then
  -- Ignore error if table is already in publication or publication is not initialized yet
  null;
end $$;
