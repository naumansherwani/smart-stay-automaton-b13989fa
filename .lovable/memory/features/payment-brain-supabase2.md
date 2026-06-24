---
name: Payment Brain = Supabase #2 (ANEXVOT AI PAY)
description: All Polar/payment logic lives on Supabase #2. Lovable Cloud holds NO polar functions. Frontend calls Supabase #2 directly; Rust bridge syncs sub status back to Supabase #1 and #3.
type: feature
---

## Architecture (locked 2026-06-24)

- SUPABASE #1  NEXATECT operations (this Lovable project) — qsfmsjyorhicydtoiluk.supabase.co. Users, subscriptions table (read-only mirror updated by Rust bridge), CRM, bookings.
- SUPABASE #2  ANEXVOT AI PAY = PAYMENT BRAIN (single source of truth) — yinpfejochafukrwmkgg.supabase.co. ALL Polar edge functions live here: polar-checkout, polar-webhook. Endpoint: https://yinpfejochafukrwmkgg.supabase.co/functions/v1/polar-checkout
- SUPABASE #3  AXONETIS builder (founderbuilder.axonetis.com, future public Lovable-clone). Apna sub tiers, SAME payment brain (#2).
- RUST BRIDGE  Inter-Supabase sync. On Polar webhook, bridge updates subscriptions in #1 and/or #3 based on metadata.product.

## Rules

1. NEVER recreate polar-create-checkout or polar-webhook in Lovable Cloud — deleted 2026-06-24. Payment functions only on Supabase #2.
2. Frontend checkout: src/lib/api.ts → createPolarCheckoutViaCloud() → fetch(PAYMENT_BRAIN_URL) with user JWT from Supabase #1 session.
3. Checkout body MUST include `product: "nexatect"` (or `"axonetis"`) so Rust bridge routes the webhook to the right Supabase.
4. Subscription status read: frontend reads Supabase #1 `subscriptions` table (mirror). Never read Supabase #2 from frontend.
5. Multi-product growth: 3rd, 4th product = new `metadata.product` value. No new payment infra.
6. POLAR_ACCESS_TOKEN, POLAR_WEBHOOK_SECRET, signature verification — only on Supabase #2. Don't request in Lovable Cloud.

## Killed deliberately (do not bring back)

websockets, REST API server, Python workers, custom webhook receivers in Lovable Cloud. Polar's only inbound webhook = Supabase #2. Single chokepoint by design.

## If a future task says "fix Polar webhook" / "add payment function"

Stop. That work belongs on Supabase #2. Generate the code/SQL as a copy-paste block for the user's terminal (see copy-paste-handoff-workflow). Do not create files under supabase/functions/ in this project.
