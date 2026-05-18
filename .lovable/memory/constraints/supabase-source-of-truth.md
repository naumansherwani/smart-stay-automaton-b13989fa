---
name: Supabase = Single Source of Truth (LOCKED)
description: Owner's PERSONAL Supabase is the only source of truth for all runtime config. Frontend = presentation, Backend (Hetzner) = execution, Supabase = truth. No hardcoded URLs/flags/mappings.
type: constraint
---
**LOCKED owner decision (May 2026) — HostFlow AI Core Architecture Rule:**

Owner's PERSONAL Supabase (`PERSONAL_SUPABASE_URL`) is the **single source of truth** for ALL runtime configuration. Lovable Cloud data is being migrated out; no new writes to Lovable Cloud.

**10 Mandatory Rules:**
1. NEVER hardcode API URLs, feature flags, routing rules, adviser mappings, plan logic, or industry configs in the frontend.
2. NEVER duplicate business logic between frontend and backend.
3. Frontend MUST read configuration from Supabase (personal).
4. Backend (Hetzner) MUST read the same configuration from Supabase.
5. Founder OS, Jimmy John (CEO AI), Sherlock (Founder Advisor), and all 8 industry advisers MUST follow Supabase-controlled configuration.
6. Each industry stays strictly isolated (enforced via Supabase config + RLS).
7. New features MUST first be registered in Supabase, then exposed to frontend.
8. Frontend MUST adapt automatically based on Supabase configuration (no rebuilds for config changes).
9. Roles: **Supabase = truth · Frontend = presentation · Backend = execution.**
10. NEVER introduce hardcoded endpoints when a Supabase-driven mapping already exists.

**Communication contract:** Lovable ↔ Owner ↔ Backend all reconfirm against Supabase before acting. If Supabase says X, X is final. Any backend change auto-syncs to frontend through Supabase reads.

**Before any backend/config work:** STOP, query personal Supabase, confirm current truth, then proceed.

**Why:** Eliminates drift, duplication, vendor lock-in. Single founder, single brain, single truth table.
