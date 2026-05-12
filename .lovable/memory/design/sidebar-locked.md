---
name: Sidebar design LOCKED
description: GhostSidebar premium dark glass design is locked across all 8 industries. Do not restyle without explicit owner approval.
type: design
---
# Sidebar — LOCKED (May 12, 2026)

The current GhostSidebar visual is FINAL and identical across all 8 industries. Owner-approved.

## What is locked
- Dark glass background: linear-gradient `rgba(8,12,20,0.97) → rgba(5,9,16,0.99)` + `backdrop-filter: blur(24px)` (`.ghost-sidebar-bg` in src/index.css).
- Right-edge soft halo using `rgba(var(--industry-rgb), 0.10)` — only the accent color rotates per industry, never the structure.
- Active item (`.ghost-sidebar-active`): subtle bg `rgba(var(--industry-rgb), 0.08)`, 1px border `rgba(var(--industry-rgb), 0.45)`, radius 14px, NO breath/pulse animation.
- Hover: `rgba(var(--industry-rgb), 0.04)` — no transform, no layout shift.
- Width, height, padding, structure, nav items, logo, footer controls = unchanged.
- Per-industry `--industry-rgb` map stays as defined for all 8 industries.

## Forbidden (do NOT do)
- Do NOT add full-height animated overlays, ::before/::after sweeps, or keyframe pulses on the sidebar.
- Do NOT leak any sidebar styling to body/header/cards/buttons via global `html.dark[data-industry]` rules.
- Do NOT change sidebar width or shift the dashboard content.
- Do NOT change per-industry — all industries get the same locked experience, only accent color rotates.

## Landing page cards
Industry cards on the landing page must stay visually consistent across all 8 industries (same card shell, same spacing, same hover). Only icon + label + accent color change.

**Why:** Owner explicitly locked this on May 12, 2026 after multiple breakage cycles. Any restyle requires owner approval — ASK FIRST.
