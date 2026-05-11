import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve a short-lived signed URL for a path inside the private
 * `profile-avatars` bucket. Returns null while loading or if no path.
 *
 * The URL is refreshed before its 1-hour expiry so the avatar never
 * 404s during a long session.
 */
export function useAvatarSignedUrl(path: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const fetchUrl = async () => {
      if (!path) {
        setUrl(null);
        return;
      }
      try {
        const { data, error } = await supabase
          .storage
          .from("profile-avatars")
          .createSignedUrl(path, 60 * 60); // 1 hour
        if (cancelled) return;
        if (error || !data?.signedUrl) {
          setUrl(null);
          return;
        }
        setUrl(data.signedUrl);
        // Refresh 5 min before expiry.
        timer = setTimeout(fetchUrl, (60 * 60 - 300) * 1000);
      } catch {
        if (!cancelled) setUrl(null);
      }
    };

    fetchUrl();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [path]);

  return url;
}