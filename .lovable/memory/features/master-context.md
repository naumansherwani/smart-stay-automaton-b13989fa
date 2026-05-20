---
name: HostFlow AI Master Context (LOCKED)
description: Authoritative system context. SQL = source of truth. Models, memory caps, advisors, infra, hooks, phases progress. Frontend must be schema/metadata-driven via Supabase Realtime.
type: feature
---

# HostFlow AI — Master Context (May 2026, owner-locked)

## 1. Mission
Sovereign AI OS. **SQL is the source of truth.** New SQL tables/columns/rules → frontend + backend auto-adapt. Frontend reads live config from Supabase (`qsfmsjyorhicydtoiluk`).

## 2. SQL-First Source-of-Truth Tables
- `system_runtime_rules`
- `backend_features`
- `plan_feature_limits`
- `autonomous_feature_registry`
- Industry tables (`airlines_*`, `hospitality_*`, etc.)

Flow: SQL change → runtime-schema-sync (PM2 on Hetzner) refreshes cache → frontend hooks read → UI updates automatically.

## 3. AI Models (LOCKED)
**Founder AIs:**
- **Jimmy** (CEO co-pilot) — primary `qwen3:8b`, burst Gemini/Groq. Memory cap: **3,000,000 tokens**.
- **Sherlock** (audit/compliance/security) — primary `qwen3:8b`. Memory cap: **1,000,000 tokens**.

**Industry advisors** — default `qwen3:4b`. Memory cap: **100,000 tokens each**.
- Aria (Hospitality), Captain Orion (Airlines), Rex (Car Rental), Dr. Lyra (Healthcare), Professor Sage (Education), Atlas (Logistics), Vega (Events), Conductor Kai (Railways).

Burst models (Gemini, Groq) only when explicitly requested.

## 4. Infrastructure
- Hetzner public IP: `88.198.208.90`
- Backend API: `https://api.hostflowai.net/api`
- Supabase: `qsfmsjyorhicydtoiluk` → `https://qsfmsjyorhicydtoiluk.supabase.co`
- PM2 process: `runtime-schema-sync` → calls `SELECT public.get_dynamic_runtime_schema();`

## 5. Frontend Stack
React 18 · Vite · TypeScript · Tailwind · Supabase Realtime. Schema-driven, metadata-driven, minimal hardcoding.

## 6. Completed Frontend Work
- **Phase 1:** `usePlanLimits` reads `plan_feature_limits` + Supabase Realtime.

## 7. Required SQL-Driven Hooks (build these)
- `useBackendFeatures()` ← `backend_features` (show/hide features)
- `useRuntimeRules()` ← `system_runtime_rules` (app behavior)
- `useIndustryFeatures(industry)` ← `backend_features` (industry modules)
- `useAutonomousFeatureRegistry()` ← `autonomous_feature_registry` (schema-driven UI modules)

## 8. Phase Progress (owner-tracked)
- **Aria (Hospitality):** 28 phases written.
- **Captain Orion (Airlines):** 22/30 phases complete, **8 remaining**.
- Others: in progress.

### Aria implemented
Hospitality email agent, smart pricing, booking manager, OTA sync, gap-night filler, occupancy heatmaps, guest scoring, resolution hub, benchmark intelligence, WhatsApp + email automation.

### Captain Orion implemented foundation
Airline profiles, yield management, smart pricing, booking manager, Seat/Flight Guard, route optimizer, competitor fare intelligence, AI Resolution Hub, aviation onboarding, benchmark intelligence, compliance monitoring, WhatsApp passenger agent, AI Email Agent.

## 9. Email Accounts
**Advisors:** aria@, orion@, rex@, lyra@, sage@, atlas@, vega@, kai@ (all `@hostflowai.net`).
**Founder/system:** sherlock@, connectai@, resolved@, revenuereport@ (all `@hostflowai.net`).

## 10. Runtime SQL Foundation
- `get_dynamic_runtime_schema(target_feature_key TEXT DEFAULT NULL)` → JSON schema metadata
- `on_physical_schema_evolution_detected()` → `pg_notify()`
- Event trigger: `tr_live_ddl_evolution_watchdog`
- Notify channel: `autonomous_schema_evolution`

## 11. Runtime Rule Examples
`ORION_STATUS`, `ORION_COMPLETED_PHASES`, `ARIA_EMAIL_AGENT_ENABLED`, `FOUNDER_KILL_SWITCH`, `ORION_WHATSAPP_PASSENGER_AGENT_ENABLED`.

## 12. Frontend Rules (HARD)
1. Never hardcode feature lists when SQL has them.
2. Hooks over static config.
3. Subscribe to Supabase Realtime.
4. Respect `backend_features` activation flags.
5. Respect `system_runtime_rules` values.
6. Maintain industry isolation.
7. Use `global_customer_id` for all customer-scoped data.

## 13. Strategic Priority (Now)
1. Wire all chatboxes to backend (`https://api.hostflowai.net/api`).
2. Use SQL-driven hooks.
3. Render feature modules dynamically.
4. Expose Captain Orion + Aria capabilities to users.

## 14. Founder AI Builder (separate product, under Founder OS)
Generates SQL schemas, registers features, updates runtime rules, triggers auto-wiring, builds SaaS from founder instructions. NOT part of AI Revenue OS umbrella.

## 15. Final Directive
> If SQL changes, the frontend adapts automatically.
> If a feature is activated in SQL, it becomes visible and usable.
> Minimize hardcoded frontend logic.
> Build a schema-driven, realtime, SQL-first interface.
