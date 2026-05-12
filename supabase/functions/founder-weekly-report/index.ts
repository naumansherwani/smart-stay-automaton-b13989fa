import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Runs weekly via pg_cron. Sends the AI-generated weekly summary
// to every founder who has weekly_report_enabled = true and hasn't
// received one in the last 6 days.
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Cron-only endpoint: require service-role token
  const auth = req.headers.get("Authorization") || "";
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (auth.replace("Bearer ", "").trim() !== SERVICE_ROLE) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString();
    const { data: founders } = await supabase
      .from("founder_settings")
      .select("user_id, weekly_report_email, last_weekly_sent_at")
      .eq("weekly_report_enabled", true);

    const eligible = (founders || []).filter(
      (f: any) => !f.last_weekly_sent_at || f.last_weekly_sent_at < sixDaysAgo,
    );

    let sent = 0;
    for (const f of eligible) {
      // Resolve recipient email
      let to = f.weekly_report_email as string | null;
      if (!to) {
        const { data: prof } = await supabase
          .from("profiles").select("email").eq("user_id", f.user_id).maybeSingle();
        to = prof?.email || null;
      }
      if (!to) continue;

      // Generate report via founder-adviser
      const reportRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/founder-adviser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ action: "weekly_report" }),
      });
      if (!reportRes.ok) { console.warn("weekly_report gen failed for", f.user_id); continue; }
      const { report } = await reportRes.json();
      if (!report?.subject) continue;

      // Send via Resend
      const sendRes = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/resend-send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          to,
          subject: report.subject,
          html: report.body_html || `<pre>${report.body_text || ""}</pre>`,
          text: report.body_text || "",
          fromIdentity: "general",
        }),
      });
      if (sendRes.ok) {
        await supabase
          .from("founder_settings")
          .update({ last_weekly_sent_at: new Date().toISOString() })
          .eq("user_id", f.user_id);
        sent += 1;
      } else {
        console.warn("weekly send failed for", f.user_id, sendRes.status);
      }
    }

    return new Response(JSON.stringify({ ok: true, eligible: eligible.length, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("founder-weekly-report error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});