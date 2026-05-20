---
name: SQL = High Command (LOCKED)
description: Before any frontend work, READ from personal Supabase (qsfmsjyorhicydtoiluk) SQL. Server (hostflowai-brain + runtime-schema-sync on PM2) auto-syncs schema/state to Supabase. Frontend mirrors whatever SQL says — no assumptions, no hardcoded mappings.
type: constraint
---
**Owner directive (May 2026):**

SQL in personal Supabase `qsfmsjyorhicydtoiluk` is the single source of truth. Backend (Hetzner `hostflowai-brain` + `runtime-schema-sync` PM2 processes) auto-syncs schema and runtime state into Supabase. Frontend must read from Supabase and render accordingly.

**Mandatory workflow before any change:**
1. Use `supabase--read_query` against `qsfmsjyorhicydtoiluk` to inspect the current SQL state (tables, columns, rows, configs).
2. Build/modify the frontend strictly based on what SQL says.
3. NEVER hardcode tables, fields, plans, prices, features, or industry mappings that exist in SQL.
4. If SQL is missing data, STOP and tell the owner — do not invent it.

**Chain of command:** SQL > Backend > Frontend. Lovable Cloud is deprecated for this project.
