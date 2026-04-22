import "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const m = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const prompt = `You are a senior SaaS growth strategist analyzing HostFlow AI metrics.

Current snapshot:
- MRR: $${m.mrr}
- ARR: $${m.arr}
- Active subscribers: ${m.activeSubs}
- Trialing: ${m.trialing}
- Churn rate: ${m.churnRate?.toFixed(1)}%
- Trial→Paid conversion: ${m.trialConversion?.toFixed(1)}%
- Net MRR growth: ${m.netGrowth?.toFixed(1)}%
- Save rate (retention wizard): ${m.saveRate?.toFixed(1)}%
- Plan revenue: ${JSON.stringify(m.planRevenue)}
- Industry revenue: ${JSON.stringify(m.industryRevenue)}
- Top churn reasons: ${JSON.stringify(m.churnReasons)}
- Refund rate (30d): ${m.refundRate?.toFixed(2) ?? 0}% (${m.refundCount ?? 0} refunds, $${(m.refundAmount ?? 0).toFixed(2)})
- Refund reasons: ${JSON.stringify(m.refundReasons || {})}

Provide 5 sharp founder insights and 3 concrete recommendations. **Always include a dedicated section called "Refund Diagnosis"** that answers: Why are users requesting refunds? Look at refund reasons + churn reasons together and pinpoint the root cause (UX, pricing, expectations, billing surprises). Be specific, use numbers. Format as markdown with bullet points. Keep it under 400 words.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an elite SaaS growth advisor. Output crisp markdown with **bold** headers, bullet points, and concrete actions." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limited, try again later" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in workspace settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) throw new Error(`AI error ${r.status}`);

    const data = await r.json();
    const insights = data.choices?.[0]?.message?.content || "No insights returned.";
    return new Response(JSON.stringify({ insights }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("mrr-ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
