---
name: Resolution Hub flow (LOCKED)
description: Exact 6-stage pipeline every Resolution Hub issue follows. Frontend must always render these stages in this order.
type: feature
---
LOCKED stage order — system works exactly this way:

1. Customer message received
2. Aria analyzed issue
3. Resolution Hub issue created
4. Sherlock reviewed
5. Pricing updated
6. Revenue protected

Rules:
- Frontend is dumb UI — only renders backend stages in this order. Never rename, reorder, merge, or remove.
- Stage labels must match exactly (case + wording).
- Aria is the advisor for hospitality; for other industries swap advisor name (Captain Orion, Rex, Dr. Lyra, Professor Sage, Atlas, Vega, Conductor Kai) but keep the 6-step shape.
- Sherlock auto-jumps in via backend when SLA expires (2min normal / 4min critical). Never call escalate from frontend.
- "Pricing updated" only applies to pricing-enabled industries (hospitality, airlines, car_rental, events_entertainment, railways). For non-pricing industries this stage shows the corrective action taken instead, but stage count stays 6.
- "Revenue protected" is the terminal resolved state — show emerald/green + amount from backend.
- Applies to: src/components/dashboard/ResolutionHub.tsx STEPS array, src/pages/ResolutionHubPage.tsx stages timeline, and any ticket detail drawer.