import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { IndustryType } from "@/lib/industryConfig";
import AnimatedTopBorder from "@/components/AnimatedTopBorder";
import { GhostSidebar } from "./GhostSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Globe, LogIn } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatarUrl, getUserDisplayName, getUserInitials } from "@/lib/utils";
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
      />
    );
  }

  const displayName = getUserDisplayName(user, profile?.display_name);
  const avatarUrl = getUserAvatarUrl(user, profile?.avatar_url);
  const initials = getUserInitials(displayName, user?.email);

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
            title="Customer Preview (Ctrl+Shift+P)"
          >
            <Globe className="w-4 h-4" /> <span className="hidden md:inline">Customer Preview</span>
          </Button>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate("/settings")}
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-1 border-l border-border/40 pl-2 ml-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => navigate("/profile")}
              aria-label="Open profile"
            >
              <Avatar className="h-10 w-10 border-2 border-primary/40 shadow-md ring-2 ring-primary/10">
                <AvatarImage src={avatarUrl ?? undefined} alt={`${displayName} profile photo`} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs hover:bg-destructive/10 hover:text-destructive"
                onClick={() => { signOut(); navigate("/"); }}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => navigate("/login")}
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden md:inline">Login</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <TrialBanner />

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
