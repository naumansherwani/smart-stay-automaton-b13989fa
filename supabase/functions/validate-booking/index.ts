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
  guest_name?: string;
  guest_email?: string;
  industry?: string;
}

interface ValidationResult {
  allowed: boolean;
  reason?: string;
  conflict_type?: "overlap" | "capacity" | "buffer" | "minimum_stay" | "maintenance";
  auto_reassigned?: boolean;
  reassigned_resource_id?: string;
  reassigned_resource_name?: string;
  conflicting_bookings?: { guest_name: string; check_in: string; check_out: string }[];
  suggested_slot?: { start: string; end: string };
  auto_rescheduled?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ allowed: false, reason: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    // Service role client for logging conflicts (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return jsonResponse({ allowed: false, reason: "Unauthorized" }, 401);
    }

    const body: ValidationRequest = await req.json();
    const { resource_id, check_in, check_out, group_size = 1, business_type, guest_name = "Unknown", guest_email, industry = "hospitality" } = body;

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
    const isCarRental = resource.industry === "car_rental";
    const reqStart = new Date(check_in).getTime();
    const reqEnd = new Date(check_out).getTime();

    // Helper: log conflict
    async function logConflict(params: {
      conflictType: string;
      resolution: string;
      existingClient: string;
      existingStart: string;
      existingEnd: string;
      resolvedResourceId?: string;
      resolvedResourceName?: string;
      suggestedStart?: string;
      suggestedEnd?: string;
    }) {
      try {
        await supabaseAdmin.from("booking_conflicts").insert({
          user_id: user!.id,
          resource_id,
          resource_name: resource.name,
          existing_client: params.existingClient,
          new_client: guest_name,
          new_client_email: guest_email || null,
          existing_time_start: params.existingStart,
          existing_time_end: params.existingEnd,
          new_time_start: check_in,
          new_time_end: check_out,
          conflict_type: params.conflictType,
          resolution: params.resolution,
          resolved_resource_id: params.resolvedResourceId || null,
          resolved_resource_name: params.resolvedResourceName || null,
          suggested_slot_start: params.suggestedStart || null,
          suggested_slot_end: params.suggestedEnd || null,
          industry,
        });
      } catch (e) {
        console.error("Failed to log conflict:", e);
      }
    }

    // 2. Check maintenance blocks (car rental)
    if (isCarRental && resource.metadata) {
      const meta = resource.metadata as Record<string, unknown>;
      const maintenanceBlocks = (meta.maintenance_blocks as any[]) || [];
      const maintenanceConflict = maintenanceBlocks.find((mb: any) => {
        const mbStart = new Date(mb.start).getTime();
        const mbEnd = new Date(mb.end).getTime();
        return reqStart < mbEnd && reqEnd > mbStart;
      });
      if (maintenanceConflict) {
        await logConflict({
          conflictType: "maintenance",
          resolution: "auto-declined",
          existingClient: "Maintenance",
          existingStart: maintenanceConflict.start,
          existingEnd: maintenanceConflict.end,
        });
        return jsonResponse({
          allowed: false,
          reason: `Vehicle is blocked for maintenance (${maintenanceConflict.reason || "Scheduled"}) during the requested period.`,
          conflict_type: "maintenance",
        });
      }
    }

    // 3. Check for overlapping bookings on the requested resource
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

    // 4. For non-tour (1:1 resource like hotel room or car): any overlap = conflict
    if (!isTour && overlaps && overlaps.length > 0) {
      const firstConflict = conflictingBookings[0];

      // Try auto-reassignment: find another available resource of same type
      const { data: altResources } = await supabase
        .from("resources")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .eq("industry", resource.industry)
        .neq("id", resource_id);

      const sameTypeResources = (altResources || []).filter(
        r => r.business_type === resource.business_type
      );
      const candidates = sameTypeResources.length > 0 ? sameTypeResources : (altResources || []);

      for (const alt of candidates) {
        if (isCarRental && alt.metadata) {
          const altMeta = alt.metadata as Record<string, unknown>;
          const altMaintBlocks = (altMeta.maintenance_blocks as any[]) || [];
          const altMaintConflict = altMaintBlocks.some((mb: any) => {
            const mbStart = new Date(mb.start).getTime();
            const mbEnd = new Date(mb.end).getTime();
            return reqStart < mbEnd && reqEnd > mbStart;
          });
          if (altMaintConflict) continue;
        }

        const { data: altOverlaps } = await supabase
          .from("bookings")
          .select("id")
          .eq("resource_id", alt.id)
          .eq("user_id", user.id)
          .neq("status", "cancelled")
          .lt("check_in", check_out)
          .gt("check_out", check_in);

        if (!altOverlaps || altOverlaps.length === 0) {
          const bufferMs = (alt.turnaround_minutes || 0) * 60 * 1000;
          const { data: nearbyBookings } = await supabase
            .from("bookings")
            .select("id, check_in, check_out")
            .eq("resource_id", alt.id)
            .eq("user_id", user.id)
            .neq("status", "cancelled")
            .gte("check_out", new Date(reqStart - bufferMs).toISOString())
            .lte("check_in", new Date(reqEnd + bufferMs).toISOString());

          const hasBufferConflict = (nearbyBookings || []).some(nb => {
            const nbEnd = new Date(nb.check_out).getTime();
            const nbStart = new Date(nb.check_in).getTime();
            const gapAfter = reqStart - nbEnd;
            const gapBefore = nbStart - reqEnd;
            return (gapAfter >= 0 && gapAfter < bufferMs) || (gapBefore >= 0 && gapBefore < bufferMs);
          });

          if (!hasBufferConflict) {
            // Log auto-reassignment
            await logConflict({
              conflictType: "overlap",
              resolution: "auto-reassigned",
              existingClient: firstConflict.guest_name,
              existingStart: firstConflict.check_in,
              existingEnd: firstConflict.check_out,
              resolvedResourceId: alt.id,
              resolvedResourceName: alt.name,
            });

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

      // No alternate resource found — try finding next available slot on same resource
      const suggestedSlot = await findNextAvailableSlot(supabase, resource_id, user.id, reqStart, reqEnd - reqStart, resource.turnaround_minutes || 0);

      if (suggestedSlot) {
        // Log auto-reschedule
        await logConflict({
          conflictType: "overlap",
          resolution: "auto-reassigned",
          existingClient: firstConflict.guest_name,
          existingStart: firstConflict.check_in,
          existingEnd: firstConflict.check_out,
          suggestedStart: suggestedSlot.start,
          suggestedEnd: suggestedSlot.end,
        });

        return jsonResponse({
          allowed: true,
          auto_rescheduled: true,
          suggested_slot: suggestedSlot,
          conflicting_bookings: conflictingBookings,
          reason: `Auto-rescheduled to ${new Date(suggestedSlot.start).toLocaleDateString()} due to conflict.`,
        });
      }

      // No slot found at all — decline
      await logConflict({
        conflictType: "overlap",
        resolution: "auto-declined",
        existingClient: firstConflict.guest_name,
        existingStart: firstConflict.check_in,
        existingEnd: firstConflict.check_out,
      });

      return jsonResponse({
        allowed: false,
        reason: "Selected time or resource is no longer available. No alternative resources or dates could be found.",
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
        const firstConflict = conflictingBookings[0];
        await logConflict({
          conflictType: "capacity",
          resolution: "auto-declined",
          existingClient: `${existingGroupSizes}/${maxCapacity} spots filled`,
          existingStart: firstConflict?.check_in || check_in,
          existingEnd: firstConflict?.check_out || check_out,
        });

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
        .gte("check_out", new Date(reqStart - bufferMs).toISOString())
        .lte("check_in", new Date(reqEnd + bufferMs).toISOString());

      const bufferConflict = (nearbyBookings || []).find(nb => {
        const nbEnd = new Date(nb.check_out).getTime();
        const nbStart = new Date(nb.check_in).getTime();
        const gapAfter = reqStart - nbEnd;
        const gapBefore = nbStart - reqEnd;
        return (gapAfter >= 0 && gapAfter < bufferMs) || (gapBefore >= 0 && gapBefore < bufferMs);
      });

      if (bufferConflict) {
        await logConflict({
          conflictType: "buffer",
          resolution: "auto-declined",
          existingClient: bufferConflict.guest_name,
          existingStart: bufferConflict.check_in,
          existingEnd: bufferConflict.check_out,
        });

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

// Find the next available time slot for a resource
async function findNextAvailableSlot(
  supabase: any,
  resourceId: string,
  userId: string,
  fromTime: number,
  durationMs: number,
  bufferMinutes: number,
): Promise<{ start: string; end: string } | undefined> {
  const bufferMs = bufferMinutes * 60 * 1000;
  const maxSearch = 7 * 24 * 60 * 60 * 1000;

  const { data: futureBookings } = await supabase
    .from("bookings")
    .select("check_in, check_out")
    .eq("resource_id", resourceId)
    .eq("user_id", userId)
    .neq("status", "cancelled")
    .gte("check_out", new Date(fromTime).toISOString())
    .order("check_in", { ascending: true })
    .limit(20);

  if (!futureBookings || futureBookings.length === 0) {
    return { start: new Date(fromTime).toISOString(), end: new Date(fromTime + durationMs).toISOString() };
  }

  let searchStart = fromTime;
  for (const booking of futureBookings) {
    const bStart = new Date(booking.check_in).getTime();
    const bEnd = new Date(booking.check_out).getTime();
    const gapStart = searchStart + bufferMs;
    const gapEnd = bStart - bufferMs;

    if (gapEnd - gapStart >= durationMs) {
      return { start: new Date(gapStart).toISOString(), end: new Date(gapStart + durationMs).toISOString() };
    }
    searchStart = Math.max(searchStart, bEnd);
  }

  const lastEnd = new Date(futureBookings[futureBookings.length - 1].check_out).getTime();
  const afterLast = lastEnd + bufferMs;
  if (afterLast - fromTime < maxSearch) {
    return { start: new Date(afterLast).toISOString(), end: new Date(afterLast + durationMs).toISOString() };
  }

  return undefined;
}

function jsonResponse(data: ValidationResult, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
