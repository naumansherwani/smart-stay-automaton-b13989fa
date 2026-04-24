import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { firstMessage } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "Generate a short 3 to 6 word chat title for the founder conversation. No quotes no punctuation just the title." },
          { role: "user", content: String(firstMessage || "").slice(0, 400) },
        ],
      }),
    });
    if (!resp.ok) {
      return new Response(JSON.stringify({ title: "New conversation" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await resp.json();
    const title = (data?.choices?.[0]?.message?.content || "New conversation").trim().replace(/["'.,]+$/g, "").slice(0, 60);
    return new Response(JSON.stringify({ title }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ title: "New conversation" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
