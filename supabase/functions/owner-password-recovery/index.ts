import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, redirectTo } = await req.json();
    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Find user by email
    const { data: userList, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) throw listErr;
    const user = userList.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Don't leak existence
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up recovery email
    const { data: profile } = await admin
      .from("profiles")
      .select("recovery_email")
      .eq("user_id", user.id)
      .maybeSingle();

    const recoveryEmail = profile?.recovery_email;

    // If no recovery email set, fall back to standard reset (Supabase sends to primary)
    if (!recoveryEmail) {
      const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, mode: "default" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate recovery link
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
    if (linkErr) throw linkErr;

    const actionLink = linkData.properties?.action_link;
    if (!actionLink) throw new Error("No action link generated");

    // Send to recovery_email via Resend
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
        <h2 style="color:#0f766e">HostFlow AI — Owner Password Reset</h2>
        <p>A password reset was requested for <strong>${email}</strong>.</p>
        <p>This is your <strong>backup recovery email</strong>. Click the button below to set a new password:</p>
        <p style="margin:28px 0">
          <a href="${actionLink}" style="background:#0f766e;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
        </p>
        <p style="font-size:12px;color:#64748b">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
        <p style="font-size:12px;color:#64748b;word-break:break-all">Or paste this URL: ${actionLink}</p>
      </div>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "HostFlow AI Security <security@notify.hostflowai.net>",
        to: [recoveryEmail],
        subject: "🔐 HostFlow AI Owner — Password Reset Link",
        html,
      }),
    });

    if (!resendRes.ok) {
      const t = await resendRes.text();
      console.error("Resend error:", t);
      throw new Error("Failed to send recovery email");
    }

    return new Response(JSON.stringify({ ok: true, mode: "recovery_email" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("owner-password-recovery error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});