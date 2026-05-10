# HostFlow AI — Backend API Brief for Lovable Frontend

**Production API Base:** `https://data-migration-master.replit.app`  
**All routes prefixed with:** `/api`  
**Auth:** `Authorization: Bearer <supabase_jwt>` on every protected route  
**Surface header:** `X-HostFlow-Surface: dashboard | crm` (required on gated routes)  
**Response envelope:** `{ ok: boolean, data: object|null, error: { code, message }|null, trace_id: string }`

Use `replitCall(path, body?)` from `src/lib/replitApi.ts` for all calls below.  
Use `invokeShim(name, { body })` for legacy shim aliases.

---

## SIDEBAR SECTION MAP

```
Overview              → /api/health + /api/v1/sync-manifest + /api/onboarding/status
AI Advisor            → /api/advisor/:industry
Revenue Intelligence  → /api/intelligence-reports/* + /api/revenue-reports/* + /api/benchmarks/:industry
AI Resolution Hub     → /api/resolution-hub/*
CRM
  Leads              → /api/advisor/:industry (CRM surface)
  Customers          → /api/health-scores/* + /api/benchmarks/:industry
  Bookings           → /api/bookings/*
  Pipeline           → /api/signals/* + /api/advisor/:industry
  Tasks              → /api/calendar/suggest + /api/calendar/slots
Analytics             → /api/health-scores/me + /api/benchmarks/:industry + /api/revenue-reports/summary
Automations           → /api/v1/stream + /api/v1/push + /api/founder/adviser
Integrations          → /api/profile/ota-connections/* + /api/whatsapp/*
Billing               → /api/payments/*
Settings              → /api/profile/me + /api/onboarding/questions/:industry + /api/voice/config
```

---

## 1. OVERVIEW PAGE

### Health Check
```
GET /api/health
Auth: none
Returns: { status: "ok", timestamp, version, region }
```

### Onboarding Status
```
GET /api/onboarding/status
Auth: required | Surface: dashboard
Returns: { completed: boolean, industry, answers_count, questions_total }
```

### Brain Sync Manifest (SSE connection status)
```
GET /api/v1/sync-manifest/status
Auth: none
Returns: { connected_clients, last_push_at, version }
```

### Profile
```
GET /api/profile/me
Auth: required
Returns: { user_id, industry, business_subtype, plan, onboarding_completed, created_at }

POST /api/profile/sync
Auth: required
Body: { industry: string, business_subtype?: string }
Use: Call after onboarding completes. Enables industry isolation middleware.

PATCH /api/profile/me
Auth: required
Body: { plan?, onboarding_completed?: boolean }
```

---

## 2. AI ADVISOR PAGE

### OFFICIAL ADVISOR ROSTER — LOCKED BY FOUNDER (DO NOT CHANGE IN UI)

| Industry | Advisor Name | Full C-Suite Designation | Email |
|---|---|---|---|
| hospitality | **Aria** | AI Advisor & Executive Revenue & Operations Director — Travel, Tourism & Hospitality Division | aria@hostflowai.net |
| airlines | **Captain Orion** | AI Advisor & AI Flight Operations & Compliance Director — Airlines & Aviation Division | orion@hostflowai.net |
| car_rental | **Rex** | AI Advisor & AI Fleet Revenue & Operations Director — Car Rental Division | rex@hostflowai.net |
| healthcare | **Dr. Lyra** | AI Advisor & AI Clinical Operations & Patient Experience Director — Healthcare & Clinics Division | lyra@hostflowai.net |
| education | **Professor Sage** | Chief Academic Intelligence & Growth Director — Education & Training Division | sage@hostflowai.net |
| logistics | **Atlas** | Global Supply-Chain Commander & Fleet Sovereign — Logistics & Mobility Infrastructure Division | atlas@hostflowai.net |
| events_entertainment | **Vega** | Chief Experience Architect & Global Production Sovereign — Events & Entertainment Division | vega@hostflowai.net |
| railways | **Conductor Kai** | Chief Kinetic Officer & Global Rail Sovereign — Railways & Transit Infrastructure Division | kai@hostflowai.net |
| owner | **Sherlock** | Head AI Advisor — Owner & Founder Advisor | sherlock@hostflowai.net |

**UI Rule:** Always show both name AND designation together. Example: `"Captain Orion — AI Flight Operations & Compliance Director"`

**Advisor Personality / Vibe (for UI tone/avatar selection):**
- Aria — Warm, welcoming host. Makes every guest feel valued.
- Captain Orion — Calm, authoritative. Inspires confidence like a senior pilot.
- Rex — Confident, road-ready. Direct and gets things done fast.
- Dr. Lyra — Caring, professional. Patient-first approach, precise.
- Professor Sage — Patient, knowledgeable. Explains clearly, never condescending.
- Atlas — Reliable, no-nonsense. Precision and efficiency above all.
- Vega — Energetic, charismatic. Makes every event feel like a headline show.
- Conductor Kai — Steady, dependable. Every journey on track, no exceptions.
- Sherlock — Authoritative, analytical. Resolves what no one else can.

**Escalation chain (show in UI):** User → Industry Advisor → Sherlock → Founder

---

### Industry Advisor Chat (ALL 8 industries)
```
POST /api/advisor/:industry
Auth: required | Surface: dashboard | Plan: all | AI limit: advisor.chat (daily/hourly)
Industry values: hospitality | airlines | car_rental | healthcare | education | logistics | events_entertainment | railways

Body:
{
  message: string,           // user message
  session_id?: string,       // for conversation continuity
  industry?: string          // optional override (server reads from DB)
}

Returns:
{
  reply: string,             // advisor's response
  advisor_name: string,      // Aria / Captain Orion / Rex / Dr. Lyra / Professor Sage / Atlas / Vega / Conductor Kai
  session_id: string,
  memory_stored: boolean,
  issue_detected: boolean,   // true if Resolution Hub issue was auto-created
  issue_id?: number,
  usage: { used_today, limit_daily, used_hour, limit_hourly }
}

invokeShim alias: "crm-ai-assistant" | "crm-daily-planner" | "crm-performance-report"
→ These all call callAdvisor(body.industry, body)
```

### Escalate to Sherlock
```
POST /api/advisor/escalate
Auth: required
Body: { issue_id: number, reason?: string }
Returns: { escalated: boolean, sherlock_notified: boolean }
```

### Industry List
```
GET /api/advisor/industries
Auth: none
Returns: { industries: ["hospitality","airlines","car_rental","healthcare","education","logistics","events_entertainment","railways"] }
```

### Owner / Founder Advisor (Sherlock)
```
POST /api/founder/adviser    ← use this path
POST /api/owner/advisor      ← alias (same handler)
Auth: required | Plan: all (no surface gate)

Body: { message: string }

Returns:
{
  reply: string,
  session_id: string,
  memory_stored: boolean,
  business_snapshot: {
    total_subs, active_subs, trial, basic, pro, premium,
    mrr_estimate_gbp, db_size_kb, total_events,
    conversation_count, max_conversations: 50000
  }
}

invokeShim alias: "founder-adviser"
```

---

## 3. REVENUE INTELLIGENCE PAGE

### Intelligence Reports (AI-generated monthly ROI — 10 sections)
```
GET /api/intelligence-reports/latest
Auth: required
Returns: latest report object with sections: executive_summary, mrr_analysis,
         churn_analysis, product_performance, ai_resolution_metrics,
         benchmark_comparison, growth_forecast, action_items, roi_summary, raw_data

GET /api/intelligence-reports
Auth: required
Query: ?page=1&pageSize=10
Returns: { reports: [...], pagination: { page, pageSize, total, pages } }

GET /api/intelligence-reports/:id
Auth: required
Returns: single report object

POST /api/intelligence-reports/generate
Auth: required
Body: { force?: boolean }
Returns: { report_id, generated: boolean, sections_count: 10 }

POST /api/intelligence-reports/:id/email
Auth: required
Body: { email?: string }
Returns: { sent: boolean, to: string }

invokeShim aliases: "founder-intelligence" | "mrr-ai-insights"
→ GET /api/intelligence-reports/latest
```

### Revenue Reports (Founder's monthly revenue summaries)
```
GET /api/revenue-reports/summary
Auth: required
Returns: { total_revenue, mrr, arr, growth_pct, top_industry, churn_rate }

GET /api/revenue-reports
Auth: required
Query: ?page=1&pageSize=12
Returns: { reports: [...], pagination }

POST /api/revenue-reports
Auth: required
Body: { month?: string, force_regenerate?: boolean }
Returns: { report_id, month, status: "generated" }

GET /api/revenue-reports/:id
Auth: required
Returns: single monthly report with all revenue breakdowns

POST /api/revenue-reports/send-monthly
Auth: required (Founder only in practice)
Body: { month?: string }
Returns: { sent: boolean, email_to: string }

POST /api/revenue-reports/:id/reanalyze
Auth: required
Returns: { reanalyzed: boolean, report_id }
```

### Industry Benchmarks (Anonymised — min 3 users per industry)
```
GET /api/benchmarks/:industry
Auth: required | Surface: dashboard
Industry: same 8 values as advisor

Returns:
{
  industry,
  user_score: number,           // this user's percentile
  avg_score: number,            // industry average
  top_quartile: number,         // top 25%
  metrics: { engagement, issue_rate, subscription_tier, usage_intensity },
  sample_size: number,          // min 3 for privacy
  user_rank: "top_10" | "above_avg" | "average" | "below_avg"
}

POST /api/benchmarks/recalculate
Auth: required
Body: { industry?: string }
Returns: { recalculated: boolean, industries_updated: number }

GET /api/benchmarks/
Auth: required
Returns: all industries benchmarks array

invokeShim alias: replitCall("/benchmarks/:industry", undefined, { method: "GET" })
```

---

## 4. AI RESOLUTION HUB PAGE

### User's Active Issues (poll every 15s)
```
GET /api/resolution-hub/issues/active
Auth: required
Returns:
{
  issues: [
    {
      id: number,
      status: "active" | "monitoring" | "sherlock_active" | "resolved" | "failed",
      issue_type: "normal" | "critical",
      issue_summary: string,
      advisor_name: string,
      industry: string,
      revenue_risk_level: "low" | "medium" | "high" | "critical",
      revenue_at_risk_amount: string | null,    // e.g. "1200.00"
      revenue_at_risk_currency: string,         // "GBP"
      sla_ms_target: number,                    // 120000 (normal) | 240000 (critical)
      stages: [{ stage, timestamp, message }],
      escalated_to_sherlock: boolean,
      created_at: string,                       // use for countdown: created_at + sla_ms_target
      resolved_at: string | null,
      elapsed_ms: number | null
    }
  ],
  count: number
}
```

### Issue History (paginated)
```
GET /api/resolution-hub/issues
Auth: required
Query: ?page=1&pageSize=20
Returns: { issues: [...], pagination: { page, pageSize, total, pages } }
```

### Single Issue Detail
```
GET /api/resolution-hub/issues/:id
Auth: required
Returns: { issue: { ...full issue object } }
```

### Customer Stats (summary card)
```
GET /api/resolution-hub/customer-stats
Auth: required
Returns:
{
  total_issues: number,
  resolved_successfully: number,
  failed_or_escalated: number,
  sherlock_escalations: number,
  critical_issues: number,
  ai_resolution_rate: number,       // 0-100 percentage
  avg_resolution_mins: string,      // e.g. "4.2"
  total_revenue_protected: string   // e.g. "8400.00"
}
```

### Manually Resolve Issue
```
PATCH /api/resolution-hub/issues/:id/resolve
Auth: required (own issues only; Founder can resolve any)
Body: { resolution_note?: string, revenue_protected?: number }
Returns: { id, status: "resolved", elapsed_ms, email_sent: boolean }
Side effects: sends resolved@ email to user, notifies Founder if high/critical risk
```

### Founder Admin View (all users, all industries)
```
GET /api/resolution-hub/admin/live
Auth: required | Founder account only
Returns:
{
  active_issues: [...],   // ordered by revenue_risk_level DESC
  summary: {
    total_active, sherlock_active_count, critical_risk_count,
    total_today, resolved_today
  }
}
```

---

## 5. CRM SECTION

### CRM Advisor Calls (Premium only via X-HostFlow-Surface: crm)
All advisor calls with `X-HostFlow-Surface: crm` require Premium plan.
Non-premium gets 403 `CRM_PREMIUM_ONLY`.

### Leads / Contacts → Advisor intelligence
```
POST /api/advisor/:industry
Surface: crm | Plan: Premium
Body: { message: "Analyse my lead pipeline for [industry]", session_id? }
Returns advisor's analysis as reply string
```

### Customers → Health Scores
```
GET /api/health-scores/me
Auth: required | Surface: dashboard
Returns:
{
  score: number,                // 0-100
  churn_risk: "low" | "medium" | "high" | "critical",
  components: {
    engagement: number,         // 30% weight
    issues: number,             // 25% weight
    subscription: number,       // 20% weight
    usage: number               // 25% weight
  },
  revenue_at_risk: string,      // estimated £ value
  last_calculated_at: string,
  trend: "improving" | "stable" | "declining"
}

GET /api/health-scores/admin
Auth: required | Founder only
Returns: all users' health scores with pagination

GET /api/health-scores/admin/critical
Auth: required | Founder only
Returns: users with churn_risk = "high" | "critical", ordered by revenue_at_risk DESC

invokeShim aliases:
  "churn-risk-score"  → GET /api/health-scores/admin
  "retention-action"  → GET /api/health-scores/admin/critical
```

### Bookings (Double Booking Guard included)
```
POST /api/bookings
Auth: required | Surface: dashboard
Body:
{
  resource_id: string,
  resource_type: string,           // room | vehicle | aircraft | doctor | classroom | train | coach | event_venue | tour_package
  start_time: string,              // ISO 8601
  end_time: string,
  guest_name?: string,
  guest_email?: string,
  guest_count?: number,
  metadata?: object,               // industry-specific fields
  idempotency_key?: string         // header: Idempotency-Key
}
Returns: { booking: {...}, conflict_checked: true }
409 DOUBLE_BOOKING_CONFLICT if overlap detected

GET /api/bookings
Auth: required | Surface: dashboard
Query: ?resource_id=&resource_type=&status=&page=1&pageSize=20
Returns: { bookings: [...], pagination }

GET /api/bookings/:id
Auth: required | Surface: dashboard
Returns: { booking: {...} }

PATCH /api/bookings/:id/status
Auth: required | Surface: dashboard
Body: { status: "confirmed" | "cancelled" | "no_show" | "checked_in" | "checked_out" }
Returns: { id, status, updated_at }

POST /api/bookings/conflict-check
Auth: required | Surface: dashboard
Body: { resource_id, resource_type, start_time, end_time, exclude_booking_id? }
Returns: { has_conflict: boolean, conflicting_bookings?: [...] }

GET /api/bookings/conflicts/active
Auth: required | Surface: dashboard
Returns: { conflicts: [...] }

invokeShim alias: "validate-booking" → POST /api/bookings
```

### Pipeline → Cross-Industry Signals
```
GET /api/signals
Auth: required
Returns: { signals: [...], count }

GET /api/signals/p0
Auth: required
Returns: P0/critical signals only — immediate action required

POST /api/signals/detect
Auth: required
Body: { force?: boolean }
Returns: { detected: number, p0_count: number, signals: [...] }

PATCH /api/signals/:id/act
Auth: required
Body: { action: string, notes?: string }
Returns: { id, acted: boolean }

invokeShim alias: "arc-orchestrator" → POST /api/signals/detect
```

### Tasks → AI Calendar
```
POST /api/calendar/suggest
Auth: required | Surface: dashboard | AI limit: calendar.ai (monthly)
Body:
{
  industry: string,
  date_range: { start: string, end: string },
  current_bookings?: [...],
  preferences?: { work_start?: string, work_end?: string, buffer_mins?: number }
}
Returns:
{
  suggestions: [{ slot_type, start_time, end_time, priority, rationale }],
  gaps_identified: number,
  urgent_alerts: string[],
  ai_confidence: number
}

GET /api/calendar/slots
Auth: required | Surface: dashboard
Query: ?start_date=&end_date=&resource_id=&resource_type=
Returns: { slots: [{ time, status: "available"|"booked", booking_id? }] }

invokeShim alias: "ai-auto-schedule" → POST /api/calendar/suggest
```

---

## 6. ANALYTICS PAGE

### Customer Health Summary
```
GET /api/health-scores/me            ← user's own score
GET /api/health-scores/admin         ← Founder: all users (paginated)
GET /api/health-scores/admin/critical ← Founder: at-risk users
```

### Industry Benchmarks (for analytics comparison)
```
GET /api/benchmarks/:industry        ← user vs industry average
POST /api/benchmarks/recalculate     ← force recalculation
```

### Revenue Summary
```
GET /api/revenue-reports/summary     ← MRR, ARR, growth, churn rate
```

---

## 7. AUTOMATIONS PAGE

### Real-time SSE Stream (Live Brain connection)
```
GET /api/v1/stream
Auth: none (but pass client_id query param)
Query: ?client_id=lovable-main
Content-Type: text/event-stream

Events pushed:
  - lovable_deployed: { hash, deploy_count }    ← Lovable site changed
  - sync_manifest: { industry, ui_flags, ... }  ← UI flag updates
  - sherlock_alert: { message, priority }        ← P0 alerts
  - health_check: { status, timestamp }

Use replitStream() from replitApi.ts for SSE consumption.

POST /api/v1/push
Auth: none (internal use)
Body: { event: string, data: object, client_id?: string }

GET /api/v1/stream/status
Returns: { connected_clients: number, uptime_ms: number }
```

### Sync Manifest (UI flags sync)
```
POST /api/v1/sync-manifest
Auth: none
Body: { industry, page, session_id, ui_flags?: object }
Returns: { accepted: boolean, ui_flags: object, server_version: string }

GET /api/v1/sync-manifest/status
Returns: { connected_clients, last_push_at, version }

invokeShim alias: "arc-event-ingest" → POST /api/v1/sync-manifest
```

### AI Smart Pricing (Dashboard automation — 5 industries only)
```
POST /api/pricing/suggest
Auth: required | Surface: dashboard | AI limit: pricing.ai (monthly)
Industries: hospitality | airlines | car_rental | events_entertainment | railways
BLOCKED for: healthcare | education | logistics → 403 PRICING_NOT_AVAILABLE

Body:
{
  industry: string,
  current_price: number,
  currency?: string,               // default GBP
  occupancy_rate?: number,         // 0-100
  competitor_prices?: number[],
  season?: "peak" | "off_peak" | "shoulder",
  demand_signal?: string
}

Returns:
{
  suggested_price: number,
  confidence: number,              // 0-1
  rationale: string,
  price_range: { min, max },
  revenue_impact_estimate: string
}

GET /api/pricing/history
Auth: required | Surface: dashboard
Returns: { history: [...], count }

invokeShim alias: "ai-smart-pricing" → POST /api/pricing/suggest
```

---

## 8. INTEGRATIONS PAGE

### OTA Connections (Hospitality: Booking.com, Airbnb, Expedia)
```
GET /api/profile/ota-connections
Auth: required
Returns: { channels: [{ channel, status, connected_at, last_sync }] }

POST /api/profile/ota-connections
Auth: required
Body: { channel: "booking_com" | "airbnb" | "expedia" | "tripadvisor", api_key: string }
Returns: { connected: boolean, channel }

GET /api/profile/ota-connections/channels
Auth: required
Returns: { available_channels: [...], connected_channels: [...] }

PATCH /api/profile/ota-connections/:channel
Auth: required
Body: { api_key?: string, active?: boolean }
Returns: { updated: boolean }
```

### WhatsApp Integration
```
GET /api/whatsapp/status
Auth: required
Returns: { connected: boolean, phone_number?, status }

POST /api/whatsapp/connect
Auth: required
Body: { phone_number: string, otp?: string }
Returns: { otp_sent: boolean } or { connected: boolean }

GET /api/whatsapp/webhook  — Meta verification (GET)
POST /api/whatsapp/webhook — Incoming message handler

GET /api/whatsapp/users
Auth: required (Founder)
Returns: { users: [...] }
```

### Email (CRM Composer & Contact Form)
```
POST /api/email/send
Auth: required
Body: { to: string, subject: string, html?: string, text?: string, identity?: "owner"|"resolved" }
Returns: { sent: boolean, message_id }

GET /api/email/inbox
Auth: required
Returns: { emails: [...], count }

GET /api/email/inbox/stream
Auth: required (SSE)
Content-Type: text/event-stream — live email push

PATCH /api/email/inbox/:id/read
Auth: required
Returns: { id, read: true }

POST /api/email/contact
Auth: none (public)
Body: { name, email, message, subject? }
Returns: { sent: boolean }
Side effect: email sent to naumansherwani@hostflowai.net + naumankhansherwani@gmail.com

invokeShim aliases:
  "owner-email-ai"  → POST /api/email/send
  "owner-mailbox"   → GET /api/email/inbox
  "contact-form"    → POST /api/email/contact
```

### Voice (ElevenLabs)
```
GET /api/voice/welcome
Auth: none
Query: ?industry=&advisor_name=
Returns: audio/mpeg stream — advisor welcome audio

POST /api/voice/speak
Auth: none
Body: { text: string, voice_id?: string }
Returns: audio/mpeg stream

GET /api/voice/config
Auth: none
Returns: { available_voices: [...], default_voice_id }
```

---

## 9. BILLING PAGE

### Subscription & Plans
```
GET /api/payments/products
Auth: none
Returns:
{
  products: [
    { plan: "trial", price_gbp: 0, limits: { advisor_daily: 10 } },
    { plan: "basic",   price_gbp: 25, launch_price: 22,   limits: { advisor_daily: 50 } },
    { plan: "pro",     price_gbp: 52, launch_price: 44.20, limits: { advisor_daily: 200 } },
    { plan: "premium", price_gbp: 108, launch_price: 86.40, limits: { advisor_daily: -1 } }
  ],
  launch_pricing_ends: "2026-07-30"
}

GET /api/payments/me
Auth: required
Returns: { plan, status, polar_subscription_id, current_period_end, cancel_at_period_end }

POST /api/payments/checkout
Auth: required
Body: { plan: "basic" | "pro" | "premium", success_url?: string, cancel_url?: string }
Returns: { checkout_url: string }   ← redirect user here

DELETE /api/payments/cancel
Auth: required
Returns: { cancelled: boolean, effective_date: string }

GET /api/subscription/me
Auth: required
Returns: { plan, status, industry, onboarding_completed }
```

### Plan Limits
```
GET /api/plan/limits
Auth: required
Returns: { plan, limits: { advisor_chat_daily, advisor_chat_hourly, pricing_ai_monthly, calendar_ai_monthly, ... } }

GET /api/plan/me
Auth: required
Returns: { plan, used_today, used_hour, limits }
```

---

## 10. SETTINGS PAGE

### Profile & Industry
```
GET /api/profile/me          ← fetch current settings
PATCH /api/profile/me        ← update plan/onboarding flag
POST /api/profile/sync       ← sync industry (call after industry change)
```

### AI Onboarding (5-question wizard)
```
GET /api/onboarding/status
Auth: required | Surface: dashboard
Returns: { completed: boolean, industry, answers_count, questions_total: 5 }

GET /api/onboarding/questions/:industry
Auth: required | Surface: dashboard
Returns: { questions: [{ id, question, options?, type: "text"|"choice" }] }

POST /api/onboarding/answer
Auth: required | Surface: dashboard
Body: { industry: string, question_id: string, answer: string }
Returns: { saved: boolean, completed: boolean, next_question_id?: string }

invokeShim alias: "ai-onboarding-guide" → POST /api/onboarding/answer
```

### Resource Registry
```
POST /api/resources
Auth: required | Surface: dashboard
Body: { name, type, industry, metadata?: object, status?: "available"|"maintenance"|"unavailable" }
Returns: { resource: { id, name, type, status, created_at } }

GET /api/resources
Auth: required | Surface: dashboard
Query: ?type=&status=&page=1
Returns: { resources: [...], pagination }

PATCH /api/resources/:id
Auth: required | Surface: dashboard
Body: { name?, metadata?, status? }

PATCH /api/resources/:id/status
Auth: required | Surface: dashboard
Body: { status: "available" | "maintenance" | "unavailable" }

GET /api/resources/fleet/summary
Auth: required | Surface: dashboard
Returns: { total, available, maintenance, unavailable, by_type: {...} }

GET /api/resources/availability
Auth: required | Surface: dashboard
Query: ?start_time=&end_time=&type=
Returns: { available: [...], unavailable: [...] }
```

---

## SURFACE GATE RULES

| Header Value | Who | What routes |
|---|---|---|
| `X-HostFlow-Surface: dashboard` | All plans | Advisor, Bookings, Resources, Pricing, Calendar, Health-Scores/me, Benchmarks, Onboarding |
| `X-HostFlow-Surface: crm` | **Premium only** | Same routes but in CRM context — 403 for non-premium |
| *(missing header)* | Fail-open | Logs warning, allows through |

```typescript
// Add to every call from CRM section:
headers: { "X-HostFlow-Surface": "crm" }

// Add to every call from Dashboard section:
headers: { "X-HostFlow-Surface": "dashboard" }
```

---

## PLAN LIMITS AT A GLANCE

| Feature | Trial | Basic | Pro | Premium |
|---|---|---|---|---|
| AI Advisor (daily) | 10 | 50 | 200 | Unlimited |
| AI Advisor (hourly) | 3 | 10 | 50 | Unlimited |
| AI Pricing (monthly) | 0 | 100 | 500 | Unlimited |
| AI Calendar (monthly) | 5 | 50 | 200 | Unlimited |
| CRM Surface | ❌ | ❌ | ❌ | ✅ |
| Resolution Hub | ✅ | ✅ | ✅ | ✅ |
| Health Score | ✅ | ✅ | ✅ | ✅ |
| Benchmarks | ✅ | ✅ | ✅ | ✅ |

---

## ERROR CODES REFERENCE

| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Invalid/missing JWT |
| `FORBIDDEN` | 403 | Plan/surface/industry mismatch |
| `CRM_PREMIUM_ONLY` | 403 | CRM surface requires Premium |
| `SURFACE_MISMATCH` | 403 | Wrong X-HostFlow-Surface value |
| `INDUSTRY_MISMATCH` | 403 | User's DB industry ≠ route industry |
| `PRICING_NOT_AVAILABLE` | 403 | Healthcare/education/logistics pricing blocked |
| `DOUBLE_BOOKING_CONFLICT` | 409 | Overlapping booking detected |
| `AI_LIMIT_REACHED` | 429 | Daily/hourly/monthly AI cap hit |
| `ALREADY_RESOLVED` | 409 | Issue already in resolved state |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Missing/invalid request fields |

---

## HOW TO ADD A NEW BACKEND CALL IN LOVABLE

1. **Add to `invokeShim`** in `src/lib/replitApi.ts` (if it's a legacy migration)  
   OR call `replitCall(path, body)` directly for new calls.

2. **Set the surface header** via the fetch `headers` option:
   ```typescript
   import { replitCall } from "@/lib/replitApi";
   const { data, error } = await replitCall("/resolution-hub/issues/active");
   ```

3. **For SSE streams** use `replitStream(path, body)`:
   ```typescript
   import { replitStream } from "@/lib/replitApi";
   for await (const { event, data } of replitStream("/advisor/hospitality", { message })) {
     // handle streamed tokens
   }
   ```

4. **Check plan gates** before showing features — `GET /api/payments/me` → `plan` field.

---

*Last updated: May 2026 by Tiger (Replit Agent)*  
*Production URL: https://data-migration-master.replit.app*  
*Source of truth for all AI features: `artifacts/api-server/src/lib/platform-knowledge.ts`*
