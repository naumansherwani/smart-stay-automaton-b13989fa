import { useEffect, useRef, useState, useCallback } from "react";
import {
  Crown, Send, X, Minus, Square, Mic, Paperclip, PanelLeftClose, PanelLeft,
  MessageSquare, Users, FileText, Brain, BarChart3, Bell, Calendar, Shield,
  Wallet, Sparkles, Zap, Search, Settings as SettingsIcon, BookOpen, Bot,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import "./jimmy-john.css";

const CHAIRMAN_EMAIL = "naumansherwani@hostflowai.net";
const STATE_KEY = "jj-state-v1";
const POS_KEY = "jj-pos-v1";
const SIZE_KEY = "jj-size-v1";
const COLLAPSE_KEY = "jj-side-collapsed-v1";
const MODULE_KEY = "jj-module-v1";

type ViewState = "closed" | "open" | "minimized" | "maximized";
type Msg = { role: "user" | "ceo"; content: string; badges?: string[] };
type ModuleId =
  | "command" | "agents" | "files" | "voice" | "think" | "memory"
  | "pulse" | "calendar" | "comms" | "finance" | "security" | "knowledge";

const STARTER_BADGES = ["CEO_CORE_ONLINE", "SHERLOCK_AUDIT_CLEAR", "EMPIRE_WATCH_24/7"];

const MODULES: { id: ModuleId; label: string; icon: typeof Crown; pill?: string; group: "core" | "ops" | "intel" }[] = [
  { id: "command",   label: "Command",        icon: MessageSquare, group: "core" },
  { id: "agents",    label: "Agents Roster",  icon: Users,         pill: "9", group: "core" },
  { id: "voice",     label: "Voice (11Labs)", icon: Mic,           group: "core" },
  { id: "think",     label: "Think Mode",     icon: Brain,         group: "core" },

  { id: "files",     label: "Files & Docs",   icon: FileText,      group: "ops" },
  { id: "comms",     label: "Comms Hub",      icon: Bell,          group: "ops" },
  { id: "calendar",  label: "Calendar",       icon: Calendar,      group: "ops" },
  { id: "finance",   label: "Finance",        icon: Wallet,        group: "ops" },

  { id: "pulse",     label: "Empire Pulse",   icon: BarChart3,     group: "intel" },
  { id: "memory",    label: "Memory Vault",   icon: BookOpen,      group: "intel" },
  { id: "knowledge", label: "Knowledge",      icon: Search,        group: "intel" },
  { id: "security",  label: "Security",       icon: Shield,        group: "intel" },
];

const AGENTS = [
  { name: "Sherlock",   role: "Deputy CEO · Investigations & Audit",     status: "active",  pill: "DEPUTY" },
  { name: "Hospitality Advisor", role: "Hotels & Tours operations",        status: "active" },
  { name: "Airlines Advisor",    role: "Flight ops & yield",                status: "active" },
  { name: "Car Rental Advisor",  role: "Fleet utilization & pricing",       status: "active" },
  { name: "Healthcare Advisor",  role: "Patient flow & compliance",         status: "active" },
  { name: "Education Advisor",   role: "Cohorts & scheduling",              status: "active" },
  { name: "Logistics Advisor",   role: "Routing & SLA",                     status: "active" },
  { name: "Events Advisor",      role: "Tickets & capacity",                status: "active" },
  { name: "Railways Advisor",    role: "Coaches & timetables",              status: "active" },
];

const FILE_CAPS = [
  { ext: "PDF",   label: "PDF — read · summarize · extract · sign",    icon: FileText },
  { ext: "DOCX",  label: "Word — draft · edit · track changes · export", icon: FileText },
  { ext: "XLSX",  label: "Excel — read · pivot · formulas · charts",   icon: FileText },
  { ext: "CSV",   label: "CSV — clean · join · analyze",                icon: FileText },
  { ext: "IMG",   label: "Images — OCR · describe · diagram",          icon: FileText },
];

export default function JimmyJohnChat() {
  const { user } = useAuth();
  const isChairman = user?.email?.toLowerCase() === CHAIRMAN_EMAIL;

  const [view, setView] = useState<ViewState>(() => {
    try { return (localStorage.getItem(STATE_KEY) as ViewState) || "minimized"; } catch { return "minimized"; }
  });
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try { const r = localStorage.getItem(POS_KEY); if (r) return JSON.parse(r); } catch { /* noop */ }
    return { x: window.innerWidth - 720, y: window.innerHeight - 660 };
  });
  const [size, setSize] = useState<{ w: number; h: number }>(() => {
    try { const r = localStorage.getItem(SIZE_KEY); if (r) return JSON.parse(r); } catch { /* noop */ }
    return { w: 700, h: 620 };
  });
  const [sideCollapsed, setSideCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === "1"; } catch { return false; }
  });
  const [activeModule, setActiveModule] = useState<ModuleId>(() => {
    try { return (localStorage.getItem(MODULE_KEY) as ModuleId) || "command"; } catch { return "command"; }
  });
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [voiceLive, setVoiceLive] = useState(false);

  const dragRef = useRef<{ sx: number; sy: number; bx: number; by: number } | null>(null);
  const resizeRef = useRef<{ sx: number; sy: number; bw: number; bh: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { try { localStorage.setItem(STATE_KEY, view); } catch { /* noop */ } }, [view]);
  useEffect(() => { try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch { /* noop */ } }, [pos]);
  useEffect(() => { try { localStorage.setItem(SIZE_KEY, JSON.stringify(size)); } catch { /* noop */ } }, [size]);
  useEffect(() => { try { localStorage.setItem(COLLAPSE_KEY, sideCollapsed ? "1" : "0"); } catch { /* noop */ } }, [sideCollapsed]);
  useEffect(() => { try { localStorage.setItem(MODULE_KEY, activeModule); } catch { /* noop */ } }, [activeModule]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  useEffect(() => {
    const open = () => setView("open");
    window.addEventListener("jj:open", open);
    return () => window.removeEventListener("jj:open", open);
  }, []);

  const onDragStart = (e: React.MouseEvent) => {
    if (view === "maximized") return;
    dragRef.current = { sx: e.clientX, sy: e.clientY, bx: pos.x, by: pos.y };
    const move = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const nx = dragRef.current.bx + (ev.clientX - dragRef.current.sx);
      const ny = dragRef.current.by + (ev.clientY - dragRef.current.sy);
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - 100, nx)),
        y: Math.max(8, Math.min(window.innerHeight - 100, ny)),
      });
    };
    const up = () => { dragRef.current = null; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const onResizeStart = (e: React.MouseEvent) => {
    if (view === "maximized") return;
    e.stopPropagation();
    resizeRef.current = { sx: e.clientX, sy: e.clientY, bw: size.w, bh: size.h };
    const move = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const nw = Math.max(420, Math.min(window.innerWidth - 40, resizeRef.current.bw + (ev.clientX - resizeRef.current.sx)));
      const nh = Math.max(420, Math.min(window.innerHeight - 40, resizeRef.current.bh + (ev.clientY - resizeRef.current.sy)));
      setSize({ w: nw, h: nh });
    };
    const up = () => { resizeRef.current = null; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const onEdgeResize = (axis: "x" | "y") => (e: React.MouseEvent) => {
    if (view === "maximized") return;
    e.stopPropagation();
    resizeRef.current = { sx: e.clientX, sy: e.clientY, bw: size.w, bh: size.h };
    const move = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const nw = axis === "x"
        ? Math.max(420, Math.min(window.innerWidth - 40, resizeRef.current.bw + (ev.clientX - resizeRef.current.sx)))
        : resizeRef.current.bw;
      const nh = axis === "y"
        ? Math.max(420, Math.min(window.innerHeight - 40, resizeRef.current.bh + (ev.clientY - resizeRef.current.sy)))
        : resizeRef.current.bh;
      setSize({ w: nw, h: nh });
    };
    const up = () => { resizeRef.current = null; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const SIZE_PRESETS: { id: "S" | "M" | "L" | "XL"; w: number; h: number }[] = [
    { id: "S",  w: 480, h: 520 },
    { id: "M",  w: 700, h: 620 },
    { id: "L",  w: 920, h: 720 },
    { id: "XL", w: 1180, h: 820 },
  ];
  const applyPreset = (p: { w: number; h: number }) => {
    if (view === "maximized") setView("open");
    const w = Math.min(window.innerWidth - 40, p.w);
    const h = Math.min(window.innerHeight - 40, p.h);
    setSize({ w, h });
    setPos((cur) => ({
      x: Math.max(8, Math.min(window.innerWidth - w - 8, cur.x)),
      y: Math.max(8, Math.min(window.innerHeight - h - 8, cur.y)),
    }));
  };
  const activePreset = SIZE_PRESETS.find((p) => p.w === size.w && p.h === size.h)?.id;

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || thinking) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setThinking(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/founder/jimmy/orchestrate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Sovereign-Token": "hf-jimmy-sk-2026-xK9mPqR7vNwZ3jL",
        },
        body: JSON.stringify({ message: text, use_burst: false }),
      });
      const data = await res.json();
      const reply = data.response || data.error || "No response from Jimmy.";
      setMessages((m) => [...m, { role: "ceo", content: reply, badges: ["CORE_ONLINE", "PROVIDER_" + (data.provider || "ollama").toUpperCase()] }]);
    } catch {
      setMessages((m) => [...m, { role: "ceo", content: "Connection error — Jimmy core unreachable.", badges: ["ERROR"] }]);
    } finally {
      setThinking(false);
    }
  }, [input, thinking]);

  if (!isChairman) return null;

  // ===== ORB (closed/minimized) =====
  if (view === "closed" || view === "minimized") {
    return (
      <button
        type="button"
        aria-label="Open Jimmy John — Autopilot CEO"
        onClick={() => setView("open")}
        className="jj-orb fixed z-[9999]"
        style={{ right: 24, bottom: 24 }}
      >
        <span className="jj-orb-ring" />
        <span className="jj-orb-core">
          <Crown className="w-7 h-7" strokeWidth={1.6} />
        </span>
      </button>
    );
  }

  // ===== WINDOW =====
  const isMax = view === "maximized";
  const winStyle: React.CSSProperties = isMax
    ? { inset: 16 }
    : { left: pos.x, top: pos.y, width: size.w, height: size.h };

  return (
    <div
      className={`jj-window fixed z-[9999] flex flex-col ${sideCollapsed ? "jj-collapsed" : ""}`}
      style={winStyle}
    >
      <div className="jj-pulse-border" aria-hidden />
      <div className="jj-pulse-shimmer" aria-hidden />

      {/* Header */}
      <div className="jj-header flex items-center gap-3 px-3 py-2.5 cursor-grab active:cursor-grabbing select-none" onMouseDown={onDragStart}>
        <div className="flex items-center gap-1.5 mr-1">
          <button aria-label="Close" onClick={(e) => { e.stopPropagation(); setView("closed"); }} className="jj-ctl"><X className="w-2.5 h-2.5" strokeWidth={2.5} /></button>
          <button aria-label="Minimize" onClick={(e) => { e.stopPropagation(); setView("minimized"); }} className="jj-ctl"><Minus className="w-2.5 h-2.5" strokeWidth={2.5} /></button>
          <button aria-label="Maximize" onClick={(e) => { e.stopPropagation(); setView(isMax ? "open" : "maximized"); }} className="jj-ctl"><Square className="w-2 h-2" strokeWidth={2.5} /></button>
        </div>

        <button
          aria-label="Toggle sidebar"
          onClick={(e) => { e.stopPropagation(); setSideCollapsed((v) => !v); }}
          className="jj-ctl"
          style={{ width: 22, height: 22, borderRadius: 6 }}
        >
          {sideCollapsed ? <PanelLeft className="w-3 h-3" /> : <PanelLeftClose className="w-3 h-3" />}
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="jj-crown-badge"><Crown className="w-4 h-4" strokeWidth={1.8} /></div>
          <div className="min-w-0 leading-tight">
            <div className="text-[11px] uppercase tracking-[0.18em] jj-gold-dim">Founder OS</div>
            <div className="text-[13px] font-semibold jj-gold truncate">Jimmy John — Autopilot CEO</div>
          </div>
        </div>

        <span className="jj-badge"><span className="jj-badge-dot" /> CORE_ONLINE</span>

        <div className="hidden sm:flex items-center gap-1 ml-1" onMouseDown={(e) => e.stopPropagation()}>
          {SIZE_PRESETS.map((p) => (
            <button
              key={p.id}
              className={`jj-size-chip ${activePreset === p.id && !isMax ? "active" : ""}`}
              onClick={(e) => { e.stopPropagation(); applyPreset(p); }}
              title={`Resize to ${p.id} (${p.w}×${p.h})`}
            >
              {p.id}
            </button>
          ))}
        </div>
      </div>

      {/* Body: Sidebar + Module */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="jj-sidebar">
          <div className="jj-sidebar-section">
            <div className="jj-sidebar-label">Core</div>
            {MODULES.filter((m) => m.group === "core").map((m) => {
              const Icon = m.icon;
              return (
                <button key={m.id} className={`jj-side-item ${activeModule === m.id ? "active" : ""}`} onClick={() => setActiveModule(m.id)} title={m.label}>
                  <Icon className="jj-side-icon" />
                  <span>{m.label}</span>
                  {m.pill && <span className="jj-side-pill">{m.pill}</span>}
                </button>
              );
            })}
          </div>
          <div className="jj-sidebar-section">
            <div className="jj-sidebar-label">Operations</div>
            {MODULES.filter((m) => m.group === "ops").map((m) => {
              const Icon = m.icon;
              return (
                <button key={m.id} className={`jj-side-item ${activeModule === m.id ? "active" : ""}`} onClick={() => setActiveModule(m.id)} title={m.label}>
                  <Icon className="jj-side-icon" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
          <div className="jj-sidebar-section">
            <div className="jj-sidebar-label">Intelligence</div>
            {MODULES.filter((m) => m.group === "intel").map((m) => {
              const Icon = m.icon;
              return (
                <button key={m.id} className={`jj-side-item ${activeModule === m.id ? "active" : ""}`} onClick={() => setActiveModule(m.id)} title={m.label}>
                  <Icon className="jj-side-icon" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Module Body */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeModule === "command" && (
            <ChatBody messages={messages} thinking={thinking} endRef={endRef} />
          )}

          {activeModule === "agents" && (
            <ModulePanel title="Agents Roster" subtitle="Jimmy commands; Sherlock deputizes. All advisors report to the CEO core.">
              {AGENTS.map((a) => (
                <div key={a.name} className="jj-feature-card flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,175,55,0.1)", border: "1px solid var(--jj-stroke)" }}>
                    <Bot className="w-4 h-4" style={{ color: "var(--jj-gold-bright)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold jj-gold truncate">{a.name}</div>
                    <div className="text-[11px] jj-gold-dim truncate">{a.role}</div>
                  </div>
                  {a.pill && <span className="jj-badge">{a.pill}</span>}
                  <span className="jj-badge"><span className="jj-badge-dot" /> {a.status.toUpperCase()}</span>
                </div>
              ))}
            </ModulePanel>
          )}

          {activeModule === "files" && (
            <ModulePanel title="Files & Docs" subtitle="PDF · Word · Excel · CSV · Images — read, write, think.">
              <input ref={fileInputRef} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg,.webp" onChange={() => { /* wire later */ }} />
              <button onClick={() => fileInputRef.current?.click()} className="jj-feature-card text-left flex items-center gap-3 cursor-pointer w-full">
                <Paperclip className="w-5 h-5" style={{ color: "var(--jj-gold-bright)" }} />
                <div className="flex-1">
                  <div className="text-[13px] font-semibold jj-gold">Upload documents to Jimmy</div>
                  <div className="text-[11px] jj-gold-dim">Drag-drop or click — analysis pipeline pending Replit wiring.</div>
                </div>
                <span className="jj-badge"><span className="jj-badge-dot" /> WIRING_PENDING</span>
              </button>
              {FILE_CAPS.map((f) => (
                <div key={f.ext} className="jj-feature-card flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(212,175,55,0.1)", border: "1px solid var(--jj-stroke)" }}>
                    <span className="text-[10px] font-bold jj-gold">{f.ext}</span>
                  </div>
                  <div className="text-[12px] jj-gold-dim flex-1">{f.label}</div>
                </div>
              ))}
            </ModulePanel>
          )}

          {activeModule === "voice" && (
            <ModulePanel title="Voice — ElevenLabs" subtitle="Conversational voice command for the Chairman.">
              <div className="jj-feature-card text-center py-6">
                <button
                  onClick={() => setVoiceLive((v) => !v)}
                  className={`jj-mic mx-auto ${voiceLive ? "live" : ""}`}
                  style={{ width: 72, height: 72, borderRadius: "50%" }}
                >
                  <Mic className="w-7 h-7" />
                </button>
                <div className="mt-3 text-[12px] jj-gold-dim italic">
                  {voiceLive ? "Listening… (preview only — agent not connected)" : "Tap to begin a voice directive"}
                </div>
              </div>
              <div className="jj-feature-card flex items-center gap-3">
                <Zap className="w-4 h-4" style={{ color: "var(--jj-gold-bright)" }} />
                <div className="text-[12px] jj-gold-dim flex-1">Real-time speech-to-speech via ElevenLabs Convai</div>
                <span className="jj-badge">WEBRTC</span>
              </div>
              <div className="jj-feature-card flex items-center gap-3">
                <SettingsIcon className="w-4 h-4" style={{ color: "var(--jj-gold-bright)" }} />
                <div className="text-[12px] jj-gold-dim flex-1">Voice tools: read files, query empire, dispatch agents</div>
                <span className="jj-badge">CLIENT_TOOLS</span>
              </div>
            </ModulePanel>
          )}

          {activeModule === "think" && (
            <ModulePanel title="Think Mode" subtitle="Deep reasoning before acting — chains, plans, and self-critique.">
              {[
                { icon: Brain, t: "Chain-of-thought planner", d: "Multi-step plan with explicit assumptions and risks" },
                { icon: Sparkles, t: "Strategy synthesis", d: "Cross-project pattern detection across HostFlow, Custom AI, Rapid Pay" },
                { icon: Search, t: "Research & web grounding", d: "Cite sources, summarize, and store in Memory Vault" },
                { icon: Shield, t: "Self-critique & guardrails", d: "Sherlock audits every directive before execution" },
              ].map((x, i) => (
                <div key={i} className="jj-feature-card flex items-start gap-3">
                  <x.icon className="w-4 h-4 mt-0.5" style={{ color: "var(--jj-gold-bright)" }} />
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold jj-gold">{x.t}</div>
                    <div className="text-[11px] jj-gold-dim">{x.d}</div>
                  </div>
                </div>
              ))}
            </ModulePanel>
          )}

          {activeModule === "pulse" && (
            <ModulePanel title="Empire Pulse" subtitle="Live signals across every property the Chairman owns.">
              {[
                ["MRR · HostFlow AI", "—", "AWAITING_CORE"],
                ["MRR · Custom AI", "—", "AWAITING_CORE"],
                ["TPV · Rapid Pay", "—", "AWAITING_CORE"],
                ["Active agents", String(AGENTS.length), "ONLINE"],
              ].map(([k, v, s], i) => (
                <div key={i} className="jj-feature-card flex items-center gap-3">
                  <div className="text-[12px] jj-gold-dim flex-1">{k}</div>
                  <div className="text-[14px] font-bold jj-gold tabular-nums">{v}</div>
                  <span className="jj-badge">{s}</span>
                </div>
              ))}
            </ModulePanel>
          )}

          {activeModule === "memory" && (
            <ModulePanel title="Memory Vault" subtitle="Long-term context Jimmy carries across every conversation.">
              <div className="jj-feature-card text-[12px] jj-gold-dim">
                Persistent project rules, brand decisions, and Chairman preferences will be indexed here once the CEO core is wired.
              </div>
            </ModulePanel>
          )}

          {activeModule === "knowledge" && (
            <ModulePanel title="Knowledge" subtitle="Internal docs, playbooks, and reference material.">
              <div className="jj-feature-card text-[12px] jj-gold-dim">Search across SOPs, advisor briefings, and Replit handoffs (pending).</div>
            </ModulePanel>
          )}

          {activeModule === "comms" && (
            <ModulePanel title="Comms Hub" subtitle="Drafts, sends, triages — across email and chat.">
              <div className="jj-feature-card text-[12px] jj-gold-dim">Compose, reply, and route messages through Jimmy. AI Email Center will be the spine.</div>
            </ModulePanel>
          )}

          {activeModule === "calendar" && (
            <ModulePanel title="Calendar" subtitle="Schedule, prepare, and brief the Chairman.">
              <div className="jj-feature-card text-[12px] jj-gold-dim">Daily brief, conflict detection, and prep notes — wiring pending.</div>
            </ModulePanel>
          )}

          {activeModule === "finance" && (
            <ModulePanel title="Finance" subtitle="Cash, revenue, and runway watch.">
              <div className="jj-feature-card text-[12px] jj-gold-dim">Polar payouts, Rapid Pay TPV, and burn — connected once the core comes online.</div>
            </ModulePanel>
          )}

          {activeModule === "security" && (
            <ModulePanel title="Security" subtitle="Sherlock audits, RLS posture, secrets hygiene.">
              <div className="jj-feature-card flex items-center gap-3">
                <Shield className="w-4 h-4" style={{ color: "var(--jj-gold-bright)" }} />
                <div className="text-[12px] jj-gold-dim flex-1">Sherlock continuous audit</div>
                <span className="jj-badge"><span className="jj-badge-dot" /> CLEAR</span>
              </div>
            </ModulePanel>
          )}

          {/* Composer (always visible at bottom) */}
          <div className="jj-composer flex items-end gap-2 px-3 py-3">
            <button className="jj-attach" onClick={() => fileInputRef.current?.click()} title="Attach files">
              <Paperclip className="w-4 h-4" />
              <span>Attach</span>
            </button>
            <button
              className={`jj-mic ${voiceLive ? "live" : ""}`}
              onClick={() => setVoiceLive((v) => !v)}
              title="Voice (ElevenLabs)"
            >
              <Mic className="w-4 h-4" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              rows={1}
              placeholder="Awaiting your strategic directive, Chairman..."
              className="jj-input flex-1 resize-none"
            />
            <button onClick={send} disabled={!input.trim() || thinking} className="jj-send" aria-label="Send">
              <Send className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      {!isMax && (
        <>
          <div className="jj-resize-e" onMouseDown={onEdgeResize("x")} title="Drag to resize width" />
          <div className="jj-resize-s" onMouseDown={onEdgeResize("y")} title="Drag to resize height" />
          <div className="jj-resize" onMouseDown={onResizeStart} title="Drag to resize" />
        </>
      )}
    </div>
  );
}

function ModulePanel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 jj-scroll">
      <div className="pb-1">
        <div className="text-[15px] font-semibold jj-gold">{title}</div>
        {subtitle && <div className="text-[11px] jj-gold-dim mt-0.5">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

function ChatBody({
  messages, thinking, endRef,
}: {
  messages: Msg[]; thinking: boolean; endRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 jj-scroll">
      {messages.length === 0 && (
        <div className="text-center pt-12 pb-8">
          <div className="jj-watermark mx-auto"><Crown className="w-12 h-12" strokeWidth={1.2} /></div>
          <p className="mt-4 text-[13px] jj-gold-dim italic">The empire is calm. All systems sovereign.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {STARTER_BADGES.map((b) => (
              <span key={b} className="jj-badge"><span className="jj-badge-dot" /> {b}</span>
            ))}
          </div>
        </div>
      )}
      {messages.map((m, i) => (
        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={m.role === "user" ? "jj-bubble-user" : "jj-bubble-ceo"}>
            <div className="text-[13px] leading-relaxed whitespace-pre-wrap">{m.content}</div>
            {m.badges && m.badges.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {m.badges.map((b) => (<span key={b} className="jj-badge"><span className="jj-badge-dot" /> {b}</span>))}
              </div>
            )}
          </div>
        </div>
      ))}
      {thinking && (
        <div className="flex justify-start">
          <div className="jj-bubble-ceo">
            <div className="flex items-center gap-2 text-[12px] jj-gold-dim">
              <span className="jj-thinking-dot" />
              <span className="jj-thinking-dot" style={{ animationDelay: "0.15s" }} />
              <span className="jj-thinking-dot" style={{ animationDelay: "0.3s" }} />
              <span className="ml-1 italic">Evaluating empire signals…</span>
            </div>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}