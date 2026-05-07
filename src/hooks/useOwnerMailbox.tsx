import { useCallback, useEffect, useMemo, useState } from "react";
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

type MailboxLogRow = {
  id: string;
  message_id: string | null;
  recipient_email: string;
  template_name: string;
  status: string;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function getMetadata(row: MailboxLogRow): Record<string, unknown> {
  return row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata) ? row.metadata : {};
}

function titleCase(input: string) {
  return input
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function inferIdentity(row: MailboxLogRow): MailIdentity {
  const metadata = getMetadata(row);
  const raw = String(metadata.fromIdentity || metadata.identity || "").toLowerCase();
  if (["advisor", "enterprise", "support", "billing", "general"].includes(raw)) {
    return raw as MailIdentity;
  }
  if (/billing/i.test(row.template_name)) return "billing";
  if (/support|ticket/i.test(row.template_name)) return "support";
  if (/enterprise/i.test(row.template_name)) return "enterprise";
  if (/advisor|welcome|followup|proposal/i.test(row.template_name)) return "advisor";
  return "general";
}

function inferSubject(row: MailboxLogRow) {
  const metadata = getMetadata(row);
  return String(metadata.subject || metadata.title || titleCase(row.template_name || row.status || "Email"));
}

function inferPreview(row: MailboxLogRow) {
  const metadata = getMetadata(row);
  const raw = String(metadata.preview || metadata.text || metadata.body || row.error_message || "");
  const collapsed = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return collapsed || `${titleCase(row.status)} · ${row.recipient_email}`;
}

function rowToListItem(row: MailboxLogRow): MailListItem {
  const identity = inferIdentity(row);
  const fromIdentity = MAIL_IDENTITIES.find((item) => item.id === identity) || MAIL_IDENTITIES[0];
  const metadata = getMetadata(row);

  return {
    uid: Number.parseInt(row.id.replace(/-/g, "").slice(0, 12), 16),
    subject: inferSubject(row),
    from: {
      name: String(metadata.fromName || fromIdentity.label),
      address: String(metadata.fromEmail || fromIdentity.address),
    },
    to: [{ name: String(metadata.toName || row.recipient_email), address: row.recipient_email }],
    date: row.created_at,
    unread: row.status !== "sent",
    starred: false,
    hasAttachment: false,
    preview: inferPreview(row),
    identity,
  };
}

function rowToDetail(row: MailboxLogRow): MailDetail {
  const base = rowToListItem(row);
  const metadata = getMetadata(row);
  const html = typeof metadata.html === "string" ? metadata.html : null;
  const text = String(metadata.text || metadata.body || row.error_message || "");

  return {
    ...base,
    html,
    text,
    cc: Array.isArray(metadata.cc)
      ? metadata.cc.map((value: string) => ({ name: value, address: value }))
      : [],
    attachments: [],
  };
}

export function useOwnerMailbox(folder: MailFolder, search: string) {
  const [rows, setRows] = useState<MailboxLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase.functions.invoke("owner-mailbox", {
        body: { action: "list", folder, search },
      });
      if (err) throw new Error(err.message);
      if (!data?.ok) throw new Error(data?.error || "Failed to load inbox");
      setRows(Array.isArray(data.data?.messages) ? data.data.messages : []);
    } catch (e: unknown) {
      setRows([]);
      setError(e instanceof Error ? e.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }, [folder, search]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const messages = useMemo(() => rows.map(rowToListItem), [rows]);

  const counts = useMemo(() => {
    const all = rows.length;
    const unread = rows.filter((row) => row.status !== "sent").length;
    return {
      inbox: { total: all, unread },
      priority: { total: rows.filter((row) => ["failed", "bounced", "complained", "dlq"].includes(row.status)).length, unread: rows.filter((row) => ["failed", "bounced", "complained", "dlq"].includes(row.status)).length },
      unread: { total: unread, unread },
      sent: { total: rows.filter((row) => row.status === "sent").length, unread: 0 },
      drafts: { total: 0, unread: 0 },
      scheduled: { total: rows.filter((row) => row.status === "pending").length, unread: rows.filter((row) => row.status === "pending").length },
      starred: { total: 0, unread: 0 },
      archive: { total: 0, unread: 0 },
      spam: { total: rows.filter((row) => ["complained", "suppressed"].includes(row.status)).length, unread: rows.filter((row) => ["complained", "suppressed"].includes(row.status)).length },
      trash: { total: 0, unread: 0 },
    } as Record<string, { total: number; unread: number }>;
  }, [rows]);

  const fetchOne = useCallback(async (uid: number): Promise<MailDetail | null> => {
    const row = rows.find((entry) => Number.parseInt(entry.id.replace(/-/g, "").slice(0, 12), 16) === uid);
    return row ? rowToDetail(row) : null;
  }, [rows]);

  const setFlag = useCallback(async () => {}, []);
  const moveTo = useCallback(async () => {}, []);

  const send = useCallback(async (payload: { to: string; cc?: string; bcc?: string; subject: string; html: string; inReplyTo?: string; references?: string; fromIdentity?: MailIdentity }) => {
    const { data, error: err } = await supabase.functions.invoke("resend-send", {
      body: { action: "send", ...payload, logMailbox: true },
    });
    if (err) throw new Error(err.message);
    if (!data?.ok) throw new Error(data?.error || "Send failed");
    toast.success("Email sent via Resend");
    await refresh();
    return data.data;
  }, [refresh]);

  return {
    messages,
    counts,
    loading,
    error,
    lastSync: rows[0]?.created_at ? new Date(rows[0].created_at) : null,
    refresh,
    fetchOne,
    setFlag,
    moveTo,
    send,
  };
}