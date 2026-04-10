import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles } from "lucide-react";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatarUrl, getUserDisplayName, getUserInitials } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import TrialBanner from "@/components/TrialBanner";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const displayName = getUserDisplayName(user, profile?.display_name);
  const avatarUrl = getUserAvatarUrl(user, profile?.avatar_url);
  const initials = getUserInitials(displayName, user?.email);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-50 h-14 flex items-center justify-between border-b border-border/50 bg-card/60 backdrop-blur-xl px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>

            <div className="flex items-center gap-1 md:gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
              <NotificationsDropdown />
              <Button
                size="sm"
                className="bg-gradient-primary shadow-[0_0_15px_hsl(var(--primary)/0.2)] hover:shadow-[0_0_25px_hsl(var(--primary)/0.3)] font-semibold"
                onClick={() => navigate("/pricing")}
              >
                <Sparkles className="w-4 h-4 md:mr-1.5" />
                <span className="hidden md:inline">Upgrade</span>
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
      </div>
    </SidebarProvider>
  );
}
