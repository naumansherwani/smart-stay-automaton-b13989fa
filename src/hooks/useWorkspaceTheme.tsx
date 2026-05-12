import { useEffect } from "react";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useProfile } from "@/hooks/useProfile";

export type WorkspaceThemeMode = "industry" | "brand" | "system";

const STORAGE_KEY = "hostflow_workspace_theme_mode";

export function getWorkspaceThemeMode(): WorkspaceThemeMode {
  if (typeof window === "undefined") return "industry";
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "brand" || v === "system" ? v : "industry";
}

export function setWorkspaceThemeMode(mode: WorkspaceThemeMode) {
  localStorage.setItem(STORAGE_KEY, mode);
  window.dispatchEvent(new Event("workspace-theme-mode-changed"));
}

/**
 * Applies `data-industry` attribute to <html> based on user's chosen theme mode:
 *  - "industry" (default): uses activeWorkspace.industry
 *  - "brand": forces HostFlow teal brand identity
 *  - "system": clears attribute → falls back to base brand teal (same as default)
 *
 * CSS in index.css scopes each industry's color tokens via [data-industry="X"].
 * On unmount, the attribute is cleared so landing/auth pages stay on default brand.
 */
export function useWorkspaceTheme() {
  const { activeWorkspace } = useWorkspaces();
  const { profile } = useProfile();

  useEffect(() => {
    const apply = () => {
      const root = document.documentElement;
      const mode = getWorkspaceThemeMode();
      if (mode === "brand" || mode === "system") {
        if (mode === "brand") root.dataset.industry = "brand";
        else delete root.dataset.industry;
        return;
      }
      const industry = activeWorkspace?.industry || profile?.industry;
      if (industry) root.dataset.industry = industry;
      else delete root.dataset.industry;
    };
    apply();
    window.addEventListener("workspace-theme-mode-changed", apply);
    return () => {
      window.removeEventListener("workspace-theme-mode-changed", apply);
    };
  }, [activeWorkspace?.industry, profile?.industry]);

  // Only clear `data-industry` on full unmount (e.g. navigating to landing /
  // login). Previously this ran on every dep change, causing a one-frame
  // un-themed flicker each time the workspace or profile updated.
  useEffect(() => {
    return () => {
      delete document.documentElement.dataset.industry;
    };
  }, []);
}
