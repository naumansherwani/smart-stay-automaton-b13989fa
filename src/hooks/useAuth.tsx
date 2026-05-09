import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

const AUTH_STORAGE_KEY = "sb-uapvdzphibxoomokahjh-auth-token";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let lastLoggedUserId: string | null = null;
    let recoveredInvalidRefresh = false;
    const fireLogin = (uid: string) => {
      if (lastLoggedUserId === uid) return;
      lastLoggedUserId = uid;
      supabase.functions
        .invoke("arc-event-ingest", { body: { event_type: "login", event_category: "auth" } })
        .catch(() => {});
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
        fireLogin(session.user.id);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        if (session?.user) fireLogin(session.user.id);
      })
      .catch((error) => {
        const code = (error as { code?: string } | null)?.code;
        const message = (error as { message?: string } | null)?.message ?? "";
        const isInvalidRefresh =
          code === "refresh_token_not_found" || message.toLowerCase().includes("invalid refresh token");

        if (isInvalidRefresh && !recoveredInvalidRefresh) {
          recoveredInvalidRefresh = true;
          try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          } catch {
            /* ignore storage cleanup failure */
          }
          void supabase.auth.signOut({ scope: "local" }).catch(() => {});
        }

        setSession(null);
        setUser(null);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
