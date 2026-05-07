---
name: AI Email Center hands-off
description: Lovable must NOT touch AI Email Center backend/data/logic — Replit owns it. Lovable only does UI/UX on owner request.
type: constraint
---
Owner rule (May 2026): Lovable agent stays away from AI Email Center backend, data fetching, edge functions, and logic. Replit fully owns the email brain (inbox sync, AI replies, classification, send pipeline).

Lovable scope for AI Email Center = **UI/UX only, and only when owner explicitly asks**:
- Visual styling, layout, spacing, copy tweaks
- Component structure for presentation

**Why:** Owner directive — avoid Lovable/Replit conflicts on email system. Replit is source of truth.

**How to apply:** Do NOT modify owner-mailbox edge function, useOwnerMailbox hook data logic, REPLIT_INBOX_URL wiring, or any email send/receive logic unless owner explicitly requests it. If asked about email backend behavior, defer to Replit.
