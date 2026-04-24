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

    const [subs, leads, deals, refunds, alerts] = await Promise.all([
      supabase.from("subscriptions").select("plan,status,created_at"),
      supabase.from("enterprise_leads").select("status,country,industry,team_size,created_at,estimated_value_gbp"),
      supabase.from("ent_deals").select("stage,value_gbp,created_at"),
      supabase.from("payment_refunds").select("amount,reason,created_at").gte("created_at", new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()),
      supabase.from("admin_alerts").select("alert_type,severity,created_at").gte("created_at", new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()),
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

    const ctx = {
      currency: "GBP (£)",
      mrr_gbp: mrr,
      arr_gbp: mrr * 12,
      active_customers: active.length,
      trial_customers: trials.length,
      canceled_customers: canceled.length,
      churn_pct: subsArr.length ? Math.round((canceled.length / subsArr.length) * 1000) / 10 : 0,
      plan_breakdown: planBreakdown,
      enterprise_leads_total: (leads.data || []).length,
      country_breakdown: countryBreakdown,
      deal_stage_breakdown: stageBreakdown,
      open_pipeline_value_gbp: pipelineValue,
      refunds_30d: (refunds.data || []).length,
      refund_amount_30d: (refunds.data || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0),
      alerts_7d: (alerts.data || []).length,
      critical_alerts_7d: (alerts.data || []).filter((a: any) => a.severity === "critical").length,
    };

    const baseSystem = `You are the Founder AI Strategist for HostFlow AI Technologies — a UK-based global SaaS for AI-driven hospitality, travel & operations. You speak directly to the founder/CEO. Be sharp, executive-level, concise. Use £ GBP. Ground every answer in the live business snapshot below. Recommend specific next moves.

LIVE BUSINESS SNAPSHOT (JSON):
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

Style guide:
- Clear executive answers in plain text
- Use short bullet points or a punchy paragraph (3–6 lines)
- Avoid unnecessary punctuation, no extra full stops or commas where not needed
- No preamble, no apologies
- End with one clear recommended next move
- When the founder uploads a screenshot or image, analyse it carefully (UI quality, conversion issues, layout, trust signals, errors, competitor strengths) and tie advice back to HostFlow AI growth`;

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
