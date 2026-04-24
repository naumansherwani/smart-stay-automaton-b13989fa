import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  Sparkles, Send, Loader2, AlertTriangle, TrendingUp, Target, BarChart3,
  RefreshCw, Plus, Search, Pin, PinOff, Pencil, Trash2, Copy, Check,
  ImageIcon, X, Brain, MessageSquare, Mic, Volume2, Square, Zap,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ArcEngine from "./ArcEngine";

const QUICK = [
  "What should I focus on today?",
  "Should I raise pricing?",
  "Which plan is weak?",
  "Why is churn rising?",
  "Which enterprise lead is easiest to close?",
  "What can increase revenue fastest?",
];

type Attachment = { url: string; path: string; name: string };
type DbMsg = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments: Attachment[] | null;
  created_at: string;
};
type Conv = {
  id: string;
  title: string;
  is_pinned: boolean;
  last_message_at: string;
  message_count: number;
};
type Insights = { risk: string; opportunity: string; action: string; weekly: string };

export default function AIAdviser() {
  const { user } = useAuth();
  const [view, setView] = useState<"chat" | "autopilot">("chat");
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DbMsg[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deepReasoning, setDeepReasoning] = useState(false);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Founder settings: Autopilot, Weekly Report, Voice
  const [settings, setSettings] = useState<{
    autopilot_enabled: boolean;
    autopilot_level: string;
    weekly_report_enabled: boolean;
    voice_enabled: boolean;
  }>({ autopilot_enabled: false, autopilot_level: "conservative", weekly_report_enabled: false, voice_enabled: true });
  const [savingSettings, setSavingSettings] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("founder_settings")
      .select("autopilot_enabled,autopilot_level,weekly_report_enabled,voice_enabled")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) setSettings(data as any);
  }, [user]);
  useEffect(() => { loadSettings(); }, [loadSettings]);

  const updateSettings = async (patch: Partial<typeof settings>) => {
    if (!user) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    setSavingSettings(true);
    try {
      await supabase.from("founder_settings").upsert({ user_id: user.id, ...next }, { onConflict: "user_id" });
    } finally { setSavingSettings(false); }
  };

  // Voice command — Web Speech API → founder-adviser voice_intent → execute
  const startVoice = useCallback(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Voice not supported on this browser. Use Chrome/Edge."); return; }
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = navigator.language || "en-US";
    r.onstart = () => setListening(true);
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.onresult = async (ev: any) => {
      const text = Array.from(ev.results).map((res: any) => res[0].transcript).join(" ").trim();
      if (!text) return;
      // Try intent parse; on any failure, just put the text in the input box.
      try {
        const { data } = await supabase.functions.invoke("founder-adviser", { body: { action: "voice_intent", voiceText: text } });
        const v = data?.voice;
        if (v && v.intent && v.intent !== "chat") {
          // Send a structured prompt so the chat handles the action with full context
          send(`[VOICE COMMAND] ${text}\n(intent: ${v.intent}${v.target_email ? `, target: ${v.target_email}` : ""})`);
        } else {
          setInput(text);
        }
      } catch {
        setInput(text);
      }
    };
    recognitionRef.current = r;
    r.start();
  }, []);
  const stopVoice = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    setListening(false);
  }, []);

  // ---- Conversations list ----
  const loadConvs = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("founder_ai_conversations")
      .select("id,title,is_pinned,last_message_at,message_count")
      .eq("is_archived", false)
      .order("is_pinned", { ascending: false })
      .order("last_message_at", { ascending: false })
      .limit(200);
    setConvs((data as Conv[]) || []);
  }, [user]);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  // ---- Messages for active conversation ----
  const loadMessages = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("founder_ai_messages")
      .select("id,conversation_id,role,content,attachments,created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });
    setMessages((data as DbMsg[]) || []);
  }, []);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
    else setMessages([]);
  }, [activeId, loadMessages]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  // ---- Realtime: keep this conv in sync if it grows ----
  useEffect(() => {
    if (!activeId) return;
    const ch = supabase
      .channel(`founder-ai-${activeId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "founder_ai_messages",
        filter: `conversation_id=eq.${activeId}`,
      }, (payload) => {
        const m = payload.new as DbMsg;
        setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId]);

  // ---- Insights panel ----
  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const { data } = await supabase.functions.invoke("founder-adviser", { body: { mode: "insights" } });
      if (data?.insights) setInsights(data.insights);
    } catch (e) { console.error(e); }
    finally { setInsightsLoading(false); }
  }, []);
  useEffect(() => { loadInsights(); }, [loadInsights]);

  // ---- New / pin / rename / delete ----
  const newChat = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("founder_ai_conversations")
      .insert({ user_id: user.id, title: "New conversation" })
      .select("id,title,is_pinned,last_message_at,message_count")
      .single();
    if (!error && data) {
      setConvs((prev) => [data as Conv, ...prev]);
      setActiveId(data.id);
      setMessages([]);
    }
  };

  const togglePin = async (c: Conv) => {
    await supabase.from("founder_ai_conversations").update({ is_pinned: !c.is_pinned }).eq("id", c.id);
    loadConvs();
  };

  const startRename = (c: Conv) => { setRenamingId(c.id); setRenameVal(c.title); };
  const commitRename = async () => {
    if (!renamingId) return;
    const t = renameVal.trim() || "Untitled";
    await supabase.from("founder_ai_conversations").update({ title: t }).eq("id", renamingId);
    setRenamingId(null);
    loadConvs();
  };

  const deleteConv = async (id: string) => {
    if (!confirm("Delete this conversation permanently?")) return;
    await supabase.from("founder_ai_conversations").delete().eq("id", id);
    if (activeId === id) { setActiveId(null); setMessages([]); }
    loadConvs();
  };

  // ---- File upload ----
  const uploadFiles = async (files: FileList | File[]) => {
    if (!user) return;
    setUploading(true);
    const out: Attachment[] = [];
    try {
      for (const f of Array.from(files).slice(0, 4)) {
        if (!f.type.startsWith("image/")) continue;
        const path = `${user.id}/${Date.now()}-${f.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
        const { error: upErr } = await supabase.storage.from("founder-ai-uploads").upload(path, f, { upsert: false });
        if (upErr) { console.error(upErr); continue; }
        const { data: signed } = await supabase.storage.from("founder-ai-uploads").createSignedUrl(path, 60 * 60 * 24);
        if (signed?.signedUrl) out.push({ url: signed.signedUrl, path, name: f.name });
      }
      setAttachments((prev) => [...prev, ...out]);
    } finally { setUploading(false); }
  };

  // ---- Send message ----
  const send = async (override?: string) => {
    const q = (override ?? input).trim();
    if ((!q && attachments.length === 0) || loading || !user) return;

    let convId = activeId;
    if (!convId) {
      const { data, error } = await supabase
        .from("founder_ai_conversations")
        .insert({ user_id: user.id, title: "New conversation" })
        .select("id,title,is_pinned,last_message_at,message_count")
        .single();
      if (error || !data) return;
      convId = data.id;
      setConvs((prev) => [data as Conv, ...prev]);
      setActiveId(convId);
    }

    const localAttach = [...attachments];
    const localContent = q;

    // Persist user message
    const { data: userMsg } = await supabase.from("founder_ai_messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content: localContent,
      attachments: localAttach,
    }).select("id,conversation_id,role,content,attachments,created_at").single();

    if (userMsg) setMessages((prev) => [...prev, userMsg as DbMsg]);
    setInput("");
    setAttachments([]);
    setLoading(true);

    // Build full history for AI
    const { data: history } = await supabase
      .from("founder_ai_messages")
      .select("role,content,attachments")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true })
      .limit(60);

    const aiMessages = (history || []).map((m: any) => {
      const att: Attachment[] = m.attachments || [];
      if (att.length > 0 && m.role === "user") {
        return {
          role: m.role,
          content: [
            ...(m.content ? [{ type: "text", text: m.content }] : []),
            ...att.map((a) => ({ type: "image_url", image_url: { url: a.url } })),
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    try {
      const { data, error } = await supabase.functions.invoke("founder-adviser", {
        body: { messages: aiMessages, conversationId: convId, deepReasoning },
      });
      if (error) throw error;
      // Realtime will push the assistant message; reload as fallback
      await loadMessages(convId);
      // Auto-title on first exchange
      if ((messages.length + 1) <= 1) {
        try {
          const { data: t } = await supabase.functions.invoke("founder-adviser-title", { body: { firstMessage: localContent } });
          if (t?.title) {
            await supabase.from("founder_ai_conversations").update({ title: t.title }).eq("id", convId);
            loadConvs();
          }
        } catch { /* ignore */ }
      } else {
        loadConvs();
      }
    } catch (e: any) {
      console.error(e);
      await supabase.from("founder_ai_messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role: "assistant",
        content: "I could not reach the gateway right now. Try again in a moment.",
      });
      loadMessages(convId);
    } finally {
      setLoading(false);
    }
  };

  const filteredConvs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return convs;
    return convs.filter((c) => c.title.toLowerCase().includes(q));
  }, [convs, search]);

  const copyMsg = async (m: DbMsg) => {
    await navigator.clipboard.writeText(m.content);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 1200);
  };

  // ---- Drag & drop ----
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      {/* HEADER — single AI Co-Owner with Chat / Autopilot tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--fos-text)]">AI Adviser</h1>
            <p className="text-xs text-[var(--fos-muted)]">Chat + Autopilot · 15 languages · full backend access · writes emails for you</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1 p-1 rounded-lg bg-[var(--fos-card)] border border-[var(--fos-border)]">
          <button
            onClick={() => setView("chat")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${view === "chat" ? "bg-[var(--fos-accent)]/15 text-[var(--fos-accent)]" : "text-[var(--fos-muted)] hover:text-[var(--fos-text)]"}`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Chat
          </button>
          <button
            onClick={() => setView("autopilot")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${view === "autopilot" ? "bg-[var(--fos-accent)]/15 text-[var(--fos-accent)]" : "text-[var(--fos-muted)] hover:text-[var(--fos-text)]"}`}
          >
            <Zap className="w-3.5 h-3.5" /> Autopilot (ARC)
          </button>
        </div>
      </div>

      {view === "autopilot" ? (
        <ArcEngine />
      ) : (
      <>
      {/* Founder Settings strip — Autopilot / Weekly Report / Voice */}
      <div className="founder-card p-3 mb-3 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${settings.autopilot_enabled ? "bg-[var(--fos-success)]" : "bg-[var(--fos-muted)]/40"}`} />
          <span className="text-[var(--fos-text)] font-medium">Autopilot</span>
          <button
            onClick={() => updateSettings({ autopilot_enabled: !settings.autopilot_enabled })}
            disabled={savingSettings}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition ${
              settings.autopilot_enabled
                ? "border-[var(--fos-success)] text-[var(--fos-success)] bg-[var(--fos-success)]/10"
                : "border-[var(--fos-border)] text-[var(--fos-muted)] hover:text-[var(--fos-text)]"
            }`}
          >{settings.autopilot_enabled ? "ON" : "OFF"}</button>
          {settings.autopilot_enabled && (
            <select
              value={settings.autopilot_level}
              onChange={(e) => updateSettings({ autopilot_level: e.target.value })}
              className="bg-[var(--fos-bg)] border border-[var(--fos-border)] rounded-md px-2 py-1 text-[10px] text-[var(--fos-text)]"
            >
              <option value="conservative">Conservative</option>
              <option value="balanced">Balanced</option>
              <option value="aggressive">Aggressive</option>
            </select>
          )}
        </div>
        <div className="h-4 w-px bg-[var(--fos-border)]" />
        <div className="flex items-center gap-2">
          <span className="text-[var(--fos-text)] font-medium">Weekly Report (Sun)</span>
          <button
            onClick={() => updateSettings({ weekly_report_enabled: !settings.weekly_report_enabled })}
            disabled={savingSettings}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition ${
              settings.weekly_report_enabled
                ? "border-[var(--fos-accent)] text-[var(--fos-accent)] bg-[var(--fos-accent)]/10"
                : "border-[var(--fos-border)] text-[var(--fos-muted)] hover:text-[var(--fos-text)]"
            }`}
          >{settings.weekly_report_enabled ? "ON" : "OFF"}</button>
        </div>
        <div className="h-4 w-px bg-[var(--fos-border)]" />
        <div className="flex items-center gap-2">
          <span className="text-[var(--fos-text)] font-medium">Voice</span>
          <button
            onClick={() => updateSettings({ voice_enabled: !settings.voice_enabled })}
            disabled={savingSettings}
            className={`px-2 py-1 rounded-md text-[10px] font-semibold border transition ${
              settings.voice_enabled
                ? "border-[var(--fos-accent)] text-[var(--fos-accent)] bg-[var(--fos-accent)]/10"
                : "border-[var(--fos-border)] text-[var(--fos-muted)] hover:text-[var(--fos-text)]"
            }`}
          >{settings.voice_enabled ? "ON" : "OFF"}</button>
        </div>
        <span className="ml-auto text-[10px] text-[var(--fos-muted)]">No briefings unless you ask. AI works 24/7 silently.</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] gap-4 h-[calc(100vh-220px)]">
      {/* SIDEBAR — conversations */}
      <div className="founder-card flex flex-col overflow-hidden">
        <div className="p-3 border-b border-[var(--fos-border)] space-y-2">
          <button
            onClick={newChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--fos-accent)] text-white text-sm font-medium hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" /> New chat
          </button>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--fos-muted)]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chats"
              className="w-full pl-8 pr-2 py-1.5 text-xs rounded-md bg-[var(--fos-bg)] border border-[var(--fos-border)] text-[var(--fos-text)] placeholder:text-[var(--fos-muted)] focus:outline-none focus:border-[var(--fos-accent)]/50"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {filteredConvs.length === 0 && (
            <div className="text-center text-[var(--fos-muted)] text-xs py-8 px-2">
              No chats yet. Start a new one.
            </div>
          )}
          {filteredConvs.map((c) => (
            <div
              key={c.id}
              className={`group rounded-md text-xs transition ${
                activeId === c.id
                  ? "bg-[var(--fos-accent)]/15 text-[var(--fos-text)]"
                  : "text-[var(--fos-muted)] hover:bg-[var(--fos-bg)] hover:text-[var(--fos-text)]"
              }`}
            >
              {renamingId === c.id ? (
                <div className="flex items-center gap-1 p-1.5">
                  <input
                    autoFocus
                    value={renameVal}
                    onChange={(e) => setRenameVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
                    onBlur={commitRename}
                    className="flex-1 bg-[var(--fos-bg)] border border-[var(--fos-border)] rounded px-1.5 py-1 text-xs"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-1 p-1.5">
                  <button
                    onClick={() => setActiveId(c.id)}
                    className="flex-1 text-left flex items-center gap-1.5 min-w-0"
                  >
                    {c.is_pinned ? <Pin className="w-3 h-3 shrink-0" /> : <MessageSquare className="w-3 h-3 shrink-0 opacity-60" />}
                    <span className="truncate">{c.title}</span>
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
                    <button onClick={() => togglePin(c)} title={c.is_pinned ? "Unpin" : "Pin"} className="p-1 rounded hover:bg-[var(--fos-border)]">
                      {c.is_pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                    </button>
                    <button onClick={() => startRename(c)} title="Rename" className="p-1 rounded hover:bg-[var(--fos-border)]">
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button onClick={() => deleteConv(c.id)} title="Delete" className="p-1 rounded hover:bg-[var(--fos-border)] text-[var(--fos-danger)]">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN — chat */}
      <div
        className={`founder-card flex flex-col overflow-hidden relative ${dragOver ? "ring-2 ring-[var(--fos-accent)]" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
      >
        <div className="px-5 py-3 border-b border-[var(--fos-border)] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--fos-accent)]" />
          <h3 className="text-[var(--fos-text)] font-semibold text-sm">AI Adviser</h3>
          <span className="ml-2 text-[10px] text-[var(--fos-success)]">● Online</span>
          <button
            onClick={() => setDeepReasoning((v) => !v)}
            className={`ml-auto flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 rounded-md border transition ${
              deepReasoning
                ? "border-[var(--fos-accent)] text-[var(--fos-accent)] bg-[var(--fos-accent)]/10"
                : "border-[var(--fos-border)] text-[var(--fos-muted)] hover:text-[var(--fos-text)]"
            }`}
            title="Deep reasoning routes to GPT-5 instead of Gemini Flash"
          >
            <Brain className="w-3 h-3" /> Deep think {deepReasoning ? "on" : "off"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-[var(--fos-muted)] text-sm py-12 max-w-md mx-auto">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-[var(--fos-accent)]/60" />
              <p className="mb-2 text-[var(--fos-text)] font-medium">Your private founder strategist</p>
              <p>I have live context on revenue, churn, plans, leads, deals, refunds and country signals. Drop a screenshot anytime for visual analysis.</p>
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} group`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                m.role === "user"
                  ? "bg-[var(--fos-accent)] text-white"
                  : "bg-[var(--fos-bg)] border border-[var(--fos-border)] text-[var(--fos-text)]"
              }`}>
                {Array.isArray(m.attachments) && m.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {m.attachments.map((a, i) => (
                      <a key={i} href={a.url} target="_blank" rel="noreferrer" className="block">
                        <img src={a.url} alt={a.name} className="max-h-40 rounded-lg border border-white/10" />
                      </a>
                    ))}
                  </div>
                )}
                {m.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{m.content}</div>
                )}
                {m.role === "assistant" && (
                  <button
                    onClick={() => copyMsg(m)}
                    className="opacity-0 group-hover:opacity-100 mt-2 inline-flex items-center gap-1 text-[10px] text-[var(--fos-muted)] hover:text-[var(--fos-accent)] transition"
                  >
                    {copiedId === m.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedId === m.id ? "Copied" : "Copy"}
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[var(--fos-bg)] border border-[var(--fos-border)] rounded-2xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--fos-accent)]" />
                <span className="text-xs text-[var(--fos-muted)]">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-[var(--fos-border)] p-3">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((a, i) => (
                <div key={i} className="relative group">
                  <img src={a.url} alt={a.name} className="h-16 w-16 object-cover rounded-md border border-[var(--fos-border)]" />
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1.5 -right-1.5 bg-[var(--fos-danger)] text-white rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {uploading && <Loader2 className="w-4 h-4 animate-spin text-[var(--fos-accent)] self-center" />}
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => e.target.files && uploadFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="p-2.5 rounded-lg border border-[var(--fos-border)] text-[var(--fos-muted)] hover:text-[var(--fos-accent)] hover:border-[var(--fos-accent)]/50 transition"
              title="Attach screenshot or image"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            {settings.voice_enabled && (
              <button
                type="button"
                onClick={listening ? stopVoice : startVoice}
                className={`p-2.5 rounded-lg border transition ${
                  listening
                    ? "border-[var(--fos-danger)] text-[var(--fos-danger)] bg-[var(--fos-danger)]/10 animate-pulse"
                    : "border-[var(--fos-border)] text-[var(--fos-muted)] hover:text-[var(--fos-accent)] hover:border-[var(--fos-accent)]/50"
                }`}
                title={listening ? "Stop listening" : "Voice command"}
              >
                {listening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder="Ask anything or drop a screenshot…"
              rows={1}
              className="flex-1 resize-none bg-[var(--fos-bg)] border border-[var(--fos-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--fos-text)] placeholder:text-[var(--fos-muted)] focus:outline-none focus:border-[var(--fos-accent)]/50 max-h-32"
            />
            <button
              type="submit"
              disabled={loading || (!input.trim() && attachments.length === 0)}
              className="p-2.5 rounded-lg bg-[var(--fos-accent)] text-white disabled:opacity-50 hover:opacity-90 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT — insights + quick prompts */}
      <div className="space-y-4 overflow-y-auto">
        <div className="founder-card p-4">
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
        <div className="founder-card p-4">
          <h4 className="text-[var(--fos-text)] font-semibold text-xs uppercase tracking-wider mb-3">Suggested prompts</h4>
          <div className="space-y-1.5">
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={loading}
                className="w-full text-left text-xs text-[var(--fos-muted)] hover:text-[var(--fos-text)] hover:bg-[var(--fos-bg)] p-2 rounded-lg border border-transparent hover:border-[var(--fos-border)] transition disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
      </div>
      </>
      )}
    </div>
  );
}
