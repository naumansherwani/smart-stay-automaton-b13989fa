import { REPLIT_API_BASE } from "@/lib/replitBase";
import { supabase } from "@/integrations/supabase/client";

/**
 * Thin wrapper for calling Replit (HostFlow Brain) routes.
 *
 * Returns { data, error } shape — drop-in replacement for
 * supabase.functions.invoke(name, { body }) in the frontend.
 *
 * - Auth: forwards current Supabase JWT as `Authorization: Bearer <token>`
 *   so Replit can validate the user via supabase.auth.getUser(token).
 * - Errors: surfaces { code, message } from the response envelope, or a
 *   generic message on network/JSON failure.
 */

export interface ReplitError {
  message: string;
  code?: string;
  status?: number;
}

export interface ReplitResult<T> {
  data: T | null;
  error: ReplitError | null;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function replitCall<T = any>(
  path: string,
  body?: unknown,
  init: {
    method?: string;
    signal?: AbortSignal;
    surface?: "dashboard" | "crm";
    headers?: Record<string, string>;
  } = {},
): Promise<ReplitResult<T>> {
  const method = init.method ?? (body !== undefined ? "POST" : "GET");
  const url = path.startsWith("http")
    ? path
    : `${REPLIT_API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const auth = await getAuthHeader();
    const surfaceHeader = init.surface
      ? { "X-HostFlow-Surface": init.surface }
      : {};
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...auth,
        ...surfaceHeader,
        ...(init.headers ?? {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: init.signal,
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      /* empty body */
    }

    if (!res.ok) {
      const err: ReplitError = {
        message:
          json?.error?.message ||
          json?.message ||
          `Request failed (${res.status})`,
        code: json?.error?.code,
        status: res.status,
      };
      return { data: null, error: err };
    }

    // Unwrap standard envelope { ok, data, error }
    const data: T = (json?.data ?? json) as T;
    return { data, error: null };
  } catch (e: any) {
    return {
      data: null,
      error: { message: e?.message || "Network error" },
    };
  }
}

/**
 * Stream Server-Sent Events from a Replit advisor/founder route.
 * Yields parsed event objects: { event, data } where data is the JSON payload.
 */
export async function* replitStream(
  path: string,
  body?: unknown,
  init: { signal?: AbortSignal } = {},
): AsyncGenerator<{ event: string; data: any }, void, unknown> {
  const url = path.startsWith("http")
    ? path
    : `${REPLIT_API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const auth = await getAuthHeader();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...auth,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: init.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`Stream failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const raw = buf.slice(0, idx);
      buf = buf.slice(idx + 2);

      let event = "message";
      const dataLines: string[] = [];
      for (const line of raw.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      }
      const dataStr = dataLines.join("\n");
      if (!dataStr) continue;

      let data: any = dataStr;
      try {
        data = JSON.parse(dataStr);
      } catch {
        /* keep as string */
      }
      yield { event, data };
    }
  }
}

/**
 * POST /api/advisor/:industry — industry-scoped CRM/advisor calls.
 * The body should NOT include a leading slash; industry is URL-encoded.
 */
export function callAdvisor<T = any>(
  industry: string,
  body: unknown,
): Promise<ReplitResult<T>> {
  const ind = encodeURIComponent(industry || "general");
  return replitCall<T>(`/advisor/${ind}`, body);
}

/**
 * Drop-in shim mirroring `supabase.functions.invoke(name, { body })`.
 * Maps legacy edge-function names to their Replit Brain routes so we
 * can migrate callsites with a single import/name change.
 */
export async function invokeShim<T = any>(
  name: string,
  opts: { body?: any; headers?: Record<string, string> } = {},
): Promise<ReplitResult<T>> {
  const body = opts.body ?? {};
  switch (name) {
    case "crm-ai-assistant":
    case "crm-daily-planner":
    case "crm-performance-report":
      return callAdvisor<T>(body?.industry || "general", body);

    case "ai-smart-pricing":
      return replitCall<T>("/pricing/suggest", body);
    case "ai-auto-schedule":
      return replitCall<T>("/calendar/suggest", body);
    case "validate-booking":
      return replitCall<T>("/bookings", body);
    case "ai-onboarding-guide":
      return replitCall<T>("/onboarding/answer", body);

    case "founder-adviser":
      return replitCall<T>("/founder/adviser", body);
    case "founder-intelligence":
    case "mrr-ai-insights":
      return replitCall<T>("/intelligence-reports/latest", body, { method: "GET" });
    case "owner-email-ai":
      return replitCall<T>("/email", body);
    case "owner-mailbox":
      return replitCall<T>("/email/inbox", body, { method: "GET" });
    case "churn-risk-score":
      return replitCall<T>("/health-scores/admin", body, { method: "GET" });
    case "retention-action":
      return replitCall<T>("/health-scores/admin/critical", body, { method: "GET" });
    case "arc-event-ingest":
      return replitCall<T>("/v1/sync-manifest", body);
    case "arc-orchestrator":
      return replitCall<T>("/signals", body);

    case "contact-form":
      return replitCall<T>("/email/contact", body);

    default:
      return {
        data: null,
        error: { message: `No Replit route mapped for "${name}"` },
      };
  }
}