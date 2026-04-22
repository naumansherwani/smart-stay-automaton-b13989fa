import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { IndustryType } from "@/lib/industryConfig";
import AnimatedTopBorder from "@/components/AnimatedTopBorder";
import { GhostSidebar } from "./GhostSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useProfile } from "@/hooks/useProfile";
import TrialBanner from "@/components/TrialBanner";
import PublicView from "./PublicView";
import WorkspaceSlidePanel from "@/components/dashboard/WorkspaceSlidePanel";
import IndustryIcon from "@/components/dashboard/IndustryIcon";

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [publicMode, setPublicMode] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const currentIndustry = (profile?.industry as IndustryType) || "hospitality";
  const togglePublicMode = useCallback(() => setPublicMode(prev => !prev), []);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
      if (!!data && !adminChecked) setPublicMode(true);
      setAdminChecked(true);
    });
  }, [user]);

  const handleIndustrySelect = useCallback(async (industry: IndustryType) => {
    if (!user) return;
    await supabase.from("profiles").update({ industry }).eq("user_id", user.id);
  }, [user]);

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
    <div className="min-h-screen flex flex-col w-full">
      <AnimatedTopBorder />
      <GhostSidebar />

      <header className="sticky top-0 z-50 h-14 flex items-center justify-between border-b border-border/50 bg-card/60 backdrop-blur-xl px-4 md:pl-6">
        <div className="flex items-center gap-3 ml-8 md:ml-14">
          <div className="hidden sm:block">
            <WorkspaceSlidePanel />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-xs font-medium hover:bg-primary/10 transition-all"
            onClick={togglePublicMode}
            title="Choose Your Industry (Ctrl+Shift+P)"
          >
            <IndustryIcon industry={currentIndustry} size={16} />
            <span className="hidden md:inline font-semibold">{INDUSTRY_LABELS[currentIndustry]}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden lg:inline text-muted-foreground">·</span>
            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden lg:inline text-muted-foreground">Switch</span>
          </Button>
        </div>
      </header>

      <TrialBanner />

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
