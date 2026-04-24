import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      resources,
      existing_bookings,
      schedule_settings,
      industry,
      industry_label,
      resource_label,
      client_label,
      period,
      optimize_for,
    } = body || {};

    // ---- Input validation: never crash on missing / bad input ----
    const safeResources = Array.isArray(resources) ? resources : [];
    const safeBookings  = Array.isArray(existing_bookings) ? existing_bookings : [];
    const safeSettings  = Array.isArray(schedule_settings) ? schedule_settings : [];
    const safeIndustryLabel = typeof industry_label === "string" && industry_label.trim() ? industry_label : "service";
    const safeResourceLabel = typeof resource_label === "string" && resource_label.trim() ? resource_label : "resource";
    const safeClientLabel   = typeof client_label === "string" && client_label.trim() ? client_label : "client";
    const safeOptimizeFor   = typeof optimize_for === "string" && optimize_for.trim() ? optimize_for : "revenue";

    if (safeResources.length === 0) {
      return new Response(
        JSON.stringify({
          suggestions: [],
          message: `Add at least one ${safeResourceLabel} before generating an AI schedule.`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const periodDays = { "1month": 30, "3months": 90, "6months": 180, "1year": 365 }[period] || 90;

    const systemPrompt = `You are an AI scheduling assistant for a ${safeIndustryLabel} business. 
You generate optimized scheduling suggestions based on the business's resources, existing bookings, and schedule settings.

IMPORTANT: Return ONLY valid JSON with a "suggestions" array. Each suggestion has:
- date (YYYY-MM-DD)
- time_start (HH:MM)
- time_end (HH:MM)  
- resource (name of the ${safeResourceLabel})
- client_type (typical ${safeClientLabel} type for this industry)
- predicted_demand ("high" | "medium" | "low")
- suggested_price (number)
- reason (brief explanation)

Rules:
1. Respect working days and hours from schedule settings
2. Don't overlap with existing bookings
3. Include buffer time between slots
4. Predict demand based on day of week, time of day, and seasonal patterns
5. Adjust prices based on demand (higher for peak, lower for off-peak)
6. Optimize for: ${safeOptimizeFor}
7. Generate suggestions for the next ${periodDays} days
8. Generate 10-20 high-value suggestions, not every possible slot`;

    const userPrompt = `Generate scheduling suggestions for my ${safeIndustryLabel} business.

Resources (${safeResourceLabel}s): ${JSON.stringify(safeResources.map((r: any) => ({ name: r?.name, base_price: r?.base_price, capacity: r?.max_capacity })))}

Schedule Settings: ${JSON.stringify(safeSettings.map((s: any) => ({ resource_id: s?.resource_id, working_days: s?.working_days, hours: `${s?.working_hours_start ?? ""}-${s?.working_hours_end ?? ""}`, slot_duration: s?.slot_duration_minutes, buffer: s?.buffer_minutes })))}

Existing Bookings (${safeBookings.length} total): ${JSON.stringify(safeBookings.slice(0, 20).map((b: any) => ({ resource_id: b?.resource_id, check_in: b?.check_in, check_out: b?.check_out, status: b?.status })))}

Today's date: ${new Date().toISOString().split('T')[0]}
Period: Next ${periodDays} days
Optimize for: ${safeOptimizeFor}

Return JSON with suggestions array.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_schedule",
            description: "Generate scheduling suggestions",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string" },
                      time_start: { type: "string" },
                      time_end: { type: "string" },
                      resource: { type: "string" },
                      client_type: { type: "string" },
                      predicted_demand: { type: "string", enum: ["high", "medium", "low"] },
                      suggested_price: { type: "number" },
                      reason: { type: "string" },
                    },
                    required: ["date", "time_start", "time_end", "resource", "client_type", "predicted_demand", "suggested_price", "reason"],
                  },
                },
              },
              required: ["suggestions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_schedule" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits required. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    let suggestions = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      suggestions = parsed.suggestions || [];
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-auto-schedule error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
