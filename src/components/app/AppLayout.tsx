import { useState, useEffect, useCallback } from "react";
import { GhostSidebar } from "./GhostSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Globe } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatarUrl, getUserDisplayName, getUserInitials } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import TrialBanner from "@/components/TrialBanner";
import { INDUSTRY_CONFIGS } from "@/lib/industryConfig";
import PublicView from "./PublicView";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [publicMode, setPublicMode] = useState(false);

  const togglePublicMode = useCallback(() => setPublicMode(prev => !prev), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "P") {
        e.preventDefault();
        togglePublicMode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePublicMode]);

  if (publicMode) {
    return <PublicView onReturn={() => setPublicMode(false)} />;
  }

  const displayName = getUserDisplayName(user, profile?.display_name);
  const avatarUrl = getUserAvatarUrl(user, profile?.avatar_url);
  const initials = getUserInitials(displayName, user?.email);

  const industryLabel = profile?.industry
    ? INDUSTRY_CONFIGS[profile.industry]?.label || profile.industry
    : "";

  return (
    <div className="min-h-screen flex flex-col w-full">
      <GhostSidebar />

      <header className="sticky top-0 z-50 h-14 flex items-center justify-between border-b border-border/50 bg-card/60 backdrop-blur-xl px-4 md:pl-6">
        <div className="flex items-center gap-3">
          {industryLabel && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 ml-4">
              <span className="text-xs font-semibold text-primary">Workspace:</span>
              <span className="text-xs font-bold text-foreground">{industryLabel}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={togglePublicMode}
            title="Public View (Ctrl+Shift+P)"
          >
            <Globe className="w-4 h-4" /> <span className="hidden md:inline">Public View</span>
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
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate("/profile")}
            aria-label="Open profile"
          >
            <Avatar className="h-8 w-8 border border-border/60">
              <AvatarImage src={avatarUrl ?? undefined} alt={`${displayName} profile photo`} />
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-destructive/10 hover:text-destructive"
            onClick={() => { signOut(); navigate("/"); }}
          >
            <LogOut className="w-4 h-4" />
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
