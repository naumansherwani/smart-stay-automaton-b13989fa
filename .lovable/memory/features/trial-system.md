---
name: Trial system
description: 7-day trial locked in SQL handle_new_user, VIPs get lifetime premium
type: feature
---
# Trial & Subscription Logic

- **Default new user**: 7-day trial, plan='trial', status='trialing' (set in `public.handle_new_user()` trigger).
- **VIP emails** get lifetime premium + admin role:
  - `raanamasood1962@gmail.com` (display: "Mrs Raana Masood Sherwani")
  - `naumansherwani@hostflowai.net` (owner)
- Trial expiry: `trial_ends_at = now() + interval '7 days'`.
- After trial → user must subscribe to basic/pro/premium via Polar (sovereign brain).
