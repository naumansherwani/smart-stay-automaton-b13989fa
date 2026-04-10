import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const isOnboarding = window.location.pathname === "/onboarding";

  // If user has industry, skip onboarding and go to dashboard
  if (isOnboarding && profile?.industry) {
    return <Navigate to="/dashboard" replace />;
  }

  // If no industry selected, redirect to onboarding
  if (!isOnboarding && profile && !profile.industry) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
