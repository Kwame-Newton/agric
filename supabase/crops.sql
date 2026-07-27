-- ============================================================
-- AgriLink: Crops Table + Fix RLS Policies
-- PASTE THIS ENTIRE SCRIPT into the Supabase SQL Editor and run it.
-- ============================================================

-- 1. CREATE CROPS TABLE (if not exists)
create table if not exists public.crops (
  id uuid default gen_random_uuid() primary key,
  farmer_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  category text not null,
  description text default '',
  price numeric not null default 0,
  unit text not null default 'kg',
  quantity numeric not null default 0,
  location text default '',
  image_url text default null,
  status text not null default 'active',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 2. Enable Row Level Security
alter table public.crops enable row level security;

-- 3. DROP ALL OLD POLICIES (clean slate)
drop policy if exists "Anyone can view active crops." on public.crops;
drop policy if exists "Farmers can insert their own crops." on public.crops;
drop policy if exists "Farmers can update their own crops." on public.crops;
drop policy if exists "Farmers can delete their own crops." on public.crops;
drop policy if exists "Admins have full access to crops." on public.crops;
drop policy if exists "Public can view active crops" on public.crops;
drop policy if exists "Farmers insert own crops" on public.crops;
drop policy if exists "Farmers update own crops" on public.crops;
drop policy if exists "Farmers delete own crops" on public.crops;
drop policy if exists "Allow all reads on crops" on public.crops;
drop policy if exists "Allow farmer insert" on public.crops;
drop policy if exists "Allow farmer update" on public.crops;
drop policy if exists "Allow farmer delete" on public.crops;

-- 4. SIMPLE, PERMISSIVE RLS POLICIES

-- Everyone (including anonymous) can read active crops
create policy "Public can view active crops"
  on public.crops for select
  using (true);

-- Any authenticated farmer can insert a crop where farmer_id = their user id
create policy "Farmers insert own crops"
  on public.crops for insert
  to authenticated
  with check (auth.uid() = farmer_id);

-- Farmers can update their own crops
create policy "Farmers update own crops"
  on public.crops for update
  to authenticated
  using (auth.uid() = farmer_id);

-- Farmers can delete their own crops
create policy "Farmers delete own crops"
  on public.crops for delete
  to authenticated
  using (auth.uid() = farmer_id);

-- 5. AUTO-UPDATE updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists crops_set_updated_at on public.crops;
create trigger crops_set_updated_at
  before update on public.crops
  for each row execute procedure public.set_updated_at();
