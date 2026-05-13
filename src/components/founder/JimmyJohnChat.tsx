import { useEffect, useRef, useState, useCallback } from "react";
import { Crown, Send, X, Minus, Square } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import "./jimmy-john.css";

const CHAIRMAN_EMAIL = "naumansherwani@hostflowai.net";
const STATE_KEY = "jj-state-v1";
const POS_KEY = "jj-pos-v1";

type ViewState = "closed" | "open" | "minimized" | "maximized";
type Msg = { role: "user" | "ceo"; content: string; badges?: string[] };

const STARTER_BADGES = ["CEO_CORE_ONLINE", "SHERLOCK_AUDIT_CLEAR", "EMPIRE_WATCH_24/7"];

export default function JimmyJohnChat() {
  const { user } = useAuth();
  const isChairman = user?.email?.toLowerCase() === CHAIRMAN_EMAIL;

  const [view, setView] = useState<ViewState>(() => {
    try { return (localStorage.getItem(STATE_KEY) as ViewState) || "minimized"; } catch { return "minimized"; }
  });
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* noop */ }
    return { x: window.innerWidth - 440, y: window.innerHeight - 620 };
  });
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; baseX: number; baseY: number } | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { try { localStorage.setItem(STATE_KEY, view); } catch { /* noop */ } }, [view]);
  useEffect(() => { try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch { /* noop */ } }, [pos]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  useEffect(() => {
    const open = () => setView("open");
    window.addEventListener("jj:open", open);
    return () => window.removeEventListener("jj:open", open);
  }, []);

  const onDragStart = (e: React.MouseEvent) => {
    if (view === "maximized") return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, baseX: pos.x, baseY: pos.y };
    const move = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const nx = dragRef.current.baseX + (ev.clientX - dragRef.current.startX);
      const ny = dragRef.current.baseY + (ev.clientY - dragRef.current.startY);
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - 100, nx)),
        y: Math.max(8, Math.min(window.innerHeight - 100, ny)),
      });
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || thinking) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    setThinking(true);
    // Stub reply — Replit wiring pending
    setTimeout(() => {
      setMessages((m) => [...m, {
        role: "ceo",
        content: "Strategic directive received, Chairman. Core wiring to Replit pending — full autopilot decisioning will come online once the CEO core is connected.",
        badges: STARTER_BADGES,
      }]);
      setThinking(false);
    }, 900);
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
    : { left: pos.x, top: pos.y, width: 420, height: 600 };

  return (
    <div className="jj-window fixed z-[9999] flex flex-col" style={winStyle}>
      <div className="jj-pulse-border" aria-hidden />
      <div className="jj-pulse-shimmer" aria-hidden />

      {/* Header */}
      <div
        className="jj-header flex items-center gap-3 px-3 py-2.5 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onDragStart}
      >
        {/* Mac controls — gold monochrome */}
        <div className="flex items-center gap-1.5 mr-1">
          <button
            aria-label="Close"
            onClick={(e) => { e.stopPropagation(); setView("closed"); }}
            className="jj-ctl"
          >
            <X className="w-2.5 h-2.5" strokeWidth={2.5} />
          </button>
          <button
            aria-label="Minimize"
            onClick={(e) => { e.stopPropagation(); setView("minimized"); }}
            className="jj-ctl"
          >
            <Minus className="w-2.5 h-2.5" strokeWidth={2.5} />
          </button>
          <button
            aria-label="Maximize"
            onClick={(e) => { e.stopPropagation(); setView(isMax ? "open" : "maximized"); }}
            className="jj-ctl"
          >
            <Square className="w-2 h-2" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="jj-crown-badge">
            <Crown className="w-4 h-4" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-[11px] uppercase tracking-[0.18em] jj-gold-dim">Founder OS</div>
            <div className="text-[13px] font-semibold jj-gold truncate">
              Jimmy John — Autopilot CEO
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 jj-scroll">
        {messages.length === 0 && (
          <div className="text-center pt-12 pb-8">
            <div className="jj-watermark mx-auto">
              <Crown className="w-12 h-12" strokeWidth={1.2} />
            </div>
            <p className="mt-4 text-[13px] jj-gold-dim italic">
              The empire is calm. All systems sovereign.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {STARTER_BADGES.map((b) => (
                <span key={b} className="jj-badge">
                  <span className="jj-badge-dot" /> {b}
                </span>
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
                  {m.badges.map((b) => (
                    <span key={b} className="jj-badge">
                      <span className="jj-badge-dot" /> {b}
                    </span>
                  ))}
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

      {/* Composer */}
      <div className="jj-composer flex items-end gap-2 px-3 py-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Awaiting your strategic directive, Chairman..."
          className="jj-input flex-1 resize-none"
        />
        <button
          onClick={send}
          disabled={!input.trim() || thinking}
          className="jj-send"
          aria-label="Send"
        >
          <Send className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}