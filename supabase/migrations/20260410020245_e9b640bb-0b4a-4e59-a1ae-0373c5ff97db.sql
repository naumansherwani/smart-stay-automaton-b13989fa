
-- Fix crm_activities: change from public to authenticated
DROP POLICY IF EXISTS "Users can delete own activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Users can insert own activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Users can update own activities" ON public.crm_activities;
DROP POLICY IF EXISTS "Users can view own activities" ON public.crm_activities;

CREATE POLICY "Users can delete own activities" ON public.crm_activities FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities" ON public.crm_activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities" ON public.crm_activities FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own activities" ON public.crm_activities FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix crm_automations
DROP POLICY IF EXISTS "Users can delete own automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Users can insert own automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Users can update own automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Users can view own automations" ON public.crm_automations;

CREATE POLICY "Users can delete own automations" ON public.crm_automations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own automations" ON public.crm_automations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own automations" ON public.crm_automations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own automations" ON public.crm_automations FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix crm_contacts
DROP POLICY IF EXISTS "Admins can view all contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "Users can view own contacts" ON public.crm_contacts;

CREATE POLICY "Admins can view all contacts" ON public.crm_contacts FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own contacts" ON public.crm_contacts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contacts" ON public.crm_contacts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own contacts" ON public.crm_contacts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own contacts" ON public.crm_contacts FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix crm_daily_plans
DROP POLICY IF EXISTS "Users manage own daily plans" ON public.crm_daily_plans;
CREATE POLICY "Users manage own daily plans" ON public.crm_daily_plans FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fix crm_deals
DROP POLICY IF EXISTS "Admins can view all deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can delete own deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can insert own deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can update own deals" ON public.crm_deals;
DROP POLICY IF EXISTS "Users can view own deals" ON public.crm_deals;

CREATE POLICY "Admins can view all deals" ON public.crm_deals FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own deals" ON public.crm_deals FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deals" ON public.crm_deals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deals" ON public.crm_deals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own deals" ON public.crm_deals FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix crm_google_connections (most critical - has OAuth tokens)
DROP POLICY IF EXISTS "Users manage own google connections" ON public.crm_google_connections;
CREATE POLICY "Users manage own google connections" ON public.crm_google_connections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fix crm_google_synced_items
DROP POLICY IF EXISTS "Users manage own synced items" ON public.crm_google_synced_items;
CREATE POLICY "Users manage own synced items" ON public.crm_google_synced_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fix crm_pipelines
DROP POLICY IF EXISTS "Users can delete own pipelines" ON public.crm_pipelines;
DROP POLICY IF EXISTS "Users can insert own pipelines" ON public.crm_pipelines;
DROP POLICY IF EXISTS "Users can update own pipelines" ON public.crm_pipelines;
DROP POLICY IF EXISTS "Users can view own pipelines" ON public.crm_pipelines;

CREATE POLICY "Users can delete own pipelines" ON public.crm_pipelines FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pipelines" ON public.crm_pipelines FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pipelines" ON public.crm_pipelines FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own pipelines" ON public.crm_pipelines FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix crm_tasks
DROP POLICY IF EXISTS "Users manage own tasks" ON public.crm_tasks;
CREATE POLICY "Users manage own tasks" ON public.crm_tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fix crm_tickets
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.crm_tickets;
DROP POLICY IF EXISTS "Users can delete own tickets" ON public.crm_tickets;
DROP POLICY IF EXISTS "Users can insert own tickets" ON public.crm_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.crm_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.crm_tickets;

CREATE POLICY "Admins can view all tickets" ON public.crm_tickets FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own tickets" ON public.crm_tickets FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tickets" ON public.crm_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tickets" ON public.crm_tickets FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own tickets" ON public.crm_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Fix crm_work_sessions
DROP POLICY IF EXISTS "Admins can view all sessions" ON public.crm_work_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.crm_work_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.crm_work_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.crm_work_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.crm_work_sessions;

CREATE POLICY "Admins can view all sessions" ON public.crm_work_sessions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete own sessions" ON public.crm_work_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.crm_work_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.crm_work_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own sessions" ON public.crm_work_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
