-- ============================================================
-- AgriLink: Complete Orders & Escrow Payment System Schema
-- Run this ENTIRE script in your Supabase SQL Editor
-- ============================================================

-- 1. CREATE ORDERS TABLE (If it does not already exist)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  delivery_address TEXT NOT NULL DEFAULT '',
  delivery_method TEXT NOT NULL DEFAULT 'farmer_deliver',
  phone TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT 'momo',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  escrow_status TEXT NOT NULL DEFAULT 'pending',
  commission_rate NUMERIC NOT NULL DEFAULT 0.05,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  farmer_amount NUMERIC NOT NULL DEFAULT 0,
  paystack_reference TEXT DEFAULT '',
  paystack_transfer_code TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  delivered_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. ENSURE ESCROW COLUMNS EXIST (If orders table was created previously)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0.05;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS commission_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS farmer_amount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paystack_reference TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paystack_transfer_code TEXT DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'farmer_deliver';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- 3. ENABLE RLS & POLICIES FOR ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all authenticated select on orders" ON public.orders;
DROP POLICY IF EXISTS "Buyers insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins/Farmers update orders" ON public.orders;

CREATE POLICY "Allow all authenticated select on orders"
  ON public.orders FOR SELECT
  USING (true);

CREATE POLICY "Buyers insert own orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins/Farmers update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (true);

-- 4. FARMERS TABLE: Add payout and Mobile Money columns
ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'mtn_momo';
ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS mobile_money_number TEXT DEFAULT '';
ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS mobile_money_name TEXT DEFAULT '';
ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS bank_name TEXT DEFAULT '';
ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS paystack_recipient_code TEXT DEFAULT '';

-- 5. PAYOUT TRANSFERS TABLE: Audit log for all Paystack disbursements
CREATE TABLE IF NOT EXISTS public.payout_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  farmer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_code TEXT NOT NULL,
  transfer_code TEXT,
  reference TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'GHS',
  status TEXT NOT NULL DEFAULT 'pending',
  paystack_response JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. ENABLE RLS & POLICIES FOR PAYOUT TRANSFERS
ALTER TABLE public.payout_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated select on payout_transfers" ON public.payout_transfers;
DROP POLICY IF EXISTS "Allow service/admins all on payout_transfers" ON public.payout_transfers;

CREATE POLICY "Allow authenticated select on payout_transfers"
  ON public.payout_transfers FOR SELECT
  TO authenticated
  USING (auth.uid() = farmer_id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Allow service/admins all on payout_transfers"
  ON public.payout_transfers FOR ALL
  TO authenticated
  USING (true);
