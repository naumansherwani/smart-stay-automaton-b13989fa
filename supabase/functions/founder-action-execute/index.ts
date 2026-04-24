// Founder Action Execute — admin approves a queued action and this function performs it.
// Supports: send_email, message_user, win_back_offer, apply_discount (logs only), create_task
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const token = auth.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: roleRow } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!roleRow) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { action_id, decision } = await req.json();
    if (!action_id || !["approve", "reject"].includes(decision)) {
      return new Response(JSON.stringify({ error: "action_id and decision (approve|reject) required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: action, error } = await supabase.from("founder_action_queue").select("*").eq("id", action_id).maybeSingle();
    if (error || !action) return new Response(JSON.stringify({ error: "Action not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (action.founder_id !== user.id) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (action.status !== "pending") return new Response(JSON.stringify({ error: `Already ${action.status}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (decision === "reject") {
      await supabase.from("founder_action_queue").update({ status: "rejected", decision_at: new Date().toISOString() }).eq("id", action_id);
      return new Response(JSON.stringify({ ok: true, status: "rejected" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Execute
    let result: any = {};
    let status: "executed" | "failed" = "executed";
    try {
      if (action.action_type === "send_email" || action.action_type === "message_user") {
        const to = action.payload?.target_email;
        if (!to) throw new Error("Missing target_email");
        const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/zoho-smtp-send`;
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
          body: JSON.stringify({ to, subject: action.title, html: `<p>${action.description ?? ""}</p>` }),
        });
        result = { http_status: resp.status, body: await resp.text() };
        if (!resp.ok) status = "failed";
      } else if (action.action_type === "create_task") {
        await supabase.from("crm_tasks").insert({
          user_id: user.id,
          industry: action.payload?.industry ?? "hospitality",
          title: action.title,
          description: action.description,
          priority: "high",
          status: "todo",
        });
        result = { task_created: true };
      } else if (action.action_type === "win_back_offer") {
        const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/winback-generate-offer`;
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}` },
          body: JSON.stringify({ user_id: action.target_user_id, ...action.payload }),
        });
        result = { http_status: resp.status, body: await resp.text() };
        if (!resp.ok) status = "failed";
      } else {
        result = { skipped: true, reason: `Unsupported action_type: ${action.action_type}` };
      }
    } catch (e) {
      status = "failed";
      result = { error: e instanceof Error ? e.message : String(e) };
    }

    await supabase.from("founder_action_queue").update({
      status, decision_at: new Date().toISOString(), executed_at: new Date().toISOString(), result,
    }).eq("id", action_id);

    return new Response(JSON.stringify({ ok: true, status, result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("founder-action-execute error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});