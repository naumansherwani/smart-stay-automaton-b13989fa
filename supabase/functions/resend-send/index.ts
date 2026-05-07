// Resend email sender for HostFlow AI Technologies
// Replaces the legacy zoho-smtp-send / owner-mailbox SMTP path.
// All outbound mail (founder, advisor, support, billing, automated) goes through here.
// deno-lint-ignore-file no-explicit-any

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = "noreply@hostflowai.net";

// Display-name only identity routing. All mail physically sends from FROM_EMAIL
// (single verified Resend sender). The identity changes the From: display name
// and the Reply-To address so replies route to the right inbox.
const IDENTITIES = [
  { id: "general",    name: "Nauman Sherwani · HostFlow AI",     replyTo: "naumansherwani@hostflowai.net" },
  { id: "advisor",    name: "HostFlow ConnectAI",                replyTo: "naumansherwani@hostflowai.net" },
  { id: "enterprise", name: "HostFlow AI · Enterprise Sales",    replyTo: "naumansherwani@hostflowai.net" },
  { id: "support",    name: "HostFlow AI · Customer Support",    replyTo: "naumansherwani@hostflowai.net" },
  { id: "billing",    name: "HostFlow AI · Billing",             replyTo: "naumansherwani@hostflowai.net" },
] as const;

function identityById(id?: string) {
  return IDENTITIES.find((i) => i.id === id) || IDENTITIES[0];
}

const ADVISOR_SIGNATURE_HTML = `
<table cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;border-top:1px solid #e2e8f0;padding-top:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;font-size:14px;line-height:1.55">
  <tr><td>
    <div style="color:#475569;margin-bottom:10px">Best regards,</div>
    <div style="font-weight:600;color:#0f172a;font-size:15px">HostFlow ConnectAI</div>
    <div style="color:#3b82f6;font-size:13px;margin-top:2px">AI Growth &amp; Success Assistant</div>
    <div style="color:#64748b;font-size:13px">HostFlow AI Technologies</div>
    <div style="margin-top:12px;font-size:13px;color:#475569">
      🌐 <a href="https://www.hostflowai.net" style="color:#3b82f6;text-decoration:none">www.hostflowai.net</a>
    </div>
    <div style="margin-top:14px;font-size:12px;color:#94a3b8;font-style:italic">Smart automation for modern businesses.</div>
  </td></tr>
</table>`.trim();

const ADVISOR_SIGNATURE_TEXT = `

--
Best regards,
HostFlow ConnectAI
AI Growth & Success Assistant
HostFlow AI Technologies

🌐 www.hostflowai.net

Smart automation for modern businesses.`;

function toArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return String(v).split(/[,;]+/).map((s) => s.trim()).filter(Boolean);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ ok: false, error: "RESEND_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "send";

    if (action === "identities") {
      return new Response(JSON.stringify({ ok: true, data: { identities: IDENTITIES } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "test") {
      const to = body.to;
      if (!to) {
        return new Response(JSON.stringify({ ok: false, error: "Missing 'to'" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `HostFlow AI <${FROM_EMAIL}>`,
          to: [to],
          subject: "✅ HostFlow AI · Resend Test",
          html: `<div style="font-family:Arial,sans-serif;padding:24px;background:#0f172a;color:#fff;border-radius:12px"><h2 style="color:#3b82f6;margin:0 0 12px">HostFlow AI · Resend Test</h2><p style="color:#cbd5e1">Resend connection is working. Sent at ${new Date().toISOString()}.</p></div>`,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        return new Response(JSON.stringify({ ok: false, error: j?.message || "Resend test failed", details: j }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ ok: true, messageId: j.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // send
    const {
      to, cc, bcc, subject, html, text, replyTo,
      fromIdentity, identity, fromName, appendSignature,
      inReplyTo, references, logMailbox,
    } = body;

    if (!to || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required fields: to, subject, html|text" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const idKey = (fromIdentity || identity || "general") as string;
    const id = identityById(idKey);
    const isAdvisor = idKey === "advisor";
    const finalFromName = fromName || id.name;
    const finalReplyTo = replyTo || id.replyTo;
    const shouldAppendSig = appendSignature === true || (isAdvisor && appendSignature !== false);
    const finalHtml = shouldAppendSig && html ? `${html}${ADVISOR_SIGNATURE_HTML}` : html;
    const finalText = shouldAppendSig && text ? `${text}${ADVISOR_SIGNATURE_TEXT}` : text;

    const headers: Record<string, string> = {};
    if (inReplyTo) headers["In-Reply-To"] = inReplyTo;
    if (references) headers["References"] = references;

    const payload: any = {
      from: `${finalFromName} <${FROM_EMAIL}>`,
      to: toArray(to),
      subject,
      html: finalHtml,
      text: finalText,
      reply_to: finalReplyTo,
    };
    const ccArr = toArray(cc);
    const bccArr = toArray(bcc);
    if (ccArr.length) payload.cc = ccArr;
    if (bccArr.length) payload.bcc = bccArr;
    if (Object.keys(headers).length) payload.headers = headers;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      return new Response(JSON.stringify({ ok: false, error: j?.message || "Resend send failed", details: j }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (logMailbox) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && serviceRole) {
        const supabase = createClient(supabaseUrl, serviceRole);
        const recipient = toArray(to)[0] || "";
        await supabase.from("email_send_log").insert({
          message_id: j.id,
          template_name: `founder_${idKey}`,
          recipient_email: recipient,
          status: "sent",
          metadata: {
            subject,
            html: finalHtml,
            text: finalText,
            fromIdentity: idKey,
            fromName: finalFromName,
            fromEmail: FROM_EMAIL,
            replyTo: finalReplyTo,
            cc: ccArr,
            bcc: bccArr,
          },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, messageId: j.id, data: { messageId: j.id } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("resend-send error:", e?.message);
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});