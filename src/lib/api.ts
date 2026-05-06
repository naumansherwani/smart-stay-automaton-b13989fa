/**
 * HostFlow AI — Replit Brain API client.
 *
 * Single source of truth for talking to the Replit backend.
 * - Base URL pinned to Replit (override via VITE_REPLIT_ADVISOR_URL).
 * - Auto-attaches Supabase JWT to every authenticated request.
 * - Every JSON response follows the contract:
 *     { ok, data, error: { code, message, ...extras } | null, trace_id }
 * - 429 AI_LIMIT_REACHED  → dispatches `hf:ai-limit` event for upgrade modal.
 * - 403 INDUSTRY_MISMATCH → signs the user out + dispatches `hf:industry-mismatch`.
 * - Never silent-fails: throws ApiError with code/message/trace_id on failure.
 *
 * NOTE: Lovable never calls AI / payments / DB writes directly. All AI
 * goes through Replit. Supabase here is read-only for the JWT.
 */

import { supabase } from "@/integrations/supabase/client";

const FALLBACK_BASE =
  "https://294617d8-2084-4895-8e41-8e7fdf1efde4-00-37kl744l50epn.riker.replit.dev/api";

const RAW_BASE =
  (import.meta.env.VITE_REPLIT_ADVISOR_URL as string | undefined)?.trim() || "";

// VITE_REPLIT_ADVISOR_URL is the Replit origin (no /api). Append /api once.
export const API_BASE = (RAW_BASE ? `${RAW_BASE.replace(/\/+$/, "")}/api` : FALLBACK_BASE);

export interface ApiEnvelope<T> {
  ok: boolean;
  data: T | null;
  error: { code: string; message: string; [k: string]: unknown } | null;
  trace_id: string;
}

export class ApiError extends Error {
  code: string;
  status: number;
  trace_id: string;
  extras: Record<string, unknown>;
  constructor(code: string, message: string, status: number, trace_id = "", extras: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.trace_id = trace_id;
    this.extras = extras;
  }
}

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

function buildUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Handle 429 / 403 globally so callers don't have to repeat the logic. */
async function handleStatusErrors(envelope: ApiEnvelope<unknown>, status: number) {
  const code = envelope.error?.code || "UNKNOWN";

  if (status === 429 && code === "AI_LIMIT_REACHED") {
    const upgradeTo = (envelope.error as any)?.upgrade_to as string | undefined;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hf:ai-limit", {
        detail: { upgrade_to: upgradeTo, message: envelope.error?.message, trace_id: envelope.trace_id },
      }));
    }
  }

  if (status === 403 && code === "INDUSTRY_MISMATCH") {
    try { await supabase.auth.signOut(); } catch { /* noop */ }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hf:industry-mismatch", {
        detail: { message: envelope.error?.message, trace_id: envelope.trace_id },
      }));
      // Hard redirect so any cached state is wiped before re-onboarding.
      window.location.href = "/login?reason=industry_mismatch";
    }
  }
}

async function parseEnvelope<T>(resp: Response): Promise<ApiEnvelope<T>> {
  let json: any = null;
  try { json = await resp.json(); } catch { /* empty body */ }
  if (json && typeof json === "object" && "ok" in json) {
    return json as ApiEnvelope<T>;
  }
  // Backend returned non-contract body — wrap it to keep callers safe.
  return {
    ok: resp.ok,
    data: (resp.ok ? (json as T) : null),
    error: resp.ok ? null : { code: "NON_CONTRACT_RESPONSE", message: `HTTP ${resp.status}` },
    trace_id: resp.headers.get("x-trace-id") || "",
  };
}

async function request<T>(method: string, path: string, body?: unknown, opts: { auth?: boolean } = {}): Promise<T> {
  const auth = opts.auth !== false;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) Object.assign(headers, await getAuthHeader());

  const resp = await fetch(buildUrl(path), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const env = await parseEnvelope<T>(resp);
  await handleStatusErrors(env, resp.status);

  if (!resp.ok || env.ok === false) {
    throw new ApiError(
      env.error?.code || "REQUEST_FAILED",
      env.error?.message || `HTTP ${resp.status}`,
      resp.status,
      env.trace_id,
      (env.error as any) || {},
    );
  }
  return env.data as T;
}

export function apiGet<T>(path: string, opts?: { auth?: boolean }) {
  return request<T>("GET", path, undefined, opts);
}
export function apiPost<T>(path: string, body: unknown, opts?: { auth?: boolean }) {
  return request<T>("POST", path, body, opts);
}

/* ──────────────────────────────────────────────────────────
 * SSE streaming for AI Advisor.
 *
 * Endpoints:
 *   POST /api/advisor/:industry   (per-industry)
 *   POST /api/owner/advisor       (owner / founder)
 *
 * Events:
 *   event: chunk → { text }
 *   event: done  → { usage }
 *   event: error → { code, message }
 * ────────────────────────────────────────────────────────── */

export interface StreamHandlers {
  onChunk?: (text: string) => void;
  onDone?: (usage: unknown) => void;
  onError?: (err: { code: string; message: string }) => void;
  onEvent?: (eventName: string, data: any) => void;
  signal?: AbortSignal;
}

export interface AdvisorRequest {
  message: string;
  user_industry: string;
  business_subtype?: string | null;
}

export async function streamAdvisor(
  industry: string,
  body: AdvisorRequest,
  handlers: StreamHandlers,
) {
  return streamSSE(`/advisor/${industry}`, body, handlers);
}

export async function streamOwnerAdvisor(
  body: { message: string; [k: string]: unknown },
  handlers: StreamHandlers,
) {
  return streamSSE(`/owner/advisor`, body, handlers);
}

async function streamSSE(path: string, body: unknown, handlers: StreamHandlers) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    ...(await getAuthHeader()),
  };

  const resp = await fetch(buildUrl(path), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: handlers.signal,
  });

  if (!resp.ok || !resp.body) {
    const env = await parseEnvelope<unknown>(resp);
    await handleStatusErrors(env, resp.status);
    const code = env.error?.code || "STREAM_FAILED";
    const message = env.error?.message || `HTTP ${resp.status}`;
    handlers.onError?.({ code, message });
    throw new ApiError(code, message, resp.status, env.trace_id, (env.error as any) || {});
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let pendingEvent = "message";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nlIdx: number;
    while ((nlIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, nlIdx);
      buffer = buffer.slice(nlIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") {
        // Comment / heartbeat / event delimiter
        continue;
      }
      if (line.startsWith("event: ")) {
        pendingEvent = line.slice(7).trim();
        continue;
      }
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6);
      if (raw === "[DONE]") {
        handlers.onDone?.({});
        return;
      }
      let payload: any = raw;
      try { payload = JSON.parse(raw); } catch { /* keep raw */ }

      handlers.onEvent?.(pendingEvent, payload);

      if (pendingEvent === "chunk") {
        const text = (payload?.text ?? payload?.delta ?? payload?.content) as string | undefined;
        if (text) handlers.onChunk?.(text);
      } else if (pendingEvent === "done") {
        handlers.onDone?.(payload?.usage ?? payload);
        return;
      } else if (pendingEvent === "error") {
        const err = { code: payload?.code || "STREAM_ERROR", message: payload?.message || "Advisor error" };
        handlers.onError?.(err);
        return;
      }
      pendingEvent = "message";
    }
  }

  handlers.onDone?.({});
}

/* ──────────────────────────────────────────────────────────
 * Plan limits — public + per-user.
 * ────────────────────────────────────────────────────────── */

export type PlanKey = "trial" | "basic" | "pro" | "premium" | "enterprise";

export interface PlanLimitBucket {
  ai?: { daily_messages: number | null; hourly_fair_use: number | null };
  core?: { industries: number | null };
  voice?: { monthly_minutes: number | null };
  [k: string]: unknown;
}

export interface PlanLimitsResponse {
  plans: Record<PlanKey, PlanLimitBucket>;
}

export interface PlanMeResponse {
  plan: PlanKey;
  status: string;
  limits: PlanLimitBucket;
  usage?: Record<string, number>;
  trial_ends_at?: string | null;
}

export const fetchPlanLimits = () => apiGet<PlanLimitsResponse>("/plan/limits", { auth: false });
export const fetchMyPlan = () => apiGet<PlanMeResponse>("/plan/me");

/* ──────────────────────────────────────────────────────────
 * Payments — Replit is the source of truth.
 * Lovable never calls Stripe / Paddle / Lemon / Polar directly,
 * never invokes a Supabase edge function for checkout, and never
 * hardcodes prices. All catalog + checkout + cancel goes through here.
 * ────────────────────────────────────────────────────────── */

export type PaymentsPlanKey = "basic" | "pro" | "premium";

export interface PaymentProduct {
  plan: PaymentsPlanKey;
  name: string;
  currency: string;            // e.g. "gbp"
  regular_price: number;       // pence
  active_price: number;        // pence
  launch_active: boolean;
  launch_ends_at: string | null;
  checkout_product_id: string;
}

export interface PaymentsProductsResponse {
  products: PaymentProduct[];
}

export interface PaymentsCheckoutResponse {
  checkout_url: string;
}

export interface PlanMeData {
  plan: PlanKey;
  status: string;
  current_period_end?: string | null;
  trial_ends_at?: string | null;
}

export const fetchPaymentProducts = () =>
  apiGet<PaymentsProductsResponse>("/payments/products", { auth: false });

export const fetchMe = () => apiGet<PlanMeData>("/plan/me");

export const createPaymentsCheckout = (body: {
  product_id: string;
  success_url: string;
  cancel_url: string;
}) => apiPost<PaymentsCheckoutResponse>("/payments/checkout", body);

export async function cancelPlan(): Promise<PlanMeData> {
  return request<PlanMeData>("DELETE", "/payments/cancel");
}
