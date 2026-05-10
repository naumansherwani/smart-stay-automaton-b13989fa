import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { IndustryType } from "@/lib/industryConfig";

export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  industry: IndustryType;
  is_active: boolean;
  created_at: string;
}

export function useWorkspaces() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      const ws = (data as Workspace[]) || [];
      setWorkspaces(ws);
      setActiveWorkspaceState(ws.find(w => w.is_active) || ws[0] || null);
      setLoading(false);
    };

    fetch();
  }, [user]);

  const createWorkspace = async (name: string, industry: IndustryType) => {
    if (!user) return null;

    // Deactivate others
    await supabase
      .from("workspaces")
      .update({ is_active: false })
      .eq("user_id", user.id);

    const { data, error } = await supabase
      .from("workspaces")
      .insert({ user_id: user.id, name, industry, is_active: true })
      .select()
      .single();

    if (error || !data) return null;

    const ws = data as Workspace;
    setWorkspaces(prev => [...prev.map(w => ({ ...w, is_active: false })), ws]);
    setActiveWorkspaceState(ws);
    return ws;
  };

  const switchWorkspace = async (workspaceId: string) => {
    if (!user) return;

    const target = workspaces.find(w => w.id === workspaceId);

    await supabase
      .from("workspaces")
      .update({ is_active: false })
      .eq("user_id", user.id);

    await supabase
      .from("workspaces")
      .update({ is_active: true })
      .eq("id", workspaceId);

    // CRITICAL: keep profiles.industry in sync with the active workspace.
    // Prevents header/sidebar showing different industries (never-mix rule).
    if (target) {
      await supabase
        .from("profiles")
        .update({ industry: target.industry })
        .eq("user_id", user.id);
    }

    setWorkspaces(prev =>
      prev.map(w => ({ ...w, is_active: w.id === workspaceId }))
    );
    setActiveWorkspaceState(prev =>
      workspaces.find(w => w.id === workspaceId) || prev
    );
  };

  return { workspaces, activeWorkspace, loading, createWorkspace, switchWorkspace };
}
