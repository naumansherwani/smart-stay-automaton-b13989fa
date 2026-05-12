// ARC Engine — Event Ingest
// Public-facing endpoint clients call to log lifecycle events (login, feature_used, etc).
// Anyone authenticated can log their own events. Admins (cron/service-role) can log any.
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_EVENTS = new Set([
  "login","feature_used","trial_started","trial_day","trial_ending",
  "payment_failed","payment_succeeded","premium_drop","churned","reactivated",
  "onboarding_step","first_setup_complete","ai_message_sent","upgrade","downgrade",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const auth = req.headers.get("Authorization");
    let userId: string | null = null;
    if (auth) {
      const token = auth.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }
    if (!userId) {
      // Silently no-op for unauthenticated callers — event tracking is best-effort
      // and must never break the client UI.
      return new Response(JSON.stringify({ ok: true, skipped: "unauthenticated" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const event_type = String(body?.event_type || "").trim();
    if (!ALLOWED_EVENTS.has(event_type)) {
      return new Response(JSON.stringify({ error: "invalid event_type" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const row = {
      user_id: userId,
      event_type,
      event_category: String(body?.event_category || "activity"),
      industry: body?.industry ?? null,
      plan: body?.plan ?? null,
      feature_key: body?.feature_key ?? null,
      metadata: body?.metadata ?? {},
    };
    const { error } = await supabase.from("arc_lifecycle_events").insert(row);
    if (error) throw error;

    // Update lightweight feature_usage if it's a feature_used event
    if (event_type === "feature_used" && row.feature_key) {
      await supabase.from("feature_usage").upsert(
        { user_id: userId, feature_key: row.feature_key, last_used_at: new Date().toISOString() },
        { onConflict: "user_id,feature_key" },
      );
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("arc-event-ingest error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});