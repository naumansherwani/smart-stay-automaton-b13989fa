import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    // Build a context snapshot from the database for grounded answers
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [subs, leads, deals] = await Promise.all([
      supabase.from("subscriptions").select("plan,status,created_at"),
      supabase.from("enterprise_leads").select("status,country,industry,created_at"),
      supabase.from("ent_deals").select("stage,value_gbp,created_at"),
    ]);

    const PLAN_GBP: Record<string, number> = { basic: 19, pro: 49, premium: 99, enterprise: 499, trial: 0 };
    const subsArr = subs.data || [];
    const active = subsArr.filter((s: any) => ["active", "trialing"].includes(s.status));
    const canceled = subsArr.filter((s: any) => s.status === "canceled");
    const mrr = active.reduce((sum: number, s: any) => sum + (PLAN_GBP[s.plan] || 0), 0);

    const planBreakdown: Record<string, number> = {};
    active.forEach((s: any) => { planBreakdown[s.plan] = (planBreakdown[s.plan] || 0) + 1; });

    const countryBreakdown: Record<string, number> = {};
    (leads.data || []).forEach((l: any) => { if (l.country) countryBreakdown[l.country] = (countryBreakdown[l.country] || 0) + 1; });

    const stageBreakdown: Record<string, number> = {};
    (deals.data || []).forEach((d: any) => { stageBreakdown[d.stage] = (stageBreakdown[d.stage] || 0) + 1; });

    const ctx = {
      currency: "GBP (£)",
      mrr_gbp: mrr,
      arr_gbp: mrr * 12,
      active_customers: active.length,
      canceled_customers: canceled.length,
      churn_pct: subsArr.length ? Math.round((canceled.length / subsArr.length) * 1000) / 10 : 0,
      plan_breakdown: planBreakdown,
      enterprise_leads_total: (leads.data || []).length,
      country_breakdown: countryBreakdown,
      deal_stage_breakdown: stageBreakdown,
    };

    const system = `You are the Founder AI Adviser for HostFlow AI Technologies — a UK-based global SaaS for AI-driven hospitality, travel & operations. You speak directly to the founder/CEO. Be sharp, executive-level, concise. Use £ GBP. Ground every answer in the live business snapshot below. Recommend specific next moves.

LIVE BUSINESS SNAPSHOT (JSON):
${JSON.stringify(ctx, null, 2)}

Style: 3–6 short bullet points or a punchy paragraph. No fluff. No preamble. End with one clear recommended action.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, ...(messages || [])],
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
    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("founder-adviser error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
