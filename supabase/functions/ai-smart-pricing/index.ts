import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { pickTierAndCheck, tierDenyResponse } from "../_shared/ai-tier.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PRICING_INDUSTRIES = ["hospitality", "airlines", "car_rental", "events_entertainment", "railways"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const { industry, resources, days = 7, competitorData, occupancyRate, bookingVelocity, generateAlerts = true } = await req.json();

    if (!industry || !PRICING_INDUSTRIES.includes(industry)) {
      return new Response(JSON.stringify({ error: "AI Pricing is not available for this industry" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!resources || !Array.isArray(resources) || resources.length === 0) {
      return new Response(JSON.stringify({ error: "At least one resource with basePrice is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const decision = await pickTierAndCheck(authHeader, "structured", "ai-smart-pricing");
    if (!decision.allowed) return tierDenyResponse(decision, corsHeaders);

    const today = new Date();
    const dateRange = Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return d.toISOString().split("T")[0];
    });

    const industryContext: Record<string, string> = {
      hospitality: "Hotel rooms/vacation rentals. Key factors: season (summer peak, winter low), weekends vs weekdays, local events, holiday periods, occupancy rate. Competitor pricing matters most here.",
      airlines: "Flight seats. Key factors: booking lead time (last-minute = expensive), seat fill rate, route demand, time of day, day of week, holiday travel surges.",
      car_rental: "Vehicle rentals. Key factors: fleet utilization, vehicle class, weekend vs business days, airport vs city location, seasonal tourism, long-term discount.",
      events_entertainment: "Event tickets/venue bookings. Key factors: event popularity, days until event, remaining capacity, artist/performer demand, comparable events pricing.",
      railways: "Train seats. Key factors: route popularity, coach class, peak hours (morning/evening commute), weekend leisure travel, advance booking discounts, holiday surges.",
    };

    const resourceSummary = resources.slice(0, 5).map((r: any) =>
      `- ${r.name}: base price $${r.basePrice}${r.occupancy ? `, occupancy ${r.occupancy}%` : ""}`
    ).join("\n");

    const competitorSummary = competitorData && competitorData.length > 0
      ? `\nCompetitor pricing:\n${competitorData.slice(0, 5).map((c: any) => `- ${c.name}: avg $${c.avgPrice}, occupancy ${c.occupancy}%, trend: ${c.trend}`).join("\n")}`
      : "\nNo competitor data available — suggest based on market averages.";

    const systemPrompt = `You are an AI pricing engine for the ${industry} industry.
${industryContext[industry]}

Current date: ${today.toISOString().split("T")[0]}
Current occupancy rate: ${occupancyRate ?? "unknown"}%
Booking velocity (last 7 days): ${bookingVelocity ?? "unknown"} bookings

RULES:
- Suggest prices for each resource for each date
- Factor in: seasonality, day of week, demand signals, competitor pricing
- Price changes should be -30% to +50% from base price
- Always provide clear reasoning for each suggestion
- Return ONLY the tool call, no extra text`;

    const userPrompt = `Resources:\n${resourceSummary}\n${competitorSummary}\n\nGenerate pricing suggestions for dates: ${dateRange.join(", ")}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: decision.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "pricing_suggestions",
            description: "Return AI pricing suggestions for resources across dates",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      resourceName: { type: "string" },
                      date: { type: "string", description: "YYYY-MM-DD" },
                      basePrice: { type: "number" },
                      suggestedPrice: { type: "number" },
                      confidence: { type: "string", enum: ["high", "medium", "low"] },
                      reasoning: { type: "string", description: "Short 1-line reason" },
                      factors: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            impact: { type: "number", description: "percentage impact, e.g. +15 or -10" },
                          },
                          required: ["name", "impact"],
                        },
                      },
                    },
                    required: ["resourceName", "date", "basePrice", "suggestedPrice", "confidence", "reasoning", "factors"],
                  },
                },
                marketInsight: { type: "string", description: "1-2 sentence overall market insight" },
                recommendedAction: { type: "string", description: "Top recommendation for the owner/manager" },
              },
              required: ["suggestions", "marketInsight", "recommendedAction"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "pricing_suggestions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — try again shortly" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("AI did not return pricing suggestions");
    }

    const pricingData = JSON.parse(toolCall.function.arguments);

    // Auto-generate price alerts for significant changes (>15%)
    const alertsGenerated: any[] = [];
    if (generateAlerts && authHeader) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey, {
          global: { headers: { Authorization: authHeader } },
        });

        const { data: { user } } = await supabase.auth.getUser();
        if (user && pricingData.suggestions) {
          const significantChanges = pricingData.suggestions.filter((s: any) => {
            const pct = Math.abs((s.suggestedPrice - s.basePrice) / s.basePrice * 100);
            return pct >= 15;
          });

          // Group by resource, take the most significant per resource
          const byResource = new Map<string, any>();
          for (const s of significantChanges) {
            const existing = byResource.get(s.resourceName);
            const pct = (s.suggestedPrice - s.basePrice) / s.basePrice * 100;
            if (!existing || Math.abs(pct) > Math.abs(existing.pct)) {
              byResource.set(s.resourceName, { ...s, pct });
            }
          }

          for (const [resourceName, s] of byResource) {
            const alertType = s.pct > 0 ? "price_increase" : "price_decrease";
            const alert = {
              user_id: user.id,
              industry,
              resource_name: resourceName,
              alert_type: alertType,
              current_price: s.basePrice,
              suggested_price: s.suggestedPrice,
              change_percent: Math.round(s.pct),
              reasoning: s.reasoning,
              confidence: s.confidence || "medium",
              expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
            };
            const { error: insertErr } = await supabase.from("price_alerts").insert(alert);
            if (!insertErr) alertsGenerated.push(alert);
          }
        }
      } catch (alertErr) {
        console.error("Alert generation error (non-fatal):", alertErr);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      industry,
      generatedAt: new Date().toISOString(),
      alertsGenerated: alertsGenerated.length,
      ...pricingData,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-smart-pricing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
