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
Payments: Polar via Replit backend, LIVE & connected. Paddle removed Apr 2026. Do NOT auto-integrate any provider on Lovable side.
Backend split: Lovable Cloud = DB of record + auth + storage + email + frontend. Replit = AI brain (advisors, health scores, benchmarks, plan enforcement). Schema changes only via Lovable migrations.
Replit also owns deep features for healthcare/education/logistics (workflows, scoring, advisor logic). Don't assume Lovable frontend has full feature picture — trust Replit as source of truth.
NO MOCK DATA in any dashboard/workspace component. Owner must see exactly what paying users see — empty/zero state if DB is empty. Sample data only on dedicated /demo route with visible badge.
CRM is named "AI CRM" everywhere user-facing. Route is /ai-crm; legacy /crm redirects to /ai-crm preserving query/hash. Internal file/component/hook names (CRM.tsx, useCrm, CrmFoo) stay as is.
Healthcare scheme: deep navy + medical red + WHITE accent (no teal/mint). Heartbeat = lub-dub double-thump then breathing glow, 5s cycle. Each industry gets its OWN signature motion (Airlines=radar sweep done; rest pending owner approval one-by-one). Landing page colors NOT touched without explicit approval.

## Memories
- [Pricing tiers](mem://features/pricing) — Plan features and limits for Basic/Standard/Premium
- [Industries](mem://features/industries) — 8 supported industry types and their configs
- [Owner credentials](mem://features/owner-credentials) — Owner login & Gmail notification config
- [Brand colors](mem://design/brand-colors) — HostFlow AI brand palette
- [Industry colors](mem://design/industry-colors) — Locked per-industry color palette
- [CRM architecture](mem://features/crm-architecture) — CRM module structure
- [Double-booking guard](mem://features/double-booking-guard) — Conflict detection system
- [Industry features](mem://features/industry-features) — Per-industry feature configs
- [Trial system](mem://features/trial-system) — Trial & subscription logic
- [Polar payment provider](mem://constraints/no-paddle-stripe-lemon) — Polar live via Replit; do not auto-integrate on Lovable side
- [Advisor architecture](mem://features/advisor-architecture) — platform-knowledge.ts → 8 industry advisors → Sherlock auto-import chain
- [Never-mix rules](mem://constraints/never-mix-rules) — Industry/sub-type/plan isolation rules
- [Replit backend contract](mem://features/replit-backend-contract) — JWT, plan enforcement, SSE advisor contract
- [No mock data](mem://constraints/no-mock-data) — Forbid hardcoded sample arrays in production UI
- [Sidebar header spacing](mem://design/sidebar-header-spacing) — Locked GhostSidebar header 72px + border-b + nav pt-2 separation
- [Sidebar locked](mem://design/sidebar-locked) — GhostSidebar premium dark glass is final across all 8 industries; landing industry cards stay consistent. Do not restyle without owner approval.
