// Owner Scheduled Email Dispatcher — runs every minute via pg_cron
// Picks pending owner_scheduled_emails that are due and sends them via owner-mailbox
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: due, error } = await supabase
      .from("owner_scheduled_emails")
      .select("*")
      .eq("status", "pending")
      .lte("send_at", new Date().toISOString())
      .limit(20);
    if (error) throw error;
    if (!due || due.length === 0) {
      return new Response(JSON.stringify({ ok: true, processed: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let sent = 0, failed = 0;
    for (const m of due) {
      try {
        const r = await fetch(`${SUPABASE_URL}/functions/v1/owner-mailbox`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE}` },
          body: JSON.stringify({
            action: "send",
            to: m.to_addr, cc: m.cc || undefined, bcc: m.bcc || undefined,
            subject: m.subject, html: m.html,
            inReplyTo: m.in_reply_to || undefined, references: m.ref_headers || undefined,
          }),
        });
        const j = await r.json();
        if (!r.ok || !j.ok) throw new Error(j.error || "send failed");
        await supabase.from("owner_scheduled_emails").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", m.id);
        sent++;
      } catch (e: any) {
        await supabase.from("owner_scheduled_emails").update({ status: "failed", error: e?.message || "error" }).eq("id", m.id);
        failed++;
      }
    }
    return new Response(JSON.stringify({ ok: true, processed: due.length, sent, failed }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || "error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
