import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type ReplitInboxEmail } from "@/lib/replitInbox";
import { REPLIT_URL, getAuthToken } from "@/lib/replitAuth";

export function useAgentInbox(toFilter?: string) {
  const [emails, setEmails] = useState<ReplitInboxEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<number | null>(null);
  const reconnectRef = useRef<number | null>(null);

  const fetchInbox = useCallback(async () => {
    setError(null);
    try {
      const jwt = await getAuthToken();
      if (!jwt) throw new Error("Not authenticated");
      const url = new URL(`${REPLIT_URL}/api/email/inbox`);
      if (toFilter) url.searchParams.set("to", toFilter);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error(`Inbox HTTP ${res.status}`);
      const json = await res.json();
      const raw = Array.isArray(json)
        ? json
        : Array.isArray(json?.emails)
          ? json.emails
          : Array.isArray(json?.data?.emails)
            ? json.data.emails
            : Array.isArray(json?.data)
              ? json.data
              : [];
      setEmails(raw as ReplitInboxEmail[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load inbox");
    } finally {
      setLoading(false);
    }
  }, [toFilter]);

  useEffect(() => {
    setLoading(true);
    void fetchInbox();

    // SSE realtime stream — JWT-protected via ?token= query param.
    let cancelled = false;
    const connect = async () => {
      if (cancelled) return;
      const jwt = await getAuthToken();
      if (!jwt || cancelled) return;
      try {
        esRef.current?.close();
        const src = new EventSource(
          `${REPLIT_URL}/api/email/inbox/stream?token=${encodeURIComponent(jwt)}`
        );
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
          // Token may have expired — close and reconnect with a fresh session token.
          src.close();
          if (cancelled) return;
          if (reconnectRef.current) window.clearTimeout(reconnectRef.current);
          reconnectRef.current = window.setTimeout(() => {
            // Force-refresh session so we don't reuse a stale token.
            supabase.auth.getSession().then(() => connect());
          }, 2000);
        };
      } catch {
        /* SSE not available */
      }
    };
    void connect();

    // Fallback periodic refresh (60s) in case SSE drops silently
    pollRef.current = window.setInterval(() => void fetchInbox(), 60_000);

    return () => {
      cancelled = true;
      esRef.current?.close();
      esRef.current = null;
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
      if (reconnectRef.current) window.clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    };
  }, [fetchInbox, toFilter]);

  const markRead = useCallback(async (id: number) => {
    setEmails((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
    try {
      const jwt = await getAuthToken();
      await fetch(`${REPLIT_URL}/api/email/inbox/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${jwt}` },
      });
    } catch {
      /* optimistic; ignore */
    }
  }, []);

  const sendEmail = useCallback(
    async (payload: { to: string; subject: string; text: string; from_name: string; from_email: string }) => {
      const jwt = await getAuthToken();
      if (!jwt) throw new Error("Not authenticated");
      const res = await fetch(`${REPLIT_URL}/api/email/send`, {
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