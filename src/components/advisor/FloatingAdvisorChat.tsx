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
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Send, Minus, Maximize2, Minimize2, X, Sparkles, Loader2, Square, RefreshCcw,
  Copy, Pencil, Paperclip, Mic, MicOff, FileText, Image as ImageIcon, FileSpreadsheet,
  AlertCircle, CheckCircle2, XCircle, ChevronRight, ChevronDown, TrendingUp, DollarSign,
  MessageSquare, Star, AlertTriangle, LineChart, Gift, Wrench, Crown,
  Heart, Activity, Pill, ShieldCheck, Shield, FlaskConical, Watch, MessageCircle,
  Mail, CalendarClock, Dna, Plane, Globe, Ticket, Radar, CloudSun, Timer, Fuel,
  Map as MapIcon, Truck, PackageCheck, Warehouse, User, Navigation, Database,
  Car, Gauge, Zap, CreditCard, ChevronLeft, Search, PanelLeft,
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
  Heart, Activity, Pill, ShieldCheck, Shield, FlaskConical, Watch, MessageCircle, Mail, CalendarClock, Dna,
  Plane, Globe, Ticket, Radar, CloudSun, Timer, Fuel,
  Map: MapIcon, Truck, PackageCheck, Warehouse, User, Navigation, Database,
  Car, Gauge, Zap, CreditCard,
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
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  // User-resizable width (persisted). Active in non-maximized state.
  const [userWidth, setUserWidth] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const v = localStorage.getItem("advisor.chat.width");
    return v ? Math.max(360, Math.min(window.innerWidth - 40, Number(v))) : null;
  });
  const [userHeight, setUserHeight] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const v = localStorage.getItem("advisor.chat.height");
    return v ? Math.max(420, Math.min(window.innerHeight - 40, Number(v))) : null;
  });
  const resizingRef = useRef<null | { startX: number; startY: number; startW: number; startH: number; mode: "w" | "h" | "wh" }>(null);

  const onResizeStart = (mode: "w" | "h" | "wh") => (e: React.MouseEvent) => {
    e.preventDefault();
    const startW = userWidth ?? Math.min(440, window.innerWidth - 40);
    const startH = userHeight ?? Math.min(680, window.innerHeight - 40);
    resizingRef.current = { startX: e.clientX, startY: e.clientY, startW, startH, mode };
    const onMove = (ev: MouseEvent) => {
      const r = resizingRef.current;
      if (!r) return;
      if (r.mode === "w" || r.mode === "wh") {
        // Dragging left edge → width grows when cursor moves LEFT
        const next = Math.max(360, Math.min(window.innerWidth - 40, r.startW + (r.startX - ev.clientX)));
        setUserWidth(next);
      }
      if (r.mode === "h" || r.mode === "wh") {
        const next = Math.max(420, Math.min(window.innerHeight - 40, r.startH + (r.startY - ev.clientY)));
        setUserHeight(next);
      }
    };
    const onUp = () => {
      const r = resizingRef.current;
      resizingRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      if (r) {
        if (r.mode !== "h") localStorage.setItem("advisor.chat.width", String(userWidthRef.current ?? r.startW));
        if (r.mode !== "w") localStorage.setItem("advisor.chat.height", String(userHeightRef.current ?? r.startH));
      }
    };
    document.body.style.cursor = mode === "w" ? "ew-resize" : mode === "h" ? "ns-resize" : "nwse-resize";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Keep latest values in refs so the mouseup handler can persist them.
  const userWidthRef = useRef<number | null>(userWidth);
  const userHeightRef = useRef<number | null>(userHeight);
  useEffect(() => { userWidthRef.current = userWidth; }, [userWidth]);
  useEffect(() => { userHeightRef.current = userHeight; }, [userHeight]);

  if (p.windowState === "closed") return null;

  if (p.windowState === "minimized") {
    const isOrb = p.advisor.minimizedOrb === "mint-breath" || p.advisor.minimizedOrb === "lime-breath";
    const orbKind = p.advisor.minimizedOrb;
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
            className={cn(
              "relative w-8 h-8 rounded-full",
              orbKind === "mint-breath" && "advisor-mint-orb",
              orbKind === "lime-breath" && "advisor-lime-orb"
            )}
            style={orbKind === "mint-breath" ? {
              background: "radial-gradient(circle at 35% 30%, #ecfdf5, #6ee7b7 55%, #059669 100%)",
              boxShadow: "0 0 18px 4px rgba(110,231,183,0.55), inset 0 0 8px rgba(255,255,255,0.6)",
            } : orbKind === "lime-breath" ? {
              background: "radial-gradient(circle at 35% 30%, #ecfccb, #a3e635 55%, #65a30d 100%)",
              boxShadow: "0 0 18px 4px rgba(163,230,53,0.55), inset 0 0 8px rgba(255,255,255,0.6)",
            } : undefined}
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
          @keyframes advisorLimeBreath {
            0%, 100% { transform: scale(1);    box-shadow: 0 0 14px 3px rgba(163,230,53,0.45), inset 0 0 8px rgba(255,255,255,0.55); }
            50%      { transform: scale(1.08); box-shadow: 0 0 26px 6px rgba(163,230,53,0.75), inset 0 0 10px rgba(255,255,255,0.7); }
          }
          .advisor-lime-orb { animation: advisorLimeBreath 4s ease-in-out infinite; }
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
        style={{
          ...auraStyle,
          ...(p.windowState !== "maximized" && userWidth ? { width: userWidth } : {}),
          ...(p.windowState !== "maximized" && userHeight ? { height: userHeight } : {}),
        }}
        className={cn(
          "pointer-events-auto absolute bg-card/95 backdrop-blur-2xl border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden",
          !resizingRef.current && "transition-all duration-200",
          maximized
            ? "top-4 bottom-4 right-4 md:top-6 md:bottom-6 md:right-6 w-[min(900px,calc(100vw-5rem))]"
            : "bottom-5 right-5 w-[min(440px,calc(100vw-2.5rem))] h-[min(680px,calc(100vh-2.5rem))]",
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
        {/* Resize handles — only in non-maximized state */}
        {!maximized && (
          <>
            {/* Left edge: horizontal resize */}
            <div
              onMouseDown={onResizeStart("w")}
              title="Drag to resize width"
              className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize z-20 hover:bg-primary/15"
            />
            {/* Top edge: vertical resize */}
            <div
              onMouseDown={onResizeStart("h")}
              title="Drag to resize height"
              className="absolute top-0 left-1.5 right-1.5 h-1.5 cursor-ns-resize z-20 hover:bg-primary/20"
            />
            {/* Top-left corner: both */}
            <div
              onMouseDown={onResizeStart("wh")}
              title="Drag to resize"
              className="absolute top-0 left-0 w-3 h-3 cursor-nwse-resize z-30 hover:bg-primary/30 rounded-tl-2xl"
            />
          </>
        )}
        {/* Header */}
        <div className={cn("relative border-b border-border/50 px-4 py-3 bg-gradient-to-r", p.advisor.accent)}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <button onClick={p.onClose} title="Close" className="w-3 h-3 rounded-full bg-red-500 hover:brightness-110" />
              <button onClick={p.onMinimize} title="Minimize" className="w-3 h-3 rounded-full bg-amber-400 hover:brightness-110" />
              <button onClick={p.onMaximize} title={maximized ? "Restore" : "Maximize"} className="w-3 h-3 rounded-full bg-emerald-500 hover:brightness-110" />
            </div>
            <div className="flex items-center gap-3 ml-2 min-w-0 flex-1">
              <UserHalo
                size={36}
                industry={p.industry}
                pulse={p.sending ? "streaming" : "idle"}
              />
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

          {/* Collapsible utility panel: channels, badges, radar, sherlock line */}
          <AdvisorUtilityPanel
            industry={p.industry}
            advisor={p.advisor}
            sending={p.sending}
            sherlock={p.sherlock}
          />
        </div>

        {/* Body: Sidebar + Chat column */}
        <div className="flex-1 flex min-h-0">
          <QuickActionsSidebar
            industry={p.industry}
            advisor={p.advisor}
            onPick={(prompt) => {
              p.onUseStarter(prompt);
              // Focus composer after inserting
              requestAnimationFrame(() => composerRef.current?.focus());
            }}
          />
          <div className="flex-1 flex flex-col min-w-0">
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

        {/* Resolution Pulse (SLA timeline) */}
        {p.advisor.resolutionPulse && (
          <ResolutionPulse sending={p.sending} sherlock={p.sherlock} />
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
              ref={composerRef}
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

// ===================== Quick Actions Sidebar =====================
// Engine-level. Reads from advisor.toolPanels (single source). Groups by
// optional `category`. Default collapsed icon-rail (56px). Manual chevron
// toggle only — no hover auto-expand. Favorites + Recents per industry.
// Click = insert into composer (parent focuses textarea).
function QuickActionsSidebar({
  industry,
  advisor,
  onPick,
}: {
  industry: string;
  advisor: ReturnType<typeof getAdvisor>;
  onPick: (prompt: string) => void;
}) {
  const isMobile = useIsMobile();
  const expandKey = `advisor-sidebar-expanded-${industry}`;
  const favKey = `advisor-sidebar-fav-${industry}`;
  const recentKey = `advisor-sidebar-recent-${industry}`;

  const [expanded, setExpanded] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(expandKey) === "1";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(favKey) || "[]"); } catch { return []; }
  });
  const [recents, setRecents] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(recentKey) || "[]"); } catch { return []; }
  });
  const [query, setQuery] = useState("");

  // Reset state when industry changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    setExpanded(localStorage.getItem(expandKey) === "1");
    try { setFavorites(JSON.parse(localStorage.getItem(favKey) || "[]")); } catch { setFavorites([]); }
    try { setRecents(JSON.parse(localStorage.getItem(recentKey) || "[]")); } catch { setRecents([]); }
    setMobileOpen(false);
    setQuery("");
  }, [industry, expandKey, favKey, recentKey]);

  const toggle = () => {
    setExpanded((v) => {
      const next = !v;
      try { localStorage.setItem(expandKey, next ? "1" : "0"); } catch {}
      return next;
    });
  };

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(favKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handlePick = (panel: ToolPanel) => {
    onPick(panel.prompt);
    setRecents((prev) => {
      const next = [panel.id, ...prev.filter((x) => x !== panel.id)].slice(0, 5);
      try { localStorage.setItem(recentKey, JSON.stringify(next)); } catch {}
      return next;
    });
    if (isMobile) setMobileOpen(false);
  };

  const panels = advisor.toolPanels;
  if (!panels || panels.length === 0) return null;

  // Build groups
  const byId = new Map(panels.map((p) => [p.id, p] as const));
  const filtered = query.trim()
    ? panels.filter((p) => (p.label + " " + p.prompt + " " + (p.category || ""))
        .toLowerCase().includes(query.trim().toLowerCase()))
    : panels;

  const groups = new Map<string, ToolPanel[]>();
  for (const p of filtered) {
    const cat = p.category || "Quick Actions";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat)!.push(p);
  }

  const favItems = favorites.map((id) => byId.get(id)).filter(Boolean) as ToolPanel[];
  const recentItems = recents.map((id) => byId.get(id)).filter(Boolean) as ToolPanel[];

  const auraGlow = `hsl(${advisor.auraHsl})`;

  // Mobile: render as drawer overlay + slim trigger rail
  if (isMobile) {
    return (
      <>
        <div className="w-10 shrink-0 border-r border-border/40 bg-card/60 backdrop-blur-xl flex flex-col items-center pt-2 gap-1">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-primary/15 text-muted-foreground hover:text-foreground transition"
            title="Open quick actions"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        </div>
        {mobileOpen && (
          <div className="fixed inset-0 z-[110] flex" onClick={() => setMobileOpen(false)}>
            <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative w-[80%] max-w-[280px] h-full bg-card/95 backdrop-blur-2xl border-r border-border/60 flex flex-col animate-in slide-in-from-left duration-200"
            >
              <SidebarContent
                expanded={true}
                onToggle={() => setMobileOpen(false)}
                advisor={advisor}
                groups={groups}
                favItems={favItems}
                recentItems={recentItems}
                favorites={favorites}
                onToggleFav={toggleFav}
                onPick={handlePick}
                query={query}
                setQuery={setQuery}
                auraGlow={auraGlow}
                isMobile
              />
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className={cn(
        "shrink-0 border-r border-border/40 bg-card/60 backdrop-blur-xl flex flex-col transition-[width] duration-200",
        expanded ? "w-[240px]" : "w-[56px]",
      )}
    >
      <SidebarContent
        expanded={expanded}
        onToggle={toggle}
        advisor={advisor}
        groups={groups}
        favItems={favItems}
        recentItems={recentItems}
        favorites={favorites}
        onToggleFav={toggleFav}
        onPick={handlePick}
        query={query}
        setQuery={setQuery}
        auraGlow={auraGlow}
      />
    </div>
  );
}

function SidebarContent({
  expanded,
  onToggle,
  advisor,
  groups,
  favItems,
  recentItems,
  favorites,
  onToggleFav,
  onPick,
  query,
  setQuery,
  auraGlow,
  isMobile = false,
}: {
  expanded: boolean;
  onToggle: () => void;
  advisor: ReturnType<typeof getAdvisor>;
  groups: Map<string, ToolPanel[]>;
  favItems: ToolPanel[];
  recentItems: ToolPanel[];
  favorites: string[];
  onToggleFav: (id: string) => void;
  onPick: (p: ToolPanel) => void;
  query: string;
  setQuery: (v: string) => void;
  auraGlow: string;
  isMobile?: boolean;
}) {
  return (
    <>
      {/* Header: toggle */}
      <div className={cn(
        "flex items-center border-b border-border/40 px-2 py-2 shrink-0",
        expanded ? "justify-between" : "justify-center",
      )}>
        {expanded && (
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground pl-1">
            Actions
          </span>
        )}
        <button
          onClick={onToggle}
          title={isMobile ? "Close" : expanded ? "Collapse sidebar" : "Expand sidebar"}
          className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-primary/15 text-muted-foreground hover:text-foreground transition"
        >
          {isMobile ? <X className="w-4 h-4" /> : expanded ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Search (only when expanded) */}
      {expanded && (
        <div className="px-2 py-2 border-b border-border/40 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search actions…"
              className="w-full h-8 pl-7 pr-2 rounded-md bg-background/60 border border-border/50 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto py-2 px-1.5">
        {/* Favorites */}
        {favItems.length > 0 && (
          <SidebarGroup label="Starred" expanded={expanded}>
            {favItems.map((p) => (
              <SidebarItem
                key={"fav-" + p.id}
                panel={p}
                expanded={expanded}
                isFav={favorites.includes(p.id)}
                onToggleFav={() => onToggleFav(p.id)}
                onPick={() => onPick(p)}
                auraGlow={auraGlow}
              />
            ))}
          </SidebarGroup>
        )}

        {/* Recents */}
        {recentItems.length > 0 && (
          <SidebarGroup label="Recent" expanded={expanded}>
            {recentItems.map((p) => (
              <SidebarItem
                key={"recent-" + p.id}
                panel={p}
                expanded={expanded}
                isFav={favorites.includes(p.id)}
                onToggleFav={() => onToggleFav(p.id)}
                onPick={() => onPick(p)}
                auraGlow={auraGlow}
              />
            ))}
          </SidebarGroup>
        )}

        {/* Categories */}
        {Array.from(groups.entries()).map(([cat, items]) => (
          <SidebarGroup key={cat} label={cat} expanded={expanded}>
            {items.map((p) => (
              <SidebarItem
                key={p.id}
                panel={p}
                expanded={expanded}
                isFav={favorites.includes(p.id)}
                onToggleFav={() => onToggleFav(p.id)}
                onPick={() => onPick(p)}
                auraGlow={auraGlow}
              />
            ))}
          </SidebarGroup>
        ))}
      </div>
    </>
  );
}

function SidebarGroup({ label, expanded, children }: { label: string; expanded: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      {expanded && (
        <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70 px-2 pt-1.5 pb-1">
          {label}
        </div>
      )}
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

function SidebarItem({
  panel,
  expanded,
  isFav,
  onToggleFav,
  onPick,
  auraGlow,
}: {
  panel: ToolPanel;
  expanded: boolean;
  isFav: boolean;
  onToggleFav: () => void;
  onPick: () => void;
  auraGlow: string;
}) {
  const Icon = ICON_MAP[panel.icon] || Wrench;
  return (
    <div className="group/sb relative flex items-center">
      <button
        onClick={onPick}
        title={expanded ? panel.prompt : panel.label}
        className={cn(
          "flex-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition",
          "hover:bg-primary/10 hover:shadow-[0_0_0_1px_var(--aura)] focus:outline-none focus:ring-1 focus:ring-primary/40",
          !expanded && "justify-center px-0",
        )}
        style={{ ['--aura' as never]: auraGlow }}
      >
        <Icon className="w-4 h-4 text-primary shrink-0" />
        {expanded && (
          <span className="text-[11.5px] font-medium truncate">{panel.label}</span>
        )}
      </button>
      {expanded && (
        <button
          onClick={onToggleFav}
          title={isFav ? "Unstar" : "Star"}
          className="opacity-0 group-hover/sb:opacity-100 focus:opacity-100 w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-amber-400 transition"
        >
          {isFav ? <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> : <Star className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}

function AdvisorUtilityPanel({
  industry,
  advisor,
  sending,
  sherlock,
}: {
  industry: string;
  advisor: ReturnType<typeof getAdvisor>;
  sending: boolean;
  sherlock: SherlockState;
}) {
  const storageKey = `advisor-utility-panel-${industry}`;
  const [expanded, setExpanded] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKey) === "1";
  });
  useEffect(() => {
    try { localStorage.setItem(storageKey, expanded ? "1" : "0"); } catch {}
  }, [expanded, storageKey]);

  const hasChannels = advisor.channels.length > 0;
  const hasBadges = advisor.metricBadges.length > 0;
  const hasHealth = !!(advisor.ekgPulse || advisor.trustScore);
  const hasRadar = !!advisor.radar;
  const hasAny = hasChannels || hasBadges || hasHealth || hasRadar;

  // Always render Sherlock line outside the collapse so it stays visible.
  // If there's nothing else, just render the line with no toggle.
  if (!hasAny) {
    return <SherlockLine state={sherlock} shieldGlow={advisor.sherlockShieldGlow} />;
  }

  const previewChips = advisor.channels.slice(0, 3);
  const remaining =
    Math.max(0, advisor.channels.length - previewChips.length) +
    advisor.metricBadges.length +
    (hasRadar ? 1 : 0);

  return (
    <div className="mt-3">
      {/* Toggle row: compact preview + chevron */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse utility panel" : "Expand utility panel"}
          className="inline-flex items-center justify-center w-6 h-6 rounded-md text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors shrink-0"
        >
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        {!expanded && (
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {previewChips.map((c) => (
              <span
                key={c.id}
                className="text-[10px] text-muted-foreground/90 truncate max-w-[90px]"
                title={c.label}
              >
                {c.label}
              </span>
            )).reduce<React.ReactNode[]>((acc, node, i) => {
              if (i > 0) acc.push(<span key={`dot-${i}`} className="text-[10px] text-muted-foreground/40">•</span>);
              acc.push(node);
              return acc;
            }, [])}
            {remaining > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-foreground/5 border border-border/40 text-[10px] text-muted-foreground font-medium">
                +{remaining}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded region */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-out overflow-hidden",
          expanded ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden space-y-3">
          {(hasChannels || hasBadges) && (
            <div className="flex flex-wrap items-center gap-2">
              {advisor.channels.map((c) => <ChannelChipView key={c.id} chip={c} />)}
              {advisor.metricBadges.map((b) => <MetricBadgeView key={b.id} badge={b} />)}
            </div>
          )}

          {hasHealth && (
            <div className="flex items-center gap-3">
              {advisor.ekgPulse && <EkgPulse active={sending} />}
              {advisor.trustScore && (
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#a7f3d0]/20 to-[#ffffff]/10 border border-[#6ee7b7]/30 text-[11px]">
                  <Heart className="w-3 h-3 text-emerald-400" />
                  <span className="text-muted-foreground">{advisor.trustScore.label}:</span>
                  <span className="font-bold text-foreground">{advisor.trustScore.value}</span>
                  {advisor.trustScore.sub && (
                    <span className="text-muted-foreground/80 hidden sm:inline">· {advisor.trustScore.sub}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {hasRadar && advisor.radar && (
            <RadarMicroMap endpoint={advisor.radar.endpoint} title={advisor.radar.title} auraHsl={advisor.auraHsl} />
          )}
        </div>
      </div>

      {/* Sherlock line always visible */}
      <div className="mt-2">
        <SherlockLine state={sherlock} shieldGlow={advisor.sherlockShieldGlow} />
      </div>
    </div>
  );
}

function SherlockLine({ state, shieldGlow }: { state: SherlockState; shieldGlow?: boolean }) {
  const palette: Record<SherlockState, { color: string; label: string }> = {
    idle:          { color: "text-muted-foreground",          label: "Sherlock standby" },
    watching:      { color: "text-muted-foreground/80",       label: "Sherlock is watching quietly" },
    investigating: { color: "text-amber-400",                 label: "Sherlock is investigating an anomaly…" },
    alert:         { color: "text-red-500",                   label: "Sherlock spotted a critical issue" },
    resolved:      { color: "text-emerald-500",               label: "Sherlock resolved a background task" },
  };
  const p = palette[state];
  const active = shieldGlow && (state === "investigating" || state === "alert" || state === "watching");
  return (
    <div className={cn("mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em]", p.color)}>
      {shieldGlow ? (
        <Shield
          className={cn("w-3 h-3", active && "text-emerald-400 drop-shadow-[0_0_6px_rgba(110,231,183,0.9)] animate-pulse")}
        />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      )}
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
        {/* Custom widget renderers (industry-specific) — data-driven via Replit SSE */}
        {event.widget?.type === "dna_helix" && <DnaHelixWidget />}
        {event.widget?.type === "risk_gauge" && (
          <RiskGaugeWidget value={event.widget.value} label={event.widget.label} />
        )}
        {event.widget?.type === "insurance_pulse" && (
          <InsurancePulseWidget state={event.widget.state} note={event.widget.note} />
        )}
        {event.widget?.type === "pharmacy_options" && (
          <PharmacyOptionsWidget options={event.widget.options} />
        )}
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

// ===================== Healthcare cockpit components =====================

function EkgPulse({ active }: { active: boolean }) {
  const dur = active ? "1.2s" : "2.6s";
  return (
    <div className="flex-1 min-w-0 h-8 relative overflow-hidden rounded-md bg-gradient-to-r from-emerald-500/5 via-emerald-500/10 to-transparent border border-emerald-500/20">
      <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="ekgGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0" />
            <stop offset="50%" stopColor="#34d399" stopOpacity="1" />
            <stop offset="100%" stopColor="#6ee7b7" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 20 L40 20 L48 20 L52 8 L58 32 L64 14 L70 26 L76 20 L120 20 L128 20 L132 4 L138 36 L144 20 L200 20"
          fill="none"
          stroke="url(#ekgGrad)"
          strokeWidth="1.6"
          style={{
            filter: "drop-shadow(0 0 4px rgba(110,231,183,0.7))",
            strokeDasharray: 400,
            animation: `ekgSweep ${dur} linear infinite`,
          }}
        />
      </svg>
      <style>{`
        @keyframes ekgSweep { 0% { stroke-dashoffset: 400; } 100% { stroke-dashoffset: 0; } }
      `}</style>
    </div>
  );
}

function ResolutionPulse({ sending, sherlock }: { sending: boolean; sherlock: SherlockState }) {
  // Stage derived from streaming time + sherlock state
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!sending) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [sending]);

  const stages = [
    { id: "analyzing", label: "AI Advisor Analyzing",   color: "bg-emerald-500" },
    { id: "audit",     label: "Deep Audit by Sherlock", color: "bg-amber-400" },
    { id: "finalize",  label: "Finalizing Resolution",  color: "bg-red-500" },
    { id: "resolved",  label: "Resolved",               color: "bg-emerald-500" },
    { id: "escalated", label: "Escalated to Sherlock",  color: "bg-red-500" },
  ];

  let activeId = "resolved";
  if (sherlock === "alert") activeId = "escalated";
  else if (sending) {
    if (elapsed < 60) activeId = "analyzing";
    else if (elapsed < 100) activeId = "audit";
    else activeId = "finalize";
  } else if (sherlock === "resolved") activeId = "resolved";

  return (
    <div className="border-t border-border/40 px-3 py-1.5 bg-background/30 flex items-center gap-1.5 overflow-x-auto">
      {stages.map((s) => {
        const isActive = s.id === activeId;
        return (
          <div
            key={s.id}
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] whitespace-nowrap border",
              isActive ? "border-foreground/30 bg-card/70" : "border-border/40 bg-background/40 opacity-50",
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", s.color, isActive && "animate-pulse")} />
            <span className={isActive ? "text-foreground font-medium" : "text-muted-foreground"}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function DnaHelixWidget() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-emerald-500/20">
      <div className="relative w-10 h-10">
        <Dna className="w-10 h-10 text-emerald-400" style={{ animation: "helixSpin 2.4s linear infinite", filter: "drop-shadow(0 0 6px rgba(110,231,183,0.6))" }} />
      </div>
      <div className="text-[11px] text-muted-foreground">Bio-scanner running — analysing patient record…</div>
      <style>{`@keyframes helixSpin { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }`}</style>
    </div>
  );
}

function RiskGaugeWidget({ value, label }: { value: number; label?: string }) {
  const v = Math.max(0, Math.min(100, value));
  const color = v < 33 ? "#10b981" : v < 66 ? "#f59e0b" : "#ef4444";
  const C = 2 * Math.PI * 28;
  const off = C - (v / 100) * C;
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/40">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="28" stroke="hsl(var(--border))" strokeWidth="6" fill="none" />
        <circle
          cx="36" cy="36" r="28" stroke={color} strokeWidth="6" fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={off}
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dashoffset 0.6s ease", filter: `drop-shadow(0 0 4px ${color}aa)` }}
        />
        <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="hsl(var(--foreground))">{v}</text>
      </svg>
      <div>
        <div className="text-[11px] text-muted-foreground">{label || "Risk Score"}</div>
        <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color }}>
          {v < 33 ? "Low" : v < 66 ? "Moderate" : "High"}
        </div>
      </div>
    </div>
  );
}

function InsurancePulseWidget({ state, note }: { state: "pending" | "approved" | "denied" | "financing"; note?: string }) {
  const cfg = {
    pending:   { color: "text-amber-400",    bg: "border-amber-400/40 bg-amber-400/10",    label: "Pre-authorization in progress…", pulse: true },
    approved:  { color: "text-emerald-500",  bg: "border-emerald-500/40 bg-emerald-500/10", label: "Approved",                       pulse: false },
    denied:    { color: "text-red-500",      bg: "border-red-500/40 bg-red-500/10",         label: "Denied",                         pulse: false },
    financing: { color: "text-sky-400",      bg: "border-sky-400/40 bg-sky-400/10",         label: "Financing options available",    pulse: false },
  }[state];
  return (
    <div className={cn("flex items-center gap-2.5 p-2.5 rounded-lg border", cfg.bg)}>
      <ShieldCheck className={cn("w-4 h-4", cfg.color, cfg.pulse && "animate-pulse")} />
      <div className="flex-1 min-w-0">
        <div className={cn("text-[11px] font-semibold uppercase tracking-wider", cfg.color)}>{cfg.label}</div>
        {note && <div className="text-[10.5px] text-muted-foreground truncate">{note}</div>}
      </div>
    </div>
  );
}

function PharmacyOptionsWidget({ options }: { options: Array<{ kind: "brand" | "generic" | "covered"; name: string; price?: string; note?: string }> }) {
  const kindLabel = { brand: "Brand", generic: "Generic", covered: "Insurance-covered" };
  const kindColor = { brand: "text-violet-400", generic: "text-sky-400", covered: "text-emerald-400" };
  return (
    <div className="grid gap-1.5 sm:grid-cols-3">
      {options.map((o, i) => (
        <div key={i} className="p-2 rounded-lg bg-background/50 border border-border/40">
          <div className={cn("text-[9px] uppercase tracking-wider font-bold", kindColor[o.kind])}>{kindLabel[o.kind]}</div>
          <div className="text-[12px] font-semibold flex items-center gap-1.5"><Pill className="w-3 h-3 text-emerald-400" />{o.name}</div>
          {o.price && <div className="text-[10px] text-muted-foreground">{o.price}</div>}
          {o.note && <div className="text-[10px] text-muted-foreground/80">{o.note}</div>}
        </div>
      ))}
    </div>
  );
}
