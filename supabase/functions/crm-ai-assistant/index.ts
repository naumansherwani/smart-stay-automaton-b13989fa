const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.102.1";
import { pickTierAndCheck, tierDenyResponse } from "../_shared/ai-tier.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Resolved per-request via tier router (set inside handler before calling helpers).
let CURRENT_MODEL = "google/gemini-2.5-flash-lite";

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

    // Check subscription: Premium OR Trial users get full access
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status, is_lifetime, trial_ends_at")
      .eq("user_id", user.id)
      .single();

    const isLifetime = sub?.is_lifetime;
    const isPremium = sub?.plan === "premium";
    const isTrialing = sub?.status === "trialing" && sub?.trial_ends_at && new Date(sub.trial_ends_at) > new Date();
    const isActiveSubscription = sub?.status === "active";

    if (!isLifetime && !isPremium && !isTrialing && !isActiveSubscription) {
      return new Response(JSON.stringify({ error: "Active subscription required for AI CRM features. Start a free trial or choose a plan." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tier-aware model selection + trial daily cap + fair-use protection.
    const decision = await pickTierAndCheck(authHeader, "structured", "crm-ai-assistant");
    if (!decision.allowed) return tierDenyResponse(decision, corsHeaders);
    CURRENT_MODEL = decision.model;

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
      case "bulk_score_contacts":
        result = await bulkScoreContacts(data);
        break;
      case "generate_report":
        result = await generateReport(data);
        break;
      case "smart_assign":
        result = await smartAssign(data);
        break;
      case "sentiment_trend":
        result = await sentimentTrend(data);
        break;
      case "deal_forecast":
        result = await dealForecast(data);
        break;
      case "compose_email":
        result = await composeEmail(data);
        break;
      case "revenue_forecast":
        result = await revenueForecast(data);
        break;
      case "competitor_analysis":
        result = await competitorAnalysis(data);
        break;
      case "suggest_meeting":
        result = await suggestMeeting(data);
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
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: CURRENT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 900,
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
6. Estimated resolution time
7. Root cause analysis

Ticket Subject: ${data.subject}
Description: ${data.description}
Current Category: ${data.category}

Return JSON: { "summary": "", "suggested_category": "", "sentiment": "", "priority": "", "resolution_steps": ["step1", "step2"], "estimated_resolution_hours": 0, "root_cause": "", "auto_response_suggestion": "" }`;

  const result = await callAI(
    "You are an expert CRM AI assistant specializing in customer support ticket analysis across all industries. Provide deep, actionable insights. Always return valid JSON.",
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

Return JSON: { "score": 0, "reason": "explanation", "churn_risk": "low|medium|high", "recommendations": ["action1", "action2"], "lifetime_value_estimate": 0, "engagement_level": "cold|warm|hot" }`;

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

Return JSON: { "suggested_resolution": "detailed resolution text", "response_template": "template for customer response", "escalation_needed": false, "similar_issues_tip": "common pattern note", "prevention_advice": "how to prevent this in future", "sla_category": "standard|priority|urgent" }`;

  const result = await callAI(
    `You are an expert ${data.industry} customer service AI. Provide actionable, empathetic resolutions. Always return valid JSON.`,
    prompt
  );
  return JSON.parse(result);
}

async function predictChurn(data: { contacts: { name: string; total_bookings: number; total_revenue: number; last_contacted_at: string | null; lifecycle_stage: string }[]; industry: string }) {
  const prompt = `Analyze these ${data.industry} contacts for churn risk:

${JSON.stringify(data.contacts.slice(0, 20))}

Return JSON: { "predictions": [{ "name": "", "churn_risk": "low|medium|high", "churn_probability": 0, "reason": "", "recommended_action": "", "urgency": "immediate|this_week|this_month" }], "overall_health": "healthy|at_risk|critical", "summary": "" }`;

  const result = await callAI(
    "You are a churn prediction AI engine. Analyze customer patterns and predict which customers are likely to leave. Be specific and actionable. Always return valid JSON.",
    prompt
  );
  return JSON.parse(result);
}

async function draftResponse(data: { ticket_subject: string; ticket_description: string; category: string; industry: string; tone: string }) {
  const prompt = `Draft a ${data.tone || "professional"} customer response for this ${data.industry} ${data.category} ticket:

Subject: ${data.ticket_subject}
Issue: ${data.ticket_description}

Return JSON: { "response": "the drafted response text", "subject_line": "suggested email subject", "follow_up_needed": true, "follow_up_date_days": 3, "internal_notes": "notes for the team" }`;

  const result = await callAI(
    `You are a customer communication expert for the ${data.industry} industry. Write clear, empathetic, professional responses. Always return valid JSON.`,
    prompt
  );
  return JSON.parse(result);
}

async function bulkScoreContacts(data: { contacts: { name: string; total_bookings: number; total_revenue: number; lifecycle_stage: string; last_contacted_at: string | null }[]; industry: string }) {
  const prompt = `Score these ${data.industry} contacts (0-100) and categorize them:

${JSON.stringify(data.contacts.slice(0, 30))}

Return JSON: { "scores": [{ "name": "", "score": 0, "tier": "platinum|gold|silver|bronze", "churn_risk": "low|medium|high", "next_action": "" }], "segment_summary": { "high_value": 0, "at_risk": 0, "needs_attention": 0 } }`;

  const result = await callAI(
    "You are a CRM AI that bulk-scores contacts for prioritization. Be consistent and fair. Always return valid JSON.",
    prompt
  );
  return JSON.parse(result);
}

async function generateReport(data: { industry: string; contacts_count: number; open_tickets: number; resolved_tickets: number; pipeline_value: number; won_deals: number; lost_deals: number; period: string }) {
  const prompt = `Generate an executive CRM performance report for a ${data.industry} business:

Period: ${data.period}
Contacts: ${data.contacts_count}
Open Tickets: ${data.open_tickets}
Resolved Tickets: ${data.resolved_tickets}
Pipeline Value: $${data.pipeline_value}
Won Deals: ${data.won_deals}
Lost Deals: ${data.lost_deals}

Return JSON: { "executive_summary": "", "key_metrics": [{ "metric": "", "value": "", "trend": "up|down|stable", "insight": "" }], "recommendations": ["action1", "action2", "action3"], "risk_alerts": ["alert1"], "opportunities": ["opp1"] }`;

  const result = await callAI(
    "You are a business intelligence AI. Generate concise, data-driven executive reports with actionable insights. Always return valid JSON.",
    prompt
  );
  return JSON.parse(result);
}

async function smartAssign(data: { ticket_subject: string; ticket_description: string; category: string; priority: string; industry: string; team_members: string[] }) {
  const prompt = `Recommend the best team member to handle this ${data.industry} ticket:

Subject: ${data.ticket_subject}
Description: ${data.ticket_description}
Category: ${data.category}
Priority: ${data.priority}
Team: ${data.team_members.join(", ")}

Return JSON: { "recommended_assignee": "", "reason": "", "skills_needed": ["skill1"], "estimated_resolution_hours": 0, "collaboration_needed": false, "backup_assignee": "" }`;

  const result = await callAI(
    "You are a smart ticket routing AI. Assign tickets to the best-suited team member based on expertise and workload. Always return valid JSON.",
    prompt
  );
  return JSON.parse(result);
}

async function sentimentTrend(data: { tickets: { subject: string; description: string; created_at: string; status: string; ai_sentiment: string | null }[]; industry: string }) {
  const prompt = `Analyze sentiment trends from these ${data.industry} tickets:

${JSON.stringify(data.tickets.slice(0, 30))}

Return JSON: { "overall_sentiment": "positive|neutral|negative", "trend": "improving|declining|stable", "sentiment_breakdown": { "positive": 0, "neutral": 0, "negative": 0, "angry": 0 }, "top_complaints": ["issue1", "issue2"], "positive_highlights": ["highlight1"], "recommendations": ["rec1", "rec2"] }`;

  const result = await callAI(
    "You are a sentiment analysis AI for CRM. Analyze customer feedback trends and provide actionable insights. Always return valid JSON.",
    prompt
  );
  return JSON.parse(result);
}

async function dealForecast(data: { deals: { title: string; value: number; stage: string; probability: number; expected_close_date: string | null; created_at: string }[]; industry: string }) {
  const prompt = `Forecast deal outcomes for this ${data.industry} pipeline:

${JSON.stringify(data.deals.slice(0, 25))}

Return JSON: { "total_forecast_value": 0, "weighted_pipeline": 0, "expected_closings_30d": 0, "at_risk_deals": [{ "title": "", "risk_reason": "", "suggestion": "" }], "best_opportunities": [{ "title": "", "reason": "" }], "pipeline_health": "strong|moderate|weak", "recommendations": ["rec1", "rec2"] }`;

  const result = await callAI(
    "You are a sales forecasting AI. Analyze deal pipelines and predict outcomes with high accuracy. Always return valid JSON.",
    prompt
  );
  return JSON.parse(result);
}

async function composeEmail(data: { industry: string; emailType: string; tone: string; customPrompt?: string; contact?: any; language?: string; passengerTier?: string; voucher?: { code: string; type: string } | null }) {
  const contactInfo = data.contact ? `\nContact: ${data.contact.name}, Stage: ${data.contact.lifecycle_stage}, Revenue: $${data.contact.total_revenue || 0}, Bookings: ${data.contact.total_bookings || 0}, Tags: ${(data.contact.tags || []).join(", ")}` : "";
  
  // Segmented template logic
  let toneInstruction = `Tone: ${data.tone}.`;
  if (data.passengerTier === "vip") {
    toneInstruction = "Tone: Extremely respectful, humble, and exclusive. Address them as a valued VIP member. Use premium language befitting their status.";
  } else if (data.passengerTier === "high-value") {
    toneInstruction = "Tone: Premium and appreciative. Acknowledge their loyalty and importance to the business.";
  }

  // Voucher insertion
  let voucherInstruction = "";
  if (data.voucher) {
    const voucherLabels: Record<string, string> = {
      discount: "15% Discount Voucher",
      lounge_pass: "Complimentary Lounge Access Pass",
      upgrade: "Complimentary Seat Upgrade",
      miles: "5,000 Bonus Miles Credit",
    };
    voucherInstruction = `\n\nIMPORTANT: Include this compensation in the email body:\nVoucher Code: ${data.voucher.code}\nVoucher Type: ${voucherLabels[data.voucher.type] || data.voucher.type}\nPresent it professionally within the email as a gesture of goodwill.`;
  }

  // Multi-language instruction
  let langInstruction = "";
  if (data.language && data.language !== "en") {
    const langNames: Record<string, string> = { ar: "Arabic", ur: "Urdu", hi: "Hindi", es: "Spanish", fr: "French", de: "German", pt: "Portuguese", zh: "Chinese", ja: "Japanese", ko: "Korean", tr: "Turkish" };
    langInstruction = `\n\nCRITICAL: Write the ENTIRE email (subject and body) in ${langNames[data.language] || data.language}. Do NOT write in English.`;
  }

  const prompt = `Compose a ${data.emailType} email for a ${data.industry} business.${contactInfo}\n${toneInstruction}${voucherInstruction}${langInstruction}${data.customPrompt ? `\nAdditional instructions: ${data.customPrompt}` : ""}

Return JSON: { "subject": "email subject line", "body": "full email body with greeting and sign-off" }`;

  const result = await callAI(
    `You are an expert email copywriter for ${data.industry} businesses. Write compelling, personalized emails. ${data.passengerTier === "vip" ? "This is a VIP client - use the most respectful and exclusive language." : ""} Always return valid JSON.`,
    prompt
  );
  return JSON.parse(result);
}

async function revenueForecast(data: { industry: string; deals: any[]; historical: any[] }) {
  const prompt = `Based on this ${data.industry} business data, forecast revenue for the next 3 months:

Historical Revenue: ${JSON.stringify(data.historical || [])}
Current Pipeline: ${JSON.stringify((data.deals || []).slice(0, 30))}

Return JSON: { "monthly_forecast": [{ "month": "Month Year", "predicted": 0, "confidence_low": 0, "confidence_high": 0 }], "quarterly_total": 0, "growth_rate": 0, "key_factors": ["factor1", "factor2"], "recommendations": ["rec1", "rec2"] }`;

  const result = await callAI(
    "You are a revenue forecasting AI. Use historical data and pipeline analysis to make accurate predictions. Always return valid JSON.",
    prompt
  );
  return JSON.parse(result);
}

async function competitorAnalysis(data: { industry: string; competitors: string[] }) {
  const prompt = `Analyze these competitors in the ${data.industry} industry: ${data.competitors.join(", ")}

Return JSON: { "competitors": [{ "name": "", "strengths": ["s1","s2"], "weaknesses": ["w1","w2"], "threat_level": "high|medium|low", "market_position": "description" }], "market_trends": ["trend1","trend2","trend3"], "opportunities": ["opp1","opp2"], "your_advantages": ["adv1","adv2"], "radar_data": [{ "metric": "Pricing", "you": 75, "avg_competitor": 60 }, { "metric": "Service", "you": 80, "avg_competitor": 70 }, { "metric": "Technology", "you": 85, "avg_competitor": 65 }, { "metric": "Brand", "you": 60, "avg_competitor": 75 }, { "metric": "Support", "you": 90, "avg_competitor": 70 }] }`;

  const result = await callAI(
    `You are a competitive intelligence AI analyst for the ${data.industry} industry. Provide deep, actionable competitor insights. Always return valid JSON.`,
    prompt
  );
  return JSON.parse(result);
}

async function suggestMeeting(data: { industry: string; meetingType: string; timezone: string; notes?: string; contact?: any }) {
  const contactInfo = data.contact ? `\nContact: ${data.contact.name}, Stage: ${data.contact.lifecycle_stage}, Last Contact: ${data.contact.last_contacted_at || "Never"}` : "";
  const prompt = `Suggest 3-5 optimal meeting slots for a ${data.meetingType} meeting in ${data.industry}.${contactInfo}
Timezone: ${data.timezone}${data.notes ? `\nNotes: ${data.notes}` : ""}

Consider business hours, industry patterns, and optimal engagement times.

Return JSON: { "slots": [{ "date": "Day, Month Date", "time": "HH:MM AM/PM", "duration": "30 min", "reason": "why this time is optimal", "score": 90 }], "agenda": "suggested meeting agenda with bullet points" }`;

  const result = await callAI(
    `You are a smart scheduling AI. Suggest optimal meeting times based on industry patterns, contact behavior, and timezone. Always return valid JSON.`,
    prompt
  );
  return JSON.parse(result);
}
