---
name: Plan limits read from SQL
description: usePlanLimits reads plan_feature_limits table from personal Supabase + Realtime sync. Replit /plan/me only overlays live usage counters. Source of truth = SQL.
type: feature
---
- `src/hooks/usePlanLimits.tsx` reads `plan_feature_limits` directly via supabase client.
- Subscribes to `postgres_changes` on that table → any SQL edit auto-syncs UI.
- User's current plan comes from `subscriptions.plan` (SQL), not Replit.
- Replit `/api/plan/me` is best-effort overlay for live `usage` counters only; if it fails, limits still render.
- Feature keys mapped: `ai_daily_messages`, `ai_hourly_fairuse`, `industries`, `voice_assistant`/`ai_voice_assistant`. All other feature_keys mirrored flat on the bucket so any consumer can read `bucket["custom_key"]`.
- **How to apply:** Never hardcode plan limits in TS. Add row to `plan_feature_limits`, frontend auto-syncs.
