# Project Memory

## Core
HostFlow AI - multi-industry AI scheduling platform. Primary #168 70% 38% teal.
3-day free trial, then Basic $15/Standard $39/Premium $99 monthly.
8 industries: Travel/Tourism/Hospitality, Airlines, Car Rental, Healthcare, Education, Logistics, Events & Entertainment, Railways.
Plans: trial | basic | standard | premium. "pro" plan does NOT exist anywhere.
Brain = Replit (all AI/payments/DB writes). Lovable = UI only. Replit base: https://294617d8-2084-4895-8e41-8e7fdf1efde4-00-37kl744l50epn.riker.replit.dev/api
API contract: { ok, data, error:{code,message}, trace_id }. 429 AI_LIMIT_REACHED → upgrade modal. 403 INDUSTRY_MISMATCH → signout. All AI advisor calls go through src/lib/api.ts (streamAdvisor / streamOwnerAdvisor) — never call ai-guide-chat / founder-adviser edge fns from frontend.
Auth: Email + Google + Apple. No anonymous signups. Email verification required.
Domain: hostflowai.net (primary, May 2026). .live FULLY REMOVED everywhere.
Owner: naumansherwani@hostflowai.net, notifications → naumankhansherwani@gmail.com (Gmail = backup recovery contact since Zoho often down)
No public support@ email on website — removed per owner. Internal founder mailbox Support identity kept.
No "Book Demo" CTA on landing/pricing — removed per owner.
Payments: Paddle FULLY REMOVED Apr 2026. No provider integrated. Checkout shows waitlist banner. Do NOT auto-integrate any provider — user must confirm.

## Memories
- [Pricing tiers](mem://features/pricing) — Plan features and limits for Basic/Standard/Premium
- [Industries](mem://features/industries) — All 8 supported industry types and their use cases
- [Owner credentials](mem://features/owner-credentials) — Owner login & Gmail notification config
- [Brand colors](mem://design/brand-colors) — HostFlow AI brand palette
- [CRM architecture](mem://features/crm-architecture) — CRM module structure
- [Double-booking guard](mem://features/double-booking-guard) — Conflict detection system
- [Industry features](mem://features/industry-features) — Per-industry feature configs
- [Trial system](mem://features/trial-system) — Trial & subscription logic
- [No payment provider](mem://constraints/no-paddle-stripe-lemon) — Paddle removed Apr 2026, no provider currently integrated
- [AI usage caps](mem://features/ai-usage-caps) — Per-plan AI message/voice/feature limits (Basic/Standard/Premium)
