-- =====================================================
-- MIGRATION: Add subscription_id to payment_receipts
-- Run this if you already created the tables
-- =====================================================

ALTER TABLE payment_receipts
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_receipts_subscription ON payment_receipts(subscription_id);

-- =====================================================
-- MIGRATION: Remove is_active from subscriptions
-- Status is now automatic based on end_date
-- =====================================================

DROP INDEX IF EXISTS idx_subscriptions_status;
ALTER TABLE subscriptions DROP COLUMN IF EXISTS is_active;
