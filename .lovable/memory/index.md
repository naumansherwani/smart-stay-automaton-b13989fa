# Project Memory

## Core
HostFlow AI - multi-industry AI scheduling platform. Primary 168 70% 38% teal.
3-day free trial, then Basic $15/Standard $39/Premium $99 monthly.
8 industries ONLY: hospitality, airlines, car_rental, healthcare, education, logistics, events_entertainment, railways.
Hospitality has 2 sub-types in profiles.business_subtype: hotel_property | travel_tours. NEVER mix hotel data with tour data.
Pricing 5 industries get AI Smart Pricing: hospitality, airlines, car_rental, events_entertainment, railways. NO pricing for healthcare/education/logistics.
AI Ticket Generator/Email only for: airlines, railways, events_entertainment.
Auth: Email + Google + Apple. No anonymous signups. Email verification required.
Domain: hostflowai.net (primary, May 2026). .live FULLY REMOVED everywhere.
Owner: naumansherwani@hostflowai.net, notifications → naumankhansherwani@gmail.com
No public support@ email on website — removed per owner. Internal founder mailbox Support identity kept.
No "Book Demo" CTA on landing/pricing — removed per owner.
Payments: Paddle FULLY REMOVED Apr 2026. No provider integrated. Checkout shows waitlist banner. Do NOT auto-integrate any provider — user must confirm.
Email: Resend ONLY (May 2026). Zoho/IMAP/SMTP fully removed. Single sender noreply@hostflowai.net, identities are display-name only, replies route to naumansherwani@hostflowai.net via Reply-To. No in-app inbox — Founder Emails section is compose-only. Edge fn: resend-send (replaces zoho-smtp-send + owner-mailbox).
Backend split: Lovable Cloud = DB of record + auth + storage + email (Resend) + frontend. Replit = AI brain (advisors, health scores, benchmarks, plan enforcement). Schema changes only via Lovable migrations.

## Memories
- [Pricing tiers](mem://features/pricing) — Plan features and limits for Basic/Standard/Premium
- [Industries](mem://features/industries) — 8 supported industry types and their configs
- [Owner credentials](mem://features/owner-credentials) — Owner login & Gmail notification config
- [Brand colors](mem://design/brand-colors) — HostFlow AI brand palette
- [CRM architecture](mem://features/crm-architecture) — CRM module structure
- [Double-booking guard](mem://features/double-booking-guard) — Conflict detection system
- [Industry features](mem://features/industry-features) — Per-industry feature configs
- [Trial system](mem://features/trial-system) — Trial & subscription logic
- [No payment provider](mem://constraints/no-paddle-stripe-lemon) — Paddle removed Apr 2026, no provider currently integrated
- [Advisor architecture](mem://features/advisor-architecture) — platform-knowledge.ts → 8 industry advisors → Sherlock auto-import chain
- [Never-mix rules](mem://constraints/never-mix-rules) — Industry/sub-type/plan isolation rules
- [Replit backend contract](mem://features/replit-backend-contract) — JWT, plan enforcement, SSE advisor contract
