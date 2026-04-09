import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ValidationRequest {
  resource_id: string;
  check_in: string;
  check_out: string;
  group_size?: number;
  business_type?: string;
}

interface ValidationResult {
  allowed: boolean;
  reason?: string;
  conflict_type?: "overlap" | "capacity" | "buffer" | "minimum_stay";
  auto_reassigned?: boolean;
  reassigned_resource_id?: string;
  reassigned_resource_name?: string;
  conflicting_bookings?: { guest_name: string; check_in: string; check_out: string }[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ allowed: false, reason: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ allowed: false, reason: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ValidationRequest = await req.json();
    const { resource_id, check_in, check_out, group_size = 1, business_type } = body;

    // 1. Fetch the target resource
    const { data: resource } = await supabase
      .from("resources")
      .select("*")
      .eq("id", resource_id)
      .eq("user_id", user.id)
      .single();

    if (!resource) {
      return jsonResponse({ allowed: false, reason: "Resource not found or not accessible.", conflict_type: "overlap" });
    }

    const isTour = (business_type || resource.business_type) === "tour";

    // 2. Check for overlapping bookings on the requested resource
    const { data: overlaps } = await supabase
      .from("bookings")
      .select("id, guest_name, check_in, check_out, resource_id, metadata")
      .eq("resource_id", resource_id)
      .eq("user_id", user.id)
      .neq("status", "cancelled")
      .lt("check_in", check_out)
      .gt("check_out", check_in);

    const conflictingBookings = (overlaps || []).map(b => ({
      guest_name: b.guest_name,
      check_in: b.check_in,
      check_out: b.check_out,
    }));

    // 3. For non-tour (1:1 resource): any overlap = conflict
    if (!isTour && overlaps && overlaps.length > 0) {
      // 4. Try auto-reassignment: find another available resource of the same type
      const { data: altResources } = await supabase
        .from("resources")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .eq("industry", resource.industry)
        .neq("id", resource_id);

      // Filter to same business_type if available
      const sameTypeResources = (altResources || []).filter(
        r => r.business_type === resource.business_type
      );
      const candidates = sameTypeResources.length > 0 ? sameTypeResources : (altResources || []);

      for (const alt of candidates) {
        const { data: altOverlaps } = await supabase
          .from("bookings")
          .select("id")
          .eq("resource_id", alt.id)
          .eq("user_id", user.id)
          .neq("status", "cancelled")
          .lt("check_in", check_out)
          .gt("check_out", check_in);

        if (!altOverlaps || altOverlaps.length === 0) {
          // Check buffer/turnaround
          const bufferMs = (alt.turnaround_minutes || 0) * 60 * 1000;
          const { data: nearbyBookings } = await supabase
            .from("bookings")
            .select("id, check_in, check_out")
            .eq("resource_id", alt.id)
            .eq("user_id", user.id)
            .neq("status", "cancelled")
            .gte("check_out", new Date(new Date(check_in).getTime() - bufferMs).toISOString())
            .lte("check_in", new Date(new Date(check_out).getTime() + bufferMs).toISOString());

          const hasBufferConflict = (nearbyBookings || []).some(nb => {
            const nbEnd = new Date(nb.check_out).getTime();
            const nbStart = new Date(nb.check_in).getTime();
            const reqStart = new Date(check_in).getTime();
            const reqEnd = new Date(check_out).getTime();
            const gapAfter = reqStart - nbEnd;
            const gapBefore = nbStart - reqEnd;
            return (gapAfter >= 0 && gapAfter < bufferMs) || (gapBefore >= 0 && gapBefore < bufferMs);
          });

          if (!hasBufferConflict) {
            return jsonResponse({
              allowed: true,
              auto_reassigned: true,
              reassigned_resource_id: alt.id,
              reassigned_resource_name: alt.name,
              conflicting_bookings: conflictingBookings,
            });
          }
        }
      }

      // No alternative found
      return jsonResponse({
        allowed: false,
        reason: "Selected time or resource is no longer available. No alternative resources could be found.",
        conflict_type: "overlap",
        conflicting_bookings: conflictingBookings,
      });
    }

    // 5. For tours: check capacity
    if (isTour) {
      const maxCapacity = resource.max_capacity || 1;
      const existingGroupSizes = (overlaps || []).reduce((sum: number, b: any) => {
        const gs = (b.metadata as any)?.group_size || 1;
        return sum + gs;
      }, 0);

      if (existingGroupSizes + group_size > maxCapacity) {
        return jsonResponse({
          allowed: false,
          reason: `Tour is at full capacity for this time slot. ${existingGroupSizes}/${maxCapacity} spots filled.`,
          conflict_type: "capacity",
          conflicting_bookings: conflictingBookings,
        });
      }
    }

    // 6. Buffer/turnaround check for the primary resource
    const bufferMs = (resource.turnaround_minutes || 0) * 60 * 1000;
    if (bufferMs > 0 && !isTour) {
      const { data: nearbyBookings } = await supabase
        .from("bookings")
        .select("id, guest_name, check_in, check_out")
        .eq("resource_id", resource_id)
        .eq("user_id", user.id)
        .neq("status", "cancelled")
        .gte("check_out", new Date(new Date(check_in).getTime() - bufferMs).toISOString())
        .lte("check_in", new Date(new Date(check_out).getTime() + bufferMs).toISOString());

      const bufferConflict = (nearbyBookings || []).find(nb => {
        const nbEnd = new Date(nb.check_out).getTime();
        const nbStart = new Date(nb.check_in).getTime();
        const reqStart = new Date(check_in).getTime();
        const reqEnd = new Date(check_out).getTime();
        const gapAfter = reqStart - nbEnd;
        const gapBefore = nbStart - reqEnd;
        return (gapAfter >= 0 && gapAfter < bufferMs) || (gapBefore >= 0 && gapBefore < bufferMs);
      });

      if (bufferConflict) {
        return jsonResponse({
          allowed: false,
          reason: `Insufficient buffer time (${resource.turnaround_minutes} min required) between bookings. Conflicts with ${bufferConflict.guest_name}'s reservation.`,
          conflict_type: "buffer",
          conflicting_bookings: [{ guest_name: bufferConflict.guest_name, check_in: bufferConflict.check_in, check_out: bufferConflict.check_out }],
        });
      }
    }

    // 7. All checks passed
    return jsonResponse({ allowed: true });
  } catch (e) {
    console.error("validate-booking error:", e);
    return new Response(JSON.stringify({ allowed: false, reason: "Validation error. Please try again." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function jsonResponse(data: ValidationResult) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
