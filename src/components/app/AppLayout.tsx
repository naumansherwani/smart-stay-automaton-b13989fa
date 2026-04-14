import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { IndustryType } from "@/lib/industryConfig";
import AnimatedTopBorder from "@/components/AnimatedTopBorder";
import { GhostSidebar } from "./GhostSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Globe, Mail, Wallet } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
  const [unreadEmails, setUnreadEmails] = useState(3); // placeholder count

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
          {/* Owner Profile Photo - Facebook style */}
          {user && (
            <button
              onClick={() => navigate("/profile")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Avatar className="h-9 w-9 border-2 border-primary/40 shadow-md ring-2 ring-primary/10">
                <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-semibold text-foreground">{displayName}</span>
            </button>
          )}
          <div className="hidden sm:block">
            <WorkspaceSlidePanel />
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {/* Email Messages Badge */}
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full"
            onClick={() => navigate("/messages")}
            aria-label="Messages"
          >
            <Mail className="w-4 h-4" />
            {unreadEmails > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                {unreadEmails}
              </span>
            )}
          </Button>

          {/* Earnings Badge */}
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => navigate("/earnings")}
            >
              <Wallet className="w-4 h-4 text-emerald-500" />
              <span className="hidden md:inline font-semibold text-emerald-500">Earnings</span>
            </Button>
          )}

          {/* Choose Your Industry */}
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

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => navigate("/settings")}
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Settings</span>
          </Button>

          {/* Logout */}
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
