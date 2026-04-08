
-- Remove dangerous INSERT/UPDATE policies on subscriptions
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

-- Subscriptions should only be readable by users, not writable
-- The handle_new_user trigger uses SECURITY DEFINER so it bypasses RLS
