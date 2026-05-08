// AI Email Assistant for Founder OS Compose
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRESETS: Record<string, string> = {
  reply: "Write a professional, warm reply on behalf of the founder of HostFlow AI Technologies. Keep it concise and clear.",
  shorten: "Shorten the email below. Keep the meaning and tone. Output the rewritten email only.",
  persuasive: "Rewrite the email below to be more persuasive without being pushy. Output the rewritten email only.",
  grammar: "Fix grammar and clarity in the email below. Keep voice intact. Output the corrected email only.",
  sales: "Rewrite the email below in a confident sales tone for an enterprise prospect. Output the rewritten email only.",
  founder: "Rewrite the email below in a calm, executive Founder tone. Direct, warm, decisive. Output the rewritten email only.",
  urgent: "Rewrite the email below to convey urgency professionally without being aggressive. Output the rewritten email only.",
  draft: "Draft a complete email based on the user's intent below. Sign as Nauman Sherwani, Founder, HostFlow AI Technologies.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    const uid = userData?.user?.id;
    if (!uid) return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    const { mode = "draft", input = "", context = "" } = await req.json();
    const system = "You are an elite executive email writer for the Founder of HostFlow AI Technologies. Output ONLY the final email body in plain text (no preamble, no markdown fences).";
    const instruction = PRESETS[mode] || PRESETS.draft;
    const userMsg = `${instruction}\n\n${context ? `CONTEXT (previous email):\n${context}\n\n` : ""}EMAIL/INTENT:\n${input}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, { role: "user", content: userMsg }],
      }),
    });
    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: "AI gateway error", detail: t }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await r.json();
    const text = j.choices?.[0]?.message?.content?.trim() || "";
    return new Response(JSON.stringify({ ok: true, text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});