import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Smart routing: vision/long-context -> Gemini, deep reasoning -> GPT-5
const VISION_MODEL = "google/gemini-2.5-pro";
const REASONING_MODEL = "openai/gpt-5";
const FAST_MODEL = "google/gemini-3-flash-preview";

function pickModel(opts: { hasImages: boolean; longContext: boolean; deepReasoning: boolean }) {
  if (opts.hasImages) return VISION_MODEL;
  if (opts.deepReasoning) return REASONING_MODEL;
  if (opts.longContext) return VISION_MODEL;
  return FAST_MODEL;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode, conversationId, deepReasoning } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Build a context snapshot from the database for grounded answers
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Identify the founder calling — required for persistence + admin gating
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      userId = userData?.user?.id ?? null;
    }

    const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const [
      subs, leads, deals, refunds, alerts,
      arcEvents, arcActions, healthScores, churnScores,
      profiles, bookings, crmDeals, crmTickets, contactSubs, cancelReqs,
    ] = await Promise.all([
      supabase.from("subscriptions").select("plan,status,created_at,trial_ends_at"),
      supabase.from("enterprise_leads").select("status,country,industry,team_size,created_at,estimated_value_gbp,company_name").order("created_at", { ascending: false }).limit(200),
      supabase.from("ent_deals").select("stage,value_gbp,created_at,title").order("created_at", { ascending: false }).limit(200),
      supabase.from("payment_refunds").select("amount,reason,created_at").gte("created_at", since30d),
      supabase.from("admin_alerts").select("alert_type,severity,title,created_at,is_resolved").gte("created_at", since7d).order("created_at", { ascending: false }).limit(50),
      supabase.from("arc_lifecycle_events").select("event_type,event_category,industry,plan,created_at").gte("created_at", since7d),
      supabase.from("arc_actions").select("action_type,phase,status,created_at").gte("created_at", since30d),
      supabase.from("user_health_scores").select("user_id,health_score,risk_level,updated_at").order("health_score", { ascending: true }).limit(50),
      supabase.from("churn_risk_scores").select("user_id,risk_score,cancel_probability,suggested_action").order("risk_score", { ascending: false }).limit(20),
      supabase.from("profiles").select("user_id,email,company_name,industry,created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("bookings").select("status,total_price,created_at").gte("created_at", since30d),
      supabase.from("crm_deals").select("stage,value,industry,created_at").gte("created_at", since30d),
      supabase.from("crm_tickets").select("status,priority,industry,created_at,ai_sentiment").gte("created_at", since7d),
      supabase.from("enterprise_leads").select("created_at").gte("created_at", since24h),
      supabase.from("cancellation_requests").select("reason,plan,final_action,created_at").gte("created_at", since30d),
    ]);

    const PLAN_GBP: Record<string, number> = { basic: 19, pro: 49, premium: 99, enterprise: 499, trial: 0 };
    const subsArr = subs.data || [];
    const active = subsArr.filter((s: any) => ["active", "trialing"].includes(s.status));
    const canceled = subsArr.filter((s: any) => s.status === "canceled");
    const trials = subsArr.filter((s: any) => s.status === "trialing");
    const mrr = active.reduce((sum: number, s: any) => sum + (PLAN_GBP[s.plan] || 0), 0);

    const planBreakdown: Record<string, number> = {};
    active.forEach((s: any) => { planBreakdown[s.plan] = (planBreakdown[s.plan] || 0) + 1; });

    const countryBreakdown: Record<string, number> = {};
    (leads.data || []).forEach((l: any) => { if (l.country) countryBreakdown[l.country] = (countryBreakdown[l.country] || 0) + 1; });

    const stageBreakdown: Record<string, number> = {};
    (deals.data || []).forEach((d: any) => { stageBreakdown[d.stage] = (stageBreakdown[d.stage] || 0) + 1; });

    const pipelineValue = (deals.data || [])
      .filter((d: any) => !["won", "lost"].includes(d.stage))
      .reduce((s: number, d: any) => s + Number(d.value_gbp || 0), 0);

    // ARC engine signals
    const arcByPhase: Record<string, number> = {};
    (arcActions.data || []).forEach((a: any) => { arcByPhase[a.phase] = (arcByPhase[a.phase] || 0) + 1; });
    const arcEventBuckets: Record<string, number> = {};
    (arcEvents.data || []).forEach((e: any) => { arcEventBuckets[e.event_type] = (arcEventBuckets[e.event_type] || 0) + 1; });

    const highRiskUsers = (healthScores.data || []).filter((h: any) => h.risk_level === "high" || h.risk_level === "critical").length;
    const churnTopRisk = (churnScores.data || []).slice(0, 5).map((c: any) => ({
      score: c.risk_score, prob: c.cancel_probability, action: c.suggested_action,
    }));

    const bookingsArr = bookings.data || [];
    const revenue30d = bookingsArr.reduce((s: number, b: any) => s + Number(b.total_price || 0), 0);
    const ticketsByPriority: Record<string, number> = {};
    (crmTickets.data || []).forEach((t: any) => { ticketsByPriority[t.priority] = (ticketsByPriority[t.priority] || 0) + 1; });
    const negativeTickets = (crmTickets.data || []).filter((t: any) => t.ai_sentiment === "negative").length;

    const trialEndingSoon = (subs.data || []).filter((s: any) => {
      if (s.status !== "trialing" || !s.trial_ends_at) return false;
      const ms = new Date(s.trial_ends_at).getTime() - Date.now();
      return ms > 0 && ms < 48 * 3600 * 1000;
    }).length;

    const cancelReasons: Record<string, number> = {};
    (cancelReqs.data || []).forEach((c: any) => { cancelReasons[c.reason] = (cancelReasons[c.reason] || 0) + 1; });

    const ctx = {
      currency: "GBP (£)",
      mrr_gbp: mrr,
      arr_gbp: mrr * 12,
      active_customers: active.length,
      trial_customers: trials.length,
      trial_ending_within_48h: trialEndingSoon,
      canceled_customers: canceled.length,
      churn_pct: subsArr.length ? Math.round((canceled.length / subsArr.length) * 1000) / 10 : 0,
      plan_breakdown: planBreakdown,
      enterprise_leads_total: (leads.data || []).length,
      enterprise_leads_24h: (contactSubs.data || []).length,
      country_breakdown: countryBreakdown,
      deal_stage_breakdown: stageBreakdown,
      open_pipeline_value_gbp: pipelineValue,
      refunds_30d: (refunds.data || []).length,
      refund_amount_30d: (refunds.data || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0),
      alerts_7d: (alerts.data || []).length,
      critical_alerts_7d: (alerts.data || []).filter((a: any) => a.severity === "critical").length,
      bookings_30d: bookingsArr.length,
      bookings_revenue_30d_gbp: revenue30d,
      crm_tickets_7d: (crmTickets.data || []).length,
      crm_tickets_by_priority: ticketsByPriority,
      crm_tickets_negative_sentiment: negativeTickets,
      arc_events_7d: (arcEvents.data || []).length,
      arc_event_breakdown_7d: arcEventBuckets,
      arc_actions_30d: (arcActions.data || []).length,
      arc_actions_by_phase_30d: arcByPhase,
      high_risk_users: highRiskUsers,
      top_churn_risks: churnTopRisk,
      cancellation_reasons_30d: cancelReasons,
      total_signups: (profiles.data || []).length,
    };

    const baseSystem = `Aap HostFlow AI Technologies ke AI Co-Owner hain — UK-based global SaaS (hospitality, airlines, car rental, healthcare, education, logistics, events, fitness, legal, real estate, coworking, maritime, government, railway).

ZAROORI RULES (hamesha follow karein):
1. ROMAN URDU mein jawab dein — friendly, simple, dost ki tarah. English tab use karein jab user English mein puchhe ya technical term ho (jaise MRR, churn).
2. Short aur seedha jawab. Lambi list nahi. Jargon nahi.
3. Numbers GBP £ mein. Snapshot se hi bolein, andaza nahi.
4. Pehle 1 line mein seedha jawab dein. Phir 2-3 chhote bullets max. Aakhir mein ek "Agla qadam" line.
5. Founder ka co-owner ho — mashwara dein, hukum nahi.

Aap ke paas yeh data hai: subscriptions, bookings, CRM (contacts/deals/tickets), enterprise leads, ARC events, health scores, churn risk, refunds, alerts, cancellation reasons.

LIVE BUSINESS SNAPSHOT (last 7-30 days):
${JSON.stringify(ctx, null, 2)}`;

    // Structured insights mode for the right-side panel (Risk / Opportunity / Action / Weekly)
    if (mode === "insights") {
      const insightsSystem = `${baseSystem}

Return ONLY a strict JSON object with these keys (each value is a short 1–2 sentence string in plain English, GBP, no markdown):
{
  "risk": "...",
  "opportunity": "...",
  "action": "...",
  "weekly": "..."
}
No prose outside the JSON. No code fences.`;

      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: FAST_MODEL,
          messages: [{ role: "system", content: insightsSystem }, { role: "user", content: "Generate the four insights now." }],
          response_format: { type: "json_object" },
        }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        console.error("insights gateway error:", resp.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error", status: resp.status }), { status: resp.status === 429 || resp.status === 402 ? resp.status : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const data = await resp.json();
      let parsed: any = { risk: "", opportunity: "", action: "", weekly: "" };
      try { parsed = JSON.parse(data?.choices?.[0]?.message?.content || "{}"); } catch { /* ignore */ }
      return new Response(JSON.stringify({ insights: parsed, snapshot: ctx }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const system = `${baseSystem}

JAWAB KA STYLE:
- Roman Urdu mein. Bilkul simple. Jaise WhatsApp pe dost ko likh rahe ho.
- Pehli line: seedha jawab (1 sentence).
- Phir 2-3 chhote points snapshot ke numbers ke saath.
- Aakhir mein: "Agla qadam:" — ek chhota kaam jo founder 24 ghante mein kar sake.
- No markdown headers. No bullets ke andar bullets. No emoji spam.
- Agar user "sales kaise barhein" ya kuch vague puchhe — snapshot se sab se strong signal uthao (sab se bara pipeline, sab se kamzor plan, top churn risk) aur ek concrete plan do.
- Agar screenshot upload ho — UI/conversion ke baare mein simple feedback do.
- Mushkil baat nahi karna. Founder ko confuse mat karein.`;

    // Detect images in the latest user message (multimodal content array)
    const incoming = Array.isArray(messages) ? messages : [];
    const hasImages = incoming.some((m: any) =>
      Array.isArray(m?.content) && m.content.some((p: any) => p?.type === "image_url"),
    );
    const totalLen = JSON.stringify(incoming).length;
    const longContext = totalLen > 6000 || incoming.length > 12;
    const model = pickModel({ hasImages, longContext, deepReasoning: !!deepReasoning });

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...incoming],
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable workspace." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content || "No response.";

    // Persist assistant reply if a conversation id is provided and caller is admin
    if (conversationId && userId) {
      try {
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        if (roleRow) {
          await supabase.from("founder_ai_messages").insert({
            conversation_id: conversationId,
            user_id: userId,
            role: "assistant",
            content: reply,
            model,
          });
        }
      } catch (persistErr) {
        console.warn("persist assistant message failed:", persistErr);
      }
    }

    return new Response(JSON.stringify({ reply, model }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("founder-adviser error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
