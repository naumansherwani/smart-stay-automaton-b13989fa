// AI Founder Intelligence — risk, opportunity, country, plan, action
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY missing");
    const metrics = await req.json();

    const system = "You are the strategic Chief of Staff to the Founder of HostFlow AI Technologies. Reply STRICTLY as JSON with keys: risk, opportunity, country, plan, action. Each value is one short sentence (max 18 words), executive tone, decisive. No markdown, no preamble.";
    const user = `Live company snapshot (GBP):\n${JSON.stringify(metrics, null, 2)}\n\nProduce the daily strategic brief.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });
    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) throw new Error(`gateway ${r.status}`);
    const j = await r.json();
    let text = j.choices?.[0]?.message?.content?.trim() || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch {
      parsed = { risk: text.slice(0, 140), opportunity: "", country: "", plan: "", action: "" };
    }
    return new Response(JSON.stringify({ ok: true, brief: parsed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
