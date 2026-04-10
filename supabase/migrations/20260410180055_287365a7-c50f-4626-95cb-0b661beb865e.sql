-- Add pricing and plan columns to workspaces table
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS base_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_percentage numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS industry_number integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'free';