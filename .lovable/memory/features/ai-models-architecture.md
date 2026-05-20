---
name: AI models architecture (LOCKED)
description: Which local Ollama models run each AI persona and the Gemini fallback rule
type: feature
---
# AI Models — Locked Architecture

## Local Ollama models (primary, on Hetzner)
- **Jimmy** → `qwen3:8b` (3M ctx) — founder-only chat
- **Sherlock** → `qwen3:8b` (1M ctx) — cross-industry audit
- **8 Industry Advisors** (Aria, Orion, Rex, Lyra, Sage, Atlas, Vega, Kai) → `qwen3:4b` (100K ctx each)

## Fallback rule
- **Gemini** is the ONLY allowed fallback, and ONLY for **Jimmy** and **Sherlock**.
- Gemini fallback fires only if Gemini API balance is available.
- Industry advisors have **NO** fallback — qwen3:4b only.
- **Groq removed** from fallback chain unless owner re-enables.
- **OpenAI** not used anywhere in founder/advisor stack.
