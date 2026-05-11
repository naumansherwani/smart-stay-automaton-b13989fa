---
name: Resolution Hub Live Problem Solving
description: Future spec for AI Resolution Hub — tool calling, live execution, actionable buttons. NOT yet implemented.
type: feature
---
# AI Resolution Hub — Live Problem Solving (Future)

Scope: **AI Resolution Hub only** (NOT AI Advisor floating chat — that is a separate feature).

When implementing, the Resolution Hub advisor must not just talk — it must act:

1. **Tool calling enabled**: advisor can query user's data (bookings, revenue, occupancy, conflicts, pricing, etc.) via Lovable AI Gateway tools or Replit tool endpoints.
2. **Show tool execution in chat** as a collapsed accordion:
   - Example: `🔍 Checked occupancy for Nov 11–15… 67%`
   - User can expand to see raw tool input/output.
3. **Actionable suggestions** rendered as inline buttons:
   - Example: "Should I lower rate by 8%?" → `[Apply] [Modify] [Skip]`
   - `Apply` triggers a backend write action (with confirmation for destructive ops).
4. **Live error/conflict resolution**:
   - If booking conflict detected, advisor automatically proposes a resolution path (move, refund, alt-resource) with one-click apply.

Owner confirmed: do NOT implement until explicitly asked. Noted May 2026.
