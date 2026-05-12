---
name: Sidebar header spacing locked
description: GhostSidebar header has fixed 72px height, border-bottom, and clear separation from nav. Do not change.
type: design
---
GhostSidebar header layout is LOCKED across all 8 industries:
- Header: min-h-[72px], px-2 py-4, mb-4 (collapsed: h-[72px] mb-2), border-b border-white/[0.06]
- Nav container: pt-2 for clear separation from header
- "Overview" and other nav items must NOT overlap branding area
- Applies to every user, every industry, every dashboard route (single shared component)
- Do NOT modify header height, padding, border, or nav top spacing without explicit owner approval
