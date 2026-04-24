import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * ARC Engine event tracker.
 * Fires `login` once per session and exposes `trackFeature` for feature usage.
 * All events are sent to the `arc-event-ingest` edge function.
 */
export function useArcTracking() {
  const { user } = useAuth();
  const loginFired = useRef(false);

  useEffect(() => {
    if (!user || loginFired.current) return;
    loginFired.current = true;
    supabase.functions
      .invoke("arc-event-ingest", {
        body: { event_type: "login", event_category: "auth" },
      })
      .catch(() => {});
  }, [user]);
}

export async function trackArcFeature(feature_key: string, metadata: Record<string, any> = {}) {
  try {
    await supabase.functions.invoke("arc-event-ingest", {
      body: {
        event_type: "feature_used",
        event_category: "activity",
        feature_key,
        metadata,
      },
    });
  } catch {
    /* fire-and-forget */
  }
}
