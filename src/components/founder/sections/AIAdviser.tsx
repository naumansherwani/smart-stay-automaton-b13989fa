import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, AlertTriangle, TrendingUp, Target, BarChart3, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const QUICK = [
  "What should I focus on today?",
  "Should I raise pricing?",
  "Which plan is weak?",
  "Which country should I target next?",
  "Why is churn rising?",
  "Which enterprise lead is easiest to close?",
  "What is hurting growth this week?",
  "What can increase revenue fastest?",
  "Best next business move?",
];

type Msg = { role: "user" | "assistant"; content: string };
type Insights = { risk: string; opportunity: string; action: string; weekly: string };

export default function AIAdviser() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadInsights = async () => {
    setInsightsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("founder-adviser", { body: { mode: "insights" } });
      if (error) throw error;
      if (data?.insights) setInsights(data.insights);
    } catch (e) {
      console.error(e);
    } finally { setInsightsLoading(false); }
  };

  useEffect(() => { loadInsights(); }, []);

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
          <h3 className="text-[var(--fos-text)] font-semibold text-sm">Founder AI Strategist</h3>
          <span className="ml-auto text-[10px] text-[var(--fos-success)]">● Online</span>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-[var(--fos-muted)] text-sm py-12">
              Ask me anything about your business. I have context on revenue, churn, plans, leads, deals, refunds, and country signals.
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
              placeholder="Ask the founder strategist…"
              className="flex-1 bg-[var(--fos-bg)] border border-[var(--fos-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--fos-text)] placeholder:text-[var(--fos-muted)] focus:outline-none focus:border-[var(--fos-accent)]/50"
            />
            <button type="submit" disabled={loading || !input.trim()} className="px-4 py-2.5 rounded-lg bg-[var(--fos-accent)] text-white disabled:opacity-50 hover:bg-[var(--fos-accent)]/90 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      <div className="space-y-4 overflow-y-auto">
        <div className="founder-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[var(--fos-text)] font-semibold text-xs uppercase tracking-wider">Live Insights</h4>
            <button onClick={loadInsights} disabled={insightsLoading} className="text-[var(--fos-muted)] hover:text-[var(--fos-accent)] disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${insightsLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
          {insightsLoading && !insights && <div className="text-xs text-[var(--fos-muted)] py-4 text-center"><Loader2 className="w-4 h-4 animate-spin inline mr-1" /> Generating…</div>}
          {insights && (
            <div className="space-y-3 text-xs">
              {[
                { icon: AlertTriangle, label: "Risk", color: "text-[var(--fos-danger)]", value: insights.risk },
                { icon: TrendingUp, label: "Opportunity", color: "text-[var(--fos-success)]", value: insights.opportunity },
                { icon: Target, label: "Recommended Action", color: "text-[var(--fos-accent)]", value: insights.action },
                { icon: BarChart3, label: "Weekly Growth", color: "text-[#A78BFA]", value: insights.weekly },
              ].map((i) => {
                const Icon = i.icon;
                return (
                  <div key={i.label} className="border-l-2 pl-3 py-0.5" style={{ borderColor: "currentColor" }}>
                    <div className={`flex items-center gap-1.5 ${i.color} font-semibold uppercase tracking-wider text-[10px] mb-1`}>
                      <Icon className="w-3 h-3" /> {i.label}
                    </div>
                    <p className="text-[var(--fos-muted)] leading-relaxed">{i.value || "—"}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="founder-card p-5">
          <h4 className="text-[var(--fos-text)] font-semibold text-xs uppercase tracking-wider mb-3">Quick Questions</h4>
          <div className="space-y-1.5">
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                disabled={loading}
                className="w-full text-left text-xs text-[var(--fos-muted)] hover:text-[var(--fos-text)] hover:bg-[var(--fos-bg)] p-2 rounded-lg border border-transparent hover:border-[var(--fos-border)] transition-all disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
