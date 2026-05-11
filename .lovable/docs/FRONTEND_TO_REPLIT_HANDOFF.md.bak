# HostFlow AI — Frontend → Replit Handoff

**Date:** May 11, 2026
**Maintainer:** Lovable frontend
**Audience:** Replit backend (HostFlow Brain)

This document is the **single source of truth** for what the Lovable
frontend has shipped, what contracts Replit must honor, and where
Replit is expected to take ownership next. Read this before changing
plan-enforcement, advisor, or pricing endpoints.

---

## 1. Backend split (reminder)

| Concern | Owner |
|---|---|
| Auth (Supabase JWT), DB of record, storage, email, frontend UI | **Lovable Cloud** |
| AI advisors (8 industries + Sherlock), health scores, benchmarks, plan-tier enforcement, deep features for healthcare/education/logistics, workflow scoring | **Replit (HostFlow Brain)** |
| Payments (Polar checkout, webhooks, plan grants) | **Replit** (LIVE, do **not** wire any provider on Lovable side) |

Schema changes are made via Lovable migrations only.

---

## 2. Auth contract

- Every Replit call from the browser carries `Authorization: Bearer <supabase_access_token>`.
- Replit MUST call `supabase.auth.getUser(token)` to resolve `user.id`.
- Anonymous sign-ups are **disabled**. Email verification is required.
- Auth providers enabled: **Email**, **Google**, **Apple**.

File: `src/lib/replitApi.ts` → `getAuthHeader()`.

---

## 3. Surface header

Frontend sends `X-HostFlow-Surface: dashboard | crm` when relevant so
Replit can scope responses (e.g. advisor system prompt, analytics).

---

## 4. **NEW — Admin "View-As-Plan" header** ⭐

Lovable now ships an admin-only **plan-switcher** in the top bar
(`src/components/app/PlanSwitcher.tsx`). It lets the owner preview the
app as a **Basic / Standard / Premium** paying user **without changing
real billing**.

### Header contract

If active, every Replit request (both `replitCall` and `replitStream`)
now includes:

```
X-View-As-Plan: basic | standard | premium
```

### What Replit should do

1. **Verify caller is admin first** (re-check `has_role(user_id, 'admin')`
   in Supabase). If not admin → **ignore the header** and use the user's
   real plan.
2. If admin → **treat the request as if the user were on that plan**:
   - apply that tier's rate limits / message caps,
   - return that tier's feature set,
   - log usage as `view_as_plan = '<plan>'` so it doesn't pollute real
     billing analytics.
3. If header is absent → behave exactly as before. **Backwards
   compatible — no rework required.**

### Plan name mapping

| Header value | Replit internal | Subscription DB plan |
|---|---|---|
| `basic` | basic | `basic` |
| `standard` | standard | `pro` (legacy name) |
| `premium` | premium | `premium` |

---

## 5. Frontend plan gating (already wired)

`src/hooks/useSubscription.tsx` now respects the view-as override:

- When admin sets a view-as plan, the hook returns a synthetic
  subscription with `plan = <chosen>`, `status = "active"`,
  `is_lifetime = false`, `trialDaysLeft = 0`.
- This means every existing feature-gate (`useTrialLimits`, advisor
  caps, AI pricing access, etc.) automatically reflects the chosen
  tier without changes.
- Real `subscriptions` row is **untouched**.

Storage key: `localStorage["hostflow:view-as-plan"]` → `"basic" | "standard" | "premium" | (absent)`.

---

## 6. SSE advisor contract (unchanged, restated for clarity)

- POST to advisor route, `Accept: text/event-stream`.
- Replit yields `{ event: string; data: any }` frames.
- Frontend already forwards `Authorization`, `X-HostFlow-Surface`, and
  now `X-View-As-Plan` on streams.
- Source: `src/lib/replitApi.ts` → `replitStream()`.

---

## 7. Industry & sub-type rules (frontend already enforces)

- **8 industries only**: hospitality, airlines, car_rental, healthcare,
  education, logistics, events_entertainment, railways.
- **Hospitality sub-types** (`profiles.business_subtype`):
  `hotel_property` vs `travel_tours` — **NEVER mix**.
- **AI Smart Pricing** ONLY for: hospitality, airlines, car_rental,
  events_entertainment, railways.
- **AI Ticket Generator / Email** ONLY for: airlines, railways,
  events_entertainment.
- **Healthcare / Education / Logistics** — no pricing, no ticketing.
  Replit owns the deep workflow / scoring logic for these.

---

## 8. Pricing tiers (frontend display)

| Plan | $/mo | Status |
|---|---|---|
| Trial | free, 3 days | auto on signup |
| Basic | $15 | live |
| Standard | $39 | live |
| Premium | $99 | live |

Payments: **Polar** (live, via Replit). Paddle has been **fully
removed** from Lovable. Do not auto-integrate Stripe / Lemon Squeezy
/ Paddle on the Lovable side.

---

## 9. No mock data rule

Owner sees exactly what a paying user sees. **No hard-coded sample
arrays** in dashboard or workspace components. Empty / zero state if
the DB is empty. Sample data lives only on the dedicated `/demo`
route with a visible badge.

---

## 10. UI / theming touch-ups (recent)

- Top bar buttons (LanguageSwitcher, **PlanSwitcher**, Industry
  switcher) unified on subtle **teal accent** (`hsl(168 70% 38%)`),
  hover → white. No more saturated green-on-black.
- Hospitality globe icon recolored from teal (`#0d9488`) to blue
  (`#2563eb`) so it reads as "world / global", not as the brand teal.
- Industry-scoped themes still applied via `data-industry="..."` on
  `<html>`. Industry primary token shifts per workspace; brand teal
  for cross-industry chrome stays fixed.

---

## 11. Files Replit may want to inspect

- `src/lib/replitApi.ts` — call wrapper + headers
- `src/lib/replitBase.ts` — origin resolution
- `src/hooks/useViewAsPlan.tsx` — admin override source
- `src/hooks/useSubscription.tsx` — plan resolution
- `src/hooks/useTrialLimits.tsx` — derived caps
- `src/components/app/PlanSwitcher.tsx` — UI control
- `src/lib/industryConfig.ts`, `src/lib/industryFeatures.ts` — industry rules
- `src/lib/pricingConfig.ts` — plan price/feature display

---

## 12. TL;DR action items for Replit

1. **Read `X-View-As-Plan`** on every request. If admin → treat user
   as that plan. If not admin → ignore. If absent → use real plan.
2. **Tag usage** logs with `view_as_plan` when header is honored, so
   admin QA doesn't pollute MRR / churn analytics.
3. Continue to **own**: advisor logic, health scores, benchmarks,
   plan-tier enforcement, deep features for healthcare / education /
   logistics, Polar checkout & webhooks.
4. **Do not** change Supabase schema directly — request via Lovable
   migration.

---

_End of handoff. Ping Lovable side if anything in this contract needs
to evolve._