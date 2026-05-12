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

// ── Module-level shared state ────────────────────────────────────────────
// Every component that calls useWorkspaces() reads/writes the SAME state.
// Without this, AppLayout (header) and Dashboard (body) had separate
// instances, so switching industry updated the header but the dashboard
// body kept rendering the previous industry's KPIs/widgets.
let _workspaces: Workspace[] = [];
let _active: Workspace | null = null;
let _loading = true;
let _userId: string | null = null;
const _subs = new Set<() => void>();
const _emit = () => _subs.forEach((fn) => fn());

export function useWorkspaces() {
  const { user } = useAuth();
  const [, force] = useState(0);

  // Subscribe this component to module-level updates.
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    _subs.add(fn);
    return () => {
      _subs.delete(fn);
    };
  }, []);

  // Fetch once per user (guarded by _userId so multiple mounts don't refetch).
  useEffect(() => {
    if (!user) {
      _workspaces = [];
      _active = null;
      _loading = false;
      _userId = null;
      _emit();
      return;
    }
    if (_userId === user.id && _workspaces.length > 0) return;
    _userId = user.id;
    _loading = true;
    _emit();
    (async () => {
      const { data } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      const ws = (data as Workspace[]) || [];
      _workspaces = ws;
      _active = ws.find((w) => w.is_active) || ws[0] || null;
      _loading = false;
      _emit();
    })();
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
    _workspaces = [..._workspaces.map((w) => ({ ...w, is_active: false })), ws];
    _active = ws;
    _emit();
    return ws;
  };

  const switchWorkspace = async (workspaceId: string) => {
    if (!user) return;

    const target = _workspaces.find((w) => w.id === workspaceId);

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

    _workspaces = _workspaces.map((w) => ({
      ...w,
      is_active: w.id === workspaceId,
    }));
    _active = _workspaces.find((w) => w.id === workspaceId) || _active;
    _emit();
  };

  return {
    workspaces: _workspaces,
    activeWorkspace: _active,
    loading: _loading,
    createWorkspace,
    switchWorkspace,
  };
}
