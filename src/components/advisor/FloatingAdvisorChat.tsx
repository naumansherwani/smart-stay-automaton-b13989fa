import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { replitCall } from "@/lib/replitApi";
import { getAdvisor } from "./advisorConfig";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Send, Minus, Maximize2, Minimize2, X, Sparkles, Loader2 } from "lucide-react";

// ============ Types ============
type WindowState = "closed" | "open" | "minimized" | "maximized";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  tool_events?: unknown[];
  pending?: boolean;
};

type Ctx = {
  windowState: WindowState;
  openChat: () => void;
  closeChat: () => void;
  minimize: () => void;
  maximize: () => void;
};

const FloatingChatCtx = createContext<Ctx | null>(null);

export function useFloatingAdvisorChat() {
  const c = useContext(FloatingChatCtx);
  if (!c) throw new Error("useFloatingAdvisorChat must be used inside FloatingAdvisorChatProvider");
  return c;
}

const PAGE_SIZE = 50;
const DRAFT_AUTOSAVE_MS = 10_000;

// ============ Provider ============
export function FloatingAdvisorChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { activeWorkspace } = useWorkspaces();
  const industry = (activeWorkspace?.industry as string) || profile?.industry || "hospitality";
  const advisor = useMemo(() => getAdvisor(industry), [industry]);

  const [windowState, setWindowState] = useState<WindowState>("closed");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [oldestCursor, setOldestCursor] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastSavedScroll = useRef(0);

  // ---- Resolve/create active thread for (user, industry) ----
  const ensureThread = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    const { data: existing } = await supabase
      .from("advisor_threads")
      .select("id, draft, window_state, scroll_position")
      .eq("user_id", user.id)
      .eq("industry", industry)
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing?.id) {
      setDraft((existing.draft as string) || "");
      lastSavedScroll.current = (existing.scroll_position as number) || 0;
      return existing.id as string;
    }
    const { data: created } = await supabase
      .from("advisor_threads")
      .insert({ user_id: user.id, industry, title: `${advisor.name} chat`, window_state: "open" })
      .select("id")
      .single();
    return (created?.id as string) || null;
  }, [user, industry, advisor.name]);

  // ---- Initial latest 50 ----
  const loadInitial = useCallback(async (tid: string) => {
    setLoadingInitial(true);
    const { data } = await supabase
      .from("advisor_messages")
      .select("id, role, content, created_at, tool_events")
      .eq("thread_id", tid)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    const rows = (data || []).slice().reverse() as Message[];
    setMessages(rows);
    setHasMore((data || []).length === PAGE_SIZE);
    setOldestCursor(rows[0]?.created_at || null);
    setLoadingInitial(false);
    // Scroll to bottom on next tick
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  // ---- Open / close / min / max ----
  const openChat = useCallback(async () => {
    setWindowState((s) => (s === "maximized" ? "maximized" : "open"));
    if (!threadId) {
      const tid = await ensureThread();
      if (tid) {
        setThreadId(tid);
        await loadInitial(tid);
      }
    }
  }, [threadId, ensureThread, loadInitial]);

  const persistWindow = useCallback(async (state: WindowState) => {
    if (!threadId) return;
    await supabase
      .from("advisor_threads")
      .update({ window_state: state })
      .eq("id", threadId);
  }, [threadId]);

  const closeChat = useCallback(() => {
    setWindowState("closed");
    persistWindow("closed");
  }, [persistWindow]);

  const minimize = useCallback(() => {
    setWindowState("minimized");
    persistWindow("minimized");
  }, [persistWindow]);

  const maximize = useCallback(() => {
    setWindowState((s) => (s === "maximized" ? "open" : "maximized"));
  }, []);

  // ---- Listen for global open event (sidebar / /advisor route) ----
  useEffect(() => {
    const handler = () => { void openChat(); };
    window.addEventListener("open-advisor-chat", handler);
    return () => window.removeEventListener("open-advisor-chat", handler);
  }, [openChat]);

  // Reset on user logout
  useEffect(() => {
    if (!user) {
      setWindowState("closed");
      setThreadId(null);
      setMessages([]);
      setDraft("");
    }
  }, [user]);

  // Reset thread when industry changes (one thread per user+industry)
  useEffect(() => {
    setThreadId(null);
    setMessages([]);
    setOldestCursor(null);
    setHasMore(false);
    // If chat is open, reload for new industry
    if (windowState === "open" || windowState === "maximized") {
      void openChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry]);

  // ---- Load older when scrolled to top ----
  const loadOlder = useCallback(async () => {
    if (!threadId || !hasMore || loadingMore || !oldestCursor) return;
    setLoadingMore(true);
    const scroller = scrollRef.current;
    const prevHeight = scroller?.scrollHeight ?? 0;
    const { data } = await supabase
      .from("advisor_messages")
      .select("id, role, content, created_at, tool_events")
      .eq("thread_id", threadId)
      .lt("created_at", oldestCursor)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    const older = (data || []).slice().reverse() as Message[];
    setMessages((m) => [...older, ...m]);
    setHasMore((data || []).length === PAGE_SIZE);
    if (older[0]?.created_at) setOldestCursor(older[0].created_at);
    setLoadingMore(false);
    // Preserve scroll position
    requestAnimationFrame(() => {
      if (scroller) {
        scroller.scrollTop = scroller.scrollHeight - prevHeight;
      }
    });
  }, [threadId, hasMore, loadingMore, oldestCursor]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop < 80 && hasMore && !loadingMore) void loadOlder();
    lastSavedScroll.current = el.scrollTop;
  }, [loadOlder, hasMore, loadingMore]);

  // ---- Draft autosave ----
  useEffect(() => {
    if (!threadId) return;
    const t = setInterval(() => {
      supabase
        .from("advisor_threads")
        .update({ draft, scroll_position: Math.floor(lastSavedScroll.current) })
        .eq("id", threadId)
        .then(() => {});
    }, DRAFT_AUTOSAVE_MS);
    return () => clearInterval(t);
  }, [threadId, draft]);

  // Persist on unload
  useEffect(() => {
    const onUnload = () => {
      if (!threadId) return;
      // Fire-and-forget; can't await in unload
      supabase
        .from("advisor_threads")
        .update({ draft, scroll_position: Math.floor(lastSavedScroll.current), window_state: windowState })
        .eq("id", threadId)
        .then(() => {});
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [threadId, draft, windowState]);

  // ---- Send message + stream reply ----
  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending || !user) return;
    let tid = threadId;
    if (!tid) {
      tid = await ensureThread();
      if (!tid) return;
      setThreadId(tid);
    }
    setSending(true);
    setDraft("");
    const now = new Date().toISOString();
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      created_at: now,
    };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      created_at: new Date(Date.now() + 1).toISOString(),
      pending: true,
    };
    setMessages((m) => [...m, userMsg, assistantMsg]);
    // Scroll to bottom
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });

    // Persist user message (non-blocking)
    supabase.from("advisor_messages").insert({
      thread_id: tid, user_id: user.id, role: "user", content: text,
    }).then(() => {});
    supabase.from("advisor_threads").update({ last_message_at: now }).eq("id", tid).then(() => {});

    // Get assistant reply (try Replit; fall back to local mock)
    let fullReply = "";
    try {
      const { data, error } = await replitCall<{ reply: string }>(
        `/advisor/${encodeURIComponent(industry)}`,
        { message: text, thread_id: tid },
        { surface: "dashboard" },
      );
      fullReply = data?.reply || "";
      if (!fullReply && error) throw new Error(error.message);
      if (!fullReply) {
        fullReply = mockReply(advisor.name, text);
      }
    } catch {
      fullReply = mockReply(advisor.name, text);
    }

    // Simulate streaming: chunk into the assistant bubble
    await streamInto(fullReply, (chunk) => {
      setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, content: chunk } : x)));
      if (scrollRef.current) {
        const el = scrollRef.current;
        const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        if (nearBottom) el.scrollTop = el.scrollHeight;
      }
    });

    setMessages((m) => m.map((x) => (x.id === assistantId ? { ...x, pending: false } : x)));

    // Persist assistant message
    supabase.from("advisor_messages").insert({
      thread_id: tid, user_id: user.id, role: "assistant", content: fullReply,
    }).then(() => {});
    supabase.from("advisor_threads").update({ last_message_at: new Date().toISOString() }).eq("id", tid).then(() => {});

    setSending(false);
  }, [draft, sending, user, threadId, ensureThread, industry, advisor.name]);

  const ctxValue = useMemo<Ctx>(
    () => ({ windowState, openChat, closeChat, minimize, maximize }),
    [windowState, openChat, closeChat, minimize, maximize],
  );

  return (
    <FloatingChatCtx.Provider value={ctxValue}>
      {children}
      {user && (
        <FloatingChatWindow
          windowState={windowState}
          advisorName={advisor.name}
          advisorDesignation={advisor.designation}
          advisorVibe={advisor.vibe}
          accent={advisor.accent}
          messages={messages}
          loadingInitial={loadingInitial}
          loadingMore={loadingMore}
          sending={sending}
          draft={draft}
          onDraftChange={setDraft}
          onSend={send}
          onClose={closeChat}
          onMinimize={minimize}
          onMaximize={maximize}
          onOpenFromPill={() => setWindowState("open")}
          scrollRef={scrollRef}
          messagesEndRef={messagesEndRef}
          onScroll={handleScroll}
        />
      )}
    </FloatingChatCtx.Provider>
  );
}

// ============ Streaming helpers ============
function mockReply(name: string, userText: string): string {
  return `Hi — ${name} here. I received: "${userText}". Once the live brain endpoint is wired, I'll respond with real data, tool calls, and actionable suggestions. For now, this is a placeholder response so the chat experience works end-to-end.`;
}

async function streamInto(text: string, onUpdate: (partial: string) => void) {
  // Chunk by ~3 chars every 12ms to feel like a fast token stream
  const chunkSize = 3;
  const delay = 12;
  let buf = "";
  for (let i = 0; i < text.length; i += chunkSize) {
    buf = text.slice(0, i + chunkSize);
    onUpdate(buf);
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, delay));
  }
  onUpdate(text);
}

// ============ Window UI ============
type WindowProps = {
  windowState: WindowState;
  advisorName: string;
  advisorDesignation: string;
  advisorVibe: string;
  accent: string;
  messages: Message[];
  loadingInitial: boolean;
  loadingMore: boolean;
  sending: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onOpenFromPill: () => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
};

function FloatingChatWindow(p: WindowProps) {
  if (p.windowState === "closed") return null;

  if (p.windowState === "minimized") {
    return (
      <button
        onClick={p.onOpenFromPill}
        className="fixed bottom-5 right-5 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-full bg-card/90 backdrop-blur-xl border border-primary/30 shadow-2xl hover:border-primary/60 transition-all group"
      >
        <span className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center", p.accent)}>
          <Sparkles className="w-4 h-4 text-primary" />
        </span>
        <span className="text-sm font-semibold">{p.advisorName}</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </button>
    );
  }

  const maximized = p.windowState === "maximized";

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div
        className={cn(
          "pointer-events-auto absolute bg-card/95 backdrop-blur-2xl border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden",
          "transition-all duration-200",
          maximized
            ? "inset-4 md:inset-6"
            : "bottom-5 right-5 w-[min(960px,calc(100vw-2.5rem))] h-[min(720px,calc(100vh-2.5rem))] sm:bottom-5 sm:right-5",
        )}
      >
        {/* Header — Mac-style controls left */}
        <div className={cn("relative border-b border-border/50 px-4 py-3 flex items-center gap-3 bg-gradient-to-r", p.accent)}>
          <div className="flex items-center gap-1.5">
            <button
              onClick={p.onClose}
              title="Close"
              className="w-3 h-3 rounded-full bg-red-500 hover:brightness-110 transition"
            />
            <button
              onClick={p.onMinimize}
              title="Minimize"
              className="w-3 h-3 rounded-full bg-amber-400 hover:brightness-110 transition"
            />
            <button
              onClick={p.onMaximize}
              title={maximized ? "Restore" : "Maximize"}
              className="w-3 h-3 rounded-full bg-emerald-500 hover:brightness-110 transition"
            />
          </div>
          <div className="flex items-center gap-3 ml-2 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-full bg-background/60 border border-primary/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight truncate">{p.advisorName}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-1">{p.advisorDesignation}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1 text-muted-foreground">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={p.onMinimize} title="Minimize">
              <Minus className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={p.onMaximize} title={maximized ? "Restore" : "Maximize"}>
              {maximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={p.onClose} title="Close">
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={p.scrollRef}
          onScroll={p.onScroll}
          className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-4 bg-background/40"
        >
          {p.loadingMore && (
            <div className="flex justify-center py-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {p.loadingInitial && p.messages.length === 0 && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className={cn("h-12 rounded-2xl", i % 2 ? "w-2/3" : "w-1/2 ml-auto")} />
              ))}
            </div>
          )}
          {!p.loadingInitial && p.messages.length === 0 && (
            <div className="text-center text-muted-foreground py-16 px-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-3 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-foreground">Start a conversation with {p.advisorName}</p>
              <p className="text-xs italic mt-1.5 max-w-sm mx-auto">{p.advisorVibe}</p>
            </div>
          )}
          {p.messages.map((m) => (
            <MessageBubble key={m.id} m={m} />
          ))}
          <div ref={p.messagesEndRef} />
        </div>

        {/* Composer */}
        <div className="border-t border-border/60 p-3 md:p-4 bg-card/60">
          <div className="flex items-end gap-2">
            <textarea
              value={p.draft}
              onChange={(e) => p.onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  p.onSend();
                }
              }}
              rows={1}
              placeholder={`Message ${p.advisorName}…`}
              className="flex-1 resize-none rounded-xl bg-background/80 border border-border/60 px-4 py-2.5 text-sm focus:outline-none focus:border-primary/60 max-h-40"
              style={{ minHeight: 44 }}
            />
            <Button
              onClick={p.onSend}
              disabled={p.sending || !p.draft.trim()}
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl"
            >
              {p.sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ m }: { m: Message }) {
  const isUser = m.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed",
          isUser
            ? "rounded-2xl px-4 py-2.5 bg-primary text-primary-foreground shadow-sm"
            : "rounded-2xl px-1 py-1 text-foreground",
        )}
      >
        {m.content || (m.pending ? <span className="inline-flex gap-1 text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…</span> : null)}
      </div>
    </div>
  );
}