---
name: Polar webhook secret + ANEXVOT AI PAY constitution
description: Supabase #2 = ANEXVOT AI PAY payment brain. Polar webhook secret is the ONE chokepoint for all future products (nexatect/hostflow, axonetis, ...). Deno-only, no Python, no WebSockets, no public API.
type: constraint
---

## Locked rules (Supabase #2 only)

- All Polar checkout + webhook logic lives ONLY on Supabase #2 (yinpfejochafukrwmkgg). Never recreate on Lovable Cloud (#1) or Axonetis (#3).
- `POLAR_WEBHOOK_SECRET` is the single most critical secret in the whole stack. Every future product (nexatect a.k.a. HostFlow AI, axonetis, and any new SaaS) routes through THIS one webhook. Rotating it = payment blackout across all products.
- `POLAR_ACCESS_TOKEN` — org token on Supabase #2 only. Never mirror to #1/#3.
- Runtime constitution: Deno (edge functions) + Rust (bridge) + Bun + TS. NO Python. NO WebSockets (WebTransport only). NO public REST API — Polar webhook is the only inbound.
- New product = add entry to `PRODUCTS` registry in polar-checkout + add `metadata.product` branch in Rust bridge. No new payment infra, ever.

## Supabase auth on Supabase #2 (JWT Signing Keys era)

`SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are DEPRECATED on Supabase #2. Edge functions must:

- Read `SUPABASE_PUBLISHABLE_KEYS` (JSON) instead of `SUPABASE_ANON_KEY`.
- Read `SUPABASE_SECRET_KEYS` (JSON) instead of `SUPABASE_SERVICE_ROLE_KEY`.
- Verify user JWTs against `SUPABASE_JWKS` (JWKS URL / JSON) — do NOT trust `sub` blindly.
- For anon-key calls (no real user), accept `role === "anon"` and skip `sub` requirement. Only require `sub` for `role === "authenticated"`.

## Curl smoke-test contract

`Authorization: Bearer <anon JWT>` against polar-checkout must return either a Polar checkout URL (if anon allowed) or a clean `authenticated user required` error — never `missing sub claim`. That error means the function is still using the old anon-key check.