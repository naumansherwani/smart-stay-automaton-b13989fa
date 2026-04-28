create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  feature text not null,
  provider text not null,
  model text not null,
  task text,
  failover_used boolean default false,
  prompt_tokens int,
  completion_tokens int,
  total_tokens int,
  error text,
  created_at timestamptz default now()
);
create index if not exists ai_usage_logs_user_created_idx on public.ai_usage_logs (user_id, created_at desc);
create index if not exists ai_usage_logs_feature_created_idx on public.ai_usage_logs (feature, created_at desc);
alter table public.ai_usage_logs enable row level security;
drop policy if exists "ai_usage_logs admin read" on public.ai_usage_logs;
create policy "ai_usage_logs admin read" on public.ai_usage_logs for select to authenticated using (public.has_role(auth.uid(), 'admin'));