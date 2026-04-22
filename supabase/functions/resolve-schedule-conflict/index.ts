import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// LOCKED priority order (cannot be changed by clients).
// Lower index = higher priority. This is the source of truth.
const PRIORITY: Record<string, number> = {
  manual_override: 1,
  confirmed_booking: 2,
  google_calendar: 3,
  ai_confirmed: 4,
  ai_suggestion: 5,
};

const VALID_SOURCES = Object.keys(PRIORITY);

interface ConflictRequest {
  source_a: string;
  source_b: string;
  conflict_start: string;
  conflict_end: string;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: { user } } = await supa.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json() as ConflictRequest;
    const { source_a, source_b, conflict_start, conflict_end, metadata = {} } = body;

    if (!VALID_SOURCES.includes(source_a) || !VALID_SOURCES.includes(source_b)) {
      return json({ error: `Invalid source. Must be one of: ${VALID_SOURCES.join(", ")}` }, 400);
    }
    if (!conflict_start || !conflict_end) {
      return json({ error: "conflict_start and conflict_end required" }, 400);
    }

    // Load policy (or use defaults)
    const { data: policy } = await supa
      .from("scheduling_conflict_policy")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const googleWins = policy?.google_calendar_wins_over_ai ?? true;
    const autoReschedule = policy?.auto_reschedule_ai_on_conflict ?? true;

    // Deterministic resolution
    const pa = PRIORITY[source_a];
    const pb = PRIORITY[source_b];
    let winner: string;
    let loser: string;
    let reason: string;

    if (pa < pb) {
      winner = source_a; loser = source_b;
      reason = `${source_a} has higher locked priority (tier ${pa}) than ${source_b} (tier ${pb}).`;
    } else if (pb < pa) {
      winner = source_b; loser = source_a;
      reason = `${source_b} has higher locked priority (tier ${pb}) than ${source_a} (tier ${pa}).`;
    } else {
      // Same tier — earliest created wins
      winner = source_a; loser = source_b;
      reason = `Equal priority — first source kept by deterministic tie-break.`;
    }

    // Special case: if google_calendar_wins_over_ai is false (admin override), AI wins over Google
    if (!googleWins && ((winner === "google_calendar" && loser.startsWith("ai_")) || (loser === "google_calendar" && winner.startsWith("ai_")))) {
      [winner, loser] = [loser, winner];
      reason = `Admin override: AI scheduler set to win over Google Calendar.`;
    }

    const action = autoReschedule && loser === "ai_suggestion" ? "rescheduled_loser" : "kept_winner";

    const { data: resolution, error: insertErr } = await admin
      .from("scheduling_conflict_resolutions")
      .insert({
        user_id: user.id,
        source_a, source_b, winner, reason,
        conflict_start, conflict_end,
        resolution_action: action,
        metadata,
      })
      .select()
      .single();

    if (insertErr) console.error("insert error", insertErr);

    return json({
      winner,
      loser,
      reason,
      action,
      priority_used: { [source_a]: pa, [source_b]: pb },
      resolution_id: resolution?.id,
    });
  } catch (e) {
    console.error("resolve-schedule-conflict error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
