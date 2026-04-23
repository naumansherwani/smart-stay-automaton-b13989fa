import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const QUICK = [
  "What should I focus on today?",
  "Which plan underperforms?",
  "Which country is growing?",
  "Should pricing change?",
  "What is my churn risk?",
  "Best next business move?",
];

type Msg = { role: "user" | "assistant"; content: string };

export default function AIAdviser() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const ask = async (q: string) => {
    if (!q.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("founder-adviser", {
        body: { messages: next },
      });
      if (error) throw error;
      setMessages([...next, { role: "assistant", content: data?.reply || "No response." }]);
    } catch (e: any) {
      setMessages([...next, { role: "assistant", content: "I couldn't reach the adviser right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
      <div className="lg:col-span-3 founder-card flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--fos-border)] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--fos-accent)]" />
          <h3 className="text-[var(--fos-text)] font-semibold text-sm">Founder AI Adviser</h3>
          <span className="ml-auto text-[10px] text-[var(--fos-success)]">● Online</span>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-[var(--fos-muted)] text-sm py-12">
              Ask me anything about your business. I have context on revenue, churn, leads, and growth.
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-[var(--fos-accent)] text-white"
                  : "bg-[var(--fos-bg)] border border-[var(--fos-border)] text-[var(--fos-text)]"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-[var(--fos-bg)] border border-[var(--fos-border)] rounded-xl px-4 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--fos-accent)]" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div className="border-t border-[var(--fos-border)] p-4">
          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the founder adviser…"
              className="flex-1 bg-[var(--fos-bg)] border border-[var(--fos-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--fos-text)] placeholder:text-[var(--fos-muted)] focus:outline-none focus:border-[var(--fos-accent)]/50"
            />
            <button type="submit" disabled={loading || !input.trim()} className="px-4 py-2.5 rounded-lg bg-[var(--fos-accent)] text-white disabled:opacity-50 hover:bg-[var(--fos-accent)]/90 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="founder-card p-5">
        <h4 className="text-[var(--fos-text)] font-semibold text-xs uppercase tracking-wider mb-3">Quick Questions</h4>
        <div className="space-y-2">
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => ask(q)}
              disabled={loading}
              className="w-full text-left text-xs text-[var(--fos-muted)] hover:text-[var(--fos-text)] hover:bg-[var(--fos-bg)] p-2.5 rounded-lg border border-transparent hover:border-[var(--fos-border)] transition-all disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
