---
name: Industry isolation locked (never-mix)
description: 8 industries are fully isolated. No data, UI, or context bleed between them. Single source of truth = activeWorkspace.industry.
type: constraint
---
# Industry Isolation — LOCKED RULE

**Never mix industries. Ever.** Each of the 8 industries is a fully isolated world:
hospitality, airlines, car_rental, healthcare, education, logistics, events_entertainment, railways.

## Single Source of Truth
- `activeWorkspace.industry` (from `useWorkspaces`) is the ONLY authoritative industry value.
- `profile.industry` MUST always match `activeWorkspace.industry`. Any switch updates BOTH atomically (`useWorkspaces.switchWorkspace` does this).
- Header chip, sidebar, dashboards, advisors, AI prompts, API calls, CRM queries, pricing engines — all read from `activeWorkspace.industry` (with `profile.industry` as fallback only).

## Forbidden
- Showing two different industries on the same screen at the same time (header says Airlines, slide-panel says Car Rental → BUG).
- Any feature visible in a non-supported industry: pricing UI in healthcare/education/logistics; ticket generator outside airlines/railways/events.
- Sharing data tables across industries without an `industry` filter column applied to every query.
- Auto-falling back to "hospitality" when the active industry doesn't have a feature — hide the feature instead.

## Subdomain plan (locked direction, May 2026)
Public-facing isolation will be reinforced via per-industry subdomains:
- `airlines.hostflowai.net`, `hospitality.hostflowai.net`, `car-rental.hostflowai.net`, `healthcare.hostflowai.net`, `education.hostflowai.net`, `logistics.hostflowai.net`, `events.hostflowai.net`, `railways.hostflowai.net`
- Each subdomain auto-pins the industry on signup/login/landing/dashboard. User cannot accidentally land in another industry's world from a subdomain.
- Root `hostflowai.net` remains the multi-industry chooser landing.

## Implementation guard
Before any commit touching industry rendering, ask: "Could this leak another industry's data, label, or UI here?" If yes, block on a `currentIndustry` check from `activeWorkspace`.