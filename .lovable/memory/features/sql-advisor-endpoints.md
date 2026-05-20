---
name: SQL Advisor Endpoints (LOCKED)
description: Canonical Hetzner endpoints per personal Supabase backend_features. Jimmy + all 8 industry advisors orchestrated through /api/founder/jimmy/orchestrate. Only Sherlock uses /api/founder/adviser.
type: feature
---
**Source:** qsfmsjyorhicydtoiluk → `backend_features` table (May 2026).

| Caller | Hetzner path | invokeShim name |
|---|---|---|
| Jimmy (founder chat) | `/api/founder/jimmy/orchestrate` body `{target:"jimmy"}` | `founder-adviser` |
| Sherlock (audit) | `/api/founder/adviser` body `{target:"sherlock"}` | `sherlock-audit` |
| 8 industry advisors (Aria/Orion/Rex/Lyra/Sage/Atlas/Vega/Kai) | `/api/founder/jimmy/orchestrate` body `{target:"industry_advisor", industry}` | `crm-*` via `callAdvisor()` |
| Owner mailbox | Supabase edge `owner-mailbox` (gracefully degrades on Hetzner /email/inbox 5xx) | `owner-mailbox` |

**Rule:** Never call `/api/advisor/:industry` — that route was wrong. SQL `backend_features.api_endpoint` is the only truth.

**Resend removed (May 2026):** `supabase/functions/resend-send` deleted. Outbound sends disabled until Google Workspace wiring. `useOwnerMailbox.send` throws a clear "disabled" error. Other backend functions that still POST to `resend-send` will fail silently — fix them when Google Workspace is wired.
