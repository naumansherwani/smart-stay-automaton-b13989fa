// Zoho SMTP sender for HostFlow AI Technologies
// Sends emails via smtp.zoho.com:587 (STARTTLS) using nodemailer.
// deno-lint-ignore-file no-explicit-any
import nodemailer from "npm:nodemailer@6.9.14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ZOHO_EMAIL = Deno.env.get("ZOHO_EMAIL") || "naumansherwani@hostflowai.live";
const ZOHO_APP_PASSWORD = Deno.env.get("ZOHO_APP_PASSWORD") || "";
const FROM_NAME = "HostFlow AI Technologies";
const FROM_EMAIL = ZOHO_EMAIL;

function buildTransport() {
  return nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 587,
    secure: false, // STARTTLS
    requireTLS: true,
    auth: { user: ZOHO_EMAIL, pass: ZOHO_APP_PASSWORD },
    tls: { minVersion: "TLSv1.2" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!ZOHO_APP_PASSWORD) {
      return new Response(
        JSON.stringify({ ok: false, error: "ZOHO_APP_PASSWORD secret is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "send";

    const transport = buildTransport();

    if (action === "verify" || action === "test") {
      // Verify SMTP connection
      try {
        await transport.verify();
      } catch (e: any) {
        return new Response(
          JSON.stringify({ ok: false, stage: "verify", error: e?.message || String(e) }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "test") {
        const to = body.to || ZOHO_EMAIL;
        try {
          const info = await transport.sendMail({
            from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
            to,
            subject: "✅ HostFlow AI · SMTP Test",
            text: `This is a test email from HostFlow AI Technologies SMTP system.\n\nSent at: ${new Date().toISOString()}`,
            html: `<div style="font-family:Arial,sans-serif;padding:24px;max-width:560px;margin:0 auto;background:#0f172a;color:#fff;border-radius:12px"><h2 style="margin:0 0 12px;color:#3b82f6">HostFlow AI · SMTP Test</h2><p style="color:#cbd5e1;line-height:1.6">Your Zoho SMTP connection is working correctly. This email was sent from <b>${FROM_EMAIL}</b> via <code>smtp.zoho.com:587</code> (STARTTLS).</p><p style="color:#94a3b8;font-size:12px;margin-top:24px">Sent at ${new Date().toISOString()}</p></div>`,
          });
          return new Response(
            JSON.stringify({ ok: true, messageId: info.messageId, accepted: info.accepted, response: info.response }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (e: any) {
          return new Response(
            JSON.stringify({ ok: false, stage: "send", error: e?.message || String(e) }),
            { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(JSON.stringify({ ok: true, verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generic send
    const { to, subject, html, text, replyTo, cc, bcc, fromName } = body;
    if (!to || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required fields: to, subject, html|text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const info = await transport.sendMail({
        from: `"${fromName || FROM_NAME}" <${FROM_EMAIL}>`,
        to,
        cc,
        bcc,
        replyTo,
        subject,
        text,
        html,
      });
      return new Response(
        JSON.stringify({ ok: true, messageId: info.messageId, accepted: info.accepted }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (e: any) {
      return new Response(
        JSON.stringify({ ok: false, stage: "send", error: e?.message || String(e), code: e?.code, command: e?.command }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});