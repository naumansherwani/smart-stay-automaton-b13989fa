---
name: Floating Advisor Chat Engine (v2 — Neural Cockpit)
description: Global ChatGPT-class floating chat. Real SSE streaming, no mocks. Per-industry config (Hospitality fully wired first). Replit contract in /mnt/documents/REPLIT_ADVISOR_CONTRACT.md.
type: feature
---
# Floating Advisor Chat (v2)

Mounted once in App.tsx via <FloatingAdvisorChatProvider>. Per (user, industry) → one thread in advisor_threads, lazy-paginated 50-at-a-time from advisor_messages.

## Real (no mock) features shipped
- SSE streaming via replitStream(`/advisor/:industry/stream`). On error: surfaces real error in bubble (no fake reply).
- Stop button (AbortController) replaces Send while streaming.
- Regenerate (drops last assistant, re-runs last user msg).
- Edit last user message (loads back into draft, drops messages after it).
- Copy per assistant message; per-message ElevenLabs speaker (ChatSpeakerButton).
- Mic input → POST audio blob to `/voice/transcribe` (Replit/ElevenLabs Scribe). Text drops into draft.
- Drag-drop + paperclip attachments → Lovable Cloud storage bucket `advisor-attachments` (private, user/thread scoped). Saved on `advisor_messages.attachments`.
- Markdown rendering (react-markdown + remark-gfm) — tables, code blocks, lists.
- Tool execution accordions (`tool_events`): icon-prefixed labels, expand for raw input/output, inline [Apply] [Modify] [Skip] buttons. Apply POSTs to event.endpoint.
- Animated gradient aura ring while streaming, color from `advisorConfig.auraHsl`.
- Sherlock shadow status line (gray/gold/red/green) driven by `event: sherlock`.
- Live metric badges (Occupancy / ADR / RevPAR for hospitality) — fetch from Replit GET endpoints; hide silently if not wired.
- Channel chips (Booking.com / Airbnb for hospitality).
- Industry-specific tool panel buttons + starter prompts (Hospitality fully populated; others empty until owner expands industry-by-industry).
- Mac-style red/amber/green window controls. closed | open | minimized | maximized. State persisted.

## Industry isolation
`activeWorkspace.industry` is the only source of truth. Industry change → thread auto-reset. Per-industry config lives in `src/components/advisor/advisorConfig.ts` (AdvisorConfig with starterPrompts, placeholder, toolPanels, metricBadges, channels, auraHsl).
Hospitality (Aria) is the first fully-wired industry. Other 7 use the same engine; their extras arrays are empty — fill them out one industry at a time.

## Backend (Replit) contract
Full spec in `/mnt/documents/REPLIT_ADVISOR_CONTRACT.md` (downloadable). Endpoints:
- POST /advisor/:industry/stream (SSE: token | tool_event | sherlock | done | error)
- POST /advisor/:industry/action (one per tool_event.actions[].endpoint)
- GET  /metrics/hospitality/{occupancy,adr,revpar}
- POST /voice/transcribe (multipart audio)
- POST /voice/speak (existing, MP3)
