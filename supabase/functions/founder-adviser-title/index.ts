import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { routeChat } from "../_shared/ai-router.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { firstMessage } = await req.json();
    const result = await routeChat({
      task: "fast",
      messages: [
        { role: "system", content: "Generate a short 3 to 6 word chat title for the founder conversation. No quotes no punctuation just the title." },
        { role: "user", content: String(firstMessage || "").slice(0, 400) },
      ],
      temperature: 0.2,
      maxOutputTokens: 24,
      feature: "founder_adviser_title",
    });
    const title = (result.text || "New conversation").trim().replace(/["'.,]+$/g, "").slice(0, 60);
    return new Response(JSON.stringify({ title }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ title: "New conversation" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
