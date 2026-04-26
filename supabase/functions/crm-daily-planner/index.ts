const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { pickTierAndCheck, tierDenyResponse } from "../_shared/ai-tier.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

let CURRENT_MODEL = "google/gemini-2.5-flash-lite";

async function callAI(systemPrompt: string, userPrompt: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: CURRENT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content || "{}");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const decision = await pickTierAndCheck(authHeader, "structured", "crm-daily-planner");
    if (!decision.allowed) return tierDenyResponse(decision, corsHeaders);
    CURRENT_MODEL = decision.model;

    const body = await req.json();
    const { action, industry, tasks, today_tasks, pending_tasks, overdue_tasks, completed_count } = body;

    if (action === "organize_tasks") {
      const systemPrompt = `You are an AI task organizer for the ${industry} industry CRM. 
Analyze the tasks and return JSON with "organized_tasks" array where each item has:
- id (original task id)
- ai_priority_score (1-10, 10 = highest priority)
- ai_category (industry-relevant category like "client-follow-up", "scheduling", "billing", "maintenance", etc.)
- ai_suggestions (array of 1-2 short actionable tips)
- sort_order (integer, 0 = do first)

Consider: deadlines, industry context, task descriptions, and logical dependencies.`;

      const userPrompt = `Organize these ${industry} tasks:\n${JSON.stringify(tasks, null, 2)}`;
      const result = await callAI(systemPrompt, userPrompt);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_daily_plan") {
      const systemPrompt = `You are an AI daily planner for the ${industry} industry CRM.
Generate a smart daily plan. Return JSON with:
- tasks_summary: array of {title, priority, reason} - ordered by importance
- recommendations: array of strings (3-5 actionable tips for today)
- focus_areas: array of strings (2-3 key focus areas)
- productivity_score: number 1-10 based on workload balance
- mood: string assessment like "Productive Day", "Heavy Workload", "Light Day", "Catch-up Needed"

Consider: overdue tasks need attention first, industry-specific priorities, balanced workload.`;

      const userPrompt = `Generate daily plan for ${industry} professional:
Today's tasks: ${JSON.stringify(today_tasks)}
Pending tasks: ${JSON.stringify(pending_tasks)}
Overdue tasks: ${JSON.stringify(overdue_tasks)}
Completed so far: ${completed_count} tasks`;

      const result = await callAI(systemPrompt, userPrompt);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
