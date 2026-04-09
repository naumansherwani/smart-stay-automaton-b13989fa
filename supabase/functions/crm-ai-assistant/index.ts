const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.102.1";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check premium subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status, is_lifetime")
      .eq("user_id", user.id)
      .single();

    const isPremium = sub?.is_lifetime || sub?.plan === "premium" || sub?.status === "trialing";
    if (!isPremium) {
      return new Response(JSON.stringify({ error: "Premium subscription required for AI CRM features" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, data } = body;

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result;

    switch (action) {
      case "analyze_ticket":
        result = await analyzeTicket(data);
        break;
      case "score_contact":
        result = await scoreContact(data);
        break;
      case "suggest_resolution":
        result = await suggestResolution(data);
        break;
      case "predict_churn":
        result = await predictChurn(data);
        break;
      case "draft_response":
        result = await draftResponse(data);
        break;
      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("CRM AI error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch("https://ai.lovable.dev/api/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

async function analyzeTicket(data: { subject: string; description: string; industry: string; category: string }) {
  const prompt = `Analyze this ${data.industry} support ticket and provide:
1. AI summary (2-3 sentences)
2. Suggested category
3. Sentiment (positive/neutral/negative/angry)
4. Priority recommendation (low/medium/high/critical)
5. Suggested resolution steps

Ticket Subject: ${data.subject}
Description: ${data.description}
Current Category: ${data.category}

Return JSON: { "summary": "", "suggested_category": "", "sentiment": "", "priority": "", "resolution_steps": ["step1", "step2"] }`;

  const result = await callAI(
    "You are an expert CRM AI assistant specializing in customer support ticket analysis. Always return valid JSON.",
    prompt
  );
  return JSON.parse(result);
}

async function scoreContact(data: { name: string; total_bookings: number; total_revenue: number; lifecycle_stage: string; last_contacted_at: string | null; industry: string }) {
  const prompt = `Score this ${data.industry} contact on a scale of 0-100 based on their value and engagement:

Name: ${data.name}
Total Bookings: ${data.total_bookings}
Total Revenue: $${data.total_revenue}
Lifecycle Stage: ${data.lifecycle_stage}
Last Contact: ${data.last_contacted_at || "Never"}

Return JSON: { "score": 0, "reason": "explanation", "churn_risk": "low|medium|high", "recommendations": ["action1", "action2"] }`;

  const result = await callAI(
    "You are an AI CRM scoring engine. Evaluate contacts based on engagement, revenue, and recency. Always return valid JSON.",
    prompt
  );
  return JSON.parse(result);
}

async function suggestResolution(data: { subject: string; description: string; category: string; industry: string }) {
  const prompt = `Suggest a resolution for this ${data.industry} ${data.category} issue:

Subject: ${data.subject}
Description: ${data.description}

Return JSON: { "suggested_resolution": "detailed resolution text", "response_template": "template for customer response", "escalation_needed": false, "similar_issues_tip": "common pattern note" }`;

  const result = await callAI(
    `You are an expert ${data.industry} customer service AI. Provide actionable, empathetic resolutions. Always return valid JSON.`,
    prompt
  );
  return JSON.parse(result);
}

async function predictChurn(data: { contacts: { name: string; total_bookings: number; total_revenue: number; last_contacted_at: string | null; lifecycle_stage: string }[]; industry: string }) {
  const prompt = `Analyze these ${data.industry} contacts for churn risk:

${JSON.stringify(data.contacts.slice(0, 20))}

Return JSON: { "predictions": [{ "name": "", "churn_risk": "low|medium|high", "reason": "", "recommended_action": "" }] }`;

  const result = await callAI(
    "You are a churn prediction AI engine. Analyze customer patterns and predict which customers are likely to leave. Always return valid JSON.",
    prompt
  );
  return JSON.parse(result);
}

async function draftResponse(data: { ticket_subject: string; ticket_description: string; category: string; industry: string; tone: string }) {
  const prompt = `Draft a ${data.tone || "professional"} customer response for this ${data.industry} ${data.category} ticket:

Subject: ${data.ticket_subject}
Issue: ${data.ticket_description}

Return JSON: { "response": "the drafted response text", "subject_line": "suggested email subject" }`;

  const result = await callAI(
    `You are a customer communication expert for the ${data.industry} industry. Write clear, empathetic, professional responses. Always return valid JSON.`,
    prompt
  );
  return JSON.parse(result);
}
