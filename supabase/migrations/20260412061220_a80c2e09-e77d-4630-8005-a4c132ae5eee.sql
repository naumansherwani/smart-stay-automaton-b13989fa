
-- 1. SUBSCRIPTIONS: Block all writes (only server/admin should modify)
CREATE POLICY "Block user inserts on subscriptions"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Block user updates on subscriptions"
  ON public.subscriptions FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "Block user deletes on subscriptions"
  ON public.subscriptions FOR DELETE
  TO authenticated
  USING (false);

-- 2. WORKSPACES: Replace UPDATE policy to restrict financial columns
-- Drop old permissive update policy
DROP POLICY IF EXISTS "Users can update own workspaces" ON public.workspaces;

-- Create a SECURITY DEFINER function for safe workspace updates (name/is_active only)
CREATE OR REPLACE FUNCTION public.update_workspace_safe(
  _workspace_id uuid,
  _name text DEFAULT NULL,
  _is_active boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.workspaces
  SET
    name = COALESCE(_name, name),
    is_active = COALESCE(_is_active, is_active),
    updated_at = now()
  WHERE id = _workspace_id AND user_id = auth.uid();
END;
$$;

-- 3. USER_EARNINGS: Block UPDATE and DELETE for non-admins
CREATE POLICY "Block user updates on earnings"
  ON public.user_earnings FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Block user deletes on earnings"
  ON public.user_earnings FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. CRM_ACTIVITY_LOGS: Replace user INSERT with server-only function
DROP POLICY IF EXISTS "Users can insert own logs" ON public.crm_activity_logs;

CREATE OR REPLACE FUNCTION public.insert_activity_log(
  _industry text,
  _action_type text,
  _entity_type text,
  _entity_id uuid DEFAULT NULL,
  _description text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  INSERT INTO public.crm_activity_logs (user_id, industry, action_type, entity_type, entity_id, description, metadata)
  VALUES (auth.uid(), _industry, _action_type, _entity_type, _entity_id, _description, _metadata)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;
