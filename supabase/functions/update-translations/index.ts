import { createClient } from "https://esm.sh/@supabase/supabase-js@2.102.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SUPPORTED_LANGUAGES = [
  { code: "es", name: "Spanish" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "de", name: "German" },
  { code: "fr", name: "French" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "pt", name: "Portuguese" },
  { code: "tr", name: "Turkish" },
  { code: "ur", name: "Urdu" },
  { code: "de-CH", name: "Swiss German" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Cron/service-role only — this function performs AI calls and writes
    // to the translations table. Reject any caller without the service role token.
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token || token !== Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional params
    let targetLanguages = SUPPORTED_LANGUAGES;
    let forceUpdate = false;
    
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body.languages && Array.isArray(body.languages)) {
          targetLanguages = SUPPORTED_LANGUAGES.filter(l => body.languages.includes(l.code));
        }
        if (body.force) forceUpdate = true;
      } catch { /* empty body is fine for cron */ }
    }

    // Check which languages need updating (older than 30 days)
    const { data: updates } = await supabase
      .from("translation_updates")
      .select("*");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const languagesNeedingUpdate = targetLanguages.filter(lang => {
      if (forceUpdate) return true;
      const record = updates?.find(u => u.language_code === lang.code);
      if (!record) return true;
      return new Date(record.last_updated_at) < thirtyDaysAgo;
    });

    if (languagesNeedingUpdate.length === 0) {
      return new Response(
        JSON.stringify({ message: "All languages are up to date", updated: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // The base English translation (source of truth)
    const englishTranslations = {
      nav: { features: "Features", industries: "Industries", pricing: "Pricing", about: "About", dashboard: "Dashboard", login: "Log In", logout: "Log Out", startTrial: "Start Free Trial", settings: "Settings", analytics: "Analytics", upgrade: "Upgrade" },
      hero: { badge: "AI Calendar + AI Pricing — Every Industry, One Platform", title1: "Book Smarter.", title2: "Price Smarter.", title3: "Grow Faster.", subtitle: "The Smart Calendar AI That Runs Your Business — Not Just Your Schedule.", subtitle2: "Zero Double-Bookings. Maximum Revenue.", quote: "One calendar to rule them all — from hotels to hospitals, airlines to logistics.", cta: "Start Free — 3 Days, Full Power", ctaPlans: "See Plans & Pricing", noCreditCard: "No credit card required", doubleBooking: "AI double-booking guard", dynamicPricing: "AI dynamic pricing", industriesSupported: "8 industries supported", trustedAcross: "Trusted across industries worldwide" },
      features: { title: "Advanced AI Features No One Else Offers", subtitle: "Built with cutting-edge AI that learns your patterns and optimizes everything automatically.", aiDemand: "AI Demand Forecasting", aiDemandDesc: "Predict demand using ML models trained on your industry data, weather, events & trends.", smartConflict: "Smart Conflict Resolution", smartConflictDesc: "AI auto-detects and resolves scheduling conflicts before they cost you money.", dynamicPricing: "Dynamic Pricing Engine", dynamicPricingDesc: "Real-time price optimization based on demand, competition, seasonality & capacity.", doubleBooking: "Double-Booking Prevention", doubleBookingDesc: "Cross-platform sync ensures zero scheduling conflicts across all channels.", guestScoring: "Guest/Client Scoring", guestScoringDesc: "AI-powered risk assessment and VIP detection for every booking.", revenueOpt: "Revenue Optimization", revenueOptDesc: "Gap-filling, turnover analysis, and profit-per-unit calculations in real time.", industriesTitle: "Built for 8 Industries", industriesSubtitle: "One AI. Every industry. No limits." },
      common: { loading: "Loading...", save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", back: "Back", next: "Next", search: "Search", confirm: "Confirm", close: "Close", submit: "Submit", reset: "Reset", yes: "Yes", no: "No", all: "All", none: "None", active: "Active", inactive: "Inactive", pending: "Pending", completed: "Completed", error: "Error", success: "Success", warning: "Warning", info: "Info" }
    };

    // Use Lovable AI Gateway to translate
    const updatedLanguages: string[] = [];
    const errors: string[] = [];

    for (const lang of languagesNeedingUpdate) {
      try {
        const prompt = `Translate the following JSON from English to ${lang.name}. Return ONLY valid JSON, no markdown, no explanation. Keep all JSON keys exactly the same. Translate values naturally and professionally for a SaaS business scheduling platform called HostFlow AI. Here is the JSON:\n\n${JSON.stringify(englishTranslations, null, 2)}`;

        const aiResponse = await fetch("https://uapvdzphibxoomokahjh.supabase.co/functions/v1/ai-proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
          }),
        });

        if (!aiResponse.ok) {
          // Fallback: just log and skip
          errors.push(`${lang.code}: AI translation failed (${aiResponse.status})`);
          continue;
        }

        const aiData = await aiResponse.json();
        const translatedText = aiData?.choices?.[0]?.message?.content || "";
        
        // Try to parse the JSON from AI response
        let translatedJson;
        try {
          // Remove markdown code blocks if present
          const cleanedText = translatedText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          translatedJson = JSON.parse(cleanedText);
        } catch {
          errors.push(`${lang.code}: Failed to parse AI translation response`);
          continue;
        }

        // Store in database
        await supabase
          .from("translation_updates")
          .upsert({
            language_code: lang.code,
            last_updated_at: new Date().toISOString(),
            version: (updates?.find(u => u.language_code === lang.code)?.version || 0) + 1,
            status: "current",
            translation_data: translatedJson,
          }, { onConflict: "language_code" });

        updatedLanguages.push(lang.code);
      } catch (err) {
        errors.push(`${lang.code}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Translation update completed`,
        updated: updatedLanguages,
        errors: errors.length > 0 ? errors : undefined,
        nextUpdateDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
