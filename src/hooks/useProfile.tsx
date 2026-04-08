import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { IndustryType } from "@/lib/industryConfig";

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  phone: string | null;
  industry: IndustryType;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (data) {
        setProfile({
          ...data,
          industry: (data.industry as IndustryType) || "hospitality",
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const updateIndustry = async (industry: IndustryType) => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ industry })
      .eq("user_id", user.id);
    setProfile(prev => prev ? { ...prev, industry } : null);
  };

  return { profile, loading, updateIndustry };
}
