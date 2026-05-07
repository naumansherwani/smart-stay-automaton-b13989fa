import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { streamAdvisor, API_BASE, ApiError } from "@/lib/api";
import { handleApiError } from "@/lib/handleApiError";
import { useProfile } from "@/hooks/useProfile";
import { useConversationCap } from "@/hooks/useConversationCap";
import ChatSpeakerButton from "@/components/chat/ChatSpeakerButton";

type PageContext = "dashboard" | "crm" | "settings";
type Msg = { role: "user" | "assistant"; content: string };

interface AiGuideChatbotProps {
  context: PageContext;
  industry: string;
}

type Advisor = {
  name: string;
  industry: string;
  role: string;
  vibe?: string;
  voiceId: string;
  voiceName?: string;
};

// App-side industry IDs differ slightly from advisor API IDs.
const INDUSTRY_API_MAP: Record<string, string> = {
  hospitality: "tourism_hospitality",
};

const ADVISOR_API_URL = `${API_BASE}/advisor/industries`;

const QUICK_TOPICS: Record<PageContext, { label: string; question: string }[]> = {
  dashboard: [
    { label: "📅 Calendar", question: "Smart Calendar kaise kaam karta hai?" },
    { label: "💰 Pricing", question: "AI Auto Pricing kya hai aur kaise use karein?" },
    { label: "🎙️ Voice AI", question: "Voice Assistant kaise kaam karta hai? Latency kitni hai aur kin languages mein available hai?" },
    { label: "🚀 Onboarding", question: "AI Onboarding Wizard kya hai aur 15 languages mein kaise kaam karta hai?" },
    { label: "🛡️ AI Safety", question: "HostFlow AI ke AI Guardrails kya hain? AI kya nahi karega?" },
    { label: "📊 Growth Center", question: "Industry Growth Command Center kya hai aur kaunsi metrics dikhata hai?" },
    { label: "🛒 Sales Funnel", question: "Sales Conversion Funnel kaise kaam karta hai aur Smart Checkout Rescue kya hai?" },
    { label: "🌐 Languages", question: "HostFlow AI kin 15 languages mein available hai? Har language ke liye kaunsi voice use hoti hai aur Language Switcher kahan hai?" },
    { label: "💜 Win-Back", question: "Win-Back Offer kya hai? Cancel karne ke baad kya hota hai aur AI voice message kaise milta hai user ki apni language mein?" },
    { label: "📬 Live Inbox", question: "MRR Command Center mein Live Inbox aur Refund Rate metric kaise kaam karte hain? High-value churn alert kab trigger hota hai aur sab data live Supabase se kaise pull hota hai?" },
    { label: "🔒 Conflict Policy", question: "Agar Google Calendar aur AI Scheduler ke beech clash ho jaye to kaun jeetega? Backend par locked priority order kya hai aur admin isay kahan se control kar sakta hai?" },
  ],
  crm: [
    { label: "👥 Contacts", question: "CRM Contacts kaise manage karein?" },
    { label: "🎙️ Voice AI", question: "CRM mein Voice Assistant kaise use karein? Streaming aur Standard mode mein kya farq hai?" },
    { label: "💼 Deals", question: "Deals pipeline kaise use karein?" },
    { label: "🚀 Onboarding", question: "Naye user ke liye AI Onboarding kya offer karta hai?" },
  ],
  settings: [
    { label: "👤 Profile", question: "Apna profile kaise update karein?" },
    { label: "🎙️ Voice AI", question: "Voice Assistant ki settings kahan hain aur kaise enable karein?" },
    { label: "🚀 Onboarding", question: "AI Onboarding ko dobara kaise launch karein?" },
    { label: "💳 Plan", question: "Premium plan mein kya milta hai?" },
  ],
};

export default function AiGuideChatbot({ context, industry }: AiGuideChatbotProps) {
  const { profile } = useProfile();
  const { remaining, showRemaining, increment } = useConversationCap();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [advisor, setAdvisor] = useState<Advisor | null>(null);
  const [ownerAdvisor, setOwnerAdvisor] = useState<Advisor | null>(null);
  const [activeAdvisor, setActiveAdvisor] = useState<Advisor | null>(null);
  const [escalated, setEscalated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch advisor identities from Replit API — never hardcode names/voices.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await fetch(ADVISOR_API_URL);
        if (!resp.ok) return;
        const json = await resp.json();
        const data = json?.data ?? json;
        const apiIndustry = INDUSTRY_API_MAP[industry] ?? industry;
        const match: Advisor | undefined = data?.advisors?.find(
          (a: Advisor) => a.industry === apiIndustry
        );
        if (cancelled) return;
        if (match) {
          setAdvisor(match);
          setActiveAdvisor(match);
        }
        if (data?.owner_advisor) setOwnerAdvisor(data.owner_advisor);
      } catch (e) {
        console.warn("[AiGuide] advisor fetch failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [industry]);

  // Reset escalation when starting a new chat.
  useEffect(() => {
    if (messages.length === 0 && advisor) {
      setActiveAdvisor(advisor);
      setEscalated(false);
    }
  }, [messages.length, advisor]);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      // Client-side throttle: prevent rapid repeated submissions (under 800ms).
      const now = Date.now();
      if ((sendMessage as any)._lastSent && now - (sendMessage as any)._lastSent < 800) {
        toast.info("Please wait a moment before sending again.");
        return;
      }
      (sendMessage as any)._lastSent = now;

      const userMsg: Msg = { role: "user", content: text.trim() };
      const allMessages = [...messages, userMsg];
      setMessages(allMessages);
      setInput("");
      setIsLoading(true);
      increment();

      let assistantSoFar = "";
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const apiIndustry = INDUSTRY_API_MAP[industry] ?? industry;

        const upsertAssistant = (chunk: string) => {
          assistantSoFar += chunk;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
              );
            }
            return [...prev, { role: "assistant", content: assistantSoFar }];
          });
        };

        await streamAdvisor(
          apiIndustry,
          {
            message: text.trim(),
            user_industry: apiIndustry,
            business_subtype: profile?.business_subtype ?? null,
          },
          {
            signal: controller.signal,
            onChunk: (t) => upsertAssistant(t),
            onEvent: (eventName, ev) => {
              if (eventName === "start") {
                setActiveAdvisor((prev) =>
                  prev
                    ? { ...prev, voiceId: ev?.voice_id || prev.voiceId, name: ev?.name || prev.name, role: ev?.role || prev.role }
                    : { name: ev?.name || "AI Advisor", role: ev?.role || "", industry: apiIndustry, voiceId: ev?.voice_id || "" }
                );
              } else if (eventName === "escalation") {
                const escTo = ev?.escalating_to || ev?.name;
                const escVoice = ev?.escalating_voice || ev?.voiceId;
                if (escTo && escVoice) {
                  setActiveAdvisor({ name: escTo, role: ev?.role || "Owner AI Advisor", industry: "owner", voiceId: escVoice });
                  setEscalated(true);
                } else if (ownerAdvisor) {
                  setActiveAdvisor(ownerAdvisor);
                  setEscalated(true);
                }
              }
            },
            onError: (err) => {
              if (err.code === "AI_LIMIT_REACHED") {
                // global hf:ai-limit listener will show the upgrade modal
                setMessages((prev) => [...prev, { role: "assistant", content: "🌟 You've hit your AI message limit. [Upgrade your plan](/pricing) to keep going." }]);
                return;
              }
              toast.error(err.message || "Advisor error");
              setMessages((prev) => [...prev, { role: "assistant", content: err.message || "Sorry, something went wrong." }]);
            },
          },
        );
      } catch (e) {
        if ((e as any)?.name === "AbortError") {
          // User stopped — keep partial assistant text if any, do not show error.
          return;
        }
        if (e instanceof ApiError && (e.code === "AI_LIMIT_REACHED" || e.code === "INDUSTRY_MISMATCH")) {
          // Already handled by global handler in api.ts
          return;
        }
        handleApiError(e, { silent: true });
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I couldn't process your request right now. Please try again. 🙏",
          },
        ]);
      } finally {
        setIsLoading(false);
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [messages, isLoading, context, industry, ownerAdvisor, profile?.industry, profile?.business_subtype]
  );

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const contextLabel =
    context === "dashboard" ? "Dashboard" : context === "crm" ? "AI CRM" : "Settings";

  const headerTitle = activeAdvisor?.name ?? "AI Guide";
  const headerSubtitle = activeAdvisor?.role
    ? `${activeAdvisor.role}${escalated ? " • Escalated" : ""}`
    : `${contextLabel} • ${industry.replace(/_/g, " ")}`;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 pl-3 pr-4 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
          aria-label="Open AI Guide"
        >
          <span className="h-9 w-9 rounded-full bg-primary-foreground/15 flex items-center justify-center">
            <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
          </span>
          <span className="hidden sm:inline text-sm font-semibold pr-1">AI Guide</span>
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent animate-pulse" />
        </button>
      )}

      {/* Slide-out panel */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[420px] p-0 flex flex-col gap-0 border-l border-border/50 bg-background/95 backdrop-blur-xl"
        >
          {/* Header */}
          <SheetHeader className="px-5 py-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <SheetTitle className="text-base font-semibold">{headerTitle}</SheetTitle>
                  <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setMessages([])}
                  title="New conversation"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="text-center py-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">How can I help?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ask me anything about {contextLabel} features
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground px-1">Quick Topics</p>
                  <div className="grid grid-cols-2 gap-2">
                    {QUICK_TOPICS[context].map((topic) => (
                      <button
                        key={topic.label}
                        onClick={() => sendMessage(topic.question)}
                        className="text-left px-3 py-2.5 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-sm group"
                      >
                        <span className="font-medium">{topic.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted/60 border border-border/40 rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="space-y-1.5">
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      {msg.content?.trim() && (
                        <ChatSpeakerButton text={msg.content} className="-ml-1" />
                      )}
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-muted/60 border border-border/40 rounded-2xl rounded-bl-md px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <form
            onSubmit={handleSubmit}
            className="px-4 py-3 border-t border-border/50 bg-background/80"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about any feature..."
                className="flex-1 bg-muted/40 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-muted-foreground/60"
                disabled={isLoading}
              />
              <Button
                type={isLoading ? "button" : "submit"}
                onClick={isLoading ? stopGenerating : undefined}
                size="icon"
                disabled={!isLoading && !input.trim()}
                className="h-10 w-10 rounded-xl shrink-0"
                title={isLoading ? "Stop" : "Send"}
                aria-label={isLoading ? "Stop generating" : "Send message"}
              >
                {isLoading ? <Square className="h-4 w-4 fill-current" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
              AI-powered by HostFlow AI • {contextLabel} Guide
            </p>
          {showRemaining && (
            <p className="text-[10px] text-amber-600 dark:text-amber-400 text-center mt-1">
              {remaining.toLocaleString()} conversations remaining
            </p>
          )}
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
