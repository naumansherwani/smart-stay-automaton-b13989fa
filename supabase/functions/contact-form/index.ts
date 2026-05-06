// Contact form handler: notifies owner + auto-replies to lead via Zoho SMTP.
// deno-lint-ignore-file no-explicit-any
import nodemailer from "npm:nodemailer@6.9.14";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ZOHO_EMAIL = (Deno.env.get("ZOHO_EMAIL") || "naumansherwani@hostflowai.net").trim();
const ZOHO_APP_PASSWORD = (Deno.env.get("ZOHO_APP_PASSWORD") || "").replace(/\s+/g, "");
const FROM_NAME = "HostFlow AI";
const OWNER_EMAIL = ZOHO_EMAIL;

function buildTransport() {
  return nodemailer.createTransport({
    host: "smtp.zoho.com",
    port: 465,
    secure: true,
    auth: { user: ZOHO_EMAIL, pass: ZOHO_APP_PASSWORD },
    tls: { minVersion: "TLSv1.2" },
  });
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!ZOHO_APP_PASSWORD) {
      return new Response(
        JSON.stringify({ ok: false, error: "Email service is not configured (missing ZOHO_APP_PASSWORD)" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const subject = String(body.subject || "Website Contact").trim();
    const message = String(body.message || "").trim();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ ok: false, error: "Name, email, and message are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ ok: false, error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transport = buildTransport();

    // 1) Notify owner
    const ownerHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#fff;padding:24px;border-radius:12px">
        <h2 style="margin:0 0 16px;color:#3b82f6">📬 New Contact Form Message</h2>
        <table style="width:100%;border-collapse:collapse;color:#cbd5e1;font-size:14px">
          <tr><td style="padding:6px 0;width:90px;color:#94a3b8">From:</td><td>${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</td></tr>
          <tr><td style="padding:6px 0;color:#94a3b8">Subject:</td><td>${escapeHtml(subject)}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #1e293b;margin:16px 0"/>
        <div style="white-space:pre-wrap;color:#e2e8f0;line-height:1.6">${escapeHtml(message)}</div>
        <p style="color:#64748b;font-size:12px;margin-top:24px">Received ${new Date().toISOString()} · HostFlow AI</p>
      </div>`;

    let ownerOk = false;
    let ownerError: string | null = null;
    try {
      const info = await transport.sendMail({
        from: `"${FROM_NAME}" <${ZOHO_EMAIL}>`,
        to: OWNER_EMAIL,
        replyTo: `"${name}" <${email}>`,
        subject: `[Contact] ${subject}`,
        html: ownerHtml,
        text: `New contact from ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
      });
      ownerOk = !!info.messageId;
    } catch (e: any) {
      ownerError = e?.message || String(e);
    }

    // 2) Auto-reply to lead
    const replyHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;color:#0f172a;padding:32px;border-radius:12px;border:1px solid #e2e8f0">
        <h2 style="margin:0 0 12px;color:#3b82f6">Thanks for reaching out, ${escapeHtml(name)}!</h2>
        <p style="color:#475569;line-height:1.6;font-size:15px">We received your message and our team will respond within 24 hours.</p>
        <div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:20px 0">
          <div style="font-size:12px;color:#64748b;margin-bottom:6px">Your message:</div>
          <div style="white-space:pre-wrap;color:#0f172a;font-size:14px;line-height:1.5">${escapeHtml(message)}</div>
        </div>
        <p style="color:#475569;font-size:14px">In the meantime, feel free to explore <a href="https://hostflowai.net" style="color:#3b82f6;text-decoration:none">hostflowai.net</a>.</p>
        <p style="color:#0f172a;font-size:14px;margin-top:24px">— Nauman Sherwani<br/><span style="color:#64748b;font-size:12px">Founder, HostFlow AI Technologies</span></p>
      </div>`;

    let replyOk = false;
    let replyError: string | null = null;
    try {
      const info = await transport.sendMail({
        from: `"${FROM_NAME}" <${ZOHO_EMAIL}>`,
        to: email,
        replyTo: ZOHO_EMAIL,
        subject: `We received your message · HostFlow AI`,
        html: replyHtml,
        text: `Hi ${name},\n\nThanks for reaching out! We received your message and will respond within 24 hours.\n\nYour message:\n${message}\n\n— Nauman Sherwani\nFounder, HostFlow AI Technologies`,
      });
      replyOk = !!info.messageId;
    } catch (e: any) {
      replyError = e?.message || String(e);
    }

    if (!ownerOk && !replyOk) {
      return new Response(
        JSON.stringify({ ok: false, error: ownerError || replyError || "Failed to send emails" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, ownerNotified: ownerOk, autoReplied: replyOk, ownerError, replyError }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});