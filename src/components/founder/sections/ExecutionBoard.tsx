import { useEffect, useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

type Col = "today" | "week" | "waiting" | "done";
type Card = { id: string; text: string; col: Col; createdAt: string };

const COLUMNS: { id: Col; label: string; tone: string }[] = [
  { id: "today", label: "Today", tone: "var(--fos-accent)" },
  { id: "week", label: "This Week", tone: "#A78BFA" },
  { id: "waiting", label: "Waiting", tone: "var(--fos-warning)" },
  { id: "done", label: "Completed", tone: "var(--fos-success)" },
];

const STORAGE = "fos-execution-board";

export default function ExecutionBoard() {
  const [cards, setCards] = useState<Card[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE) || "[]");
      if (raw.length) return raw;
    } catch {}
    return [
      { id: "1", text: "Email top 3 enterprise leads", col: "today", createdAt: new Date().toISOString() },
      { id: "2", text: "Review Premium tier pricing", col: "today", createdAt: new Date().toISOString() },
      { id: "3", text: "Approve win-back offers", col: "week", createdAt: new Date().toISOString() },
      { id: "4", text: "Awaiting legal review on enterprise contract", col: "waiting", createdAt: new Date().toISOString() },
    ];
  });
  const [adding, setAdding] = useState<Col | null>(null);
  const [draft, setDraft] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(cards)); }, [cards]);

  const add = (col: Col) => {
    if (!draft.trim()) return;
    setCards([{ id: String(Date.now()), text: draft, col, createdAt: new Date().toISOString() }, ...cards]);
    setDraft(""); setAdding(null);
  };

  const move = (id: string, col: Col) => setCards(cards.map((c) => c.id === id ? { ...c, col } : c));
  const remove = (id: string) => setCards(cards.filter((c) => c.id !== id));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const items = cards.filter((c) => c.col === col.id);
        return (
          <div
            key={col.id}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragId) { move(dragId, col.id); setDragId(null); } }}
            className="founder-card p-4 min-h-[400px] flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: col.tone }} />
                <h4 className="text-[var(--fos-text)] font-semibold text-xs uppercase tracking-wider">{col.label}</h4>
                <span className="text-[10px] text-[var(--fos-muted)]">{items.length}</span>
              </div>
              <button onClick={() => setAdding(col.id)} className="text-[var(--fos-muted)] hover:text-[var(--fos-accent)]"><Plus className="w-3.5 h-3.5" /></button>
            </div>

            {adding === col.id && (
              <div className="mb-3">
                <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); add(col.id); } if (e.key === "Escape") { setAdding(null); setDraft(""); } }} placeholder="New task…" rows={2} className="w-full bg-[var(--fos-bg)] border border-[var(--fos-border)] rounded-lg px-3 py-2 text-xs text-[var(--fos-text)] focus:outline-none focus:border-[var(--fos-accent)]/50" />
                <div className="flex gap-2 mt-1.5">
                  <button onClick={() => add(col.id)} className="px-2 py-1 rounded bg-[var(--fos-accent)] text-white text-[11px] font-semibold">Add</button>
                  <button onClick={() => { setAdding(null); setDraft(""); }} className="px-2 py-1 rounded text-[var(--fos-muted)] text-[11px]">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-2 flex-1 overflow-y-auto">
              {items.map((c) => (
                <div
                  key={c.id}
                  draggable
                  onDragStart={() => setDragId(c.id)}
                  className={`group bg-[var(--fos-bg)] border border-[var(--fos-border)]/60 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-[var(--fos-accent)]/40 transition ${dragId === c.id ? "opacity-50" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-3.5 h-3.5 text-[var(--fos-muted)]/40 mt-0.5 shrink-0" />
                    <div className="flex-1 text-[13px] text-[var(--fos-text)] leading-snug">{c.text}</div>
                    <button onClick={() => remove(c.id)} className="opacity-0 group-hover:opacity-100 text-[var(--fos-muted)] hover:text-[var(--fos-danger)] transition"><Trash2 className="w-3 h-3" /></button>
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {COLUMNS.filter((x) => x.id !== col.id).map((x) => (
                      <button key={x.id} onClick={() => move(c.id, x.id)} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--fos-card)] text-[var(--fos-muted)] hover:text-[var(--fos-text)] hover:bg-[var(--fos-border)]/40">→ {x.label}</button>
                    ))}
                  </div>
                </div>
              ))}
              {items.length === 0 && adding !== col.id && <div className="text-[11px] text-[var(--fos-muted)]/50 italic text-center py-6">Drop here</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}