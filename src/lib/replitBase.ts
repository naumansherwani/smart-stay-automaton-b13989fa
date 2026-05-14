// Sovereign Brain (Hetzner, May 2026). Replaces Replit dev/app subdomains.
const DEFAULT_REPLIT_ORIGIN = "http://88.198.208.90:8000";

function normalizeOrigin(value?: string): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";

  const sanitized = raw.replace(/\/api\/?$/, "").replace(/\/+$/, "");

  try {
    const url = new URL(sanitized);
    const host = url.hostname.toLowerCase();

    // Hard block legacy Replit dev hosts that were causing auth/session drift.
    if (host.endsWith(".riker.replit.dev")) return "";

    // Allow stable Replit app domains (legacy) OR the sovereign Hetzner host.
    const isReplitApp = host.endsWith(".replit.app");
    const isSovereign = host === "88.198.208.90" || host.endsWith("hostflowai.net");
    if (!isReplitApp && !isSovereign) return "";

    return url.origin;
  } catch {
    return "";
  }
}

const envOrigins = [
  import.meta.env.VITE_API_BASE_URL as string | undefined,
  import.meta.env.VITE_REPLIT_URL as string | undefined,
  import.meta.env.VITE_REPLIT_INBOX_URL as string | undefined,
  import.meta.env.VITE_REPLIT_ADVISOR_URL as string | undefined,
  import.meta.env.VITE_BACKEND_URL as string | undefined,
]
  .map(normalizeOrigin)
  .filter(Boolean);

export const REPLIT_ORIGIN = envOrigins[0] || DEFAULT_REPLIT_ORIGIN;
export const REPLIT_API_BASE = `${REPLIT_ORIGIN}/api`;

// Sovereign auth token for Founder OS chat (Jimmy). Sent as X-Sovereign-Token.
export const SOVEREIGN_TOKEN =
  (import.meta.env.VITE_SOVEREIGN_TOKEN as string | undefined) ||
  "JimmyFounder2026SecureKey";