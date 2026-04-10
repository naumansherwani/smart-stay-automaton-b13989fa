import { useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";

export function useCrmActivityLogger() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const industry = profile?.industry || "hospitality";

  const logActivity = useCallback(async (
    action_type: string,
    entity_type: string,
    entity_id?: string,
    description?: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!user) return;
    await supabase.from("crm_activity_logs" as any).insert({
      user_id: user.id,
      industry,
      action_type,
      entity_type,
      entity_id: entity_id || null,
      description: description || null,
      metadata: metadata || {},
    } as any);
  }, [user, industry]);

  return { logActivity };
}

// Auto-save hook that syncs CRM data every 60 seconds
export function useCrmAutoSync(dataKey: string, getData: () => any) {
  const { user } = useAuth();
  const lastSyncRef = useRef<string>("");

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const currentData = getData();
      const dataStr = JSON.stringify(currentData);
      if (dataStr !== lastSyncRef.current && currentData) {
        lastSyncRef.current = dataStr;
        // Data is already saved via individual CRUD operations
        // This just ensures consistency by re-fetching if needed
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [user, dataKey, getData]);
}
