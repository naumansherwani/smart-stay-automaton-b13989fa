---
name: Advisor Endpoints (LOCKED — owner final May 2026)
description: Each industry advisor has its own dedicated Hetzner endpoint /api/advisor/{industry}. Jimmy uses /api/founder/jimmy/orchestrate. Sherlock uses /api/founder/sherlock/orchestrate.
type: feature
---
**Owner-locked May 2026 (FINAL) — supersedes prior orchestrator-only routing.**

| Caller | Hetzner path | invokeShim name |
|---|---|---|
| Jimmy (founder chat) | `/api/founder/jimmy/orchestrate` body `{target:"jimmy"}` | `founder-adviser` |
| Sherlock (audit) | `/api/founder/sherlock/orchestrate` body `{target:"sherlock"}` | `sherlock-audit` |
| Industry advisors (Aria/Orion/Rex/Lyra/Sage/Atlas/Vega/Kai) | `/api/advisor/{industry}` — one endpoint per industry | `crm-*` via `callAdvisor()` |
| Owner mailbox | Supabase edge `owner-mailbox` (gracefully degrades on Hetzner /email/inbox 5xx) | `owner-mailbox` |

**Industry slugs (locked):** `hospitality`, `airlines`, `car_rental`, `healthcare`, `education`, `logistics`, `events_entertainment`, `railways`.

**Rule:** Industry advisor calls go DIRECT to `/api/advisor/{industry}` — no orchestrator hop, no `target:"industry_advisor"` body shim. Backend (Hetzner) routes each path to its qwen3:4b advisor.

**Resend removed (May 2026):** `supabase/functions/resend-send` deleted. Outbound sends disabled until Google Workspace wiring. `useOwnerMailbox.send` throws a clear "disabled" error. Other backend functions that still POST to `resend-send` will fail silently — fix them when Google Workspace is wired.
