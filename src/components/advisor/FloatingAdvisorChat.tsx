import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { replitStream, replitCall } from "@/lib/replitApi";
import { getAdvisor, type ToolPanel, type MetricBadge, type ChannelChip } from "./advisorConfig";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import ChatSpeakerButton from "@/components/chat/ChatSpeakerButton";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Send, Minus, Maximize2, Minimize2, X, Sparkles, Loader2, Square, RefreshCcw,
  Copy, Pencil, Paperclip, Mic, MicOff, FileText, Image as ImageIcon, FileSpreadsheet,
  AlertCircle, CheckCircle2, XCircle, ChevronRight, TrendingUp, DollarSign,
  MessageSquare, Star, AlertTriangle, LineChart, Gift, Wrench, Crown,
  Heart, Activity, Pill, ShieldCheck, Shield, FlaskConical, Watch, MessageCircle,
  Mail, CalendarClock, Dna,
} from "lucide-react";

// ===================== Types =====================
type WindowState = "closed" | "open" | "minimized" | "maximized";

type Attachment = {
  id: string;
  name: string;
  mime: string;
  size: number;
  /** Storage path inside `advisor-attachments` bucket */
  path: string;
};

type ToolEvent = {
  id: string;
  /** Short label e.g. "🔍 Checked Booking.com occupancy" */
  label: string;
  /** lucide icon name (optional) */
  icon?: string;
  /** Raw input / output for expand view */
  input?: unknown;
  output?: unknown;
  status?: "running" | "done" | "error";
  /** Custom widget renderer (industry-specific). Falls back to JSON view. */
  widget?:
    | { type: "dna_helix" }
    | { type: "risk_gauge"; value: number; label?: string }
    | { type: "insurance_pulse"; state: "pending" | "approved" | "denied" | "financing"; note?: string }
    | { type: "pharmacy_options"; options: Array<{ kind: "brand" | "generic" | "covered"; name: string; price?: string; note?: string }> };
  /** Inline actions the user can take */
  actions?: Array<{
    id: string;
    label: string;
    /** apply / modify / skip — UI variants */
    kind: "apply" | "modify" | "skip";
    /** Replit path to POST to when Apply is pressed */
    endpoint?: string;
    /** JSON body the apply call should send */
    payload?: unknown;
  }>;
};

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  tool_events?: ToolEvent[];
  attachments?: Attachment[];
  pending?: boolean;
  error?: boolean;
};

type SherlockState = "idle" | "watching" | "investigating" | "alert" | "resolved";

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
const ALLOWED_MIME = /^(application\/(pdf|vnd\.openxmlformats-officedocument\..*|vnd\.ms-excel|msword)|text\/csv|image\/.+)$/;
const MAX_FILE_MB = 20;

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp, DollarSign, MessageSquare, Star, AlertTriangle, LineChart, Gift, Wrench,
  FileText, ImageIcon, FileSpreadsheet,
};

// ===================== Provider =====================
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
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [oldestCursor, setOldestCursor] = useState<string | null>(null);
  const [sherlock, setSherlock] = useState<SherlockState>("watching");
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastSavedScroll = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const mediaChunksRef = useRef<Blob[]>([]);
  const lastUserTextRef = useRef<string>("");
  const lastAttachmentsRef = useRef<Attachment[]>([]);

  // -------- Thread resolve / create --------
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

  // -------- Load initial --------
  const loadInitial = useCallback(async (tid: string) => {
    setLoadingInitial(true);
    const { data } = await supabase
      .from("advisor_messages")
      .select("id, role, content, created_at, tool_events, attachments")
      .eq("thread_id", tid)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    const rows = (data || []).slice().reverse() as unknown as Message[];
    setMessages(rows);
    setHasMore((data || []).length === PAGE_SIZE);
    setOldestCursor(rows[0]?.created_at || null);
    setLoadingInitial(false);
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  // -------- Window controls --------
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
    await supabase.from("advisor_threads").update({ window_state: state }).eq("id", threadId);
  }, [threadId]);

  const closeChat = useCallback(() => {
    setWindowState("closed");
    void persistWindow("closed");
  }, [persistWindow]);

  const minimize = useCallback(() => {
    setWindowState("minimized");
    void persistWindow("minimized");
  }, [persistWindow]);

  const maximize = useCallback(() => {
    setWindowState((s) => (s === "maximized" ? "open" : "maximized"));
  }, []);

  useEffect(() => {
    const handler = () => { void openChat(); };
    window.addEventListener("open-advisor-chat", handler);
    return () => window.removeEventListener("open-advisor-chat", handler);
  }, [openChat]);

  useEffect(() => {
    if (!user) {
      setWindowState("closed");
      setThreadId(null);
      setMessages([]);
      setDraft("");
      setPendingAttachments([]);
    }
  }, [user]);

  // Industry change → reload thread for new industry, never mix
  useEffect(() => {
    setThreadId(null);
    setMessages([]);
    setOldestCursor(null);
    setHasMore(false);
    setPendingAttachments([]);
    if (windowState === "open" || windowState === "maximized") {
      void openChat();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry]);

  // -------- Older pagination --------
  const loadOlder = useCallback(async () => {
    if (!threadId || !hasMore || loadingMore || !oldestCursor) return;
    setLoadingMore(true);
    const scroller = scrollRef.current;
    const prevHeight = scroller?.scrollHeight ?? 0;
    const { data } = await supabase
      .from("advisor_messages")
      .select("id, role, content, created_at, tool_events, attachments")
      .eq("thread_id", threadId)
      .lt("created_at", oldestCursor)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    const older = (data || []).slice().reverse() as unknown as Message[];
    setMessages((m) => [...older, ...m]);
    setHasMore((data || []).length === PAGE_SIZE);
    if (older[0]?.created_at) setOldestCursor(older[0].created_at);
    setLoadingMore(false);
    requestAnimationFrame(() => {
      if (scroller) scroller.scrollTop = scroller.scrollHeight - prevHeight;
    });
  }, [threadId, hasMore, loadingMore, oldestCursor]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop < 80 && hasMore && !loadingMore) void loadOlder();
    lastSavedScroll.current = el.scrollTop;
  }, [loadOlder, hasMore, loadingMore]);

  // -------- Draft autosave --------
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

  useEffect(() => {
    const onUnload = () => {
      if (!threadId) return;
      supabase
        .from("advisor_threads")
        .update({ draft, scroll_position: Math.floor(lastSavedScroll.current), window_state: windowState })
        .eq("id", threadId).then(() => {});
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [threadId, draft, windowState]);

  // -------- Stream assistant reply --------
  const streamAssistantReply = useCallback(async (
    tid: string,
    userText: string,
    attachments: Attachment[],
    assistantId: string,
  ) => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      let acc = "";
      const events: ToolEvent[] = [];

      for await (const ev of replitStream(`/advisor/${encodeURIComponent(industry)}/stream`, {
        message: userText,
        thread_id: tid,
        attachments,
      }, { signal: ctrl.signal })) {
        if (ev.event === "token" || ev.event === "message") {
          const chunk = typeof ev.data === "string" ? ev.data : (ev.data?.delta || ev.data?.content || "");
          if (chunk) {
            acc += chunk;
            setMessages((m) => m.map((x) => x.id === assistantId ? { ...x, content: acc } : x));
            const el = scrollRef.current;
            if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 160) {
              el.scrollTop = el.scrollHeight;
            }
          }
        } else if (ev.event === "tool_event" || ev.event === "tool") {
          const incoming = ev.data as ToolEvent;
          const idx = events.findIndex((e) => e.id === incoming.id);
          if (idx >= 0) events[idx] = { ...events[idx], ...incoming };
          else events.push(incoming);
          setMessages((m) => m.map((x) => x.id === assistantId ? { ...x, tool_events: [...events] } : x));
        } else if (ev.event === "sherlock") {
          if (ev.data?.state) setSherlock(ev.data.state as SherlockState);
        } else if (ev.event === "done" || ev.event === "end") {
          break;
        } else if (ev.event === "error") {
          throw new Error(ev.data?.message || "Stream error");
        }
      }

      setMessages((m) => m.map((x) => x.id === assistantId ? { ...x, pending: false } : x));

      // Persist final assistant message
      if (user) {
        await supabase.from("advisor_messages").insert({
          thread_id: tid, user_id: user.id, role: "assistant", content: acc,
          tool_events: events as unknown as never,
        });
        await supabase.from("advisor_threads").update({ last_message_at: new Date().toISOString() }).eq("id", tid);
      }
    } catch (err: unknown) {
      const aborted = (err as { name?: string } | undefined)?.name === "AbortError";
      const errMessage = aborted
        ? "_(stopped)_"
        : `⚠️ Couldn't reach the AI brain. ${(err as Error)?.message || ""}`.trim();
      setMessages((m) => m.map((x) => x.id === assistantId ? {
        ...x, content: x.content || errMessage, pending: false, error: !aborted,
      } : x));
    } finally {
      abortRef.current = null;
      setSending(false);
    }
  }, [industry, user]);

  // -------- Send --------
  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? draft).trim();
    if ((!text && pendingAttachments.length === 0) || sending || !user) return;
    let tid = threadId;
    if (!tid) {
      tid = await ensureThread();
      if (!tid) return;
      setThreadId(tid);
    }
    setSending(true);
    setDraft("");
    const atts = pendingAttachments;
    setPendingAttachments([]);
    lastUserTextRef.current = text;
    lastAttachmentsRef.current = atts;

    const now = new Date().toISOString();
    const userMsg: Message = {
      id: crypto.randomUUID(), role: "user", content: text, created_at: now, attachments: atts,
    };
    const assistantId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantId, role: "assistant", content: "",
      created_at: new Date(Date.now() + 1).toISOString(), pending: true,
    };
    setMessages((m) => [...m, userMsg, assistantMsg]);
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });

    // Persist user message
    void supabase.from("advisor_messages").insert({
      thread_id: tid, user_id: user.id, role: "user", content: text,
      attachments: atts as unknown as never,
    });
    void supabase.from("advisor_threads").update({ last_message_at: now }).eq("id", tid);

    await streamAssistantReply(tid, text, atts, assistantId);
  }, [draft, pendingAttachments, sending, user, threadId, ensureThread, streamAssistantReply]);

  // -------- Stop --------
  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // -------- Regenerate (drop last assistant + re-send last user) --------
  const regenerate = useCallback(async () => {
    if (sending || !threadId || !user) return;
    // Drop last assistant
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages((m) => {
      const lastAssistantIdx = [...m].reverse().findIndex((x) => x.role === "assistant");
      if (lastAssistantIdx < 0) return m;
      const realIdx = m.length - 1 - lastAssistantIdx;
      return m.slice(0, realIdx);
    });
    setSending(true);
    const assistantId = crypto.randomUUID();
    setMessages((m) => [...m, {
      id: assistantId, role: "assistant", content: "",
      created_at: new Date().toISOString(), pending: true,
    }]);
    await streamAssistantReply(threadId, lastUser.content, lastUser.attachments || [], assistantId);
  }, [sending, threadId, user, messages, streamAssistantReply]);

  // -------- Edit last user message --------
  const editLastUser = useCallback(() => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setDraft(lastUser.content);
    setEditingMsgId(lastUser.id);
    setPendingAttachments(lastUser.attachments || []);
    setMessages((m) => {
      const idx = m.findIndex((x) => x.id === lastUser.id);
      return idx >= 0 ? m.slice(0, idx) : m;
    });
  }, [messages]);

  // -------- Attachments: upload --------
  const uploadFile = useCallback(async (file: File): Promise<Attachment | null> => {
    if (!user || !threadId) {
      const tid = await ensureThread();
      if (!tid) return null;
      setThreadId(tid);
    }
    const tid = threadId || (await ensureThread());
    if (!tid || !user) return null;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      toast({ title: "File too large", description: `${file.name} is over ${MAX_FILE_MB} MB.`, variant: "destructive" });
      return null;
    }
    if (!ALLOWED_MIME.test(file.type) && !/\.(pdf|csv|xlsx|docx|png|jpe?g|webp|gif)$/i.test(file.name)) {
      toast({ title: "Unsupported file type", description: file.name, variant: "destructive" });
      return null;
    }
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${user.id}/${tid}/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage.from("advisor-attachments").upload(path, file, {
      cacheControl: "3600", upsert: false, contentType: file.type || undefined,
    });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return null;
    }
    return {
      id: crypto.randomUUID(), name: file.name, mime: file.type || "application/octet-stream",
      size: file.size, path,
    };
  }, [user, threadId, ensureThread]);

  const onFilesPicked = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files);
    for (const f of arr) {
      const att = await uploadFile(f);
      if (att) setPendingAttachments((p) => [...p, att]);
    }
  }, [uploadFile]);

  const removePending = useCallback((id: string) => {
    setPendingAttachments((p) => {
      const a = p.find((x) => x.id === id);
      if (a) void supabase.storage.from("advisor-attachments").remove([a.path]);
      return p.filter((x) => x.id !== id);
    });
  }, []);

  // -------- Voice input (mic) --------
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRecRef.current = rec;
      mediaChunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) mediaChunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(mediaChunksRef.current, { type: rec.mimeType || "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        // Send to Replit STT (real endpoint — graceful failure if not wired yet)
        try {
          const form = new FormData();
          form.append("audio", blob, "voice.webm");
          const { data: session } = await supabase.auth.getSession();
          const token = session.session?.access_token;
          const resp = await fetch(`${import.meta.env.VITE_REPLIT_ADVISOR_URL || ""}/voice/transcribe`, {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: form,
          });
          if (resp.ok) {
            const j = await resp.json().catch(() => ({}));
            const text = j?.data?.text || j?.text;
            if (text) setDraft((d) => (d ? `${d} ${text}` : text));
            else toast({ title: "No speech detected", variant: "destructive" });
          } else {
            toast({ title: "Voice transcription unavailable", description: `(${resp.status})`, variant: "destructive" });
          }
        } catch (e) {
          toast({ title: "Voice transcription failed", description: (e as Error).message, variant: "destructive" });
        }
      };
      rec.start();
      setRecording(true);
    } catch (e) {
      toast({ title: "Microphone access denied", description: (e as Error).message, variant: "destructive" });
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecRef.current?.stop();
    setRecording(false);
  }, []);

  // -------- Tool-event action handler --------
  const handleToolAction = useCallback(async (event: ToolEvent, actionId: string) => {
    const action = event.actions?.find((a) => a.id === actionId);
    if (!action) return;
    if (action.kind === "skip") {
      toast({ title: "Skipped", description: event.label });
      return;
    }
    if (action.kind === "modify") {
      // Drop modify intent into draft so user can refine
      setDraft((d) => d || `Modify: ${event.label}`);
      toast({ title: "Edit and resend", description: "Tell me how to adjust this action." });
      return;
    }
    // apply
    if (!action.endpoint) {
      toast({ title: "Applied", description: event.label });
      return;
    }
    const { error } = await replitCall(action.endpoint, action.payload ?? {});
    if (error) {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Applied successfully", description: event.label });
    }
  }, []);

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
          industry={industry}
          advisor={advisor}
          messages={messages}
          loadingInitial={loadingInitial}
          loadingMore={loadingMore}
          sending={sending}
          draft={draft}
          editingMsgId={editingMsgId}
          pendingAttachments={pendingAttachments}
          recording={recording}
          sherlock={sherlock}
          onDraftChange={(v) => { setDraft(v); if (editingMsgId) setEditingMsgId(null); }}
          onSend={() => void send()}
          onStop={stop}
          onRegenerate={() => void regenerate()}
          onEditLast={editLastUser}
          onClose={closeChat}
          onMinimize={minimize}
          onMaximize={maximize}
          onOpenFromPill={() => setWindowState("open")}
          scrollRef={scrollRef}
          onScroll={handleScroll}
          onFilesPicked={(f) => void onFilesPicked(f)}
          onRemoveAttachment={removePending}
          onStartRecording={() => void startRecording()}
          onStopRecording={stopRecording}
          onUseStarter={(p) => setDraft(p)}
          onToolAction={handleToolAction}
        />
      )}
    </FloatingChatCtx.Provider>
  );
}

// ===================== Window UI =====================
type WindowProps = {
  windowState: WindowState;
  industry: string;
  advisor: ReturnType<typeof getAdvisor>;
  messages: Message[];
  loadingInitial: boolean;
  loadingMore: boolean;
  sending: boolean;
  draft: string;
  editingMsgId: string | null;
  pendingAttachments: Attachment[];
  recording: boolean;
  sherlock: SherlockState;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  onRegenerate: () => void;
  onEditLast: () => void;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onOpenFromPill: () => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  onScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  onFilesPicked: (files: FileList | File[]) => void;
  onRemoveAttachment: (id: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onUseStarter: (prompt: string) => void;
  onToolAction: (event: ToolEvent, actionId: string) => void;
};

function FloatingChatWindow(p: WindowProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  if (p.windowState === "closed") return null;

  if (p.windowState === "minimized") {
    const isOrb = p.advisor.minimizedOrb === "mint-breath";
    const hour = new Date().getHours();
    const dim = hour >= 20 || hour < 7;
    return (
      <button
        onClick={p.onOpenFromPill}
        className="fixed bottom-5 right-5 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-full bg-card/90 backdrop-blur-xl border border-primary/30 shadow-2xl hover:border-primary/60 transition-all group"
        style={isOrb && dim ? { filter: "brightness(0.7)" } : undefined}
      >
        {isOrb ? (
          <span
            className="advisor-mint-orb relative w-8 h-8 rounded-full"
            style={{
              background: "radial-gradient(circle at 35% 30%, #ecfdf5, #6ee7b7 55%, #059669 100%)",
              boxShadow: "0 0 18px 4px rgba(110,231,183,0.55), inset 0 0 8px rgba(255,255,255,0.6)",
            }}
          />
        ) : (
          <span className={cn("w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center", p.advisor.accent)}>
            <Sparkles className="w-4 h-4 text-primary" />
          </span>
        )}
        <span className="text-sm font-semibold">{p.advisor.name}</span>
        <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse",
          p.sending ? "bg-amber-400" : "bg-emerald-500")} />
        <style>{`
          @keyframes advisorMintBreath {
            0%, 100% { transform: scale(1);    box-shadow: 0 0 14px 3px rgba(110,231,183,0.45), inset 0 0 8px rgba(255,255,255,0.55); }
            50%      { transform: scale(1.08); box-shadow: 0 0 26px 6px rgba(110,231,183,0.75), inset 0 0 10px rgba(255,255,255,0.7); }
          }
          .advisor-mint-orb { animation: advisorMintBreath 4s ease-in-out infinite; }
        `}</style>
      </button>
    );
  }

  const maximized = p.windowState === "maximized";
  const auraStyle: React.CSSProperties = {
    boxShadow: p.sending
      ? `0 0 0 1px hsl(${p.advisor.auraHsl} / 0.6), 0 0 40px -10px hsl(${p.advisor.auraHsl} / 0.4)`
      : undefined,
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div
        style={auraStyle}
        className={cn(
          "pointer-events-auto absolute bg-card/95 backdrop-blur-2xl border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden",
          "transition-all duration-200",
          maximized
            ? "inset-4 md:inset-6"
            : "bottom-5 right-5 w-[min(960px,calc(100vw-2.5rem))] h-[min(720px,calc(100vh-2.5rem))]",
          p.sending && "advisor-aura-anim",
          dragOver && "ring-2 ring-primary/60",
          p.advisor.mono && "font-mono",
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) p.onFilesPicked(e.dataTransfer.files);
        }}
      >
        {/* Header */}
        <div className={cn("relative border-b border-border/50 px-4 py-3 bg-gradient-to-r", p.advisor.accent)}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button onClick={p.onClose} title="Close" className="w-3 h-3 rounded-full bg-red-500 hover:brightness-110" />
              <button onClick={p.onMinimize} title="Minimize" className="w-3 h-3 rounded-full bg-amber-400 hover:brightness-110" />
              <button onClick={p.onMaximize} title={maximized ? "Restore" : "Maximize"} className="w-3 h-3 rounded-full bg-emerald-500 hover:brightness-110" />
            </div>
            <div className="flex items-center gap-3 ml-2 min-w-0 flex-1">
              <div className="w-9 h-9 rounded-full bg-background/60 border border-primary/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight truncate flex items-center gap-1.5">
                  <span>
                    {p.advisor.name}
                    {p.advisor.shortTitle && (
                      <span className="text-muted-foreground font-medium"> — {p.advisor.shortTitle}</span>
                    )}
                  </span>
                  {p.advisor.sovereignBadge && (
                    <span
                      title="Sovereign"
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#f5d4a1] to-[#f4c2d7] text-amber-900 shadow-[0_0_10px_rgba(245,212,161,0.55)]"
                    >
                      <Crown className="w-2.5 h-2.5" />
                      Sovereign
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{p.advisor.designation}</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-1 text-muted-foreground">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={p.onMinimize}><Minus className="w-3.5 h-3.5" /></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={p.onMaximize}>
                {maximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={p.onClose}><X className="w-3.5 h-3.5" /></Button>
            </div>
          </div>

          {/* Channels + Metric badges */}
          {(p.advisor.channels.length > 0 || p.advisor.metricBadges.length > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {p.advisor.channels.map((c) => <ChannelChipView key={c.id} chip={c} />)}
              {p.advisor.metricBadges.map((b) => <MetricBadgeView key={b.id} badge={b} />)}
            </div>
          )}

          {/* Radar micro-map (industry-specific, e.g. airlines) */}
          {p.advisor.radar && (
            <RadarMicroMap endpoint={p.advisor.radar.endpoint} title={p.advisor.radar.title} auraHsl={p.advisor.auraHsl} />
          )}

          {/* Sherlock shadow status line */}
          <SherlockLine state={p.sherlock} />
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
            <EmptyState advisor={p.advisor} onUseStarter={p.onUseStarter} />
          )}

          {p.messages.map((m, i) => (
            <MessageBubble
              key={m.id}
              message={m}
              advisorName={p.advisor.name}
              toolBadgeStyle={p.advisor.toolBadgeStyle}
              isLastAssistant={m.role === "assistant" && i === p.messages.length - 1 && !p.sending}
              canEditLastUser={m.role === "user" && i === p.messages.length - 2 && !p.sending}
              onRegenerate={p.onRegenerate}
              onEditLast={p.onEditLast}
              onToolAction={p.onToolAction}
            />
          ))}
        </div>

        {/* Tool panels (industry-specific) */}
        {p.advisor.toolPanels.length > 0 && (
          <div className="border-t border-border/40 px-3 py-2 flex gap-1.5 overflow-x-auto bg-background/30">
            {p.advisor.toolPanels.map((t) => (
              <ToolPanelButton key={t.id} panel={t} onClick={() => p.onUseStarter(t.prompt)} />
            ))}
          </div>
        )}

        {/* Attachment chips */}
        {p.pendingAttachments.length > 0 && (
          <div className="px-4 pt-2 flex flex-wrap gap-2 border-t border-border/40 bg-background/30">
            {p.pendingAttachments.map((a) => (
              <AttachmentChip key={a.id} att={a} onRemove={() => p.onRemoveAttachment(a.id)} />
            ))}
          </div>
        )}

        {/* Composer */}
        <div className="border-t border-border/50 p-3 bg-background/50">
          {p.editingMsgId && (
            <div className="text-[11px] text-amber-500 mb-1 flex items-center gap-1">
              <Pencil className="w-3 h-3" /> Editing your previous message
            </div>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.csv,.xlsx,.docx,image/*"
              className="hidden"
              onChange={(e) => e.target.files && p.onFilesPicked(e.target.files)}
            />
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => fileInputRef.current?.click()} title="Attach files">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button
              variant={p.recording ? "destructive" : "ghost"}
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={p.recording ? p.onStopRecording : p.onStartRecording}
              title={p.recording ? "Stop recording" : "Voice input"}
            >
              {p.recording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <textarea
              value={p.draft}
              onChange={(e) => p.onDraftChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!p.sending) p.onSend(); }
              }}
              placeholder={p.advisor.placeholder}
              rows={1}
              className="flex-1 resize-none rounded-xl bg-background/70 border border-border/60 px-3 py-2 text-sm max-h-32 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {p.sending ? (
              <Button onClick={p.onStop} variant="destructive" size="icon" className="h-9 w-9 shrink-0" title="Stop generating">
                <Square className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={p.onSend} size="icon" className="h-9 w-9 shrink-0" disabled={!p.draft.trim() && p.pendingAttachments.length === 0} title="Send">
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Aura keyframes */}
      <style>{`
        @keyframes advisorAuraPulse {
          0%, 100% { box-shadow: 0 0 0 1px hsl(${p.advisor.auraHsl} / 0.55), 0 0 30px -8px hsl(${p.advisor.auraHsl} / 0.35); }
          50%      { box-shadow: 0 0 0 2px hsl(${p.advisor.auraHsl} / 0.85), 0 0 60px -6px hsl(${p.advisor.auraHsl} / 0.55); }
        }
        .advisor-aura-anim { animation: advisorAuraPulse 2.4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

// ===================== Sub-components =====================
function EmptyState({ advisor, onUseStarter }: { advisor: ReturnType<typeof getAdvisor>; onUseStarter: (p: string) => void }) {
  return (
    <div className="text-center py-10 max-w-xl mx-auto">
      <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 items-center justify-center mb-4">
        <Sparkles className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-lg font-bold">{advisor.name}</h3>
      <p className="text-xs text-muted-foreground italic mt-1">{advisor.vibe}</p>
      {advisor.starterPrompts.length > 0 && (
        <div className="mt-6 grid gap-2 sm:grid-cols-2 text-left">
          {advisor.starterPrompts.map((sp, i) => (
            <button
              key={i}
              onClick={() => onUseStarter(sp)}
              className="p-3 rounded-xl border border-border/60 bg-card/60 hover:border-primary/40 hover:bg-card text-xs text-foreground/90 transition text-left"
            >
              {sp}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChannelChipView({ chip }: { chip: ChannelChip }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-background/70 border border-border/60 text-[11px]">
      {chip.iconUrl ? (
        <img src={chip.iconUrl} alt="" className="w-3.5 h-3.5 rounded-sm" />
      ) : (
        <span className="w-3.5 h-3.5 rounded-sm bg-primary/20" />
      )}
      <span className="font-medium">{chip.label}</span>
    </div>
  );
}

function MetricBadgeView({ badge }: { badge: MetricBadge }) {
  const [val, setVal] = useState<string | null>(null);
  const [delta, setDelta] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    (async () => {
      const { data, error } = await replitCall<{ value: string | number; delta?: number; unit?: string }>(badge.endpoint, undefined, { method: "GET" });
      if (!live) return;
      if (!error && data && data.value !== undefined && data.value !== null) {
        setVal(String(data.value));
        if (typeof data.delta === "number") setDelta(data.delta);
      }
    })();
    return () => { live = false; };
  }, [badge.endpoint]);
  if (val === null) return null; // hide gracefully if backend not wired
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/30 text-[11px]">
      <span className="text-muted-foreground">{badge.label}</span>
      <span className="font-bold text-foreground">{val}{badge.unit}</span>
      {delta !== null && (
        <span className={cn("font-medium", delta >= 0 ? "text-emerald-500" : "text-red-500")}>
          {delta >= 0 ? "+" : ""}{delta}%
        </span>
      )}
    </div>
  );
}

function SherlockLine({ state }: { state: SherlockState }) {
  const palette: Record<SherlockState, { color: string; label: string }> = {
    idle:          { color: "text-muted-foreground",          label: "Sherlock standby" },
    watching:      { color: "text-muted-foreground/80",       label: "Sherlock is watching quietly" },
    investigating: { color: "text-amber-400",                 label: "Sherlock is investigating an anomaly…" },
    alert:         { color: "text-red-500",                   label: "Sherlock spotted a critical issue" },
    resolved:      { color: "text-emerald-500",               label: "Sherlock resolved a background task" },
  };
  const p = palette[state];
  return (
    <div className={cn("mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em]", p.color)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {p.label}
    </div>
  );
}

function ToolPanelButton({ panel, onClick }: { panel: ToolPanel; onClick: () => void }) {
  const Icon = ICON_MAP[panel.icon] || Wrench;
  return (
    <button
      onClick={onClick}
      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/60 text-[11px] hover:border-primary/40 hover:bg-card transition"
      title={panel.prompt}
    >
      <Icon className="w-3.5 h-3.5 text-primary" />
      <span className="font-medium whitespace-nowrap">{panel.label}</span>
    </button>
  );
}

function AttachmentChip({ att, onRemove }: { att: Attachment; onRemove: () => void }) {
  const Icon = att.mime.startsWith("image/") ? ImageIcon : /sheet|csv|excel/.test(att.mime) ? FileSpreadsheet : FileText;
  return (
    <div className="inline-flex items-center gap-1.5 max-w-[200px] px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-[11px]">
      <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="truncate" title={att.name}>{att.name}</span>
      <button onClick={onRemove} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
    </div>
  );
}

function MessageBubble(props: {
  message: Message;
  advisorName: string;
  toolBadgeStyle?: "uppercase-code";
  isLastAssistant: boolean;
  canEditLastUser: boolean;
  onRegenerate: () => void;
  onEditLast: () => void;
  onToolAction: (event: ToolEvent, actionId: string) => void;
}) {
  const { message: m } = props;
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(m.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (m.role === "user") {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="max-w-[80%] bg-primary text-primary-foreground rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap">
          {m.content}
        </div>
        {m.attachments && m.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 max-w-[80%] justify-end">
            {m.attachments.map((a) => (
              <div key={a.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 border border-primary/30 text-[10px]">
                <Paperclip className="w-3 h-3" /> {a.name}
              </div>
            ))}
          </div>
        )}
        {props.canEditLastUser && (
          <button onClick={props.onEditLast} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <Pencil className="w-3 h-3" /> Edit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-3 text-sm border",
        m.error ? "bg-destructive/10 border-destructive/40" : "bg-muted/40 border-border/50",
      )}>
        {/* Tool events */}
        {m.tool_events && m.tool_events.length > 0 && (
          <div className="mb-2">
            <Accordion type="multiple" className="space-y-1">
              {m.tool_events.map((ev) => (
                <ToolEventView key={ev.id} event={ev} badgeStyle={props.toolBadgeStyle} onAction={(aid) => props.onToolAction(ev, aid)} />
              ))}
            </Accordion>
          </div>
        )}

        {/* Markdown content */}
        {m.content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-background/70 prose-pre:border prose-pre:border-border/50 prose-code:text-primary prose-code:before:hidden prose-code:after:hidden">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
          </div>
        ) : (
          m.pending && <Loader2 className="w-4 h-4 animate-spin text-primary" />
        )}
      </div>

      {/* Action row under assistant message */}
      {!m.pending && m.content && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <button onClick={copy} className="inline-flex items-center gap-1 text-[11px] hover:text-foreground px-1.5 py-0.5 rounded">
            <Copy className="w-3 h-3" /> {copied ? "Copied" : "Copy"}
          </button>
          {props.isLastAssistant && (
            <button onClick={props.onRegenerate} className="inline-flex items-center gap-1 text-[11px] hover:text-foreground px-1.5 py-0.5 rounded">
              <RefreshCcw className="w-3 h-3" /> Regenerate
            </button>
          )}
          <ChatSpeakerButton text={m.content} className="ml-1" />
        </div>
      )}
    </div>
  );
}

function ToolEventView({ event, badgeStyle, onAction }: { event: ToolEvent; badgeStyle?: "uppercase-code"; onAction: (actionId: string) => void }) {
  const statusIcon =
    event.status === "running" ? <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" /> :
    event.status === "error"   ? <XCircle className="w-3.5 h-3.5 text-red-500" /> :
                                 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
  const codeLabel = `[${event.label.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "")}]`;
  return (
    <AccordionItem value={event.id} className="border border-border/40 rounded-lg px-2.5 bg-background/40">
      <AccordionTrigger className="py-1.5 hover:no-underline">
        <div className="flex items-center gap-2 text-[12px] font-medium text-left">
          {statusIcon}
          {badgeStyle === "uppercase-code" ? (
            <span className="font-mono text-[10.5px] tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-[#f5d4a1]/25 to-[#f4c2d7]/25 border border-[#f5d4a1]/40 text-amber-200">
              {codeLabel}
            </span>
          ) : (
            <span>{event.label}</span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-2">
        {(event.input !== undefined || event.output !== undefined) && (
          <pre className="text-[10.5px] bg-background/70 border border-border/40 rounded p-2 overflow-x-auto max-h-48">
            {JSON.stringify({ input: event.input, output: event.output }, null, 2)}
          </pre>
        )}
        {event.actions && event.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {event.actions.map((a) => (
              <Button
                key={a.id}
                size="sm"
                variant={a.kind === "apply" ? "default" : a.kind === "skip" ? "ghost" : "outline"}
                className="h-7 text-[11px]"
                onClick={() => onAction(a.id)}
              >
                {a.kind === "apply" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                {a.kind === "modify" && <Pencil className="w-3 h-3 mr-1" />}
                {a.kind === "skip" && <ChevronRight className="w-3 h-3 mr-1" />}
                {a.label}
              </Button>
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

type RadarDot = { id: string; x: number; y: number; status?: "ok" | "delay" | "cancel" | "weather"; label?: string };
type RadarData = { dots: RadarDot[]; weather?: { x: number; y: number; kind?: string }[] };

function RadarMicroMap({ endpoint, title, auraHsl }: { endpoint: string; title?: string; auraHsl: string }) {
  const [data, setData] = useState<RadarData | null>(null);
  useEffect(() => {
    let live = true;
    const load = async () => {
      const { data, error } = await replitCall<RadarData>(endpoint, undefined, { method: "GET" });
      if (live && !error && data?.dots) setData(data);
    };
    load();
    const t = setInterval(load, 30000);
    return () => { live = false; clearInterval(t); };
  }, [endpoint]);

  const statusColor = (s?: RadarDot["status"]) =>
    s === "delay" ? "#f59e0b" : s === "cancel" ? "#ef4444" : s === "weather" ? "#38bdf8" : "#84cc16";

  return (
    <div
      className="mt-3 relative h-28 rounded-lg border border-border/40 overflow-hidden bg-[#0a1628]/60"
      style={{ boxShadow: `inset 0 0 40px hsl(${auraHsl} / 0.15)` }}
    >
      <div className="absolute top-1.5 left-2 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/80 z-10">
        {title || "Radar"}
      </div>
      {/* radar sweep */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, hsl(${auraHsl} / 0.35) 0%, transparent 60%), repeating-radial-gradient(circle at 50% 50%, hsl(${auraHsl} / 0.25) 0 1px, transparent 1px 20px)`,
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-[140%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full origin-center pointer-events-none"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, hsl(${auraHsl} / 0.35) 30deg, transparent 60deg)`,
          animation: "radar-sweep 4s linear infinite",
        }}
      />
      {/* dots */}
      {data?.dots?.map((d) => (
        <div
          key={d.id}
          title={d.label}
          className="absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${Math.max(2, Math.min(98, d.x))}%`,
            top: `${Math.max(8, Math.min(92, d.y))}%`,
            background: statusColor(d.status),
            boxShadow: `0 0 8px ${statusColor(d.status)}`,
          }}
        />
      ))}
      {!data && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground/70">
          awaiting network feed…
        </div>
      )}
      <style>{`
        @keyframes radar-sweep { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
      `}</style>
    </div>
  );
}
