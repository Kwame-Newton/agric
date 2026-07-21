-- Supabase Database Schema for AgriLink

-- 1. PROFILES TABLE
-- Holds shared information for all users (Farmers, Buyers, Admins)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  phone text,
  role text not null check (role in ('farmer', 'buyer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Drop old policies to avoid duplicates
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can update their own profile." on public.profiles;
drop policy if exists "Admins have full access to profiles." on public.profiles;

-- Create policies without infinite recursion
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can update their own profile." on public.profiles
  for update using (auth.uid() = id);

-- Uses JWT metadata to check for admin role to prevent infinite recursion on the profiles table itself
create policy "Admins have full access to profiles." on public.profiles
  for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );


-- 2. FARMERS TABLE
-- Holds specific details for farmers/producers
create table if not exists public.farmers (
  id uuid references public.profiles(id) on delete cascade primary key,
  farm_name text not null,
  farm_location text not null,
  farm_size numeric not null,
  primary_category text not null,
  id_type text not null,
  id_number text not null,
  farm_bio text,
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'suspended', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for farmers
alter table public.farmers enable row level security;

drop policy if exists "Farmers details are viewable by everyone." on public.farmers;
drop policy if exists "Farmers can insert their own details." on public.farmers;
drop policy if exists "Farmers can update their own details." on public.farmers;
drop policy if exists "Admins have full access to farmers." on public.farmers;

create policy "Farmers details are viewable by everyone." on public.farmers
  for select using (true);

create policy "Farmers can insert their own details." on public.farmers
  for insert with check (auth.uid() = id);

create policy "Farmers can update their own details." on public.farmers
  for update using (auth.uid() = id);

create policy "Admins have full access to farmers." on public.farmers
  for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );


-- 3. BUYERS TABLE
-- Holds specific details for buyers/consumers
create table if not exists public.buyers (
  id uuid references public.profiles(id) on delete cascade primary key,
  buyer_type text not null check (buyer_type in ('individual', 'restaurant', 'wholesaler', 'processor')),
  payment_method text not null check (payment_method in ('momo', 'cash', 'bank')),
  delivery_address text not null,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for buyers
alter table public.buyers enable row level security;

drop policy if exists "Buyers can view their own details." on public.buyers;
drop policy if exists "Buyers can insert their own details." on public.buyers;
drop policy if exists "Buyers can update their own details." on public.buyers;
drop policy if exists "Admins have full access to buyers." on public.buyers;

create policy "Buyers can view their own details." on public.buyers
  for select using (
    auth.uid() = id or 
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

create policy "Buyers can insert their own details." on public.buyers
  for insert with check (auth.uid() = id);

create policy "Buyers can update their own details." on public.buyers
  for update using (auth.uid() = id);

create policy "Admins have full access to buyers." on public.buyers
  for all using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );


-- 4. AUTH TRIGGER
-- Automatically creates profile, farmer, or buyer details in a secure transaction during signup.
-- This bypasses client-side RLS limits for unconfirmed/new signups.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_role text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'buyer');

  -- Insert into profiles
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    user_role
  );

  -- Insert into role-specific tables
  if user_role = 'farmer' then
    insert into public.farmers (
      id, 
      farm_name, 
      farm_location, 
      farm_size, 
      primary_category, 
      id_type, 
      id_number, 
      farm_bio, 
      verification_status
    )
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'farm_name', 'Unnamed Farm'),
      coalesce(new.raw_user_meta_data->>'farm_location', 'Unknown'),
      coalesce((new.raw_user_meta_data->>'farm_size')::numeric, 0),
      coalesce(new.raw_user_meta_data->>'primary_category', 'vegetables'),
      coalesce(new.raw_user_meta_data->>'id_type', 'national'),
      coalesce(new.raw_user_meta_data->>'id_number', ''),
      coalesce(new.raw_user_meta_data->>'farm_bio', ''),
      'pending'
    );
  elsif user_role = 'buyer' then
    insert into public.buyers (
      id, 
      buyer_type, 
      payment_method, 
      delivery_address, 
      status
    )
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'buyer_type', 'individual'),
      coalesce(new.raw_user_meta_data->>'payment_method', 'momo'),
      coalesce(new.raw_user_meta_data->>'delivery_address', ''),
      'active'
    );
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
