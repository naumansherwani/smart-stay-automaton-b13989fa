---
name: Sovereign Architecture (LOCKED)
description: Owner runs his own Hetzner server + personal Supabase + local Ollama. Lovable is FRONTEND/DESIGN ONLY. No new Lovable Cloud usage.
type: constraint
---
**LOCKED owner decision (May 2026):**

- **Backend = owner's Hetzner server** at `api.hostflowai.net` (IP 88.198.208.90, IPv6 2a01:4f8:c0c:de81::/64). All API calls go here.
- **Database/Auth = owner's PERSONAL Supabase** (secrets: `PERSONAL_SUPABASE_URL`, `PERSONAL_SUPABASE_ANON_KEY`, `PERSONAL_SUPABASE_SERVICE_ROLE_KEY`). NOT Lovable Cloud.
- **AI = owner's local Ollama** on Hetzner. Jimmy John (CEO, 8B) + Sherlock (Founder Advisor, 8B) + 8 industry advisors (4B). Internal company AIs — never exposed as separate brands; users just use the features.
- **Sovereign auth header:** `X-Sovereign-Token` from `SOVEREIGN_API_BASE_URL` / `VITE_SOVEREIGN_TOKEN`. SECRET — never display, never hardcode beyond the existing fallback.
- **Lovable role = FRONTEND DESIGN ONLY.** Do NOT:
  - add new Lovable Cloud tables, edge functions, migrations, or storage buckets
  - duplicate any feature that already lives on owner's server
  - integrate payment/AI/auth providers on Lovable side
  - create parallel Supabase clients on Lovable Cloud
- **Migration in progress:** existing Lovable Cloud edge functions + DB are being decommissioned. When touching code, route through `src/lib/replitApi.ts` (sovereign base) and personal Supabase client. No new code paths to Lovable Cloud.
- **Why:** sole founder, full data sovereignty, no vendor lock-in, no duplicated state. Replit retired within ~10 days; Hetzner is permanent brain.

If a request needs new backend work, STOP and tell owner to build it on his server first — do not implement a Lovable Cloud shortcut.