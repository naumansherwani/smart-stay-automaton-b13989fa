import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { REPLIT_INBOX_URL, type ReplitInboxEmail } from "@/lib/replitInbox";

async function getJwt(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export function useAgentInbox(toFilter?: string) {
  const [emails, setEmails] = useState<ReplitInboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<number | null>(null);

  const fetchInbox = useCallback(async () => {
    setError(null);
    try {
      const jwt = await getJwt();
      if (!jwt) throw new Error("Not authenticated");
      const url = new URL(`${REPLIT_INBOX_URL}/api/email/inbox`);
      if (toFilter) url.searchParams.set("to", toFilter);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error(`Inbox HTTP ${res.status}`);
      const json = await res.json();
      const list: ReplitInboxEmail[] = Array.isArray(json) ? json : json.emails || json.data || [];
      setEmails(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load inbox");
    } finally {
      setLoading(false);
    }
  }, [toFilter]);

  useEffect(() => {
    setLoading(true);
    void fetchInbox();

    // SSE realtime stream (only for "All Inboxes" view; per-tab still gets stream-wide events but filters client-side)
    try {
      const src = new EventSource(`${REPLIT_INBOX_URL}/api/email/inbox/stream`);
      esRef.current = src;
      src.addEventListener("inbox.new_email", (e: MessageEvent) => {
        try {
          const email: ReplitInboxEmail = JSON.parse(e.data);
          if (toFilter && email.toAddress?.toLowerCase() !== toFilter.toLowerCase()) return;
          setEmails((prev) => [email, ...prev.filter((m) => m.id !== email.id)]);
        } catch {
          /* ignore malformed */
        }
      });
      src.onerror = () => {
        // allow browser auto-reconnect; do not surface as fatal
      };
    } catch {
      /* SSE not available */
    }

    // Fallback periodic refresh (60s) in case SSE drops silently
    pollRef.current = window.setInterval(() => void fetchInbox(), 60_000);

    return () => {
      esRef.current?.close();
      esRef.current = null;
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [fetchInbox, toFilter]);

  const markRead = useCallback(async (id: number) => {
    setEmails((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
    try {
      const jwt = await getJwt();
      await fetch(`${REPLIT_INBOX_URL}/api/email/inbox/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${jwt}` },
      });
    } catch {
      /* optimistic; ignore */
    }
  }, []);

  const sendEmail = useCallback(
    async (payload: { to: string; subject: string; text: string; from_name: string; from_email: string }) => {
      const jwt = await getJwt();
      if (!jwt) throw new Error("Not authenticated");
      const res = await fetch(`${REPLIT_INBOX_URL}/api/email/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Send failed: ${res.status} ${txt}`);
      }
      return res.json().catch(() => ({}));
    },
    []
  );

  return { emails, loading, error, refresh: fetchInbox, markRead, sendEmail };
}