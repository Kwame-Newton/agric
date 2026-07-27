-- ============================================================
-- AgriLink: Orders Table Schema
-- PASTE THIS ENTIRE SCRIPT into the Supabase SQL Editor and run it.
-- ============================================================

create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  order_number text not null,
  buyer_id uuid references public.profiles(id) on delete cascade not null,
  farmer_id uuid references public.profiles(id) on delete set null,
  items jsonb not null default '[]'::jsonb,
  total_amount numeric not null default 0,
  delivery_address text not null default '',
  phone text not null default '',
  payment_method text not null default 'momo',
  status text not null default 'pending' check (status in ('pending', 'processing', 'delivered', 'cancelled')),
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.orders enable row level security;

-- Policies
drop policy if exists "Buyers view own orders" on public.orders;
drop policy if exists "Buyers insert own orders" on public.orders;
drop policy if exists "Admins/Farmers update orders" on public.orders;
drop policy if exists "Allow all authenticated select on orders" on public.orders;

create policy "Allow all authenticated select on orders"
  on public.orders for select
  using (true);

create policy "Buyers insert own orders"
  on public.orders for insert
  to authenticated
  with check (auth.uid() = buyer_id);

create policy "Admins/Farmers update orders"
  on public.orders for update
  to authenticated
  using (true);
