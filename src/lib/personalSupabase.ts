import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const PERSONAL_SUPABASE_URL = "https://qsfmsjyorhicydtoiluk.supabase.co";
export const PERSONAL_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_2Ys8isiGGWE3sUqEcIbEgA_yajwvX4i";

export const supabase = createClient<Database>(PERSONAL_SUPABASE_URL, PERSONAL_SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});