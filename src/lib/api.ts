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
import { REPLIT_API_BASE } from "@/lib/replitBase";

export const API_BASE = REPLIT_API_BASE;

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

/**
 * Detect the current surface from the URL path.
 * Backend uses this to enforce dashboard-vs-CRM access:
 *   X-HostFlow-Surface: dashboard → all plans allowed
 *   X-HostFlow-Surface: crm       → Premium plan only (else CRM_PREMIUM_ONLY 403)
 * Wrong surface → SURFACE_MISMATCH 403. Header missing = fail-open (backwards compat).
 */
function detectSurface(): "dashboard" | "crm" {
  if (typeof window === "undefined") return "dashboard";
  const p = window.location.pathname;
  if (p.startsWith("/crm") || p.startsWith("/owner-crm")) return "crm";
  return "dashboard";
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

  if (status === 403 && code === "CRM_PREMIUM_ONLY") {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hf:crm-premium-only", {
        detail: { message: envelope.error?.message, trace_id: envelope.trace_id },
      }));
    }
  }

  if (status === 403 && code === "SURFACE_MISMATCH") {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hf:surface-mismatch", {
        detail: { message: envelope.error?.message, trace_id: envelope.trace_id },
      }));
    }
  }

  if (status === 403 && code === "INDUSTRY_MISMATCH") {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hf:industry-mismatch", {
        detail: { message: envelope.error?.message, trace_id: envelope.trace_id },
      }));
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
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-HostFlow-Surface": detectSurface(),
  };
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
    "X-HostFlow-Surface": detectSurface(),
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

/* ──────────────────────────────────────────────────────────
 * Phase 6 — Payment History
 * GET /api/payments/me  → list of past payments (newest first server-side OK)
 * Amount field is in pence/cents.
 * ────────────────────────────────────────────────────────── */

export interface PaymentHistoryItem {
  id?: string;
  date: string;          // ISO timestamp
  plan: string;          // plan label
  amount: number;        // pence
  currency?: string;     // "gbp" | "usd" etc.
  status: "paid" | "pending" | "failed" | string;
}

export interface PaymentsMeResponse {
  payments: PaymentHistoryItem[];
}

export const fetchPaymentHistory = () =>
  apiGet<PaymentsMeResponse>("/payments/me");

/* ──────────────────────────────────────────────────────────
 * Phase 7 — Voice (ElevenLabs TTS via Replit)
 * GET  /api/voice/config   (no auth)  → settings
 * GET  /api/voice/welcome  (no auth)  → welcome audio buffer (mp3)
 * POST /api/voice/speak    (auth)     → audio buffer (mp3) for given text
 * Voice errors are silent — UI hides icon, never toasts.
 * ────────────────────────────────────────────────────────── */

function voiceUrl(path: string) {
  return `${API_BASE}${path}`;
}

/** Fetch welcome audio buffer. Returns null on any failure (silent). */
export async function fetchVoiceWelcomeBuffer(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(voiceUrl("/voice/welcome"));
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/** POST /voice/speak — returns audio buffer or null on any failure. */
export async function fetchVoiceSpeakBuffer(
  text: string,
  voiceId?: string
): Promise<ArrayBuffer | null> {
  try {
    const auth = await getAuthHeader();
    const res = await fetch(voiceUrl("/voice/speak"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...auth,
      },
      body: JSON.stringify(voiceId ? { text, voice_id: voiceId } : { text }),
    });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/* ──────────────────────────────────────────────────────────
 * CRM — WhatsApp connection (Premium only)
 * Surface header is auto-applied via detectSurface() since path /crm.
 * ────────────────────────────────────────────────────────── */

export interface WhatsAppConnection {
  connected: boolean;
  phone?: string;
  connectedAt?: string;
}

export interface WhatsAppOtpRequestResp {
  sent: boolean;
  phone: string;
  expiresIn: number;
}

export interface WhatsAppOtpVerifyResp {
  connected: boolean;
  phone: string;
}

export const requestWhatsAppOtp = (phone: string) =>
  apiPost<WhatsAppOtpRequestResp>("/crm/whatsapp/connect/request", { phone });

export const verifyWhatsAppOtp = (code: string) =>
  apiPost<WhatsAppOtpVerifyResp>("/crm/whatsapp/connect/verify", { code });

export const getWhatsAppConnection = () =>
  apiGet<WhatsAppConnection>("/crm/whatsapp/connection");

export const disconnectWhatsApp = () =>
  request<{ disconnected: boolean }>("DELETE", "/crm/whatsapp/connection");

/* ──────────────────────────────────────────────────────────
 * Revenue Intelligence — founder-only.
 * All requests use surface=dashboard. 403 → hide page.
 * ────────────────────────────────────────────────────────── */

export interface IntelligenceReport {
  id: string;
  periodLabel: string;
  periodType: string;
  status: "generating" | "ready" | "failed";
  confidenceScore: number;
  createdAt: string;
  s1_executive_summary: string;
  s2_revenue_impact: {
    revenueGrowthEstimate?: string;
    conversionImprovements?: string;
    bookingIncreases?: string;
    occupancyImprovements?: string;
    repeatCustomerGrowth?: string;
    aiAssistedUpsells?: string;
    abandonedRecoveries?: string;
    totalRevenueImpact?: string;
    confidenceNote?: string;
  };
  s3_cost_savings: {
    vsMarketplaceFees?: string;
    vsManualSupport?: string;
    vsExternalAICRM?: string;
    operationalEfficiency?: string;
    automationImpact?: string;
    totalSavingsEstimate?: string;
    savingsConfidence?: number;
  };
  s4_ai_resolution_metrics: {
    totalAiCallsThisPeriod?: number;
    avgResolutionTime?: string;
    aiFirstResolutionRate?: string;
    sherlockEscalationRate?: string;
    automationPercentage?: string;
    engagementTrend?: string;
    topEndpoints?: { endpoint: string; count: number }[];
    channelBreakdown?: { chat?: number | string; email?: number | string; whatsapp?: number | string };
    advisorEffectiveness?: { advisor: string; interactions: number; industry: string }[];
  };
  s5_recovery_engine: {
    paymentRecoveries?: string;
    abandonedWorkflows?: string;
    customerRetentionSaves?: string;
    aiInterventionCount?: number;
    recoveredRevenueEstimate?: string;
    preventedChurnValue?: string;
    operationalContinuity?: string;
  };
  s6_industry_advisor_insights: {
    industry: string;
    advisor: string;
    interactions: number;
    memoriesExtracted: number;
    topInsight: string;
    performanceNote: string;
  }[];
  s7_sherlock_strategic_notes: string;
  s8_growth_recommendations: {
    strategicGrowthRec?: { title: string; detail: string; estimatedImpact: string };
    operationalWarning?: { title: string; detail: string; urgency: "immediate" | "this_week" | "this_month" };
    missedOpportunity?: { title: string; detail: string; potentialValue: string };
    revenueOptimization?: { title: string; prediction: string; triggerCondition: string };
  };
  s9_forecast_next_month: {
    expectedGrowthRange?: string;
    keyDrivers?: string[];
    watchItems?: string[];
    recommendedActions?: string[];
    confidenceLevel?: number | string;
  };
  s10_net_business_impact: {
    totalRevenueImpact?: string;
    totalCostSavings?: string;
    totalROIEstimate?: string;
    hostflowValueScore?: number;
    verdictOneLiner?: string;
  };
}

export interface RevenueSummary {
  [k: string]: unknown;
}

export const fetchLatestIntelligenceReport = () =>
  apiGet<IntelligenceReport>("/intelligence-reports/latest");

export const fetchIntelligenceReportById = (id: string) =>
  apiGet<IntelligenceReport>(`/intelligence-reports/${id}`);

export const generateIntelligenceReport = () =>
  apiPost<{ id: string; status: string; period?: string }>(
    "/intelligence-reports/generate",
    { sendEmail: false }
  );

export const emailIntelligenceReport = (id: string) =>
  apiPost<{ sent: boolean }>(`/intelligence-reports/${id}/email`, {});

export const fetchRevenueReportsSummary = () =>
  apiGet<RevenueSummary>("/revenue-reports/summary");

/** Build SSE URL for live intelligence feed. Use with `new EventSource(url)`. */
export function liveStreamUrl(): string {
  // /v1/stream lives at the Replit origin (sibling of /api).
  const origin = API_BASE.replace(/\/api\/?$/, "");
  return `${origin}/v1/stream`;
}
