/**
 * Replit Backend (Brain) endpoint.
 *
 * This is the single source of truth for the backend URL.
 * To change the backend URL in the future, update only this file.
 *
 * Usage:
 *   import { BACKEND_URL, backendFetch } from "@/lib/backend";
 *
 * NOTE: Nothing in the existing app imports this yet — it is a passive
 * helper. Existing UI, flows, and pages are untouched.
 */

const FALLBACK_BACKEND =
  "https://294617d8-2084-4895-8e41-8e7fdf1efde4-00-37kl744l50epn.riker.replit.dev/api";

// Prefer VITE_BACKEND_URL when provided. Strip trailing slash for clean joins.
const RAW_BACKEND =
  (import.meta.env.VITE_BACKEND_URL as string | undefined)?.trim() || FALLBACK_BACKEND;

export const BACKEND_URL = RAW_BACKEND.replace(/\/+$/, "");

/**
 * Thin fetch wrapper that prepends BACKEND_URL to a path.
 * Example: backendFetch("/rapidpay/session", { method: "POST", body: ... })
 */
export async function backendFetch(path: string, init: RequestInit = {}) {
  const url = path.startsWith("http")
    ? path
    : `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;

  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
}

/**
 * Send the current UI/Industry manifest to Replit so the backend always
 * knows what the Experience Layer is rendering. Fire-and-forget.
 */
export async function syncManifest(extra: Record<string, unknown> = {}) {
  try {
    const industry =
      (typeof localStorage !== "undefined" && localStorage.getItem("hf-industry")) ||
      "hospitality";
    const theme =
      (typeof localStorage !== "undefined" && localStorage.getItem("theme")) || "system";
    const lang =
      (typeof localStorage !== "undefined" && localStorage.getItem("i18nextLng")) || "en";

    const manifest = {
      app: "hostflow-experience",
      version: 1,
      ts: new Date().toISOString(),
      route: typeof location !== "undefined" ? location.pathname : "/",
      origin: typeof location !== "undefined" ? location.origin : "",
      industry,
      theme,
      lang,
      viewport:
        typeof window !== "undefined"
          ? { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio }
          : null,
      ...extra,
    };

    await backendFetch("/v1/sync-manifest", {
      method: "POST",
      body: JSON.stringify(manifest),
      keepalive: true,
    });
  } catch {
    // Silent — UI must never break on sync failure.
  }
}