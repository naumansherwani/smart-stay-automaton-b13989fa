import { supabase } from "@/integrations/supabase/client";

const FOUNDER_UI_LOCK_TITLE = "Founder OS Restore Lock";

export async function ensureFounderUiLock(userId: string) {
  const timestamp = new Date().toISOString();

  const { data: existing, error } = await supabase
    .from("founder_ai_conversations")
    .select("id, metadata")
    .eq("user_id", userId)
    .eq("title", FOUNDER_UI_LOCK_TITLE)
    .maybeSingle();

  if (error) throw error;

  const metadata = {
    ...(existing?.metadata && typeof existing.metadata === "object" ? existing.metadata : {}),
    kind: "founder_ui_snapshot",
    lock_key: "founder-os-primary",
    lock_reason: "prevent_admin_dashboard_from_auto-opening_public_view",
    founder_route: "/founder",
    dashboard_route: "/dashboard",
    restored_surface: "dashboard",
    auto_public_view_disabled: true,
    updated_at: timestamp,
  };

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("founder_ai_conversations")
      .update({
        is_pinned: true,
        is_archived: false,
        metadata,
        last_message_at: timestamp,
      })
      .eq("id", existing.id);

    if (updateError) throw updateError;
    return existing.id;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("founder_ai_conversations")
    .insert({
      user_id: userId,
      title: FOUNDER_UI_LOCK_TITLE,
      is_pinned: true,
      is_archived: false,
      message_count: 0,
      last_message_at: timestamp,
      metadata,
    })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return inserted.id;
}