---
name: pricing-currency
description: GBP is master/base currency. Public plans Basic £25, Pro £52, Premium £108. Switcher supports GBP/USD/EUR/CHF/KWD/PKR.
type: feature
---
- Master currency: GBP (£). All `useCurrency` rates relative to 1 GBP.
- Default for new visitors: GBP. Persisted in localStorage `preferred_currency`.
- Public pricing (GBP base): Basic 25, Pro 52, Premium 108 / month.
- `format(amount)` and `convert(amount)` treat the input as GBP.
- Supported currencies (CURRENCIES order): GBP, USD, EUR, CHF, KWD, PKR.
- Pricing surfaces showing the switcher: `src/pages/Pricing.tsx`, `src/components/landing/PricingSection.tsx`.
- Reusable component: `src/components/CurrencySwitcher.tsx`.
- Terms (`src/pages/Terms.tsx`) and FAQ reflect GBP. Billing processed in GBP.
- Earnings/Settings still use `useCurrency` — values stored as numbers are now interpreted as GBP for display.
