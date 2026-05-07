import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REPLIT_INBOX_URL =
  Deno.env.get("REPLIT_INBOX_URL") ||
  "https://294617d8-2084-4895-8e41-8e7fdf1efde4-00-37kl744l50epn.riker.replit.dev/api/email/inbox";

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

    if (action === "mark_read") {
      const id = body?.id;
      if (!id) {
        return new Response(JSON.stringify({ ok: false, error: "Missing id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      try {
        const r = await fetch(`${REPLIT_INBOX_URL}/${encodeURIComponent(String(id))}/read`, {
          method: "PATCH",
          headers: { Authorization: authHeader },
        });
        const j = await r.json().catch(() => ({}));
        return new Response(JSON.stringify({ ok: r.ok, data: j }), {
          status: r.ok ? 200 : 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Replit unreachable" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action !== "list") {
      return new Response(JSON.stringify({ ok: false, error: "Unsupported action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const folder = String(body?.folder || "inbox");
    const search = String(body?.search || "").trim().toLowerCase();
    const statuses = FOLDER_STATUS_MAP[folder] ?? FOLDER_STATUS_MAP.inbox;

    // 1) Try Replit inbox first (inbound emails routed via Resend → Replit)
    let replitMessages: any[] = [];
    try {
      const params = new URLSearchParams();
      if (body?.to) params.set("to", String(body.to));
      params.set("limit", String(body?.limit || 100));
      params.set("offset", String(body?.offset || 0));
      const url = `${REPLIT_INBOX_URL}?${params.toString()}`;
      const r = await fetch(url, {
        headers: { Authorization: authHeader, "Content-Type": "application/json" },
      });
      if (r.ok) {
        const j = await r.json().catch(() => ({}));
        const emails = j?.data?.emails || j?.emails || [];
        replitMessages = (Array.isArray(emails) ? emails : []).map((e: any) => ({
          id: `replit-${e.id}`,
          message_id: String(e.id),
          recipient_email: e.toAddress || "",
          template_name: e.subject || "Inbound email",
          status: e.isRead ? "sent" : "pending",
          error_message: null,
          metadata: {
            subject: e.subject,
            preview: e.bodyText,
            text: e.bodyText,
            fromName: e.fromName,
            fromEmail: e.fromEmail,
            identity: (e.advisorName || "").toLowerCase().includes("aria")
              ? "advisor"
              : "general",
            advisorName: e.advisorName,
            industry: e.industry,
            aiReply: e.aiReply,
            repliedAt: e.repliedAt,
            source: "replit-inbound",
          },
          created_at: e.receivedAt || new Date().toISOString(),
        }));
      }
    } catch (_err) {
      // Replit unreachable — fall back to log only
    }

    // 2) Read outbound log as fallback / Sent folder source
    let query = supabase
      .from("email_send_log")
      .select("id,message_id,recipient_email,template_name,status,error_message,metadata,created_at")
      .order("created_at", { ascending: false })
      .limit(250);

    if (Array.isArray(statuses)) {
      if (statuses.length === 0) {
        return new Response(JSON.stringify({ ok: true, data: { messages: replitMessages } }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      query = query.in("status", statuses);
    }

    const { data, error } = await query;
    if (error) throw error;

    const combined = [...replitMessages, ...(data || [])];
    const filtered = combined.filter((row: any) => {
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

    filtered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

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