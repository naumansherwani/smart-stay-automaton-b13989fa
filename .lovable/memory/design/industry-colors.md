---
name: Industry Dashboard Colors (LOCKED)
description: PERMANENT per-industry palette. Owner-locked May 12, 2026. Do NOT change without explicit owner approval. Teal NEVER forced inside any industry workspace.
type: design
---
**LOCKED BY OWNER — DO NOT MODIFY WITHOUT EXPLICIT PERMISSION.**
If a change seems needed, ASK FIRST. Never auto-replace, never force teal inside an industry.

| Industry | Light primary | Dark primary | Vibe |
|---|---|---|---|
| Hospitality (Travel/Tourism) | Gold 46 65% 52% | Gold 46 65% 52% | Warm gold + soft rose accent |
| Airlines | Sky blue 205 100% 40% | Bright sky 199 92% 64% | Aviation blue + amber |
| Car Rental | Deep green 120 100% 20% | Neon green 110 100% 50% | Race green + silver |
| Healthcare | Medical teal-green 165 100% 36% | Mint 162 100% 45% | Clean clinical green |
| Education | Navy 218 100% 14% | Warm gold 39 98% 71% | Academic navy + scholar gold |
| Logistics | Cargo orange 22 100% 41% | Bright orange 33 100% 50% | Industrial orange + steel grey |
| Events & Entertainment | Royal purple 263 100% 46% | Purple + magenta + cyan | Stage purple + neon |
| Railways | Signal red 0 100% 46% | Bright red 0 100% 50% | Railway red + safety green accent |
| Brand (HostFlow chrome only) | Teal 174 55% 42% | Teal 174 62% 55% | ONLY for landing/auth/cross-industry chrome |

**Source of truth:** src/index.css [data-industry="X"] + html.dark[data-industry="X"] blocks.
**Rule:** Teal is brand chrome only. Never apply teal inside an industry workspace. Never use "brand" as a fallback when an industry is active. If industry is null → leave data-industry unset (no force).
