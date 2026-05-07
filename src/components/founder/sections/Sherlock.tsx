import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Send, Loader2, Square, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "@/hooks/use-toast";
import { streamOwnerAdvisor, ApiError } from "@/lib/api";

type Msg = { role: "user" | "assistant"; content: string };

function uuid() {
  // RFC4122 v4-ish; fine for a session id
  return (crypto as any)?.randomUUID?.() ??
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}

interface SherlockProps {
  onForbidden?: () => void;
}

export default function Sherlock({ onForbidden }: SherlockProps) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionId = useMemo(() => uuid(), []);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = useCallback(async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    const controller = new AbortController();
    abortRef.current = controller;

    let buf = "";
    const upsert = (chunk: string) => {
      buf += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: buf } : m));
        }
        return [...prev, { role: "assistant", content: buf }];
      });
    };

    try {
      await streamOwnerAdvisor(
        { message: text, session_id: sessionId },
        {
          signal: controller.signal,
          onChunk: (t) => upsert(t),
          onError: (err) => {
            toast({ title: "Sherlock error", description: err.message, variant: "destructive" });
          },
        },
      );
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      if (e instanceof ApiError && e.status === 403) {
        // Silent unmount on 403
        onForbidden?.();
        return;
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [input, loading, sessionId, onForbidden]);

  const stop = () => { try { abortRef.current?.abort(); } catch { /* noop */ } setLoading(false); };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold text-[var(--fos-text)]">Sherlock</h1>
      </div>

      <div className="founder-card p-4 min-h-[480px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.length === 0 && (
            <p className="text-sm text-[var(--fos-muted)]">Ask Sherlock anything.</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-[var(--fos-accent)]/15 text-[var(--fos-text)]"
                  : "bg-[var(--fos-card)] text-[var(--fos-text)]"
              }`}>
                <ReactMarkdown>{m.content || (loading && i === messages.length - 1 ? "…" : "")}</ReactMarkdown>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="mt-3 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Message Sherlock…"
            rows={2}
            className="flex-1 resize-none rounded-lg bg-[var(--fos-card)] border border-[var(--fos-border)] px-3 py-2 text-sm text-[var(--fos-text)] outline-none focus:border-[var(--fos-accent)]"
          />
          {loading ? (
            <button
              onClick={stop}
              className="h-10 w-10 flex items-center justify-center rounded-lg bg-[var(--fos-card)] border border-[var(--fos-border)] text-[var(--fos-muted)] hover:text-[var(--fos-text)]"
              title="Stop"
            >
              <Square className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => send()}
              disabled={!input.trim()}
              className="h-10 px-4 flex items-center gap-2 rounded-lg bg-[var(--fos-accent)] text-white text-sm font-semibold disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}