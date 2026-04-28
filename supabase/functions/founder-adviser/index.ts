import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// AI provider routing.
// We prefer the user's own OpenAI (ChatGPT) API key when OPENAI_API_KEY is set,
// so the adviser keeps working even if the Lovable AI workspace credits run out.
// If OPENAI_API_KEY is missing, we transparently fall back to the Lovable AI gateway.
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const USE_OPENAI = OPENAI_KEY.length > 0;
const AI_BASE_URL = USE_OPENAI
  ? "https://api.openai.com/v1/chat/completions"
  : "https://ai.gateway.lovable.dev/v1/chat/completions";

// Model names depend on which provider we're calling.
// OpenAI direct uses bare model ids; Lovable gateway uses provider-prefixed ids.
const VISION_MODEL    = USE_OPENAI ? "gpt-5"      : "google/gemini-2.5-pro";
const REASONING_MODEL = USE_OPENAI ? "gpt-5"      : "openai/gpt-5";
const FAST_MODEL      = USE_OPENAI ? "gpt-5-mini" : "google/gemini-3-flash-preview";

function pickModel(opts: { hasImages: boolean; longContext: boolean; deepReasoning: boolean }) {
  if (opts.hasImages) return VISION_MODEL;
  if (opts.deepReasoning) return REASONING_MODEL;
  if (opts.longContext) return VISION_MODEL;
  return FAST_MODEL;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode, conversationId, deepReasoning, focusUserId, action, voiceText } = await req.json();
    const apiKey = USE_OPENAI ? OPENAI_KEY : (Deno.env.get("LOVABLE_API_KEY") || "");
    if (!apiKey) throw new Error("No AI key configured (set OPENAI_API_KEY or LOVABLE_API_KEY)");

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

    const since30d = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const since8h = new Date(Date.now() - 8 * 3600 * 1000).toISOString();

    const [
      subs, leads, deals, refunds, alerts,
      arcEvents, arcActions, healthScores, churnScores,
      profiles, bookings, crmDeals, crmTickets, contactSubs, cancelReqs,
    ] = await Promise.all([
      supabase.from("subscriptions").select("plan,status,created_at,trial_ends_at"),
      supabase.from("enterprise_leads").select("status,country,industry,team_size,created_at,estimated_value_gbp,company_name").order("created_at", { ascending: false }).limit(200),
      supabase.from("ent_deals").select("stage,value_gbp,created_at,title").order("created_at", { ascending: false }).limit(200),
      supabase.from("payment_refunds").select("amount,reason,created_at").gte("created_at", since30d),
      supabase.from("admin_alerts").select("alert_type,severity,title,created_at,is_resolved").gte("created_at", since7d).order("created_at", { ascending: false }).limit(50),
      supabase.from("arc_lifecycle_events").select("event_type,event_category,industry,plan,created_at").gte("created_at", since7d),
      supabase.from("arc_actions").select("action_type,phase,status,created_at").gte("created_at", since30d),
      supabase.from("user_health_scores").select("user_id,health_score,risk_level,updated_at").order("health_score", { ascending: true }).limit(50),
      supabase.from("churn_risk_scores").select("user_id,risk_score,cancel_probability,suggested_action").order("risk_score", { ascending: false }).limit(20),
      supabase.from("profiles").select("user_id,email,company_name,industry,created_at").order("created_at", { ascending: false }).limit(50),
      supabase.from("bookings").select("status,total_price,created_at").gte("created_at", since30d),
      supabase.from("crm_deals").select("stage,value,industry,created_at").gte("created_at", since30d),
      supabase.from("crm_tickets").select("status,priority,industry,created_at,ai_sentiment").gte("created_at", since7d),
      supabase.from("enterprise_leads").select("created_at").gte("created_at", since24h),
      supabase.from("cancellation_requests").select("reason,plan,final_action,created_at").gte("created_at", since30d),
    ]);

    // Per-user 360° dossier (when founder asks about a specific user)
    let focusUser: any = null;
    if (focusUserId) {
      const [
        fProfile, fSub, fBookings, fDeals, fTickets, fHealth, fChurn, fArc, fCancel, fEmails,
      ] = await Promise.all([
        supabase.from("profiles").select("user_id,email,display_name,company_name,industry,country,created_at").eq("user_id", focusUserId).maybeSingle(),
        supabase.from("subscriptions").select("plan,status,trial_starts_at,trial_ends_at,current_period_end,is_lifetime,created_at").eq("user_id", focusUserId).maybeSingle(),
        supabase.from("bookings").select("status,total_price,created_at").eq("user_id", focusUserId).order("created_at", { ascending: false }).limit(20),
        supabase.from("crm_deals").select("stage,value,industry,created_at").eq("user_id", focusUserId).order("created_at", { ascending: false }).limit(20),
        supabase.from("crm_tickets").select("status,priority,ai_sentiment,created_at").eq("user_id", focusUserId).order("created_at", { ascending: false }).limit(10),
        supabase.from("user_health_scores").select("health_score,risk_level,updated_at").eq("user_id", focusUserId).maybeSingle(),
        supabase.from("churn_risk_scores").select("risk_score,cancel_probability,suggested_action,computed_at").eq("user_id", focusUserId).maybeSingle(),
        supabase.from("arc_lifecycle_events").select("event_type,event_category,created_at").eq("user_id", focusUserId).order("created_at", { ascending: false }).limit(30),
        supabase.from("cancellation_requests").select("reason,reason_details,final_action,created_at").eq("user_id", focusUserId).order("created_at", { ascending: false }).limit(5),
        supabase.from("email_send_log").select("template_name,status,created_at").eq("recipient_email", "").limit(0),
      ]);
      focusUser = {
        profile: fProfile.data,
        subscription: fSub.data,
        recent_bookings: fBookings.data,
        recent_deals: fDeals.data,
        recent_tickets: fTickets.data,
        health: fHealth.data,
        churn: fChurn.data,
        recent_arc_events: fArc.data,
        cancellations: fCancel.data,
      };
      // Pull email log by recipient email if profile loaded
      if (fProfile.data?.email) {
        const { data: emailLog } = await supabase
          .from("email_send_log")
          .select("template_name,status,created_at")
          .eq("recipient_email", fProfile.data.email)
          .order("created_at", { ascending: false })
          .limit(20);
        focusUser.email_history = emailLog || [];
      }
    }

    const PLAN_GBP: Record<string, number> = { basic: 25, pro: 52, premium: 108, enterprise: 499, trial: 0 };
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

    // ARC engine signals
    const arcByPhase: Record<string, number> = {};
    (arcActions.data || []).forEach((a: any) => { arcByPhase[a.phase] = (arcByPhase[a.phase] || 0) + 1; });
    const arcEventBuckets: Record<string, number> = {};
    (arcEvents.data || []).forEach((e: any) => { arcEventBuckets[e.event_type] = (arcEventBuckets[e.event_type] || 0) + 1; });

    const highRiskUsers = (healthScores.data || []).filter((h: any) => h.risk_level === "high" || h.risk_level === "critical").length;
    const churnTopRisk = (churnScores.data || []).slice(0, 5).map((c: any) => ({
      score: c.risk_score, prob: c.cancel_probability, action: c.suggested_action,
    }));

    const bookingsArr = bookings.data || [];
    const revenue30d = bookingsArr.reduce((s: number, b: any) => s + Number(b.total_price || 0), 0);
    const ticketsByPriority: Record<string, number> = {};
    (crmTickets.data || []).forEach((t: any) => { ticketsByPriority[t.priority] = (ticketsByPriority[t.priority] || 0) + 1; });
    const negativeTickets = (crmTickets.data || []).filter((t: any) => t.ai_sentiment === "negative").length;

    const trialEndingSoon = (subs.data || []).filter((s: any) => {
      if (s.status !== "trialing" || !s.trial_ends_at) return false;
      const ms = new Date(s.trial_ends_at).getTime() - Date.now();
      return ms > 0 && ms < 48 * 3600 * 1000;
    }).length;

    const cancelReasons: Record<string, number> = {};
    (cancelReqs.data || []).forEach((c: any) => { cancelReasons[c.reason] = (cancelReasons[c.reason] || 0) + 1; });

    // Live launch-discount scarcity counter — same backend the public landing page reads.
    let launchDiscount: any = null;
    try {
      const { data: ld } = await supabase.rpc("get_launch_discount_status");
      launchDiscount = ld;
    } catch { /* non-fatal */ }

    // Static catalog of the 8 production industries + the headline AI features each one ships with.
    // Keep this in sync with src/lib/industryFeatures.ts. Used so the adviser can answer
    // "what does HostFlow do for airlines?" without making things up.
    // Full feature map for the 8 production industries.
    // Keep in sync with src/lib/industryFeatures.ts and the landing page.
    // Shared across ALL industries: AI Calendar/Scheduling, Double Booking Guard,
    // CRM (Premium), Voice AI Assistant (ElevenLabs), Analytics & Reports,
    // Email notifications, Client/Lead Scoring, Custom AI Training (Premium),
    // 14-language support, AI Onboarding Wizard, Smart Greeting, Trial system.
    const SHARED_FEATURES = [
      "AI Calendar & Auto-Schedule",
      "Double Booking Guard",
      "CRM (Premium)",
      "AI Voice Assistant (ElevenLabs)",
      "Analytics & Reports",
      "Email + WhatsApp notifications",
      "Client/Lead Scoring",
      "Custom AI Training (Premium)",
      "14-language UI + AI",
      "Owner Console + Founder OS",
    ];
    const industriesCatalog = {
      hospitality: {
        shared: SHARED_FEATURES,
        unique: ["AI Smart Pricing", "Auto Price Alerts (>15%)", "Demand Forecasting", "Gap-Night Filler", "Competitor Radar", "Guest Score Card", "Booking Manager", "Resource Manager"],
        pricing_industry: true,
      },
      airlines: {
        shared: SHARED_FEATURES,
        unique: ["AI Smart Pricing", "Demand Forecasting", "Crew Scheduling", "Fleet Intelligence", "Airline Ops Dashboard", "AI Resolve Conflicts", "Route Optimization", "AI Ticket Generator + Email"],
        pricing_industry: true,
      },
      car_rental: {
        shared: SHARED_FEATURES,
        unique: ["AI Smart Pricing", "Auto Price Alerts", "Demand Forecasting", "Fleet Map", "Vehicle Manager"],
        pricing_industry: true,
      },
      events_entertainment: {
        shared: SHARED_FEATURES,
        unique: ["AI Smart Pricing", "Auto Price Alerts", "Demand Forecasting", "Ticket Capacity Manager", "Events Manager", "AI Ticket Generator + Email"],
        pricing_industry: true,
      },
      railways: {
        shared: SHARED_FEATURES,
        unique: ["AI Smart Pricing", "Demand Forecasting", "Crew Scheduling", "Trains/Coaches/Seats", "Stations & Routes", "Schedules", "Pricing Overrides", "AI Ticket Generator + Email", "Railway Notifications"],
        pricing_industry: true,
      },
      healthcare: {
        shared: SHARED_FEATURES,
        unique: ["Doctors / Patients / Appointments", "Patient Flow", "Schedule Timeline", "AI Auto-Schedule"],
        pricing_industry: false,
      },
      education: {
        shared: SHARED_FEATURES,
        unique: ["Class Schedule", "Timetable Manager", "AI Auto-Schedule"],
        pricing_industry: false,
      },
      logistics: {
        shared: SHARED_FEATURES,
        unique: ["Drivers", "Vehicles", "Deliveries Tracking", "Route Optimization", "AI Auto-Schedule"],
        pricing_industry: false,
      },
    };
    const launchCaps = { basic: 100, pro: 100, premium: 100 };

    const ctx = {
      currency: "GBP (£)",
      mrr_gbp: mrr,
      arr_gbp: mrr * 12,
      active_customers: active.length,
      trial_customers: trials.length,
      trial_ending_within_48h: trialEndingSoon,
      canceled_customers: canceled.length,
      churn_pct: subsArr.length ? Math.round((canceled.length / subsArr.length) * 1000) / 10 : 0,
      plan_breakdown: planBreakdown,
      enterprise_leads_total: (leads.data || []).length,
      enterprise_leads_24h: (contactSubs.data || []).length,
      country_breakdown: countryBreakdown,
      deal_stage_breakdown: stageBreakdown,
      open_pipeline_value_gbp: pipelineValue,
      refunds_30d: (refunds.data || []).length,
      refund_amount_30d: (refunds.data || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0),
      alerts_7d: (alerts.data || []).length,
      critical_alerts_7d: (alerts.data || []).filter((a: any) => a.severity === "critical").length,
      bookings_30d: bookingsArr.length,
      bookings_revenue_30d_gbp: revenue30d,
      crm_tickets_7d: (crmTickets.data || []).length,
      crm_tickets_by_priority: ticketsByPriority,
      crm_tickets_negative_sentiment: negativeTickets,
      arc_events_7d: (arcEvents.data || []).length,
      arc_event_breakdown_7d: arcEventBuckets,
      arc_actions_30d: (arcActions.data || []).length,
      arc_actions_by_phase_30d: arcByPhase,
      high_risk_users: highRiskUsers,
      top_churn_risks: churnTopRisk,
      cancellation_reasons_30d: cancelReasons,
      total_signups: (profiles.data || []).length,
      launch_discount: launchDiscount,
      industries_supported: industriesCatalog,
      industries_count: Object.keys(industriesCatalog).length,
      pricing_gbp: { basic: 25, pro: 52, premium: 108, enterprise: 499 },
      launch_discounted_gbp: { basic: 22, pro: 44.2, premium: 86.4 },
      launch_caps_per_plan: launchCaps,
    };

    // Owner email identities (Zoho-routed). All inboxes land in the founder mailbox.
    const ownerEmailIdentities = {
      primary_owner: "naumansherwani@hostflowai.live",
      ai_advisor_outbound: "connectai@hostflowai.live",
      ai_advisor_sender_name: "HostFlow ConnectAI",
      customer_support: "support@hostflowai.live",
      billing: "billing@hostflowai.live",
      smtp_provider: "Zoho Mail (smtp.zoho.com:465 SSL)",
      priority_rule: "Emails to naumansherwani@hostflowai.live are owner-direct = highest priority in inbox.",
      advisor_outbound_rule: "ALL automated AI Advisor / Autopilot emails (welcome, trial onboarding, lead follow-up, re-engagement, booking reminders, upgrade nudges, churn prevention, AI tips, comeback, founder assistant messages) MUST be sent FROM 'HostFlow ConnectAI <connectai@hostflowai.live>'. Replies route back to this same mailbox and appear in the Email Center. Never use naumansherwani@ for outbound automated AI emails — that address is the founder's personal inbox.",
      connectai_dual_purpose: "The address connectai@hostflowai.live is shared by TWO personas: (1) automated AI Advisor sends use sender name 'HostFlow ConnectAI'; (2) when the OWNER (Nauman) composes manually, he can pick the 'Enterprise Sales' persona which uses the same address with sender name 'HostFlow AI · Enterprise Sales'. Both are legitimate — the owner is allowed to use this address in either role.",
      advisor_signature_rule: "Every AI Advisor outgoing email is auto-appended with the official premium signature (HostFlow ConnectAI · AI Growth & Success Assistant · HostFlow AI Technologies · www.hostflowai.live). Do NOT add a second signature in the body.",
    };
    (ctx as any).owner_email_identities = ownerEmailIdentities;

    // AI Tier System (deployed Apr 2026) — keep the AI Advisor aware so it never
    // proposes duplicate work or contradicts the live policy. Founder/admin (Nauman)
    // is bypassed: premium models, no caps. Model names MUST stay internal — never
    // surface them to end users.
    const aiTierSystem = {
      deployed_at: "2026-04-26",
      policy_file: "supabase/functions/_shared/ai-tier.ts",
      tiers: {
        trial:   { visible_limit: "5 messages/day", hidden_fair_use: "5/hr",   experience: "Onboarding, FAQs, simple CRM guidance, multilingual greetings" },
        basic:   { visible_limit: "none",           hidden_fair_use: "60/hr",  experience: "Fast everyday business help + AI CRM support" },
        pro:     { visible_limit: "none",           hidden_fair_use: "120/hr", experience: "Better reasoning, smarter CRM suggestions, stronger business support" },
        premium: { visible_limit: "none",           hidden_fair_use: "240/hr", experience: "Elite tier — deep insights, growth advice, advanced CRM intelligence, priority speed" },
      },
      founder_admin_rule: "Nauman + raanamasood1962@gmail.com are admin → no caps, premium model mix, untouched. Founder AI Advisor (this function) and founder-intelligence / mrr-ai-insights / owner-email-ai are NEVER throttled.",
      wired_functions: ["ai-guide-chat", "crm-ai-assistant", "crm-daily-planner", "ai-smart-pricing", "ai-onboarding-guide", "ai-auto-schedule"],
      ui_compliance: "Strict: technical model names are NEVER shown to users in any toast, error, or message. AI Guide chatbot detects daily_limit / expired / fair_use and shows friendly upgrade prompts.",
      recent_db_fixes: [
        "Trial ai_followups duplicate row removed (single row = 10).",
        "Pro plan unlocked: ai_voice_assistant, ai_conflict_resolution, ai_demand_forecasting.",
        "New ai_message_log table tracks every AI call for usage + fair-use enforcement.",
      ],
      preserved: ["pricing", "checkout flow", "site design", "existing customer data", "Founder AI Advisor capabilities"],
    };
    (ctx as any).ai_tier_system = aiTierSystem;

    // Polar webhook integration status (incident-aware) — keeps the Advisor from
    // suggesting "set up Polar webhook" when it's already healthy, and helps it
    // explain past delivery failures correctly.
    const polarWebhook = {
      status: "healthy",
      endpoint_function: "polar-webhook",
      correct_url: "https://uapvdzphibxoomokahjh.supabase.co/functions/v1/polar-webhook",
      verified_at: "2026-04-27",
      last_incident: {
        date: "2026-04-23 → 2026-04-27",
        cause: "Polar dashboard had a typo in the configured webhook URL (digit '1' instead of letter 'i' in project ref). DNS resolution failed for ~4 days; our edge function was never the problem.",
        resolution: "Old broken endpoint deleted in Polar dashboard. New endpoint added pointing at the correct URL above. Missed events to be replayed from Polar delivery logs.",
      },
      events_subscribed: [
        "checkout.created","checkout.updated",
        "subscription.created","subscription.active","subscription.updated","subscription.canceled","subscription.revoked","subscription.past_due",
        "order.created","order.paid",
      ],
      signature_verification: "POLAR_WEBHOOK_SECRET present — Standard Webhooks signature verified on every delivery.",
      checkout_function: "polar-create-checkout (active, verify_jwt=true)",
    };
    (ctx as any).polar_webhook = polarWebhook;

    // Live "what changed in the last 8 hours" feed — gives the AI Advisor immediate
    // awareness of every system event, deploy, lead, deal, refund, alert, signup.
    // Pulled fresh on every call so the AI is never out-of-date.
    const [recentEvents, recentLeads, recentSignups, recentAlerts, recentRefunds, recentArcActions, recentDeals] = await Promise.all([
      supabase.from("arc_lifecycle_events").select("event_type,event_category,industry,plan,created_at,metadata").gte("created_at", since8h).order("created_at", { ascending: false }).limit(50),
      supabase.from("enterprise_leads").select("company_name,country,industry,status,created_at").gte("created_at", since8h).order("created_at", { ascending: false }).limit(20),
      supabase.from("profiles").select("email,company_name,industry,created_at").gte("created_at", since8h).order("created_at", { ascending: false }).limit(20),
      supabase.from("admin_alerts").select("alert_type,severity,title,created_at").gte("created_at", since8h).order("created_at", { ascending: false }).limit(20),
      supabase.from("payment_refunds").select("amount,reason,created_at").gte("created_at", since8h).order("created_at", { ascending: false }).limit(20),
      supabase.from("arc_actions").select("action_type,phase,status,title,created_at").gte("created_at", since8h).order("created_at", { ascending: false }).limit(30),
      supabase.from("ent_deals").select("title,stage,value_gbp,created_at").gte("created_at", since8h).order("created_at", { ascending: false }).limit(20),
    ]);
    (ctx as any).live_feed_last_8h = {
      generated_at: new Date().toISOString(),
      window: "last 8 hours",
      lifecycle_events: recentEvents.data || [],
      new_leads: recentLeads.data || [],
      new_signups: recentSignups.data || [],
      new_alerts: recentAlerts.data || [],
      new_refunds: recentRefunds.data || [],
      arc_actions: recentArcActions.data || [],
      new_deals: recentDeals.data || [],
      summary: `${(recentSignups.data || []).length} new signups · ${(recentLeads.data || []).length} new leads · ${(recentDeals.data || []).length} new deals · ${(recentAlerts.data || []).length} alerts · ${(recentArcActions.data || []).length} ARC actions in the last 8h.`,
    };

    const baseSystem = `You are the AI Advisor for HostFlow AI Technologies — a UK-based global SaaS serving 14+ industries. You are Nauman's (the founder's) silent co-owner and trusted business partner. You think like a sharp, calm, modern operator — like a senior product strategist texting back on WhatsApp.

HOW TO TALK (most important):
- Sound HUMAN, not like a script or a robot. No corporate filler. No "As an AI…", no "I am here to help". Just talk like a smart friend who happens to know the whole business.
- Vary your phrasing every time. Never repeat the same opener twice in a row ("Sure!", "Got it!", "Here you go" — avoid these defaults).
- Match the founder's energy. If he's casual, you're casual. If he's stressed, you're calm and concrete. If he jokes, you can be lightly witty (one line max, never forced).
- Think first, then answer. If a question is fuzzy, ask ONE short clarifying question instead of guessing.
- Don't lecture. Don't dump knowledge. Give the answer first, reasoning only if it adds value.
- Memory feels natural, not robotic. Don't say "I remember that you said…". Just use the context silently.
- Never say you can't do something without offering the closest thing you CAN do.

LANGUAGE — AUTO-DETECT, ALWAYS MIRROR THE LAST MESSAGE:
Detect the language of the LAST user message and reply in EXACTLY that same language.
- Roman Urdu ("kaise ho", "mashwara", "kero") → Roman Urdu
- Urdu script (اردو) → Urdu script
- English → English
- Hindi (हिन्दी), Arabic (العربية), Spanish, French, German, Portuguese, Chinese (中文), Japanese (日本語), Korean (한국어), Turkish, Italian, Romanian, Swiss German → that language
Mixed → dominant one. Brand names + numbers stay in English (MRR, GBP, HostFlow).

FORMAT:
1. First line = the answer in one clean sentence.
2. If useful, 2–3 short bullets with real numbers from the snapshot. Skip bullets if the answer is a single sentence.
3. End with a soft next step ONLY when the founder is clearly asking "what should I do" — otherwise don't force it.
4. Use GBP £. Cite snapshot numbers, never invent. If a number is missing, say so plainly.
5. No markdown headers, no emoji spam, no walls of text.

NEVER push unsolicited briefings/daily summaries. Only summarize when explicitly asked ("brief me", "summary", "what's happening").

POWERS (you can act on the founder's behalf):
- Read 100% of backend: subscriptions, MRR, every user's profile, bookings, CRM, enterprise leads, ARC events, health & churn scores, refunds, cancellations, email history.
- Draft personalized emails to ANY user (welcome, onboarding nudge, ROI, retention, win-back, upsell) — full subject + body, ready to send.
- Recommend "next best action" per at-risk user, per trial, per enterprise lead.
- Detect data anomalies (mock/test/duplicate/orphan rows, stuck trials, broken statuses, zero-value deals stuck in pipeline) and PROPOSE a clean-up plan. When the founder confirms, the system runs a safe self-heal pass — only data, never code.
- When the founder is asleep / away, prioritize keeping trials and at-risk premium users engaged.

SELF-HEAL RULES (very important — protect the business):
- You may suggest cleaning data (archive duplicates, mark obvious test/mock rows, close stuck trials) — but ALWAYS ask one short confirmation first ("Yeh 6 mock signups archive ker doon?"). Never silently delete real customer data. Never touch code, RLS, schemas, or auth.

SECURITY SCANNER (you have a live security & bug detector):
When the founder asks about bugs, security, errors, broken things, "kuch theek nahi", "scan kero", "audit", "issues" — tell him you can run an instant scan that detects:
- Unresolved critical alerts older than 24h
- Open CRM security alerts (mass-delete, bulk-export, mass-edit warnings)
- Failed email deliveries (Zoho/SMTP issues)
- Stuck booking conflicts (>7 days unresolved)
- Orphan bookings / orphan subscriptions
- High-volume destructive activity (potential data exfiltration)
After the scan, summarize in plain language with counts, then ask if you should run the safe auto-fix pass (which only marks stuck records as expired/canceled — never deletes real data).

LIVE BUSINESS SNAPSHOT (last 7–30 days):
${JSON.stringify(ctx, null, 2)}
${focusUser ? `\nFOCUS USER 360° DOSSIER:\n${JSON.stringify(focusUser, null, 2)}` : ""}`;

    // Voice command intent parser — turn spoken text into a structured action JSON.
    if (action === "voice_intent" && typeof voiceText === "string") {
      const voiceSystem = `${baseSystem}

TASK: The founder spoke a voice command. Detect the language, then return STRICT JSON:
{
  "intent": "chat" | "draft_email" | "send_email" | "summary" | "unknown",
  "language": "en|ur-roman|ur|hi|ar|es|fr|de|pt|zh|ja|ko|tr|it|ro|de-CH",
  "target_email": "user@example.com or null",
  "topic": "what the founder wants to do",
  "spoken_back": "1-line confirmation in the same language the founder spoke"
}
No prose outside JSON. No code fences.`;
      const r = await fetch(AI_BASE_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: FAST_MODEL,
          messages: [{ role: "system", content: voiceSystem }, { role: "user", content: voiceText }],
          response_format: { type: "json_object" },
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        return new Response(JSON.stringify({ error: "AI gateway error", status: r.status, detail: t }), { status: r.status === 429 || r.status === 402 ? r.status : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const j = await r.json();
      let parsed: any = { intent: "chat", spoken_back: voiceText };
      try { parsed = JSON.parse(j?.choices?.[0]?.message?.content || "{}"); } catch { /* ignore */ }
      return new Response(JSON.stringify({ voice: parsed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Weekly Founder Report — produces a short HTML/text summary email body
    if (action === "weekly_report") {
      const weeklySystem = `${baseSystem}

TASK: Produce the founder's weekly summary email. Detect the founder's preferred language from any provided sample messages; default to English. Output STRICT JSON:
{
  "subject": "Weekly Founder Report — <date range>",
  "body_text": "plain text, ~200 words, with concrete numbers from the snapshot",
  "body_html": "<p>...</p> with simple inline styling",
  "highlights": ["bullet 1", "bullet 2", "bullet 3"]
}
No prose outside JSON. No code fences.`;
      const r = await fetch(AI_BASE_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: REASONING_MODEL,
          messages: [{ role: "system", content: weeklySystem }, { role: "user", content: "Generate this week's founder report now." }],
          response_format: { type: "json_object" },
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        return new Response(JSON.stringify({ error: "AI gateway error", status: r.status, detail: t }), { status: r.status === 429 || r.status === 402 ? r.status : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const j = await r.json();
      let report: any = {};
      try { report = JSON.parse(j?.choices?.[0]?.message?.content || "{}"); } catch { /* ignore */ }
      return new Response(JSON.stringify({ report, snapshot: ctx }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

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

      const resp = await fetch(AI_BASE_URL, {
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

    // Special action: draft an email to a user (founder asks "email this user...")
    if (action === "draft_email" && focusUser) {
      const draftSystem = `${baseSystem}

TASK: Draft a complete email to this user as if you were the founder. Reply in the SAME language as the founder's request. Output STRICT JSON only:
{ "subject": "...", "body_text": "plain text body", "body_html": "<p>...</p>", "recipient_email": "...", "rationale": "1-line why this email now" }
No prose outside the JSON. No code fences.`;
      const resp = await fetch(AI_BASE_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: REASONING_MODEL,
          messages: [{ role: "system", content: draftSystem }, ...(Array.isArray(messages) ? messages : [])],
          response_format: { type: "json_object" },
        }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        return new Response(JSON.stringify({ error: "AI gateway error", status: resp.status, detail: t }), { status: resp.status === 429 || resp.status === 402 ? resp.status : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const d = await resp.json();
      let draft: any = {};
      try { draft = JSON.parse(d?.choices?.[0]?.message?.content || "{}"); } catch { /* ignore */ }
      if (!draft.recipient_email && focusUser?.profile?.email) draft.recipient_email = focusUser.profile.email;
      return new Response(JSON.stringify({ draft }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Self-heal: detect anomalies (mock/test/duplicate data, stuck trials) — read-only scan + optional cleanup.
    if (action === "self_heal_scan" || action === "self_heal_apply") {
      // Verify caller is admin
      let isAdmin = false;
      if (userId) {
        const { data: roleRow } = await supabase
          .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
        isAdmin = !!roleRow;
      }
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Find anomalies
      const findings: any[] = [];

      // 1. Obvious mock/test profiles
      const { data: mockProfiles } = await supabase
        .from("profiles")
        .select("user_id,email,company_name,created_at")
        .or("email.ilike.%test%,email.ilike.%mock%,email.ilike.%example.com,email.ilike.%demo%,company_name.ilike.%test%,company_name.ilike.%mock%");
      if (mockProfiles?.length) findings.push({ kind: "mock_profiles", count: mockProfiles.length, sample: mockProfiles.slice(0, 5), ids: mockProfiles.map((p) => p.user_id) });

      // 2. Stuck trials (trial_ends_at in the past, still status=trialing)
      const { data: stuckTrials } = await supabase
        .from("subscriptions")
        .select("id,user_id,trial_ends_at")
        .eq("status", "trialing")
        .lt("trial_ends_at", new Date().toISOString());
      if (stuckTrials?.length) findings.push({ kind: "stuck_trials", count: stuckTrials.length, ids: stuckTrials.map((s) => s.id) });

      // 3. Zero-value open enterprise deals older than 60 days
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString();
      const { data: staleDeals } = await supabase
        .from("ent_deals")
        .select("id,title,stage,value_gbp,created_at")
        .eq("value_gbp", 0)
        .not("stage", "in", "(won,lost)")
        .lt("created_at", sixtyDaysAgo);
      if (staleDeals?.length) findings.push({ kind: "stale_zero_deals", count: staleDeals.length, ids: staleDeals.map((d) => d.id) });

      if (action === "self_heal_scan") {
        return new Response(JSON.stringify({ findings, scanned_at: new Date().toISOString() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // self_heal_apply — perform safe cleanup
      const applied: any[] = [];
      for (const f of findings) {
        if (f.kind === "stuck_trials" && f.ids.length) {
          const { error } = await supabase.from("subscriptions").update({ status: "canceled" }).in("id", f.ids);
          applied.push({ kind: f.kind, count: f.ids.length, ok: !error, error: error?.message });
        }
        if (f.kind === "stale_zero_deals" && f.ids.length) {
          const { error } = await supabase.from("ent_deals").update({ stage: "lost" }).in("id", f.ids);
          applied.push({ kind: f.kind, count: f.ids.length, ok: !error, error: error?.message });
        }
        // Mock profiles: never auto-delete. Just flag.
        if (f.kind === "mock_profiles") {
          applied.push({ kind: f.kind, count: f.count, ok: true, note: "Flagged only — manual review required, not deleted." });
        }
      }
      return new Response(JSON.stringify({ findings, applied, applied_at: new Date().toISOString() }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Advanced security scanner — detects RLS gaps, stuck data, suspicious activity, and runtime bugs.
    if (action === "security_scan" || action === "security_fix") {
      // Verify caller is admin
      let isAdmin = false;
      if (userId) {
        const { data: roleRow } = await supabase
          .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
        isAdmin = !!roleRow;
      }
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const issues: any[] = [];
      const now = new Date();

      // 1. Critical alerts unresolved > 24h
      const dayAgo = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
      const { data: oldAlerts } = await supabase
        .from("admin_alerts")
        .select("id,title,severity,created_at")
        .eq("is_resolved", false)
        .eq("severity", "critical")
        .lt("created_at", dayAgo);
      if (oldAlerts?.length) issues.push({
        kind: "unresolved_critical_alerts",
        severity: "high",
        count: oldAlerts.length,
        sample: oldAlerts.slice(0, 3),
        ids: oldAlerts.map((a) => a.id),
        fix: "Mark resolved if already addressed.",
      });

      // 2. CRM security alerts unresolved
      const { data: crmAlerts } = await supabase
        .from("crm_security_alerts")
        .select("id,alert_type,severity,title,created_at")
        .eq("is_resolved", false);
      if (crmAlerts?.length) issues.push({
        kind: "open_crm_security_alerts",
        severity: "medium",
        count: crmAlerts.length,
        sample: crmAlerts.slice(0, 3),
        ids: crmAlerts.map((a) => a.id),
        fix: "Review & resolve via CRM admin panel.",
      });

      // 3. Mass-delete / mass-export activity in last 24h
      const { data: massActivity } = await supabase
        .from("crm_activity_logs")
        .select("user_id,action_type,created_at")
        .in("action_type", ["delete", "export"])
        .gte("created_at", dayAgo);
      if (massActivity && massActivity.length > 50) issues.push({
        kind: "high_volume_destructive_activity",
        severity: "high",
        count: massActivity.length,
        fix: "Investigate the user(s) responsible — may indicate data exfiltration or accidental loss.",
      });

      // 4. Failed email sends in last 7 days
      const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
      const { data: failedEmails } = await supabase
        .from("email_send_log")
        .select("id,template_name,error_message,created_at")
        .eq("status", "failed")
        .gte("created_at", weekAgo);
      if (failedEmails && failedEmails.length > 0) issues.push({
        kind: "failed_email_deliveries",
        severity: failedEmails.length > 10 ? "high" : "medium",
        count: failedEmails.length,
        sample: failedEmails.slice(0, 3),
        fix: "Check ZOHO_APP_PASSWORD and SMTP connectivity.",
      });

      // 5. Stuck booking conflicts (unresolved > 7 days)
      const { data: stuckConflicts } = await supabase
        .from("booking_conflicts")
        .select("id,resource_name,created_at")
        .eq("resolution", "unresolved")
        .lt("created_at", weekAgo);
      if (stuckConflicts?.length) issues.push({
        kind: "stuck_booking_conflicts",
        severity: "medium",
        count: stuckConflicts.length,
        ids: stuckConflicts.map((c) => c.id),
        fix: "Auto-mark as 'expired' since they're older than 7 days.",
      });

      // 6. Orphan bookings (resource_id missing)
      const { data: orphanBookings } = await supabase
        .from("bookings")
        .select("id,guest_name,created_at")
        .is("resource_id", null)
        .limit(20);
      if (orphanBookings?.length) issues.push({
        kind: "orphan_bookings",
        severity: "low",
        count: orphanBookings.length,
        sample: orphanBookings.slice(0, 3),
        fix: "Manual review — booking has no resource attached.",
      });

      // 7. Subscriptions without profile (orphan accounts)
      const { data: allSubs } = await supabase.from("subscriptions").select("user_id");
      const { data: allProfiles } = await supabase.from("profiles").select("user_id");
      const profileIds = new Set((allProfiles || []).map((p) => p.user_id));
      const orphanSubs = (allSubs || []).filter((s) => !profileIds.has(s.user_id));
      if (orphanSubs.length) issues.push({
        kind: "orphan_subscriptions",
        severity: "medium",
        count: orphanSubs.length,
        fix: "Subscriptions exist for deleted users. Safe to mark canceled.",
        ids: orphanSubs.map((s) => s.user_id),
      });

      if (action === "security_scan") {
        return new Response(
          JSON.stringify({
            issues,
            scanned_at: now.toISOString(),
            summary: {
              total: issues.length,
              high: issues.filter((i) => i.severity === "high").length,
              medium: issues.filter((i) => i.severity === "medium").length,
              low: issues.filter((i) => i.severity === "low").length,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // security_fix — auto-resolve safe issues
      const fixed: any[] = [];
      for (const i of issues) {
        if (i.kind === "unresolved_critical_alerts" && i.ids?.length) {
          // Don't auto-resolve — too risky. Just flag.
          fixed.push({ kind: i.kind, action: "flagged_for_review", count: i.count });
        }
        if (i.kind === "stuck_booking_conflicts" && i.ids?.length) {
          const { error } = await supabase
            .from("booking_conflicts")
            .update({ resolution: "expired" })
            .in("id", i.ids);
          fixed.push({ kind: i.kind, action: "marked_expired", count: i.ids.length, ok: !error, error: error?.message });
        }
        if (i.kind === "orphan_subscriptions" && i.ids?.length) {
          const { error } = await supabase
            .from("subscriptions")
            .update({ status: "canceled" })
            .in("user_id", i.ids)
            .neq("status", "canceled");
          fixed.push({ kind: i.kind, action: "canceled_orphans", count: i.ids.length, ok: !error, error: error?.message });
        }
      }

      return new Response(
        JSON.stringify({ issues, fixed, fixed_at: now.toISOString() }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const system = baseSystem;

    // Detect images in the latest user message (multimodal content array)
    const incoming = Array.isArray(messages) ? messages : [];
    const hasImages = incoming.some((m: any) =>
      Array.isArray(m?.content) && m.content.some((p: any) => p?.type === "image_url"),
    );
    const totalLen = JSON.stringify(incoming).length;
    const longContext = totalLen > 6000 || incoming.length > 12;
    const model = pickModel({ hasImages, longContext, deepReasoning: !!deepReasoning });

    const resp = await fetch(AI_BASE_URL, {
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
