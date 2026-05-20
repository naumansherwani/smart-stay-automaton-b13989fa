## Goal

SQL = high command. Personal Supabase (`qsfmsjyorhicydtoiluk`, 102 tables) drives the frontend. Hardcoded mappings in TS files are removed in favor of SQL reads + Realtime auto-sync. Backend (Hetzner `hostflowai-brain` + `runtime-schema-sync`) keeps SQL fresh.

## Audit findings

**SQL config tables already populated:**
- `plan_feature_limits` — 4 plans × ~25 feature keys (limits + unlimited flags) ✅
- `onboarding_settings`, `voice_assistant_settings`, `schedule_settings`, `founder_settings`, `scheduling_conflict_policy`, `railway_pricing_overrides`

**Hardcoded files to migrate (in priority order):**
1. `src/lib/pricingConfig.ts` (47 ln) — plan keys + prices + discounts. **Mismatch**: code has `basic/pro/premium` + £25/52/108; SQL + memory say `basic/standard/premium` + $15/39/99. SQL wins.
2. `src/lib/industryFeatures.ts` (96 ln) — per-industry feature flags.
3. `src/lib/industryConfig.ts` (182 ln) — industry list, names, icons, colors.
4. `src/lib/crmConfig.ts` (176 ln) — per-industry CRM tabs/columns.
5. `src/hooks/usePlanLimits.tsx` — currently goes via Replit HTTP; switch to direct SQL read with Replit only for live usage counters.

**Tables that may need to be created for full SQL-drive** (Phase 4 only if missing):
- `industry_configs` (industry, display_name, icon, color, enabled, sort_order)
- `industry_features` (industry, feature_key, enabled, plan_required)
- `plan_pricing` (plan, base_price, currency, discount_percent)

## Phases

### Phase 1 — Plan limits (lowest risk, biggest win)
- Rewrite `usePlanLimits` to read `plan_feature_limits` directly from Supabase + subscribe to Realtime changes.
- Keep Replit `/api/plan/me` only for live usage counters (today's AI messages used, etc.).
- All `FeatureGate`, `useTrialLimits`, `useConversationCap` consumers auto-update.
- Delete hardcoded limits from `useTrialLimits.tsx` if any.

### Phase 2 — Pricing reconciliation
- Confirm with owner: SQL says plan enum = `trial/basic/standard/premium`; code says `basic/pro/premium`. Need owner decision on `pro` vs `standard` rename + currency ($ vs £).
- Create `plan_pricing` table OR use `subscriptions.plan` enum as source.
- Rewrite `pricingConfig.ts` → thin hook `usePricing()` that reads SQL.
- Update `PricingSection`, `Pricing` page, `Billing` page.

### Phase 3 — Industry & CRM configs
- Create `industry_configs` + `industry_features` tables (migration to personal Supabase).
- Seed from current TS values so nothing breaks.
- Convert `industryConfig.ts` + `industryFeatures.ts` + `crmConfig.ts` to thin SQL-backed hooks (`useIndustries`, `useIndustryFeatures`, `useCrmConfig`).
- Add Realtime so `runtime-schema-sync` changes propagate instantly.

### Phase 4 — Onboarding, voice, scheduling settings
- Wire `Onboarding` wizard to `onboarding_settings`.
- Wire voice components to `voice_assistant_settings`.
- Wire schedule/conflict UI to `schedule_settings` + `scheduling_conflict_policy`.

## Technical notes

- All reads use `supabase` client from `@/integrations/supabase/client` (already aliased to personal Supabase via `vite.config.ts`).
- Each new hook caches in-memory + subscribes to `postgres_changes` for that table for auto-sync.
- No migrations created against Lovable Cloud — Phase 3 migration SQL will be handed to owner to run on personal Supabase (since Lovable migration tool targets the wrong project).
- Zero behavior change in Phase 1: if SQL row missing, fall back to current Replit response.
- Each phase = one chat turn, one git commit, independently revertable.

## Out of scope (this plan)

- Touching 90+ data tables (bookings, crm_*, railway_*, healthcare_*) — those are already correctly wired via supabase client, no hardcoded data.
- Landing page copy, brand colors (locked per memory).
- Backend changes on Hetzner.

## What I need from you before starting

Just say **"Phase 1 start"** and I'll rewire `usePlanLimits` to read `plan_feature_limits` directly. For Phase 2, I'll need a one-line answer: keep `pro` or rename to `standard`? Keep £ or switch to $?
