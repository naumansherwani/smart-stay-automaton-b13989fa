import { useState, useMemo, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { Sparkles, Send, Loader2, MessageSquare, TrendingUp, Settings2, AlertTriangle, LineChart, Target, Shield } from "lucide-react";
import { replitCall } from "@/lib/replitApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import AppLayout from "@/components/app/AppLayout";

type Advisor = {
  industry: string;
  name: string;
  designation: string;
  vibe: string;
};

const ADVISORS: Record<string, Advisor> = {
  hospitality: { industry: "hospitality", name: "Aria", designation: "AI Advisor & Executive Revenue & Operations Director — Travel, Tourism & Hospitality Division", vibe: "Warm, welcoming host. Makes every guest feel valued." },
  airlines: { industry: "airlines", name: "Captain Orion", designation: "AI Advisor & AI Flight Operations & Compliance Director — Airlines & Aviation Division", vibe: "Calm, authoritative. Inspires confidence like a senior pilot." },
  car_rental: { industry: "car_rental", name: "Rex", designation: "AI Advisor & AI Fleet Revenue & Operations Director — Car Rental Division", vibe: "Confident, road-ready. Direct and gets things done fast." },
  healthcare: { industry: "healthcare", name: "Dr. Lyra", designation: "AI Advisor & AI Clinical Operations & Patient Experience Director — Healthcare & Clinics Division", vibe: "Caring, professional. Patient-first approach, precise." },
  education: { industry: "education", name: "Professor Sage", designation: "Chief Academic Intelligence & Growth Director — Education & Training Division", vibe: "Patient, knowledgeable. Explains clearly, never condescending." },
  logistics: { industry: "logistics", name: "Atlas", designation: "Global Supply-Chain Commander & Fleet Sovereign — Logistics & Mobility Infrastructure Division", vibe: "Reliable, no-nonsense. Precision and efficiency above all." },
  events_entertainment: { industry: "events_entertainment", name: "Vega", designation: "Chief Experience Architect & Global Production Sovereign — Events & Entertainment Division", vibe: "Energetic, charismatic. Makes every event feel like a headline show." },
  railways: { industry: "railways", name: "Conductor Kai", designation: "Chief Kinetic Officer & Global Rail Sovereign — Railways & Transit Infrastructure Division", vibe: "Steady, dependable. Every journey on track, no exceptions." },
};

const CAPABILITIES = [
  { icon: TrendingUp, title: "Revenue Optimization", desc: "Spot pricing, demand and yield opportunities tailored to your industry.", prompt: "Where are the biggest revenue optimization opportunities for my business right now?" },
  { icon: Settings2, title: "Operations Guidance", desc: "Day-to-day workflow, scheduling and resource allocation advice.", prompt: "Review my current operations and suggest workflow and scheduling improvements." },
  { icon: AlertTriangle, title: "Issue Resolution", desc: "Diagnose problems and recommend the next best action fast.", prompt: "What are the top issues I should resolve this week, and how?" },
  { icon: LineChart, title: "Forecasting", desc: "Forward-looking signals on demand, occupancy and revenue.", prompt: "Give me a forecast for next month — demand, revenue and key risks." },
  { icon: Target, title: "Strategic Recommendations", desc: "High-impact moves aligned with your business goals.", prompt: "What are the top strategic moves I should make this quarter?" },
];

type Msg = { role: "user" | "assistant"; content: string };

export default function AIAdvisor() {
  const { profile } = useProfile();
  const { activeWorkspace } = useWorkspaces();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const industry = (activeWorkspace?.industry as string) || profile?.industry || "hospitality";
  const advisor = useMemo(() => ADVISORS[industry] || ADVISORS.hospitality, [industry]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    setInput("");
    setSending(true);
    try {
      const { data, error } = await replitCall<{ reply: string }>(
        `/advisor/${encodeURIComponent(advisor.industry)}`,
        { message: userMsg },
        { surface: "dashboard" },
      );
      const reply = data?.reply || error?.message || "(no response)";
      setMessages(m => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", content: "I couldn't reach the advisor service. Please try again in a moment." }]);
    } finally {
      setSending(false);
    }
  };

  const openWithPrompt = (prompt: string) => {
    setInput(prompt);
    setChatOpen(true);
  };

  return (
    <AppLayout>
      <div className="container max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">AI Advisor</h1>
          <p className="text-muted-foreground mt-1.5">Your dedicated industry advisor, specialized for your business.</p>
        </div>

        {/* Hero card — single advisor */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/30 backdrop-blur-xl p-8 mb-6">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl shrink-0">
              <Sparkles className="w-9 h-9 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold mb-1.5">Your dedicated advisor</p>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight">{advisor.name}</h2>
              <p className="text-sm text-muted-foreground mt-1.5">{advisor.designation}</p>
              <p className="text-xs text-muted-foreground/80 italic mt-2">{advisor.vibe}</p>
            </div>
            <Button size="lg" className="gap-2 shrink-0" onClick={() => setChatOpen(true)}>
              <MessageSquare className="w-4 h-4" />
              Open Chat
            </Button>
          </div>
        </div>

        {/* Capabilities */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          {CAPABILITIES.map((c) => (
            <button
              type="button"
              key={c.title}
              onClick={() => openWithPrompt(c.prompt)}
              className="p-5 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 text-left hover:border-primary/40 hover:bg-card/60 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3">
                <c.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{c.title}</h3>
              <p className="text-xs text-muted-foreground leading-snug">{c.desc}</p>
            </button>
          ))}
        </div>

        {/* Sherlock background note */}
        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground/70">
          <Shield className="w-3.5 h-3.5" />
          <span>Sherlock monitors complex issues behind the scenes.</span>
        </div>

        {/* Chat dialog */}
        {chatOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setChatOpen(false)}>
            <div className="w-full max-w-2xl h-[80vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="border-b border-border/50 px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm leading-tight">{advisor.name}</h3>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">{advisor.designation}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setChatOpen(false)}>Close</Button>
              </div>
              <ScrollArea className="flex-1 px-4 py-5">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-12">
                      <p className="italic">{advisor.vibe}</p>
                      <p className="mt-2 text-xs">Start a conversation with {advisor.name}.</p>
                    </div>
                  )}
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                        m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50 border border-border/50"
                      }`}>{m.content}</div>
                    </div>
                  ))}
                  {sending && (
                    <div className="flex justify-start">
                      <div className="bg-muted/50 border border-border/50 rounded-2xl px-4 py-2.5">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="border-t border-border/50 p-4 flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                  placeholder={`Ask ${advisor.name}…`}
                  disabled={sending}
                />
                <Button onClick={send} disabled={sending || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
