---
name: Website = Supabase (LOCKED)
description: Website runs from personal Supabase SQL (qsfmsjyorhicydtoiluk). Frontend auto-syncs to whatever SQL says. NEVER touch/edit SQL tables without explicit owner permission — read only. Plans locked = basic/pro/premium, GBP. Launch discount active until 2026-07-31.
type: constraint
---
**Owner directive (May 2026) — LOCKED:**

1. **Website = Supabase.** The personal Supabase (`qsfmsjyorhicydtoiluk`) SQL editor IS the website. When owner creates/edits a table there, Lovable's job is to READ it and wire the frontend to it. No assumptions.
2. **Read-only for Lovable.** NEVER insert/update/delete/alter SQL tables without explicit owner permission. Even schema migrations require ask-first.
3. **Plan keys LOCKED:** `basic`, `pro`, `premium`. SQL `plan_feature_limits` uses `standard` for the middle tier — alias `standard` → `pro` in code (`usePlanLimits`).
4. **Currency LOCKED:** GBP (£). Base prices: Basic £25, Pro £52, Premium £108/month.
5. **Launch discount LOCKED:** Active 2026-04-24 → 2026-07-31. Basic 12%, Pro 15%, Premium 20%. Cap 100/plan. Source: `get_launch_discount_status()` + `launch_discount_redemptions` table.
6. **Workflow on new SQL table:** (a) read columns via `supabase--read_query`, (b) wire frontend hook + Realtime subscription, (c) zero hardcoded mappings.