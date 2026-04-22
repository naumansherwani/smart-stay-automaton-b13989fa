import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Sparkles, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

type PageContext = "dashboard" | "crm" | "settings";
type Msg = { role: "user" | "assistant"; content: string };

interface AiGuideChatbotProps {
  context: PageContext;
  industry: string;
}

const QUICK_TOPICS: Record<PageContext, { label: string; question: string }[]> = {
  dashboard: [
    { label: "📅 Calendar", question: "Smart Calendar kaise kaam karta hai?" },
    { label: "💰 Pricing", question: "AI Auto Pricing kya hai aur kaise use karein?" },
    { label: "🎙️ Voice AI", question: "Voice Assistant kaise kaam karta hai? Latency kitni hai aur kin languages mein available hai?" },
    { label: "🚀 Onboarding", question: "AI Onboarding Wizard kya hai aur 15 languages mein kaise kaam karta hai?" },
    { label: "🛡️ AI Safety", question: "HostFlow AI ke AI Guardrails kya hain? AI kya nahi karega?" },
    { label: "📊 Growth Center", question: "Industry Growth Command Center kya hai aur kaunsi metrics dikhata hai?" },
    { label: "🛒 Sales Funnel", question: "Sales Conversion Funnel kaise kaam karta hai aur Smart Checkout Rescue kya hai?" },
    { label: "🌐 Languages", question: "HostFlow AI kin 15 languages mein available hai? Italian, Romanian, Arabic, Turkish, Korean kaise enable karein?" },
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

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-guide-chat`;

export default function AiGuideChatbot({ context, industry }: AiGuideChatbotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

      const userMsg: Msg = { role: "user", content: text.trim() };
      const allMessages = [...messages, userMsg];
      setMessages(allMessages);
      setInput("");
      setIsLoading(true);

      let assistantSoFar = "";

      try {
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: allMessages, context, industry }),
        });

        if (!resp.ok || !resp.body) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to get response");
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";

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

        let streamDone = false;
        while (!streamDone) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              streamDone = true;
              break;
            }
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // flush remaining
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (raw.startsWith(":") || raw.trim() === "") continue;
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch {}
          }
        }
      } catch (e) {
        console.error("AI Guide error:", e);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, I couldn't process your request right now. Please try again. 🙏",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, context, industry]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const contextLabel =
    context === "dashboard" ? "Dashboard" : context === "crm" ? "AI CRM" : "Settings";

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
                  <SheetTitle className="text-base font-semibold">AI Guide</SheetTitle>
                  <p className="text-xs text-muted-foreground">
                    {contextLabel} • {industry.replace(/_/g, " ")}
                  </p>
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
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
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
                type="submit"
                size="icon"
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 rounded-xl shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
              AI-powered by HostFlow AI • {contextLabel} Guide
            </p>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
