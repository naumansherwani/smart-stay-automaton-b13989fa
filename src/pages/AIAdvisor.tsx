import { useState, useMemo } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, Send, Loader2, Crown } from "lucide-react";
import { replitCall } from "@/lib/replitApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

type Advisor = {
  industry: string;
  name: string;
  designation: string;
  vibe: string;
  ownerOnly?: boolean;
};

const ADVISORS: Advisor[] = [
  { industry: "hospitality", name: "Aria", designation: "AI Advisor & Executive Revenue & Operations Director — Travel, Tourism & Hospitality Division", vibe: "Warm, welcoming host. Makes every guest feel valued." },
  { industry: "airlines", name: "Captain Orion", designation: "AI Advisor & AI Flight Operations & Compliance Director — Airlines & Aviation Division", vibe: "Calm, authoritative. Inspires confidence like a senior pilot." },
  { industry: "car_rental", name: "Rex", designation: "AI Advisor & AI Fleet Revenue & Operations Director — Car Rental Division", vibe: "Confident, road-ready. Direct and gets things done fast." },
  { industry: "healthcare", name: "Dr. Lyra", designation: "AI Advisor & AI Clinical Operations & Patient Experience Director — Healthcare & Clinics Division", vibe: "Caring, professional. Patient-first approach, precise." },
  { industry: "education", name: "Professor Sage", designation: "Chief Academic Intelligence & Growth Director — Education & Training Division", vibe: "Patient, knowledgeable. Explains clearly, never condescending." },
  { industry: "logistics", name: "Atlas", designation: "Global Supply-Chain Commander & Fleet Sovereign — Logistics & Mobility Infrastructure Division", vibe: "Reliable, no-nonsense. Precision and efficiency above all." },
  { industry: "events_entertainment", name: "Vega", designation: "Chief Experience Architect & Global Production Sovereign — Events & Entertainment Division", vibe: "Energetic, charismatic. Makes every event feel like a headline show." },
  { industry: "railways", name: "Conductor Kai", designation: "Chief Kinetic Officer & Global Rail Sovereign — Railways & Transit Infrastructure Division", vibe: "Steady, dependable. Every journey on track, no exceptions." },
  { industry: "owner", name: "Sherlock", designation: "Head AI Advisor — Owner & Founder Advisor", vibe: "Authoritative, analytical. Resolves what no one else can.", ownerOnly: true },
];

type Msg = { role: "user" | "assistant"; content: string };

export default function AIAdvisor() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [active, setActive] = useState<Advisor | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const userIndustry = profile?.industry || "hospitality";

  const visible = useMemo(() => {
    return ADVISORS.filter(a => !a.ownerOnly || isAdmin);
  }, [isAdmin]);

  const myAdvisor = useMemo(
    () => ADVISORS.find(a => a.industry === userIndustry) || ADVISORS[0],
    [userIndustry]
  );

  const send = async () => {
    if (!input.trim() || !active) return;
    const userMsg = input.trim();
    setMessages(m => [...m, { role: "user", content: userMsg }]);
    setInput("");
    setSending(true);
    try {
      if (active.industry === "owner") {
        const { data, error } = await replitCall<{ reply: string }>(
          "/founder/adviser",
          { message: userMsg },
        );
        const reply = data?.reply || error?.message || "(no response)";
        setMessages(m => [...m, { role: "assistant", content: reply }]);
      } else {
        const { data, error } = await replitCall<{ reply: string }>(
          `/advisor/${encodeURIComponent(active.industry)}`,
          { message: userMsg },
          { surface: "dashboard" },
        );
        const reply = data?.reply || error?.message || "(no response)";
        setMessages(m => [...m, { role: "assistant", content: reply }]);
      }
    } finally {
      setSending(false);
    }
  };

  if (active) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
        <div className="border-b border-border/50 bg-card/40 backdrop-blur-xl px-6 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => { setActive(null); setMessages([]); }}>← Back</Button>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center">
            {active.industry === "owner" ? <Crown className="w-5 h-5 text-primary" /> : <Sparkles className="w-5 h-5 text-primary" />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-tight">{active.name}</h1>
            <p className="text-xs text-muted-foreground line-clamp-1">{active.designation}</p>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-12">
                <p className="italic">{active.vibe}</p>
                <p className="mt-2 text-xs">Start a conversation with {active.name}.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card/60 backdrop-blur border border-border/50"
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-card/60 backdrop-blur border border-border/50 rounded-2xl px-4 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-border/50 bg-card/40 backdrop-blur-xl p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
              placeholder={`Ask ${active.name}…`}
              disabled={sending}
            />
            <Button onClick={send} disabled={sending || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">AI Advisor</h1>
        <p className="text-muted-foreground mt-1.5">Your dedicated industry advisor — and Sherlock when escalation is needed.</p>
      </div>

      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 backdrop-blur">
        <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-1">Your dedicated advisor</p>
        <button
          onClick={() => setActive(myAdvisor)}
          className="text-left w-full hover:opacity-90 transition"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{myAdvisor.name}</h2>
              <p className="text-xs text-muted-foreground">{myAdvisor.designation}</p>
            </div>
          </div>
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((a) => (
          <button
            key={a.industry}
            onClick={() => setActive(a)}
            className="text-left p-5 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/50 hover:border-primary/40 hover:bg-card/60 transition-all group"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${a.ownerOnly ? "bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30" : "bg-primary/10 border border-primary/20"}`}>
                {a.ownerOnly ? <Crown className="w-4 h-4 text-amber-500" /> : <Sparkles className="w-4 h-4 text-primary" />}
              </div>
              <h3 className="font-bold text-base">{a.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">{a.designation}</p>
            <p className="text-[10px] text-muted-foreground/70 italic mt-2">{a.vibe}</p>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground/70 text-center mt-8">
        Escalation chain: User → Industry Advisor → Sherlock → Founder
      </p>
    </div>
  );
}