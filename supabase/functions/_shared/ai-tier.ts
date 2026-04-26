// Centralized AI tier policy for HostFlow AI.
// Picks a model + enforces trial daily cap + hidden hourly fair-use ceiling.
// Founder/admin users are NEVER throttled and keep their existing premium models.
//
// Model names are an internal implementation detail — NEVER expose them in any
// response body, error message, log returned to client, or UI.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type Plan = "trial" | "basic" | "standard" | "pro" | "premium" | string;

export type TierTask =
  | "chat"        // conversational guide, CRM assistant
  | "structured"  // JSON / tool-calling tasks (pricing, scheduling)
  | "deep";       // long context, deep insights (premium-only)

export interface TierDecision {
  allowed: boolean;
  plan: Plan;
  isAdmin: boolean;
  model: string;
  /** Reason for denial — safe to surface as a friendly toast (no model names). */
  denyReason?: "daily_limit" | "fair_use" | "expired" | "auth";
  /** Human-friendly message for the client. */
  message?: string;
  /** Trial only: messages used today vs cap. */
  dailyUsed?: number;
  dailyCap?: number;
}

const FOUNDER_EMAILS = new Set([
  "naumansherwani@hostflowai.live",
  "raanamasood1962@gmail.com",
]);

// Internal model mapping — NEVER returned to client.
const MODEL_BY_TIER: Record<string, Record<TierTask, string>> = {
  // Speed-optimized: flash-lite is the fastest (sub-second TTFB), used for chat on Trial/Basic.
  trial:    { chat: "google/gemini-2.5-flash-lite", structured: "google/gemini-2.5-flash-lite", deep: "google/gemini-2.5-flash-lite" },
  basic:    { chat: "google/gemini-2.5-flash-lite", structured: "google/gemini-2.5-flash-lite", deep: "google/gemini-2.5-flash" },
  standard: { chat: "google/gemini-2.5-flash-lite", structured: "google/gemini-2.5-flash",      deep: "google/gemini-2.5-flash" },
  // Pro: flash-lite for chat (snappy), flash for structured/deep (smarter).
  pro:      { chat: "google/gemini-2.5-flash-lite", structured: "google/gemini-2.5-flash",      deep: "google/gemini-2.5-flash" },
  // Premium: gpt-5-mini stays as the elite default; gpt-5 for deep insights only.
  premium:  { chat: "openai/gpt-5-mini",            structured: "openai/gpt-5-mini",            deep: "openai/gpt-5" },
};

// Founder/admin keeps premium-tier mix regardless of subscription state.
const FOUNDER_MODELS: Record<TierTask, string> = {
  chat: "openai/gpt-5-mini",
  structured: "openai/gpt-5-mini",
  deep: "openai/gpt-5",
};

// Hard daily cap for trial only. Paid plans are unlimited (UI shows no counter).
const TRIAL_DAILY_CAP = 5;

// Hidden anti-spam ceiling per minute (was per hour). Tighter to protect costs
// and discourage rapid-fire abuse — never shown to user.
const FAIR_USE_PER_MINUTE: Record<string, number> = {
  trial: 3,
  basic: 8,
  standard: 12,
  pro: 15,
  premium: 30,
};

// Soft hourly ceiling — second layer of protection.
const FAIR_USE_PER_HOUR: Record<string, number> = {
  trial: 5,
  basic: 90,
  standard: 150,
  pro: 180,
  premium: 360,
};

function makeAdmin(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );
}

/**
 * Resolve plan + admin status from a Supabase auth token.
 * Returns null plan if the token is invalid.
 */
export async function resolveUserContext(
  authHeader: string | null
): Promise<{ userId: string; email: string | null; plan: Plan; isAdmin: boolean } | null> {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const admin = makeAdmin();

  const { data: userData, error } = await admin.auth.getUser(token);
  if (error || !userData.user) return null;
  const userId = userData.user.id;
  const email = userData.user.email ?? null;

  // Admin check via DB function (preferred over hardcoded emails).
  const { data: adminRow } = await admin.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  const isAdmin = adminRow === true || (email ? FOUNDER_EMAILS.has(email) : false);

  // Plan lookup
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan, status, is_lifetime, trial_ends_at, current_period_end")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let plan: Plan = sub?.plan ?? "trial";
  // Treat expired trials as locked
  if (
    !isAdmin &&
    !sub?.is_lifetime &&
    sub?.status === "trialing" &&
    sub?.trial_ends_at &&
    new Date(sub.trial_ends_at).getTime() < Date.now()
  ) {
    plan = "expired";
  }

  return { userId, email, plan, isAdmin };
}

/**
 * Decide which model to use + whether the request is allowed.
 * Logs the call to ai_message_log on success (best-effort, non-blocking).
 */
export async function pickTierAndCheck(
  authHeader: string | null,
  task: TierTask,
  functionName: string
): Promise<TierDecision> {
  const ctx = await resolveUserContext(authHeader);
  if (!ctx) {
    return {
      allowed: false,
      plan: "trial",
      isAdmin: false,
      model: MODEL_BY_TIER.trial[task],
      denyReason: "auth",
      message: "Please sign in to use AI features.",
    };
  }

  // Founder / admin bypass — always allowed, premium models.
  if (ctx.isAdmin) {
    void logUsage(ctx.userId, functionName, "admin", FOUNDER_MODELS[task]);
    return { allowed: true, plan: "admin", isAdmin: true, model: FOUNDER_MODELS[task] };
  }

  if (ctx.plan === "expired") {
    return {
      allowed: false,
      plan: ctx.plan,
      isAdmin: false,
      model: MODEL_BY_TIER.trial[task],
      denyReason: "expired",
      message: "Your free trial has ended. Upgrade to keep using AI features.",
    };
  }

  const planKey = (MODEL_BY_TIER[ctx.plan] ? ctx.plan : "trial") as keyof typeof MODEL_BY_TIER;
  const model = MODEL_BY_TIER[planKey][task];

  // Trial: enforce 5/day hard cap.
  if (ctx.plan === "trial") {
    const used = await countMessagesSince(ctx.userId, startOfDayUtc());
    if (used >= TRIAL_DAILY_CAP) {
      return {
        allowed: false,
        plan: ctx.plan,
        isAdmin: false,
        model,
        denyReason: "daily_limit",
        message: `You've used your ${TRIAL_DAILY_CAP} free AI messages for today. Upgrade to keep going — limit resets tomorrow.`,
        dailyUsed: used,
        dailyCap: TRIAL_DAILY_CAP,
      };
    }
  }

  // Hidden hourly fair-use ceiling for all plans (anti-spam only).
  const minuteCap = FAIR_USE_PER_MINUTE[ctx.plan] ?? 10;
  const hourlyCap = FAIR_USE_PER_HOUR[ctx.plan] ?? 90;
  const [minuteUsed, hourlyUsed] = await Promise.all([
    countMessagesSince(ctx.userId, new Date(Date.now() - 60 * 1000).toISOString()),
    countMessagesSince(ctx.userId, new Date(Date.now() - 60 * 60 * 1000).toISOString()),
  ]);
  if (minuteUsed >= minuteCap || hourlyUsed >= hourlyCap) {
    return {
      allowed: false,
      plan: ctx.plan,
      isAdmin: false,
      model,
      denyReason: "fair_use",
      message: "You're sending requests very fast. Please wait a moment and try again.",
    };
  }

  void logUsage(ctx.userId, functionName, ctx.plan, model);

  return {
    allowed: true,
    plan: ctx.plan,
    isAdmin: false,
    model,
    dailyUsed: ctx.plan === "trial" ? await countMessagesSince(ctx.userId, startOfDayUtc()) : undefined,
    dailyCap: ctx.plan === "trial" ? TRIAL_DAILY_CAP : undefined,
  };
}

function startOfDayUtc(): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function countMessagesSince(userId: string, sinceIso: string): Promise<number> {
  const admin = makeAdmin();
  const { count } = await admin
    .from("ai_message_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", sinceIso);
  return count ?? 0;
}

async function logUsage(userId: string, functionName: string, plan: string, model: string) {
  try {
    const admin = makeAdmin();
    await admin.from("ai_message_log").insert({
      user_id: userId,
      function_name: functionName,
      plan,
      model_used: model,
    });
  } catch (e) {
    console.error("ai_message_log insert failed", e);
  }
}

/**
 * Build a JSON deny response with proper status code.
 * Status 429 = limit/fair-use, 401 = auth, 402 = expired/upgrade.
 */
export function tierDenyResponse(decision: TierDecision, corsHeaders: Record<string, string>) {
  const status =
    decision.denyReason === "auth" ? 401 :
    decision.denyReason === "expired" ? 402 :
    429;
  return new Response(
    JSON.stringify({
      error: decision.message,
      reason: decision.denyReason,
      daily_used: decision.dailyUsed,
      daily_cap: decision.dailyCap,
    }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}