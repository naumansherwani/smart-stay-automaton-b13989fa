import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Allowed regions
const ALLOWED_CONTINENTS = new Set([
  "EU", // Europe
  "NA", // North America
  "SA", // South America
  "OC", // Oceania (Australia, NZ)
]);

// Cloudflare cf-ipcountry → continent mapping for major countries
const COUNTRY_TO_CONTINENT: Record<string, string> = {
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
  // Oceania
  AU: "OC", NZ: "OC", FJ: "OC", PG: "OC", WS: "OC", TO: "OC", VU: "OC",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
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

    // User client (respects RLS)
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
    const country = req.headers.get("cf-ipcountry") || req.headers.get("x-country-code") || "";
    const continent = COUNTRY_TO_CONTINENT[country.toUpperCase()] || "";
    if (country && !ALLOWED_CONTINENTS.has(continent)) {
      return new Response(
        JSON.stringify({ error: "Reviews are not available in your region." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { reviewer_name, rating, review_text } = await req.json();

    // Input validation
    if (!reviewer_name || typeof reviewer_name !== "string" || reviewer_name.trim().length > 100) {
      return new Response(JSON.stringify({ error: "Invalid name" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: "Invalid rating" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!review_text || typeof review_text !== "string" || review_text.trim().length > 1000) {
      return new Response(JSON.stringify({ error: "Invalid review text" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI content moderation
    let status = "pending";
    if (lovableKey) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `You are a review content moderator for a SaaS booking platform called HostFlow AI. 
Your job is to classify reviews as either "approve" or "pending".

APPROVE if the review is:
- A genuine suggestion or feedback (positive or negative)
- Constructive criticism
- Sharing a real experience
- Asking for improvements or features

PENDING (flag for manual review) if the review:
- Contains hate speech, profanity, or offensive language
- Is spam or promotional content
- Seems fake, bot-generated, or nonsensical
- Attempts to damage the brand with false claims
- Contains personal attacks or threats
- Has suspicious patterns (random characters, repeated text)
- Is clearly irrelevant to the platform

Respond with ONLY one word: "approve" or "pending". Nothing else.`,
              },
              {
                role: "user",
                content: `Review by "${reviewer_name.trim()}" (Rating: ${rating}/5):\n"${review_text.trim()}"`,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const decision = (aiData.choices?.[0]?.message?.content || "").trim().toLowerCase();
          if (decision === "approve") {
            status = "approved";
          } else {
            status = "pending";
          }
        }
      } catch (aiErr) {
        console.error("AI moderation error:", aiErr);
        // Fall back to pending if AI fails
        status = "pending";
      }
    }

    // Insert using service role to bypass RLS (we already verified the user)
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data, error } = await adminClient.from("reviews").insert({
      user_id: user.id,
      reviewer_name: reviewer_name.trim(),
      rating,
      review_text: review_text.trim(),
      status,
    }).select().single();

    if (error) {
      if (error.code === "23505") {
        return new Response(JSON.stringify({ error: "You have already submitted a review" }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        status,
        message: status === "approved"
          ? "Your review has been published!"
          : "Your review has been submitted and is awaiting approval.",
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
