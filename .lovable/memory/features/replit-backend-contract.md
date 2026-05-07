---
name: Replit Backend Contract
description: API contract Replit must follow — auth, plan enforcement, industry isolation, SSE advisor format.
type: feature
---
**Auth:** JWT bearer via Supabase. Server validates with auth.getUser(token). Never bypass RLS with service role for user endpoints.

**Plan enforcement (every limited feature):**
1. Read subscriptions.plan
2. Read plan_feature_limits WHERE plan + feature_key
3. Read feature_usage WHERE user_id + feature_key
4. is_unlimited=true → ALLOW
5. usage >= limit → 429 { error: "AI_LIMIT_REACHED", upgrade_to }
6. Else ALLOW + atomic increment
Daily reset 00:00 UTC. Monthly reset 1st UTC.

**Industry isolation:** Read profiles.industry + profiles.business_subtype on EVERY request. 403 on mismatch.

**Hospitality sub-type strict:**
- hotel_property → only rooms/occupancy/RevPAR/gap-night. NEVER tours.
- travel_tours → only packages/travelers/itineraries. NEVER rooms/RevPAR.

**SSE advisor (POST /api/advisor/:industry):** events = start | chunk | done | escalation | error. Validate :industry vs profiles.industry.

**Response envelope:** { ok, data, error: { code, message }, trace_id }
