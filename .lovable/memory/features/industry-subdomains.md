---
name: Industry Subdomains (LOCKED — owner final May 2026)
description: Each industry runs on its own subdomain of hostflowai.net. Root domain is landing + industry chooser only.
type: feature
---
**Owner-locked FINAL May 2026.** One codebase, one Lovable project, one Supabase backend. The subdomain just locks which industry the visitor signs up / logs in for.

| Industry slug | Subdomain |
|---|---|
| `hospitality` | `hospitality.hostflowai.net` |
| `airlines` | `airlines.hostflowai.net` |
| `car_rental` | `car-rental.hostflowai.net` (hyphen — underscores illegal in DNS) |
| `healthcare` | `healthcare.hostflowai.net` |
| `education` | `education.hostflowai.net` |
| `logistics` | `logistics.hostflowai.net` |
| `events_entertainment` | `events.hostflowai.net` |
| `railways` | `railways.hostflowai.net` |

**Root:** `hostflowai.net` + `www.hostflowai.net` → landing page + industry chooser. Founder/Owner consoles (`/founder-os`, `/owner-console`) stay on root.

**Routing helper:** `src/lib/industryDomain.ts` — `getIndustryFromHost()`, `getLockedIndustry()`, `getIndustrySubdomainUrl(industry, path)`, `getRootUrl(path)`.

**Rules:**
- Landing's IndustriesSection redirects to `https://{sub}.hostflowai.net/signup` (logged out) or `/onboarding` (logged in).
- Signup page reads the subdomain → passes `industry` into `auth.signUp({ options.data })` so the backend trigger can pre-set `profiles.industry`.
- Login page just shows an industry badge — actual industry comes from the user's profile after sign-in. (Mismatch redirect to correct subdomain is a future enhancement.)
- On Lovable preview hosts (`*.lovable.app`, `localhost`), subdomains are skipped — industry forwards via `?industry=` query instead.
- Auth cookies are subdomain-scoped by default (separate session per industry). Cross-subdomain SSO not configured yet.

**DNS setup (Lovable Custom Domains):** owner must add each subdomain in Project Settings → Domains, completing the standard A-record (185.158.133.1) flow once per subdomain. Same Lovable project serves all of them.