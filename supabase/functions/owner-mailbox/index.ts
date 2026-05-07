import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FOLDER_STATUS_MAP: Record<string, string[] | null> = {
  inbox: ["sent", "pending", "failed", "suppressed", "bounced", "complained", "dlq"],
  priority: ["failed", "bounced", "complained", "dlq"],
  unread: ["pending", "failed", "bounced", "complained", "dlq"],
  sent: ["sent"],
  drafts: null,
  scheduled: ["pending"],
  starred: null,
  archive: [],
  spam: ["complained", "suppressed"],
  trash: [],
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ ok: false, error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, serviceKey);
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", authData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ ok: false, error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action || "list";

    if (action !== "list") {
      return new Response(JSON.stringify({ ok: false, error: "Unsupported action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const folder = String(body?.folder || "inbox");
    const search = String(body?.search || "").trim().toLowerCase();
    const statuses = FOLDER_STATUS_MAP[folder] ?? FOLDER_STATUS_MAP.inbox;

    let query = supabase
      .from("email_send_log")
      .select("id,message_id,recipient_email,template_name,status,error_message,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(250);

    if (Array.isArray(statuses)) {
      if (statuses.length === 0) {
        return new Response(JSON.stringify({ ok: true, data: { messages: [] } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      query = query.in("status", statuses);
    }

    const { data, error } = await query;
    if (error) throw error;

    const filtered = (data || []).filter((row: any) => {
      if (!search) return true;
      const haystack = [
        row.recipient_email,
        row.template_name,
        row.status,
        row.error_message,
        typeof row.metadata === "object" ? JSON.stringify(row.metadata) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });

    return new Response(JSON.stringify({ ok: true, data: { messages: filtered } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});