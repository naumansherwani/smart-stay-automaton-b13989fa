import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type MailFolder = "inbox" | "priority" | "unread" | "sent" | "drafts" | "scheduled" | "starred" | "archive" | "spam" | "trash";

// Identities are display-name only (Resend single-sender). All identities map
// to the same physical sender address (noreply@hostflowai.net) and route
// replies back to the founder mailbox via reply-to.
export type MailIdentity = "advisor" | "enterprise" | "support" | "billing" | "general";

export const MAIL_IDENTITIES: { id: MailIdentity; address: string; label: string }[] = [
  { id: "general", address: "noreply@hostflowai.net", label: "Founder (Owner)" },
  { id: "advisor", address: "noreply@hostflowai.net", label: "AI Advisor" },
  { id: "support", address: "noreply@hostflowai.net", label: "Support" },
  { id: "billing", address: "noreply@hostflowai.net", label: "Billing" },
];

export interface MailListItem {
  uid: number;
  subject: string;
  from: { name: string; address: string };
  to: { name: string; address: string }[];
  date: string;
  unread: boolean;
  starred: boolean;
  hasAttachment: boolean;
  preview: string;
  identity?: MailIdentity;
}

export interface MailDetail extends MailListItem {
  html: string | null;
  text: string;
  cc: { name: string; address: string }[];
  attachments: { filename: string; size: number; contentType: string }[];
  identity?: MailIdentity;
}

// Resend is send-only — there is no IMAP inbox to read. We keep the same hook
// surface so callers (Emails section, EntLeadDetailSheet) don't break.
// `messages`, `counts`, `fetchOne`, `setFlag`, `moveTo` are all no-ops that
// return empty data. `send()` posts to the Resend-backed `resend-send` edge fn.
export function useOwnerMailbox(_folder: MailFolder, _search: string) {
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const refresh = useCallback(async () => { /* no-op: Resend has no inbox */ }, []);
  const fetchOne = useCallback(async (_uid: number): Promise<MailDetail | null> => null, []);
  const setFlag = useCallback(async (_uid: number, _add: string[] = [], _remove: string[] = []) => {}, []);
  const moveTo = useCallback(async (_uid: number, _to: MailFolder) => {}, []);

  const send = useCallback(async (payload: { to: string; cc?: string; bcc?: string; subject: string; html: string; inReplyTo?: string; references?: string; fromIdentity?: MailIdentity }) => {
    const { data, error: err } = await supabase.functions.invoke("resend-send", {
      body: { action: "send", ...payload },
    });
    if (err) throw new Error(err.message);
    if (!data?.ok) throw new Error(data?.error || "Send failed");
    toast.success("Email sent via Resend");
    return data.data;
  }, []);

  return {
    messages: [] as MailListItem[],
    counts: {} as Record<string, { total: number; unread: number }>,
    loading,
    error,
    lastSync: null as Date | null,
    refresh,
    fetchOne,
    setFlag,
    moveTo,
    send,
  };
}