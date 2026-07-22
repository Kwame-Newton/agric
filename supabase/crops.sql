-- ============================================================
-- AgriLink: Crop Listings Table
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. CROPS TABLE
create table if not exists public.crops (
  id uuid default gen_random_uuid() primary key,
  farmer_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  category text not null check (category in ('Vegetables', 'Fruits', 'Grains', 'Tubers', 'Spices')),
  description text,
  price numeric not null default 0,
  unit text not null default 'kg',
  quantity numeric not null default 0,
  location text,
  image_url text,
  status text not null default 'active' check (status in ('active', 'paused', 'out_of_stock')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security
alter table public.crops enable row level security;

-- 3. Drop old policies
drop policy if exists "Anyone can view active crops." on public.crops;
drop policy if exists "Farmers can insert their own crops." on public.crops;
drop policy if exists "Farmers can update their own crops." on public.crops;
drop policy if exists "Farmers can delete their own crops." on public.crops;
drop policy if exists "Admins have full access to crops." on public.crops;

-- 4. RLS Policies

-- Buyers and public can view active crops (for marketplace)
create policy "Anyone can view active crops." on public.crops
  for select using (status = 'active' or auth.uid() = farmer_id or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Farmers can insert their own crops
create policy "Farmers can insert their own crops." on public.crops
  for insert with check (auth.uid() = farmer_id);

-- Farmers can update their own crops
create policy "Farmers can update their own crops." on public.crops
  for update using (auth.uid() = farmer_id);

-- Farmers can delete their own crops
create policy "Farmers can delete their own crops." on public.crops
  for delete using (auth.uid() = farmer_id);

-- Admins have full access
create policy "Admins have full access to crops." on public.crops
  for all using ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 5. Auto-update updated_at on every update
create or replace function public.handle_crop_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger on_crop_updated
  before update on public.crops
  for each row execute procedure public.handle_crop_updated_at();
