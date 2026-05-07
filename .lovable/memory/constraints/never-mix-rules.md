---
name: Never-Mix Rules (Strict)
description: 6 server-side enforcement rules to prevent industry/plan/sub-type data leakage. Source of truth for both Lovable and Replit.
type: constraint
---
Strict server-side rules. Frontend hide is NOT enough — backend MUST filter at query level.

1. Never blend hospitality sub-types. hotel_property data ≠ travel_tours data. Always filter by profiles.business_subtype.
2. Never show pricing widgets to healthcare / education / logistics users.
3. Never show CRM to non-Premium users (gate via subscriptions.plan = 'premium').
4. Never show industry features outside that industry (no Gap Filler in airlines, etc.).
5. AI Ticket Generator/Email only for airlines, railways, events_entertainment.
6. Always count usage against plan_feature_limits BEFORE serving AI calls. Block with 429 + { error, upgrade_to } if exceeded.

**Why:** Any deviation = data leak risk. When in doubt, reject and log.
**How to apply:** Both Lovable edge functions and Replit /api/* endpoints must enforce. Never bypass RLS with service role for user-facing endpoints.
