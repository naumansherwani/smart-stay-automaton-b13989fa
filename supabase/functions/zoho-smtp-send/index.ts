// Zoho SMTP sender for HostFlow AI Technologies
// Sends emails via smtp.zoho.com:465 (SSL) using nodemailer.
// deno-lint-ignore-file no-explicit-any
import nodemailer from "npm:nodemailer@6.9.14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ZOHO_EMAIL = (Deno.env.get("ZOHO_EMAIL") || "naumansherwani@hostflowai.net").trim();
// Zoho App Passwords are often shown with spaces — strip ALL whitespace.
const ZOHO_APP_PASSWORD = (Deno.env.get("ZOHO_APP_PASSWORD") || "").replace(/\s+/g, "");
const FROM_NAME = "HostFlow AI";
const FROM_EMAIL = ZOHO_EMAIL;

// AI Advisor identity — used by all automated AI Advisor / Autopilot emails.
// Replies route back to the same Zoho mailbox so they appear in the Email Center.
const ADVISOR_NAME = "HostFlow ConnectAI";
const ADVISOR_EMAIL = "connectai@hostflowai.net";

// Premium signature appended to every AI Advisor email (HTML + plain text).
export const ADVISOR_SIGNATURE_HTML = `
<table cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;border-top:1px solid #e2e8f0;padding-top:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;font-size:14px;line-height:1.55">
  <tr><td>
    <div style="color:#475569;margin-bottom:10px">Best regards,</div>
    <div style="font-weight:600;color:#0f172a;font-size:15px">HostFlow ConnectAI</div>
    <div style="color:#3b82f6;font-size:13px;margin-top:2px">AI Growth &amp; Success Assistant</div>
    <div style="color:#64748b;font-size:13px">HostFlow AI Technologies</div>
    <div style="margin-top:12px;font-size:13px;color:#475569">
      🌐 <a href="https://www.hostflowai.net" style="color:#3b82f6;text-decoration:none">www.hostflowai.net</a><br/>
      ✉ <a href="mailto:connectai@hostflowai.net" style="color:#3b82f6;text-decoration:none">connectai@hostflowai.net</a>
    </div>
    <div style="margin-top:14px;font-size:12px;color:#94a3b8;font-style:italic">Smart automation for modern businesses.</div>
  </td></tr>
</table>`.trim();

export const ADVISOR_SIGNATURE_TEXT = `

--
Best regards,
HostFlow ConnectAI
AI Growth & Success Assistant
HostFlow AI Technologies

🌐 www.hostflowai.net
✉ connectai@hostflowai.net

Smart automation for modern businesses.`;

function buildTransport() {
  return nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465,
    secure: true, // SSL
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
            html: `<div style="font-family:Arial,sans-serif;padding:24px;max-width:560px;margin:0 auto;background:#0f172a;color:#fff;border-radius:12px"><h2 style="margin:0 0 12px;color:#3b82f6">HostFlow AI · SMTP Test</h2><p style="color:#cbd5e1;line-height:1.6">Your Zoho SMTP connection is working correctly. This email was sent from <b>${FROM_EMAIL}</b> via <code>smtp.zoho.com:465</code> (SSL).</p><p style="color:#94a3b8;font-size:12px;margin-top:24px">Sent at ${new Date().toISOString()}</p></div>`,
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
    const { to, subject, html, text, replyTo, cc, bcc, fromName, fromAddress, identity, appendSignature, attachments } = body;
    if (!to || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required fields: to, subject, html|text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resolve identity — `advisor` routes via connectai@hostflowai.net.
    const isAdvisor = identity === "advisor" || (fromAddress && String(fromAddress).toLowerCase() === ADVISOR_EMAIL);
    const resolvedFromName = isAdvisor ? ADVISOR_NAME : (fromName || FROM_NAME);
    const resolvedFromEmail = isAdvisor ? ADVISOR_EMAIL : (fromAddress || FROM_EMAIL);
    const resolvedReplyTo = replyTo || (isAdvisor ? ADVISOR_EMAIL : undefined);
    const shouldAppendSig = appendSignature !== false && (isAdvisor || appendSignature === true);
    const finalHtml = shouldAppendSig && html ? `${html}${ADVISOR_SIGNATURE_HTML}` : html;
    const finalText = shouldAppendSig && text ? `${text}${ADVISOR_SIGNATURE_TEXT}` : text;

    try {
      const info = await transport.sendMail({
        from: `"${resolvedFromName}" <${resolvedFromEmail}>`,
        to,
        cc,
        bcc,
        replyTo: resolvedReplyTo,
        subject,
        text: finalText,
        html: finalHtml,
        attachments: Array.isArray(attachments) ? attachments : undefined,
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