import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { IndustryType } from "@/lib/industryConfig";
import AnimatedTopBorder from "@/components/AnimatedTopBorder";
import { GhostSidebar } from "./GhostSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useProfile } from "@/hooks/useProfile";
import TrialBanner from "@/components/TrialBanner";
import PublicView from "./PublicView";
import IndustryIcon from "@/components/dashboard/IndustryIcon";
import WinBackOfferModal from "@/components/winback/WinBackOfferModal";
import PlanSwitcher, { PlanSwitcherBanner } from "./PlanSwitcher";
import UserHalo from "@/components/identity/UserHalo";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { INDUSTRY_CONFIGS } from "@/lib/industryConfig";
import { useWorkspaceTheme } from "@/hooks/useWorkspaceTheme";
import { toast } from "sonner";

const INDUSTRY_LABELS: Record<IndustryType, string> = {
  hospitality: "Travel, Tourism & Hospitality",
  airlines: "Airlines",
  car_rental: "Car Rental",
  healthcare: "Healthcare",
  education: "Education",
  logistics: "Logistics",
  events_entertainment: "Events",
  railways: "Railways",
};

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { workspaces, activeWorkspace, createWorkspace, switchWorkspace } = useWorkspaces();
  const [isAdmin, setIsAdmin] = useState(false);
  const [publicMode, setPublicMode] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);
  // Apply industry-scoped color theme to <html data-industry="...">.
  // Respects user's chosen mode (industry/brand/system) from localStorage.
  useWorkspaceTheme();

  // SINGLE source of truth: active workspace industry wins, profile is fallback only.
  // This prevents header/sidebar mismatch (e.g. left shows Car Rental, right shows Airlines).
  const currentIndustry = (activeWorkspace?.industry as IndustryType)
    || (profile?.industry as IndustryType)
    || "hospitality";
  const togglePublicMode = useCallback(() => setPublicMode(prev => !prev), []);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
      // Only auto-open PublicView the first time per session.
      // Once admin picks an industry (or closes it), don't re-open on every page mount.
      const hasExitedPublic = sessionStorage.getItem("admin_exited_public") === "1";
      if (!!data && !adminChecked && !hasExitedPublic) setPublicMode(true);
      setAdminChecked(true);
    });
  }, [user]);

  // Auto-heal: if activeWorkspace.industry diverges from profile.industry,
  // sync profile to match workspace (single source of truth = active workspace).
  // Prevents header/tabs/sidebar showing different industries.
  useEffect(() => {
    if (!user || !activeWorkspace?.industry || !profile) return;
    if (profile.industry !== activeWorkspace.industry) {
      supabase.from("profiles")
        .update({ industry: activeWorkspace.industry })
        .eq("user_id", user.id)
        .then(() => {});
    }
  }, [user, activeWorkspace?.industry, profile?.industry]);

  const handleIndustrySelect = useCallback(async (industry: IndustryType) => {
    if (!user) return;
    // Skip if already on this industry (check workspace, not just profile)
    if (activeWorkspace?.industry === industry && profile?.industry === industry) {
      sessionStorage.setItem("admin_exited_public", "1");
      setPublicMode(false);
      navigate("/dashboard");
      return;
    }
    // 1. Sync workspace FIRST — switch if exists, otherwise create
    const existing = workspaces.find(w => w.industry === industry);
    if (existing) {
      await switchWorkspace(existing.id);
    } else {
      const label = INDUSTRY_CONFIGS[industry]?.label || industry;
      await createWorkspace(label, industry);
    }

    // 2. Update profile industry to MATCH workspace (keeps both in sync)
    await supabase.from("profiles").update({ industry }).eq("user_id", user.id);

    // 3. Close public view + go to that industry's dashboard
    sessionStorage.setItem("admin_exited_public", "1");
    setPublicMode(false);
    toast.success(`Switched to ${INDUSTRY_CONFIGS[industry]?.label || industry}`);
    navigate("/dashboard");
  }, [user, profile?.industry, activeWorkspace?.industry, workspaces, switchWorkspace, createWorkspace, navigate]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        e.preventDefault();
        togglePublicMode();
      }
    };
    const logoHandler = () => togglePublicMode();
    window.addEventListener("keydown", handler);
    window.addEventListener("toggle-public-view", logoHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("toggle-public-view", logoHandler);
    };
  }, [togglePublicMode]);

  if (publicMode) {
    return (
      <PublicView
        onReturn={() => setPublicMode(false)}
        onIndustrySelect={isAdmin ? handleIndustrySelect : undefined}
        currentIndustry={currentIndustry}
        isAdmin={isAdmin}
        user={user}
        profile={profile}
      />
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col w-full transition-[padding] duration-300"
      style={{ paddingLeft: "var(--app-sidebar-w, 0px)" }}
    >
      <AnimatedTopBorder />
      <GhostSidebar />

      <header className="sticky top-0 z-50 h-14 flex items-center justify-between border-b border-border/50 bg-card/60 backdrop-blur-xl px-4 md:pl-6">
        <div className="flex items-center gap-3 ml-12 md:ml-0" />

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <PlanSwitcher />
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-xs font-medium bg-[hsl(168_70%_38%)]/10 text-foreground border border-[hsl(168_70%_38%)]/30 hover:bg-[hsl(168_70%_38%)]/20 hover:text-white transition-all"
            onClick={togglePublicMode}
            title="Choose Your Industry (Ctrl+Shift+P)"
          >
            <IndustryIcon industry={currentIndustry} size={16} />
            <span className="hidden md:inline font-semibold">{INDUSTRY_LABELS[currentIndustry]}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </Button>
          <UserHalo
            size={32}
            industry={currentIndustry}
            founderBadge={isAdmin}
            onClick={() => navigate("/profile")}
            title="Your Profile"
          />
        </div>
      </header>

      <PlanSwitcherBanner />
      <TrialBanner />

      <main className="flex-1">
        {children}
      </main>

      {/* Win-Back personalized offer for canceled users */}
      <WinBackOfferModal />
    </div>
  );
}
