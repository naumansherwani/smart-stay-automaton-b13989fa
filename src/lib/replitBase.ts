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

// Sovereign machine-to-machine token. Sent as X-Sovereign-Token on every
// Brain request so Hetzner can verify the caller is the official HostFlow
// frontend (in addition to the user JWT for identity / RLS).
//
// MUST come from env (VITE_SOVEREIGN_TOKEN). If missing, requests will be
// rejected by the Brain with 401 — which is the intended secure default.
export const SOVEREIGN_TOKEN =
  (import.meta.env.VITE_SOVEREIGN_TOKEN as string | undefined) ?? "";

if (!SOVEREIGN_TOKEN && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    "[brain] VITE_SOVEREIGN_TOKEN not set — Brain API requests will be unauthorized.",
  );
}