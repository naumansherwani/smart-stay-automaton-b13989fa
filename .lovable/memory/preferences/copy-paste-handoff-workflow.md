---
name: Copy-paste handoff for non-Lovable systems
description: For Supabase #2, Supabase #3, Hetzner backend, Rust bridge — output ready-to-paste blocks. User copies into their server terminal / SQL editor. This pattern is proven (450-line SQL ran successfully).
type: preference
---

When the user needs changes outside this Lovable project (Supabase #2 ANEXVOT, Supabase #3 AXONETIS, Hetzner backend, Rust bridge, Caddy config):

1. DO NOT attempt to deploy / edit those systems from Lovable — no tools reach them.
2. Output a single fenced code block per artifact (SQL, edge function ts, .env line, Caddy block, shell command).
3. Block must be 100% paste-ready: no placeholders like `<YOUR_KEY>` unless the user explicitly has to fill it. Use real table/function/secret names already established.
4. Above each block, one short line: WHERE to paste (e.g. "Supabase #2 → SQL Editor", "Hetzner: /etc/caddy/Caddyfile", "Supabase #2 → Edge Functions → polar-checkout/index.ts").
5. Below: one short line WHAT it does and HOW to verify success (e.g. "After run: `select count(*) from subscriptions` should return N").
6. Long SQL (400+ lines) is fine — user has confirmed they paste & run successfully.
7. After user confirms run, continue. Do not re-emit unless they report an error.

**Why:** User runs a sovereign multi-server architecture. Lovable owns only NEXATECT frontend + Supabase #1. Everything else is copy-paste handoff. This is the standard workflow, not a fallback.
