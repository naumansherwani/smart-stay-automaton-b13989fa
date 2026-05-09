const DEFAULT_REPLIT_ORIGIN = "https://hostflowai-brain--naumansherwani.replit.app";

function normalizeOrigin(value?: string): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  return raw.replace(/\/api\/?$/, "").replace(/\/+$/, "");
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