# HostFlow AI — FINAL Frontend → Replit Handoff

**Date:** May 11, 2026  
**Frontend owner:** Lovable Cloud (smart-stay-automaton / hostflowai.net)  
**Backend owner:** Replit (HostFlow Brain @ `https://data-migration-master.replit.app`)  
**Author:** Lovable agent (deep audit pass)

This document is the **single source of truth** for everything the
Lovable frontend ships, every contract Replit must honor, and every
integration point Replit owns. Read this end-to-end before changing
any auth, plan, advisor, payment, or owner-protocol logic.

---

## 0. TL;DR for Replit

1. Trust Supabase JWT on every request (`Authorization: Bearer …`). Resolve user via `supabase.auth.getUser(token)`.
2. Owner identity = **TWO emails**, both already `admin` in `user_roles`:
   - `naumansherwani@hostflowai.net` (primary work)
   - `naumankhansherwani@gmail.com` (personal Gmail)
   Either one logging in must unlock Crown Badge + Founder Command Center. Frontend already routes both to `/founder-os` via `AdminRoute`.
3. Public marketing site = `https://hostflowai.net` (+ `www.`). Staging = `smart-stay-automaton.lovable.app`. Preview = `id-preview--…lovable.app`. **All three must be in Replit's CORS allowlist.**
4. Honor 3 request headers:
   - `Authorization: Bearer <jwt>` — required
   - `X-HostFlow-Surface: dashboard | crm` — scopes advisor system prompt
   - `X-View-As-Plan: basic | standard | premium` — admin-only plan QA override (verify caller is admin first, never trust blindly)
5. Payments = **Polar**, live, owned by Replit. Lovable side has NO payment provider wired. Do not auto-integrate Stripe / Paddle / Lemon Squeezy.
6. **No mock data** in any user-facing surface. Owner sees exactly what a paying user sees.

---

## 1. Backend split (authoritative)

| Concern | Owner |
|---|---|
| Auth (Supabase JWT, Email + Google + Apple), DB of record, storage, transactional email, frontend UI | **Lovable Cloud** |
| AI advisors (8 industries + Sherlock), health scores, benchmarks, plan-tier enforcement, deep features for healthcare / education / logistics, workflow scoring | **Replit Brain** |
| Payments (Polar checkout, webhooks, plan grants) | **Replit** (LIVE) |
| Email inbox / outbound AI compose | Lovable edge fn `owner-mailbox` + `owner-email-ai` (Resend), Replit forwards to `/email/inbox` shim if needed |

Schema changes happen **only** via Lovable migrations. Replit must never run DDL.

---

## 2. Auth contract

### 2.1 JWT validation
- Every Replit request from the browser carries `Authorization: Bearer <supabase_access_token>`.
- Replit MUST call `supabase.auth.getUser(token)` (or verify JWKS — secret `SUPABASE_JWKS` is already set on Lovable side, use the same project ref `uapvdzphibxoomokahjh`).
- Anonymous sign-ups: **DISABLED**.
- Email verification: **REQUIRED**.
- Providers enabled: **Email**, **Google**, **Apple**. No others.

### 2.2 Owner / Founder protocol  ⭐ NEW

Owner accounts (both grant Crown Badge + Founder Command Center):

| Email | Source | Role | DB user_id |
|---|---|---|---|
| `naumansherwani@hostflowai.net` | Email/password | admin | `d089432d-5d6b-416e-bd29-abe913121d99` |
| `naumankhansherwani@gmail.com` | Google OAuth | admin | `5692605f-08d9-423f-bc71-ff21eb9d78c7` |

Frontend allow-list (must stay in sync with Replit's own owner allow-list):
```ts
// src/pages/Login.tsx
const OWNER_EMAILS = [
  "naumansherwani@hostflowai.net",
  "naumankhansherwani@gmail.com",
];
```

**Replit must:**
- Treat both emails as owner-class even if a JWT comes in fresh from Google OAuth (the Gmail one).
- Never expose internal founder data (MRR, churn, advisor diagnostics, Sherlock raw reports) to anyone who is not `has_role('admin')`.
- For the Gmail account specifically: it logs in via **Google OAuth** (Lovable Cloud managed). Replit will see a JWT with `email = naumankhansherwani@gmail.com`, `aud = authenticated`, and a `sub` matching the row above. Same Brain behavior as the .net account.

### 2.3 Routes & guards (frontend)
- `ProtectedRoute` → any logged-in user with completed onboarding
- `AdminRoute` → checks `has_role(user_id,'admin')` via Supabase before rendering Founder OS, Owner Console, EnterpriseConsole, RevenueIntelligence
- `/onboarding` is forced for users with no `profiles.industry`

---

## 3. Required request headers (all Replit calls)

Source: `src/lib/replitApi.ts`.

| Header | Set by | Purpose |
|---|---|---|
| `Authorization: Bearer <jwt>` | always | identify user |
| `Content-Type: application/json` | always | — |
| `X-HostFlow-Surface: dashboard \| crm` | when relevant | scope advisor prompt |
| `X-View-As-Plan: basic \| standard \| premium` | admin only, when `localStorage["hostflow:view-as-plan"]` set | preview as paying tier |

**Plan name mapping:**

| Header value | DB plan |
|---|---|
| `basic` | `basic` |
| `standard` | `pro` (legacy) |
| `premium` | `premium` |

View-as override logic on the frontend lives in `src/hooks/useViewAsPlan.tsx` and `src/hooks/useSubscription.tsx`. Replit must:
1. Verify caller is admin first. Non-admin → ignore header.
2. If admin → return that tier's feature set / caps.
3. Tag usage logs with `view_as_plan` so admin QA does not pollute MRR / churn analytics.

---

## 4. CORS allowlist (Replit must allow)

- `https://hostflowai.net`
- `https://www.hostflowai.net`
- `https://smart-stay-automaton.lovable.app` (published)
- `https://id-preview--0ac55503-220d-4481-83fe-d4e85a8e516e.lovable.app` (preview)
- `http://localhost:5173`, `http://localhost:8080` (dev)

Allowed headers: `Authorization, Content-Type, X-HostFlow-Surface, X-View-As-Plan, Accept`.

---

## 5. Industry & sub-type rules (NEVER violate)

- **8 industries only**: `hospitality, airlines, car_rental, healthcare, education, logistics, events_entertainment, railways`.
- **Hospitality sub-types** (`profiles.business_subtype`): `hotel_property` vs `travel_tours` — never mix.
- **AI Smart Pricing** allowed only for: hospitality, airlines, car_rental, events_entertainment, railways.
- **AI Ticket Generator / Email** allowed only for: airlines, railways, events_entertainment.
- Healthcare / Education / Logistics: **Replit owns** deep workflow / scoring logic — no pricing, no ticketing.
- Replit MUST read `profiles.industry` + `profiles.business_subtype` on every advisor call and 403 on mismatch.

---

## 6. Frontend surfaces (what Lovable ships)

### 6.1 Public marketing (hostflowai.net)
`Index, About, Pricing, Contact, Support, Terms, PrivacyPolicy, RefundPolicy, Unsubscribe, Maintenance, NotFound` + landing components (`Hero, Features, HowItWorks, Industries, Pricing, Testimonials, Reviews, Stats, FAQ, CTA, Footer, MultilingualTrustStrip, TrustBadges, VoiceAISection, WhyDifferent`).

### 6.2 Auth
`Login, Signup, ForgotPassword, ResetPassword`, Email + Google + Apple via `lovable.auth.signInWithOAuth`. MFA TOTP supported on Login. Password HIBP check enabled.

### 6.3 User app (any of 8 industries)
- `Dashboard` — industry-themed via `data-industry`; calls Replit for health score + advisor preview.
- `CRM` — full pipeline (leads, deals, tasks, notes, companies). Hook: `useCrm`, `useCrmTasks`, `useCrmPerformance`. Realtime via Supabase channel. AI assistant via Replit `/advisor/:industry` (surface=`crm`).
- `AIAdvisor` — SSE stream from Replit `/advisor/:industry`. Component: `FloatingAdvisorChat` (also globally mounted).
- `Analytics`, `Earnings`, `RevenueIntelligence` — Replit `/intelligence-reports/latest`.
- `Automations`, `Integrations`, `Messages`, `Reviews`, `Settings`, `Profile`, `Billing`, `ResolutionHubPage`, `Onboarding`, `RailwayDashboard`, `EnterpriseConsole`.
- Industry-specific tabs under `src/components/railway/*`, `src/components/dashboard/*`, `src/components/crm/*`, `src/components/enterprise-crm/*`.
- Plan gating: `useSubscription`, `useTrialLimits`, `usePlanLimits`, `useConversationCap`, `FeatureGate`, `LimitReachedPopup`, `UpgradeNudge`, `AiLimitModal`.
- Trial system: 3-day trial auto-granted on signup (DB trigger `handle_new_user`).

### 6.4 Owner / Founder protocol (admin only)
- `FounderOS` (Command Center shell) with sections in `src/components/founder/sections/*`:
  Dashboard, RevenueIntelligence, Emails, AIAgentsEmailCenter, FounderProfile, Settings, etc.
- `OwnerConsole`, `EnterpriseConsole`.
- Crown badge + avatar via `UserHalo` (`founderBadge` prop) in `FounderHeader`.
- Plan switcher (admin-only) in `PlanSwitcher` writes `localStorage["hostflow:view-as-plan"]`.

### 6.5 Identity layer (Neural Halo)
- `src/components/identity/UserHalo.tsx` — single primitive, industry-themed pulse, optional Crown overlay.
- `useAvatarSignedUrl` — resolves signed URLs from **private** `profile-avatars` bucket (1-hour expiry, auto-refresh).
- Profile upload writes to `profile-avatars/{user_id}/avatar.{ext}` and stores path in `profiles.avatar_path`.

---

## 7. Lovable Cloud edge functions (Lovable owns; Replit may call)

| Function | Purpose | Replit usage |
|---|---|---|
| `contact-form` | Public contact form → Resend → owner inbox | call-from-Brain optional |
| `resend-send`, `send-transactional-email`, `process-email-queue`, `preview-transactional-email`, `handle-email-suppression`, `handle-email-unsubscribe` | Outbound email pipeline | Replit may enqueue via `enqueue_email` RPC |
| `owner-mailbox`, `owner-email-ai`, `owner-password-recovery`, `owner-schedule-dispatch` | Founder mailbox | Replit shim `/email/inbox` may proxy |
| `arc-event-ingest`, `arc-orchestrator` | Analytics / ARC signals | Replit can forward |
| `polar-create-checkout`, `polar-webhook` | Payments | **Replit-owned; Lovable shim only** |
| `elevenlabs-conversation-token`, `elevenlabs-tts` | Voice AI | Lovable-owned |
| `review-ai-filter`, `exit-survey-summary`, `winback-generate-offer`, `winback-approve-offer`, `retention-action`, `churn-risk-score`, `resolve-schedule-conflict`, `validate-booking`, `ai-auto-schedule`, `ai-smart-pricing`, `ai-onboarding-guide`, `ai-guide-chat`, `founder-adviser`, `founder-adviser-title`, `founder-intelligence`, `founder-weekly-report`, `founder-action-execute`, `mrr-ai-insights`, `crm-ai-assistant`, `crm-daily-planner`, `crm-performance-report`, `update-translations` | Legacy shims | **Migrating to Replit** — see Section 8 |

---

## 8. Replit route map (what Brain must expose)

Source-of-truth: `src/lib/replitApi.ts` → `invokeShim()`.

| Legacy name (Lovable code) | Replit route | Method |
|---|---|---|
| `crm-ai-assistant`, `crm-daily-planner`, `crm-performance-report` | `POST /api/advisor/:industry` | SSE/JSON |
| `ai-smart-pricing` | `POST /api/pricing/suggest` | JSON |
| `ai-auto-schedule` | `POST /api/calendar/suggest` | JSON |
| `validate-booking` | `POST /api/bookings` | JSON |
| `ai-onboarding-guide` | `POST /api/onboarding/answer` | JSON |
| `founder-adviser` | `POST /api/founder/adviser` | JSON / SSE |
| `founder-intelligence`, `mrr-ai-insights` | `GET /api/intelligence-reports/latest` | JSON |
| `owner-email-ai` | `POST /api/email` | JSON |
| `owner-mailbox` | `GET /api/email/inbox` | JSON |
| `churn-risk-score` | `GET /api/health-scores/admin` | JSON |
| `retention-action` | `GET /api/health-scores/admin/critical` | JSON |
| `arc-event-ingest` | `POST /api/v1/sync-manifest` | JSON |
| `arc-orchestrator` | `POST /api/signals` | JSON |
| `contact-form` | `POST /api/email/contact` | JSON |

### SSE advisor contract (POST `/api/advisor/:industry`)

- Headers: `Authorization`, `Accept: text/event-stream`, optional `X-HostFlow-Surface`, optional `X-View-As-Plan`.
- Frames: `start | chunk | done | escalation | error`.
- Validate `:industry` against `profiles.industry`. 403 on mismatch.
- Hospitality: also validate `profiles.business_subtype`. `hotel_property` advisor must NEVER answer with tour-pricing/itinerary content, and vice versa.

### Response envelope (everywhere except SSE)

```json
{ "ok": true, "data": { ... }, "error": null, "trace_id": "…" }
```

On error:
```json
{ "ok": false, "data": null, "error": { "code": "AI_LIMIT_REACHED", "message": "Upgrade required", "upgrade_to": "standard" }, "trace_id": "…" }
```

---

## 9. Plan enforcement (Replit-owned)

For every limited feature:
1. Read `subscriptions.plan` (live row; ignore view-as for non-admin).
2. If admin and `X-View-As-Plan` present, swap to that plan for the request.
3. Read `plan_feature_limits` WHERE `plan` + `feature_key`.
4. Read `feature_usage` WHERE `user_id` + `feature_key`.
5. `is_unlimited=true` → ALLOW.
6. `usage >= limit` → 429 with `{ error: { code: "AI_LIMIT_REACHED", upgrade_to } }`.
7. Else ALLOW + atomic increment.

Reset: daily 00:00 UTC, monthly 1st UTC. Lifetime accounts (`subscriptions.is_lifetime=true`) bypass all caps — the two owner accounts qualify; trigger `handle_new_user` already grants this.

Pricing tiers (display only): Trial 3 days free → Basic $15 → Standard $39 → Premium $99 / month.

---

## 10. Industry isolation in DB

Replit must enforce on every read/write: `WHERE profiles.user_id = auth.uid()` AND `industry = <route param>`. Cross-industry leakage = bug. The frontend already routes industry-scoped data via `useWorkspaces`, `useEnterpriseCrm`, `useHealthcare`, `useLogistics`, `useEvents`, `useAiPricing`, etc.

---

## 11. Storage buckets

| Bucket | Public? | Use |
|---|---|---|
| `avatars` | yes (legacy) | old uploads — read-only |
| `profile-avatars` | **private** | new identity halo, signed URLs |
| `founder-ai-uploads` | private | founder AI attachments |
| `advisor-attachments` | private | advisor SSE attachments |

Path convention: `{bucket}/{user_id}/...`. RLS: owner-only.

---

## 12. Secrets (Lovable-side, already set)

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEY(S)`, `SUPABASE_SECRET_KEYS`, `SUPABASE_JWKS`, `SUPABASE_DB_URL`, `OPENAI_API_KEY`, `GEMINI_API_KEY`, `LOVABLE_API_KEY`, `RESEND_API_KEY`, `REPLIT_INBOX_URL`.

Replit must hold its own copies of any keys it actually uses; do not pull from Lovable runtime.

---

## 13. Recent UI / theming touch-ups Replit should know about

- Top-bar buttons (LanguageSwitcher, PlanSwitcher, Industry switcher) unified on subtle teal `hsl(168 70% 38%)`, hover → white.
- Hospitality globe icon recolored to **blue** `#2563eb` (global/world cue, not brand teal).
- Industry primary token shifts per workspace via `data-industry="…"` on `<html>`. Brand teal stays fixed for cross-industry chrome.
- Crown 👑 in `FounderHeader` is now an **avatar + crown badge combo**, not a standalone icon.
- `FloatingAdvisorChat` header + minimized orb use `<UserHalo />` instead of Sparkles.
- Top bar also renders `<UserHalo size="sm">` next to the industry switcher.

---

## 14. No-mock-data rule (HARD)

No component in `src/pages/*` or `src/components/{dashboard,crm,enterprise-crm,railway,founder}/*` may render hard-coded sample arrays. Empty / zero state if DB is empty. Sample data lives only on a dedicated `/demo` route with a visible badge. Owner sees exactly what a paying user sees.

---

## 15. Files Replit may want to read on Lovable side

- `src/lib/replitApi.ts` — call wrapper, headers, SSE parser, `invokeShim`
- `src/lib/replitBase.ts` — origin resolution (block legacy `*.riker.replit.dev`)
- `src/lib/replitAuth.ts` — token + industry helpers
- `src/hooks/useAuth.tsx` — session refresh recovery
- `src/hooks/useViewAsPlan.tsx` — admin override source
- `src/hooks/useSubscription.tsx` — plan resolution (respects view-as)
- `src/hooks/useTrialLimits.tsx`, `usePlanLimits.tsx` — derived caps
- `src/components/app/PlanSwitcher.tsx` — UI control for view-as
- `src/lib/industryConfig.ts`, `src/lib/industryFeatures.ts` — industry rules
- `src/lib/pricingConfig.ts` — plan price/feature display
- `src/components/auth/AdminRoute.tsx` — admin gate
- `src/components/identity/UserHalo.tsx` — halo + crown
- `src/pages/Login.tsx` — OWNER_EMAILS allow-list (must match Replit)

---

## 16. Replit action items

1. Sync `OWNER_EMAILS` allow-list on Brain side to the same two emails. Either email logging in (password or Google OAuth) must unlock founder-class endpoints.
2. Re-check CORS allowlist includes hostflowai.net + www + lovable preview + lovable published.
3. Honor `X-View-As-Plan` header (admin-verified) on every limited endpoint and tag usage logs with `view_as_plan`.
4. Continue to own: advisor SSE, health scores, benchmarks, plan enforcement, deep workflows (healthcare / education / logistics), Polar checkout + webhook.
5. Never modify Supabase schema directly. Request migration via Lovable.
6. Validate `:industry` and `profiles.business_subtype` on every advisor / pricing / ticket call — 403 on mismatch.
7. Never expose mock or seeded data on production routes. `/demo` is the only exception.
8. Mirror owner identity in Brain: both `naumansherwani@hostflowai.net` and `naumankhansherwani@gmail.com` → founder-class.

---

## 17. Where the human-facing site lives

- **Primary public:** https://hostflowai.net  (+ https://www.hostflowai.net) — A records → Lovable `185.158.133.1`, SSL auto.
- **Lovable published mirror:** https://smart-stay-automaton.lovable.app
- **Preview:** https://id-preview--0ac55503-220d-4481-83fe-d4e85a8e516e.lovable.app

All three serve the same React build; the .net domain is the canonical one.

---

_End of FINAL handoff. Older handoff at `.lovable/docs/FRONTEND_TO_REPLIT_HANDOFF.md` superseded by this file._