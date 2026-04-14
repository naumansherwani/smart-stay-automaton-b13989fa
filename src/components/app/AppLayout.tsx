import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { IndustryType } from "@/lib/industryConfig";
import AnimatedTopBorder from "@/components/AnimatedTopBorder";
import { GhostSidebar } from "./GhostSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Globe } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useProfile } from "@/hooks/useProfile";
import TrialBanner from "@/components/TrialBanner";
import PublicView from "./PublicView";
import WorkspaceSlidePanel from "@/components/dashboard/WorkspaceSlidePanel";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [publicMode, setPublicMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const togglePublicMode = useCallback(() => setPublicMode(prev => !prev), []);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const handleIndustrySelect = useCallback(async (industry: IndustryType) => {
    if (!user) return;
    await supabase.from("profiles").update({ industry }).eq("user_id", user.id);
    setPublicMode(false);
    window.location.reload();
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
        currentIndustry={(profile?.industry as IndustryType) || "hospitality"}
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

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={togglePublicMode}
            title="Choose Your Industry (Ctrl+Shift+P)"
          >
            <Globe className="w-4 h-4" /> <span className="hidden md:inline">Choose Your Industry</span>
          </Button>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => navigate("/settings")}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Settings</span>
          </Button>
          {user && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs hover:bg-destructive/10 hover:text-destructive"
              onClick={() => { signOut(); navigate("/"); }}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          )}
        </div>
      </header>

      <TrialBanner />

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
