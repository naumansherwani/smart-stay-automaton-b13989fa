import { useState, useEffect, useCallback } from "react";
import { GhostSidebar } from "./GhostSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Globe, ChevronDown, LogIn } from "lucide-react";
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
    const logoHandler = () => togglePublicMode();
    window.addEventListener("keydown", handler);
    window.addEventListener("toggle-public-view", logoHandler);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("toggle-public-view", logoHandler);
    };
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
        <div className="flex items-center gap-3 ml-8 md:ml-14">
          {industryLabel && (
            <div className="hidden sm:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/25 shadow-[0_0_12px_-3px_hsl(var(--primary)/0.2)] hover:shadow-[0_0_18px_-3px_hsl(var(--primary)/0.35)] hover:border-primary/40 hover:brightness-105 transition-all duration-300 cursor-pointer group">
              <span className="text-sm text-muted-foreground font-medium">Workspace:</span>
              <span className="text-sm font-bold text-foreground">{industryLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
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
          <div className="flex items-center gap-1 border-l border-border/40 pl-2 ml-1">
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
