// Production Brain (per BACKEND_API_BRIEF.md, May 2026 — Tiger).
const DEFAULT_REPLIT_ORIGIN = "https://data-migration-master.replit.app";

function normalizeOrigin(value?: string): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";

  const sanitized = raw.replace(/\/api\/?$/, "").replace(/\/+$/, "");

  try {
    const url = new URL(sanitized);
    const host = url.hostname.toLowerCase();

    // Hard block legacy Replit dev hosts that were causing auth/session drift.
    if (host.endsWith(".riker.replit.dev")) return "";

    // Only allow stable Replit app domains as overrides.
    if (!host.endsWith(".replit.app")) return "";

    return url.origin;
  } catch {
    return "";
  }
}

const envOrigins = [
  import.meta.env.VITE_REPLIT_URL as string | undefined,
  import.meta.env.VITE_REPLIT_INBOX_URL as string | undefined,
  import.meta.env.VITE_REPLIT_ADVISOR_URL as string | undefined,
  import.meta.env.VITE_BACKEND_URL as string | undefined,
]
  .map(normalizeOrigin)
  .filter(Boolean);

export const REPLIT_ORIGIN = envOrigins[0] || DEFAULT_REPLIT_ORIGIN;
export const REPLIT_API_BASE = `${REPLIT_ORIGIN}/api`;