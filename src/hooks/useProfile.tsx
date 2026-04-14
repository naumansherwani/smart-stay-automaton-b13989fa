import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { IndustryType } from "@/lib/industryConfig";
import { getUserAvatarUrl, getUserDisplayName } from "@/lib/utils";

export type BusinessSubtype = "hotel_property" | "travel_tours" | null;

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  company_name: string | null;
  phone: string | null;
  industry: IndustryType;
  business_subtype: BusinessSubtype;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        const industry = (data?.industry as IndustryType) || "hospitality";
        const displayName = getUserDisplayName(user, data?.display_name);
        const avatarUrl = getUserAvatarUrl(user, data?.avatar_url);

        const resolvedProfile: Profile = {
          id: data?.id ?? user.id,
          user_id: user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          company_name: data?.company_name ?? null,
          phone: data?.phone ?? null,
          industry,
          business_subtype: (data?.business_subtype as BusinessSubtype) ?? null,
        };

        if (!cancelled) {
          setProfile(resolvedProfile);
        }

        if (!data) {
          await supabase.from("profiles").insert({
            user_id: user.id,
            display_name: displayName,
            avatar_url: avatarUrl,
            industry,
          });
        } else {
          const updates: { display_name?: string; avatar_url?: string } = {};

          if (displayName && displayName !== data.display_name) {
            updates.display_name = displayName;
          }

          if (avatarUrl && avatarUrl !== data.avatar_url) {
            updates.avatar_url = avatarUrl;
          }

          if (Object.keys(updates).length > 0) {
            await supabase
              .from("profiles")
              .update(updates)
              .eq("user_id", user.id);
          }
        }
      } catch (error) {
        console.error("Failed to load profile", error);

        if (!cancelled) {
          setProfile({
            id: user.id,
            user_id: user.id,
            display_name: getUserDisplayName(user),
            avatar_url: getUserAvatarUrl(user),
            company_name: null,
            phone: null,
            industry: "hospitality",
            business_subtype: null,
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const updateIndustry = async (industry: IndustryType) => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ industry })
      .eq("user_id", user.id);
    setProfile(prev => prev ? { ...prev, industry } : null);
  };

  const updateProfile = async (updates: { display_name?: string; company_name?: string; phone?: string; avatar_url?: string }) => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  return { profile, loading, updateIndustry, updateProfile };
}
