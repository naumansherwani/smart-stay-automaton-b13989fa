import { REPLIT_API_BASE } from "@/lib/replitBase";

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

export const BACKEND_URL = REPLIT_API_BASE;

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
export type UiFlags = {
  show_ai_advisor?: boolean;
  play_welcome_voice?: boolean;
  show_revenue_chart?: boolean;
  voice_trigger?: boolean;
  [k: string]: unknown;
};

let latestUiFlags: UiFlags = {};
export const getUiFlags = () => latestUiFlags;

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem("sid");
    if (!sid) {
      sid =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `sid_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem("sid", sid);
    }
    return sid;
  } catch {
    return `sid_${Date.now()}`;
  }
}

/**
 * Sync the current UI state with the Brain. Returns ui_flags from backend.
 * Fire-and-forget on the caller side; UI must never break on failure.
 */
export async function syncManifest(opts: {
  industry?: string;
  page?: string;
  user_id?: string | null;
} = {}) {
  try {
    const industry =
      opts.industry ||
      (typeof localStorage !== "undefined" && localStorage.getItem("hf-industry")) ||
      "tourism_hospitality";
    const page =
      opts.page ||
      (typeof location !== "undefined" ? location.pathname : "/");

    const body = {
      industry,
      page,
      user_id: opts.user_id ?? null,
      session_id: getSessionId(),
    };

    const res = await backendFetch("/v1/sync-manifest", {
      method: "POST",
      body: JSON.stringify(body),
      keepalive: true,
    });
    const json = await res.json().catch(() => null);
    const flags = (json?.data?.ui_flags ?? json?.ui_flags ?? {}) as UiFlags;
    latestUiFlags = flags;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hf:ui-flags", { detail: flags }));
    }
    return flags;
  } catch {
    return {} as UiFlags;
  }
}

/**
 * Send a one-shot changelog/notification payload to the Brain so Replit
 * always knows what the Experience Layer just shipped. Fire-and-forget.
 */
export async function notifyChangelog(payload: {
  event: string;
  summary: string;
  details?: Record<string, unknown>;
}) {
  try {
    await backendFetch("/v1/changelog", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        session_id: getSessionId(),
        ts: new Date().toISOString(),
      }),
      keepalive: true,
    });
  } catch {
    /* never break the UI on failure */
  }
}