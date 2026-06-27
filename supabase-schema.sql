-- =====================================================
-- DATABASE SCHEMA - SUBSCRIPTION MANAGEMENT SYSTEM
-- Execute this SQL in Supabase SQL Editor (public schema)
-- =====================================================

-- 1. SUBSCRIBERS TABLE
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  CONSTRAINT chk_valid_dates CHECK (end_date >= start_date)
);

-- 3. PAYMENT RECEIPTS TABLE
CREATE TABLE IF NOT EXISTS payment_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subscriber_id UUID REFERENCES subscribers(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  reference_month TEXT NOT NULL, -- format: YYYY-MM (ex: 2026-01)
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(contact_email);
CREATE INDEX IF NOT EXISTS idx_subscribers_whatsapp ON subscribers(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber ON subscriptions(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_receipts_subscriber ON payment_receipts(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_receipts_month ON payment_receipts(reference_month);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES

-- Subscribers
CREATE POLICY "authenticated_view_subscribers"
  ON subscribers FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_subscribers"
  ON subscribers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_subscribers"
  ON subscribers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_subscribers"
  ON subscribers FOR DELETE TO authenticated USING (true);

-- Subscriptions
CREATE POLICY "authenticated_view_subscriptions"
  ON subscriptions FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_subscriptions"
  ON subscriptions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_subscriptions"
  ON subscriptions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_subscriptions"
  ON subscriptions FOR DELETE TO authenticated USING (true);

-- Payment Receipts
CREATE POLICY "authenticated_view_receipts"
  ON payment_receipts FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_receipts"
  ON payment_receipts FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_receipts"
  ON payment_receipts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_receipts"
  ON payment_receipts FOR DELETE TO authenticated USING (true);
