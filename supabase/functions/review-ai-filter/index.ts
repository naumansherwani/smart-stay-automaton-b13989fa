import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Allowed regions (per business policy):
// North America, South America, Europe, Africa, Australia, New Zealand, Indonesia, Maldives
const ALLOWED_REGIONS = new Set(["NA", "SA", "EU", "AF", "OC", "ID_MV"]);

// ISO country code → region label
const COUNTRY_TO_REGION: Record<string, string> = {
  // Europe
  GB: "EU", DE: "EU", FR: "EU", IT: "EU", ES: "EU", NL: "EU", SE: "EU", NO: "EU",
  DK: "EU", FI: "EU", PL: "EU", PT: "EU", AT: "EU", BE: "EU", CH: "EU", IE: "EU",
  CZ: "EU", RO: "EU", HU: "EU", GR: "EU", HR: "EU", BG: "EU", SK: "EU", LT: "EU",
  SI: "EU", LV: "EU", EE: "EU", CY: "EU", LU: "EU", MT: "EU", IS: "EU", UA: "EU",
  RS: "EU", BA: "EU", ME: "EU", MK: "EU", AL: "EU", MD: "EU", XK: "EU",
  // North America
  US: "NA", CA: "NA", MX: "NA", GT: "NA", CU: "NA", HT: "NA", DO: "NA", HN: "NA",
  SV: "NA", NI: "NA", CR: "NA", PA: "NA", JM: "NA", TT: "NA", BS: "NA", BZ: "NA",
  BB: "NA", AG: "NA", DM: "NA", GD: "NA", KN: "NA", LC: "NA", VC: "NA", PR: "NA",
  // South America
  BR: "SA", AR: "SA", CO: "SA", PE: "SA", VE: "SA", CL: "SA", EC: "SA", BO: "SA",
  PY: "SA", UY: "SA", GY: "SA", SR: "SA",
  // Oceania (Australia + NZ + Pacific islands)
  AU: "OC", NZ: "OC", FJ: "OC", PG: "OC", WS: "OC", TO: "OC", VU: "OC", SB: "OC", KI: "OC",
  // Africa (full continent)
  ZA: "AF", NG: "AF", EG: "AF", KE: "AF", MA: "AF", DZ: "AF", TN: "AF", ET: "AF",
  GH: "AF", UG: "AF", TZ: "AF", SN: "AF", CI: "AF", CM: "AF", ZM: "AF", ZW: "AF",
  AO: "AF", MZ: "AF", LY: "AF", SD: "AF", RW: "AF", BW: "AF", NA: "AF", MG: "AF",
  MU: "AF", SC: "AF", BJ: "AF", BF: "AF", ML: "AF", NE: "AF", TD: "AF", SO: "AF",
  GA: "AF", CG: "AF", CD: "AF", LR: "AF", SL: "AF", GM: "AF", GN: "AF", TG: "AF",
  ER: "AF", DJ: "AF", BI: "AF", LS: "AF", SZ: "AF", MW: "AF", CV: "AF", GQ: "AF",
  SS: "AF", ST: "AF", KM: "AF", CF: "AF", MR: "AF",
  // Indonesia + Maldives (only allowed Asian countries)
  ID: "ID_MV", MV: "ID_MV",
};

const REGION_LABEL: Record<string, string> = {
  NA: "North America",
  SA: "South America",
  EU: "Europe",
  AF: "Africa",
  OC: "Oceania (Australia / NZ)",
  ID_MV: "Indonesia / Maldives",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Geo check
    const country = (
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-country-code") ||
      req.headers.get("x-vercel-ip-country") ||
      ""
    ).toUpperCase();
    const region = COUNTRY_TO_REGION[country] || "";

    // If we know the country and it's NOT in allowed regions → block.
    // If we don't know the country at all → allow (but mark as unknown — admin can review).
    if (country && !ALLOWED_REGIONS.has(region)) {
      return new Response(
        JSON.stringify({
          error:
            "Reviews are currently only available in North America, South America, Europe, Africa, Australia, New Zealand, Indonesia and Maldives.",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { reviewer_name, rating, review_text } = await req.json();

    // Input validation
    if (!reviewer_name || typeof reviewer_name !== "string" || reviewer_name.trim().length === 0 || reviewer_name.trim().length > 100) {
      return new Response(JSON.stringify({ error: "Invalid name" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: "Invalid rating" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!review_text || typeof review_text !== "string" || review_text.trim().length === 0 || review_text.trim().length > 1000) {
      return new Response(JSON.stringify({ error: "Invalid review text" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI moderation — three-way decision: approve / pending / reject
    let status = "pending";
    let aiDecision: string | null = null;
    let aiReason: string | null = null;
    let isAutoRejected = false;

    if (lovableKey) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: `You are the review-moderation AI for a SaaS product called HostFlow AI.
Classify each review into EXACTLY one of these three labels:

"approve" — Genuine, good-faith review (positive, negative, or neutral). Real experience, suggestion, constructive criticism or feature request. Praise is fine. Honest negative feedback that is specific and not abusive is also fine.

"pending" — Borderline cases that a human admin should look at. Examples: very short or vague text, unclear intent, mild profanity, suspicious but not clearly malicious.

"reject" — Clearly fake / brand-damaging / abusive content. Reject if ANY of these is true:
  • Hate speech, slurs, harassment, threats, or sexual content
  • Spam / promotional links / contact details / phone numbers
  • Bot-generated, gibberish, or repeated character patterns
  • Coordinated brand-attack: claims the product is a "scam", "fraud", "stolen", "virus", "hack", with no specific detail
  • Personal attacks on the founder, team, or other users
  • Defamatory or false claims that could damage the company's reputation
  • Mentions competitor products in a promotional way
  • Off-topic content (politics, religion, unrelated business)

Respond with STRICT JSON only, no markdown, no prose:
{"decision":"approve"|"pending"|"reject","reason":"<max 140 chars explaining why>"}`,
              },
              {
                role: "user",
                content: `Reviewer: "${reviewer_name.trim()}"
Rating: ${rating}/5
Review: """${review_text.trim()}"""`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const raw = (aiData.choices?.[0]?.message?.content || "").trim();
          // Strip optional code fences
          const cleaned = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
          try {
            const parsed = JSON.parse(cleaned);
            const d = String(parsed.decision || "").toLowerCase();
            aiReason = (parsed.reason || "").toString().slice(0, 200);
            if (d === "approve") {
              status = "approved";
              aiDecision = "approve";
            } else if (d === "reject") {
              status = "rejected";
              aiDecision = "reject";
              isAutoRejected = true;
            } else {
              status = "pending";
              aiDecision = "pending";
            }
          } catch {
            // Fallback: look for keywords
            const low = raw.toLowerCase();
            if (low.includes("reject")) { status = "rejected"; aiDecision = "reject"; isAutoRejected = true; aiReason = "AI flagged as harmful"; }
            else if (low.includes("approve")) { status = "approved"; aiDecision = "approve"; aiReason = "AI approved"; }
            else { status = "pending"; aiDecision = "pending"; aiReason = "AI uncertain"; }
          }
        }
      } catch (aiErr) {
        console.error("AI moderation error:", aiErr);
        status = "pending";
        aiDecision = "pending";
        aiReason = "AI moderation unavailable";
      }
    }

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data, error } = await adminClient.from("reviews").insert({
      user_id: user.id,
      reviewer_name: reviewer_name.trim(),
      rating,
      review_text: review_text.trim(),
      status,
      country_code: country || null,
      region: region ? REGION_LABEL[region] : null,
      ai_decision: aiDecision,
      ai_reason: aiReason,
      is_auto_rejected: isAutoRejected,
    }).select().single();

    if (error) {
      if (error.code === "23505") {
        return new Response(JSON.stringify({ error: "You have already submitted a review" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    let userMessage = "Your review has been submitted and is awaiting approval.";
    if (status === "approved") userMessage = "🎉 Your review has been published!";
    else if (status === "rejected") userMessage = "Your review could not be published as it appears to violate our review guidelines.";

    return new Response(
      JSON.stringify({
        success: true,
        status,
        ai_decision: aiDecision,
        message: userMessage,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("review-ai-filter error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
