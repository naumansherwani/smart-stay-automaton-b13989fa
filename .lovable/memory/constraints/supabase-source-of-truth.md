---
name: Supabase = Single Source of Truth (LOCKED)
description: HostFlow AI Operations Supabase (qsfmsjyorhicydtoiluk) is the central control plane and auto-sync layer for ALL 8 industries, prices, plans, features, advisers, AI RapidPay, and the Founder AI Builder. Frontend = presentation, Backend (Hetzner api.hostflowai.net) = execution, Supabase = truth. No hardcoded URLs/flags/mappings.
type: constraint
---
**LOCKED owner decision (May 2026) — HostFlow AI Core Architecture Rule:**

**HostFlow AI Operations Supabase** is the single source of truth and central auto-sync layer:
- URL: `https://qsfmsjyorhicydtoiluk.supabase.co`
- Backend API: `https://api.hostflowai.net/api`
- Realtime broadcasts every backend change → frontend auto-syncs instantly.
- Applies to all 8 industries (each isolated row-set), prices, packages, plans, features, advisers, AI RapidPay (separate Supabase managed by owner), Founder AI Builder, and every code/glitch correction.
- Lovable Cloud data is being migrated out; no new writes to Lovable Cloud.

**Jimmy backend contract (LOCKED):**
- Endpoint: `POST https://api.hostflowai.net/api/founder/jimmy/orchestrate`
- Headers: `X-Sovereign-Token: hf-jimmy-sk-2026-xK9mPqR7vNwZ3jL` + Supabase JWT `Authorization: Bearer <token>`

**10 Mandatory Rules:**
1. NEVER hardcode API URLs, feature flags, routing rules, adviser mappings, plan logic, or industry configs in the frontend.
2. NEVER duplicate business logic between frontend and backend.
3. Frontend MUST read configuration from the Operations Supabase.
4. Backend (Hetzner) MUST read the same configuration from the Operations Supabase.
5. Founder OS, Jimmy John (CEO AI), Sherlock (Founder Advisor), and all 8 industry advisers MUST follow Supabase-controlled configuration.
6. Each industry stays strictly isolated (enforced via Supabase config + RLS).
7. New features MUST first be registered in Supabase, then exposed to frontend.
8. Frontend MUST adapt automatically based on Supabase configuration (no rebuilds for config changes).
9. Roles: **Supabase = truth · Frontend = presentation · Backend = execution.**
10. NEVER introduce hardcoded endpoints when a Supabase-driven mapping already exists.

**Communication contract:** Lovable ↔ Owner ↔ Backend all reconfirm against the Operations Supabase before acting. If Supabase says X, X is final. Any backend change auto-syncs to frontend through Supabase reads + Realtime.

**Before any backend/config work:** STOP, query Operations Supabase (`qsfmsjyorhicydtoiluk`), confirm current truth, then proceed.

**Scope:** Same rule applies to upcoming AI RapidPay (separate Supabase) and Founder AI Builder projects.

**Why:** Eliminates drift, duplication, vendor lock-in. Single founder, single brain, single truth table.
