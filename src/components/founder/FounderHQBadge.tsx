import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Crown, ArrowUpRight } from "lucide-react";

export default function FounderHQBadge() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) { setIsAdmin(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  if (!isAdmin) return null;

  return (
    <button
      onClick={() => window.open("/founder", "_blank", "noopener")}
      className="group fixed bottom-6 right-6 z-[60] flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-full bg-gradient-to-r from-[#0F172A] to-[#1F2937] border border-amber-500/30 shadow-2xl shadow-amber-500/20 hover:shadow-amber-500/40 hover:border-amber-500/60 transition-all duration-300"
      title="Open Founder Command Center"
    >
      <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg">
        <Crown className="w-3.5 h-3.5 text-white" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-[#0F172A]" />
      </span>
      <span className="text-white text-xs font-semibold tracking-wide">Owner Command Center</span>
      <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
    </button>
  );
}
