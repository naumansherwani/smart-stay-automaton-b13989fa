// ARC Engine — Orchestrator
// Cron-driven brain that:
// 1. Recomputes user_health_scores for all users
// 2. Evaluates arc_rules and creates arc_actions
// 3. Dispatches actions (email via resend-send / queues founder tasks)
// Runs every 30 min via pg_cron.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

type HealthSignals = {
  no_login_days: number;
  feature_count_30d: number;
  trial_day: number | null;
  trial_days_remaining: number | null;
  payment_failed_recent: boolean;
  premium_usage_drop_pct: number;
  first_setup_complete: boolean;
  plan: string;
};

function lifecyclePhase(s: HealthSignals): "attract" | "convert" | "retain" | "recover" | "champion" {
  if (s.payment_failed_recent) return "recover";
  if (s.plan === "trial" || s.plan === "trialing") return s.trial_day && s.trial_day >= 4 ? "convert" : "attract";
  if (s.premium_usage_drop_pct >= 50 || s.no_login_days >= 7) return "retain";
  if (s.feature_count_30d >= 20 && s.no_login_days <= 2) return "champion";
  return "retain";
}

function scoreHealth(s: HealthSignals) {
  let usage = 50;
  if (s.feature_count_30d >= 20) usage = 95;
  else if (s.feature_count_30d >= 10) usage = 80;
  else if (s.feature_count_30d >= 4) usage = 60;
  else if (s.feature_count_30d >= 1) usage = 35;
  else usage = 10;

  let engagement = 100;
  if (s.no_login_days >= 14) engagement = 5;
  else if (s.no_login_days >= 7) engagement = 25;
  else if (s.no_login_days >= 3) engagement = 60;
  else engagement = 95;

  const payment = s.payment_failed_recent ? 20 : 100;
  const composite = Math.round(usage * 0.4 + engagement * 0.4 + payment * 0.2);
  return { usage, engagement, payment, composite };
}

function recommendAction(phase: string, s: HealthSignals): { action: string; reason: string } {
  if (phase === "recover") return { action: "Send payment rescue email", reason: "Recent payment failure detected" };
  if (phase === "convert" && s.trial_day && s.trial_day >= 5) return { action: "Send ROI + upgrade prompt", reason: `Trial day ${s.trial_day} — value moment` };
  if (phase === "attract" && !s.first_setup_complete) return { action: "Quick Start nudge", reason: "Onboarding incomplete" };
  if (phase === "retain" && s.no_login_days >= 14) return { action: "Win-back offer 20%", reason: `${s.no_login_days} days inactive` };
  if (phase === "retain" && s.premium_usage_drop_pct >= 60) return { action: "Founder personal outreach", reason: "Premium usage dropping" };
  if (phase === "champion") return { action: "Ask for testimonial / referral", reason: "Power user — leverage advocacy" };
  return { action: "Monitor", reason: "Healthy" };
}

async function recomputeHealthForUser(p: any, now: number) {
  const uid = p.user_id;
  const [{ data: lastEvent }, { data: usageRows }, { data: subRow }, { data: failedPay }, { count: recentEventCount }] = await Promise.all([
    supabase.from("arc_lifecycle_events").select("created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("feature_usage").select("id, last_used_at").eq("user_id", uid),
    supabase.from("subscriptions").select("status, plan, trial_starts_at, trial_ends_at, created_at").eq("user_id", uid).maybeSingle(),
    supabase.from("arc_lifecycle_events").select("id").eq("user_id", uid).eq("event_type", "payment_failed").gte("created_at", new Date(now - 24 * 3600 * 1000).toISOString()).limit(1),
    supabase.from("arc_lifecycle_events").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("event_type", "feature_used").gte("created_at", new Date(now - 30 * 24 * 3600 * 1000).toISOString()),
  ]);

  const lastActive = lastEvent?.created_at ? new Date(lastEvent.created_at).getTime() : 0;
  const noLoginDays = lastActive ? Math.floor((now - lastActive) / (1000 * 60 * 60 * 24)) : 30;
  const featureCount = recentEventCount ?? (usageRows?.length ?? 0);

  let trialDay: number | null = null;
  let trialDaysRemaining: number | null = null;
  if (subRow?.status === "trialing" && subRow?.trial_starts_at) {
    trialDay = Math.floor((now - new Date(subRow.trial_starts_at).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (subRow.trial_ends_at) trialDaysRemaining = Math.ceil((new Date(subRow.trial_ends_at).getTime() - now) / (1000 * 60 * 60 * 24));
  }

  const signals: HealthSignals = {
    no_login_days: noLoginDays,
    feature_count_30d: featureCount,
    trial_day: trialDay,
    trial_days_remaining: trialDaysRemaining,
    payment_failed_recent: !!(failedPay && failedPay.length),
    premium_usage_drop_pct: 0, // TODO compare to prior 30d
    first_setup_complete: featureCount >= 2,
    plan: subRow?.plan ?? "trial",
  };
  const { usage, engagement, payment, composite } = scoreHealth(signals);
  const phase = lifecyclePhase(signals);
  const rec = recommendAction(phase, signals);

  await supabase.from("user_health_scores").upsert({
    user_id: uid,
    industry: p.industry ?? null,
    plan: signals.plan,
    health_score: composite,
    usage_score: usage,
    engagement_score: engagement,
    payment_health_score: payment,
    lifecycle_phase: phase,
    trial_day: trialDay,
    days_since_last_action: noLoginDays,
    feature_count_30d: featureCount,
    recommended_action: rec.action,
    recommended_action_reason: rec.reason,
    signals: signals as unknown as Record<string, unknown>,
    computed_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  return { uid, phase, signals, composite };
}

function ruleMatches(rule: any, h: { phase: string; signals: HealthSignals }) {
  const c = rule.trigger_conditions ?? {};
  switch (rule.trigger_type) {
    case "first_setup_incomplete":
      return h.phase === "attract" && !h.signals.first_setup_complete && (c.feature_count_lt === undefined || h.signals.feature_count_30d < c.feature_count_lt);
    case "trial_day":
      if (c.trial_day !== undefined) return h.signals.trial_day === c.trial_day;
      if (c.trial_days_remaining !== undefined) return h.signals.trial_days_remaining !== null && h.signals.trial_days_remaining <= c.trial_days_remaining;
      return false;
    case "payment_failed":
      return h.signals.payment_failed_recent;
    case "inactivity":
      return h.signals.no_login_days >= (c.days_inactive ?? 14);
    case "usage_drop":
      return h.signals.premium_usage_drop_pct >= (c.drop_percent ?? 50) && (!c.plan || h.signals.plan === c.plan);
    default:
      return false;
  }
}

async function maybeQueueAction(rule: any, userRow: any, h: { phase: string; signals: HealthSignals }) {
  // Cooldown — skip if same rule fired for this user within cooldown window
  const since = new Date(Date.now() - (rule.cooldown_hours ?? 72) * 3600 * 1000).toISOString();
  const { count } = await supabase.from("arc_actions").select("id", { count: "exact", head: true })
    .eq("user_id", userRow.user_id).eq("rule_id", rule.id).gte("created_at", since);
  if ((count ?? 0) > 0) return null;

  const tpl = rule.action_template ?? {};
  const ctx: Record<string, string> = {
    name: userRow.display_name ?? "there",
    company: userRow.company_name ?? "your business",
    feature_count: String(h.signals.feature_count_30d),
    hours_saved: String(Math.max(2, h.signals.feature_count_30d * 0.3).toFixed(1)),
    savings: String(Math.max(20, h.signals.feature_count_30d * 8)),
  };
  const fill = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => ctx[k] ?? "");

  const { data: action } = await supabase.from("arc_actions").insert({
    user_id: userRow.user_id,
    rule_id: rule.id,
    phase: rule.phase,
    action_type: tpl.type ?? "ai_message",
    channel: tpl.channel ?? "email",
    title: fill(tpl.title ?? rule.name),
    body: fill(tpl.body_template ?? ""),
    payload: { template_vars: ctx, signals: h.signals },
    status: "pending",
    triggered_by: "arc_engine",
  }).select().single();

  await supabase.from("arc_rules").update({
    trigger_count: (rule.trigger_count ?? 0) + 1,
    last_triggered_at: new Date().toISOString(),
  }).eq("id", rule.id);

  return action;
}

async function dispatchAction(action: any, userRow: any) {
  try {
    if (action.channel === "email" && userRow.email) {
      // Use Resend
      const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/resend-send`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ to: userRow.email, subject: action.title, html: `<p>${action.body}</p>`, fromIdentity: "advisor" }),
      });
      const ok = resp.ok;
      await supabase.from("arc_actions").update({
        status: ok ? "completed" : "failed",
        executed_at: new Date().toISOString(),
        result: { http_status: resp.status },
      }).eq("id", action.id);
    } else if (action.action_type === "task_for_founder") {
      // Surface to founder action queue (admins) instead of executing
      const { data: founders } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      for (const f of founders ?? []) {
        await supabase.from("founder_action_queue").insert({
          founder_id: f.user_id,
          proposed_by: "arc_engine",
          target_user_id: userRow.user_id,
          action_type: "message_user",
          title: action.title,
          description: action.body,
          ai_reasoning: `ARC rule fired: ${action.title}`,
          risk_level: "low",
          payload: { arc_action_id: action.id, target_email: userRow.email },
        });
      }
      await supabase.from("arc_actions").update({ status: "completed", executed_at: new Date().toISOString(), result: { surfaced: true } }).eq("id", action.id);
    } else {
      // Default: mark skipped (no channel handler yet)
      await supabase.from("arc_actions").update({ status: "skipped", executed_at: new Date().toISOString(), result: { reason: "no_handler" } }).eq("id", action.id);
    }
  } catch (e) {
    await supabase.from("arc_actions").update({ status: "failed", result: { error: e instanceof Error ? e.message : String(e) } }).eq("id", action.id);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    // Auth: service role OR admin
    const auth = req.headers.get("Authorization");
    let allowed = false;
    if (auth) {
      const token = auth.replace("Bearer ", "");
      if (token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) allowed = true;
      else {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          const { data: roleRow } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
          if (roleRow) allowed = true;
        }
      }
    }
    if (!allowed) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const now = Date.now();
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, email, company_name, industry").limit(2000);
    const { data: rules } = await supabase.from("arc_rules").select("*").eq("is_active", true).order("priority", { ascending: false });

    let scored = 0; let actionsQueued = 0; let actionsDispatched = 0;
    for (const p of profiles ?? []) {
      const h = await recomputeHealthForUser(p, now);
      scored++;
      for (const rule of rules ?? []) {
        if (rule.industries && rule.industries.length && !rule.industries.includes(p.industry)) continue;
        if (!ruleMatches(rule, h)) continue;
        const action = await maybeQueueAction(rule, p, h);
        if (action) {
          actionsQueued++;
          await dispatchAction(action, p);
          actionsDispatched++;
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, scored, actionsQueued, actionsDispatched }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("arc-orchestrator error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});