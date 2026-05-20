import { supabase } from "@/integrations/supabase/client";

/**
 * Advisor → Tool Dispatcher (Supabase-backed).
 *
 * When the Hetzner Brain streams a `tool_call` SSE event, the frontend
 * runs the tool locally against Supabase using the *user's* JWT (RLS-safe,
 * zero service-role exposure). The result is reported back as a synthetic
 * tool_event UI badge AND can be relayed to the brain on the next user turn.
 *
 * Supported tools (extend as Brain adds more):
 *   - send_email    → enqueue_email RPC (queue auto-sends via cron)
 *   - log_activity  → insert_activity_log RPC
 *   - notify_owner  → admin_alerts insert
 *
 * Brain-side contract (per call):
 *   event: tool_call
 *   data: { id: string, name: string, args: Record<string, unknown> }
 */

export type ToolCallEvent = {
  id: string;
  name: string;
  args: Record<string, unknown>;
};

export type ToolDispatchResult = {
  id: string;
  name: string;
  status: "done" | "error";
  label: string;
  output?: unknown;
  error?: string;
};

/** Run a Brain-issued tool call against Supabase. Never throws — always returns a result. */
export async function dispatchAdvisorTool(
  call: ToolCallEvent,
  ctx: { industry: string; userId?: string | null },
): Promise<ToolDispatchResult> {
  const base = { id: call.id, name: call.name };
  try {
    switch (call.name) {
      case "send_email": {
        const args = call.args as {
          to?: string;
          subject?: string;
          body?: string;
          html?: string;
          template?: string;
          template_data?: Record<string, unknown>;
          from_name?: string;
        };
        if (!args.to || !args.subject) {
          return { ...base, status: "error", label: `✉️ Email skipped — missing recipient or subject`, error: "missing to/subject" };
        }
        const payload = {
          to: args.to,
          subject: args.subject,
          html: args.html,
          text: args.body,
          template: args.template,
          template_data: args.template_data ?? {},
          from_name: args.from_name,
          industry: ctx.industry,
          user_id: ctx.userId,
          purpose: "transactional",
          source: "advisor_tool_call",
          idempotency_key: `advisor:${call.id}`,
        };
        const { data, error } = await supabase.rpc("enqueue_email", {
          queue_name: "transactional_emails",
          payload: payload as unknown as never,
        });
        if (error) throw error;
        return {
          ...base,
          status: "done",
          label: `✉️ Email queued → ${args.to}`,
          output: { message_id: data, queued_at: new Date().toISOString() },
        };
      }

      case "log_activity": {
        const args = call.args as {
          action_type?: string;
          entity_type?: string;
          entity_id?: string;
          description?: string;
          metadata?: Record<string, unknown>;
        };
        const { data, error } = await supabase.rpc("insert_activity_log", {
          _industry: ctx.industry,
          _action_type: args.action_type || "advisor_action",
          _entity_type: args.entity_type || "advisor",
          _entity_id: args.entity_id as unknown as never,
          _description: args.description || null,
          _metadata: (args.metadata ?? {}) as unknown as never,
        });
        if (error) throw error;
        return {
          ...base,
          status: "done",
          label: `📒 Activity logged`,
          output: { id: data },
        };
      }

      case "notify_owner": {
        const args = call.args as {
          title?: string;
          message?: string;
          severity?: "low" | "medium" | "high" | "critical";
          alert_type?: string;
          metadata?: Record<string, unknown>;
        };
        const { data, error } = await supabase
          .from("admin_alerts")
          .insert({
            alert_type: args.alert_type || "advisor_notification",
            severity: args.severity || "medium",
            title: args.title || "Advisor notification",
            message: args.message || "",
            related_user_id: ctx.userId,
            related_entity_type: "advisor",
            metadata: (args.metadata ?? {}) as unknown as never,
          } as never)
          .select("id")
          .maybeSingle();
        if (error) throw error;
        return {
          ...base,
          status: "done",
          label: `🔔 Owner notified`,
          output: data,
        };
      }

      default:
        return {
          ...base,
          status: "error",
          label: `⚠️ Unknown tool: ${call.name}`,
          error: `No frontend dispatcher for tool "${call.name}"`,
        };
    }
  } catch (e) {
    const msg = (e as Error)?.message || String(e);
    return {
      ...base,
      status: "error",
      label: `⚠️ ${call.name} failed`,
      error: msg,
    };
  }
}