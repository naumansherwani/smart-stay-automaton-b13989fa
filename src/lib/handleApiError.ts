/**
 * Shared HTTP/API error handler — Phase 1.
 *
 * Every API response from the Replit backend follows:
 *   { ok, data, error: { code, message } | null, trace_id }
 *
 * Callers should:
 *   1. Use the typed helpers in `@/lib/api` (which already validate `ok`
 *      and throw `ApiError` on `ok === false`).
 *   2. In the catch block, call `handleApiError(err)` — it covers all
 *      standard HTTP statuses with a single, consistent UX:
 *
 *   400 → toast(error.message)
 *   401 → clear session + redirect to /login
 *   403 → toast: "You don't have access to this feature"
 *   404 → toast: "Not found"
 *   429 → toast: "You've reached your usage limit…" (link → /pricing)
 *   500 → toast: "Something went wrong. Please try again."
 *         trace_id is logged to console only — never shown to the user.
 *
 * Special codes (`AI_LIMIT_REACHED`, `INDUSTRY_MISMATCH`) are already
 * handled globally inside `@/lib/api` and are returned as "handled"
 * here so callers do not double-toast.
 *
 * AbortError (user-cancelled stream) is also treated as handled.
 */

import { toast } from "sonner";
import { ApiError } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

export interface HandleApiErrorOptions {
  /** Override the toast shown for HTTP 400 (defaults to error.message). */
  fallback400?: string;
  /** Suppress toasts entirely — still performs 401 redirect. */
  silent?: boolean;
}

/** Returns true if the error was a recognized API/abort error and was handled. */
export function handleApiError(err: unknown, opts: HandleApiErrorOptions = {}): boolean {
  // User-cancelled fetch / SSE stream — never an error to the user.
  if ((err as any)?.name === "AbortError") return true;

  if (!(err instanceof ApiError)) {
    // Network / unknown — generic toast, do not leak details.
    if (!opts.silent) {
      toast.error("Something went wrong. Please try again.");
    }
    // eslint-disable-next-line no-console
    console.error("[api] non-ApiError:", err);
    return false;
  }

  const { status, code, message, trace_id } = err;

  // Already handled globally inside api.ts (modal / re-onboarding).
  if (code === "AI_LIMIT_REACHED" || code === "INDUSTRY_MISMATCH") {
    if (trace_id) console.debug("[api] trace_id:", trace_id);
    return true;
  }

  // Always log trace_id to console for support/debugging — never to the user.
  if (trace_id) console.debug("[api] trace_id:", trace_id, "code:", code);

  switch (status) {
    case 400:
      if (!opts.silent) toast.error(message || opts.fallback400 || "Invalid request");
      return true;
    case 401:
      // Clear session and bounce to login.
      void supabase.auth.signOut().catch(() => { /* noop */ });
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      return true;
    case 403:
      if (!opts.silent) toast.error("You don't have access to this feature");
      return true;
    case 404:
      if (!opts.silent) toast.error("Not found");
      return true;
    case 429:
      if (!opts.silent) {
        toast.error("You've reached your usage limit. Please upgrade your plan.", {
          action: {
            label: "Upgrade",
            onClick: () => {
              if (typeof window !== "undefined") window.location.href = "/pricing";
            },
          },
        });
      }
      return true;
    case 500:
    default:
      if (!opts.silent) toast.error("Something went wrong. Please try again.");
      return true;
  }
}