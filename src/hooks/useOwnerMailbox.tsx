import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type MailFolder = "inbox" | "priority" | "unread" | "sent" | "drafts" | "scheduled" | "starred" | "archive" | "spam" | "trash";

export type MailIdentity = "enterprise" | "support" | "billing" | "general";

export const MAIL_IDENTITIES: { id: MailIdentity; address: string; label: string }[] = [
  { id: "enterprise", address: "connectai@hostflowai.live", label: "Enterprise" },
  { id: "support",    address: "support@hostflowai.live",   label: "Support" },
  { id: "billing",    address: "billing@hostflowai.live",   label: "Billing" },
  { id: "general",    address: "hello@hostflowai.live",     label: "Founder" },
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

const REMOTE_FOLDERS: MailFolder[] = ["inbox", "sent", "drafts", "spam", "trash", "archive"];

function mapFolder(f: MailFolder): MailFolder {
  if (f === "priority" || f === "unread" || f === "starred") return "inbox";
  if (f === "scheduled") return "drafts";
  return f;
}

export function useOwnerMailbox(folder: MailFolder, search: string) {
  const [messages, setMessages] = useState<MailListItem[]>([]);
  const [counts, setCounts] = useState<Record<string, { total: number; unread: number }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const remote = mapFolder(folder);
      const { data, error: err } = await supabase.functions.invoke("owner-mailbox", {
        body: { action: "list", folder: remote, limit: 60, search: search || undefined },
      });
      if (err) throw new Error(err.message);
      if (!data?.ok) throw new Error(data?.error || "Failed to load mailbox");
      let list: MailListItem[] = data.data?.messages || [];
      // Client-side filters for virtual folders
      if (folder === "unread") list = list.filter((m) => m.unread);
      if (folder === "starred") list = list.filter((m) => m.starred);
      if (folder === "priority") list = list.filter((m) => m.unread && (m.subject?.toLowerCase().includes("urgent") || m.subject?.toLowerCase().includes("re:") || m.unread));
      setMessages(list);
      setLastSync(new Date());
    } catch (e: any) {
      setError(e.message);
      toast.error("Mailbox: " + e.message);
    } finally {
      setLoading(false);
    }
  }, [folder, search]);

  const loadCounts = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke("owner-mailbox", { body: { action: "counts" } });
      if (data?.ok) setCounts(data.data || {});
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCounts(); const id = setInterval(loadCounts, 60000); return () => clearInterval(id); }, [loadCounts]);

  const fetchOne = useCallback(async (uid: number): Promise<MailDetail | null> => {
    const remote = mapFolder(folder);
    const { data, error: err } = await supabase.functions.invoke("owner-mailbox", { body: { action: "get", folder: remote, uid } });
    if (err) { toast.error(err.message); return null; }
    if (!data?.ok) { toast.error(data?.error || "Failed"); return null; }
    return data.data;
  }, [folder]);

  const setFlag = useCallback(async (uid: number, add: string[] = [], remove: string[] = []) => {
    const remote = mapFolder(folder);
    await supabase.functions.invoke("owner-mailbox", { body: { action: "flag", folder: remote, uid, add, remove } });
    setMessages((prev) => prev.map((m) => m.uid === uid ? { ...m, unread: add.includes("\\Seen") ? false : remove.includes("\\Seen") ? true : m.unread, starred: add.includes("\\Flagged") ? true : remove.includes("\\Flagged") ? false : m.starred } : m));
  }, [folder]);

  const moveTo = useCallback(async (uid: number, to: MailFolder) => {
    const remote = mapFolder(folder);
    const target = REMOTE_FOLDERS.includes(to) ? to : "inbox";
    await supabase.functions.invoke("owner-mailbox", { body: { action: "move", from: remote, to: target, uid } });
    setMessages((prev) => prev.filter((m) => m.uid !== uid));
    toast.success(`Moved to ${target}`);
  }, [folder]);

  const send = useCallback(async (payload: { to: string; cc?: string; bcc?: string; subject: string; html: string; inReplyTo?: string; references?: string }) => {
    const { data, error: err } = await supabase.functions.invoke("owner-mailbox", { body: { action: "send", ...payload } });
    if (err) throw new Error(err.message);
    if (!data?.ok) throw new Error(data?.error || "Send failed");
    return data.data;
  }, []);

  return { messages, counts, loading, error, lastSync, refresh: load, fetchOne, setFlag, moveTo, send };
}