// Sovereign HostFlow Brain — runs on owner's own server (Hetzner).
// Single source of truth for AI advisors, founder OS, and inbox.
const DEFAULT_BRAIN_ORIGIN = "https://api.hostflowai.net";

function normalizeOrigin(value?: string): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";

  const sanitized = raw.replace(/\/api\/?$/, "").replace(/\/+$/, "");

  try {
    const url = new URL(sanitized);
    const host = url.hostname.toLowerCase();

    // Only allow the sovereign HostFlow Brain host. Everything else rejected.
    const isSovereign = host === "88.198.208.90" || host.endsWith("hostflowai.net");
    if (!isSovereign) return "";

    return url.origin;
  } catch {
    return "";
  }
}

const envOrigins = [
  import.meta.env.VITE_BRAIN_API_BASE as string | undefined,
  import.meta.env.VITE_BRAIN_INBOX_URL as string | undefined,
  import.meta.env.VITE_API_BASE_URL as string | undefined,
  import.meta.env.VITE_BACKEND_URL as string | undefined,
]
  .map(normalizeOrigin)
  .filter(Boolean);

export const BRAIN_ORIGIN = envOrigins[0] || DEFAULT_BRAIN_ORIGIN;
export const BRAIN_API_BASE = `${BRAIN_ORIGIN}/api`;

// Back-compat aliases — existing imports keep working. Prefer BRAIN_* in new code.
export const REPLIT_ORIGIN = BRAIN_ORIGIN;
export const REPLIT_API_BASE = BRAIN_API_BASE;

// Publishable Brain identifier — sent as X-Sovereign-Token so Hetzner
// recognizes the official HostFlow frontend. Real per-user security comes
// from the Supabase JWT (Authorization: Bearer). Acts like an anon key.
// Override at build time with VITE_SOVEREIGN_TOKEN if rotated.
export const SOVEREIGN_TOKEN =
  (import.meta.env.VITE_SOVEREIGN_TOKEN as string | undefined) ||
  "hf-jimmy-sk-2026-xK9mPqR7vNwZ3jL";