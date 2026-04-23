import { useState } from "react";
import { Plus, CheckCircle2, Circle, Trash2 } from "lucide-react";

export default function Tasks() {
  const [tasks, setTasks] = useState<{ id: number; t: string; done: boolean }[]>([
    { id: 1, t: "Follow up with top enterprise leads", done: false },
    { id: 2, t: "Review weekly revenue report", done: false },
    { id: 3, t: "Approve pending refunds", done: true },
  ]);
  const [input, setInput] = useState("");
  const add = () => { if (!input.trim()) return; setTasks([{ id: Date.now(), t: input, done: false }, ...tasks]); setInput(""); };
  return (
    <div className="founder-card p-6 max-w-3xl">
      <h3 className="text-[var(--fos-text)] font-semibold text-sm mb-4">Founder Tasks</h3>
      <div className="flex gap-2 mb-4">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add a task…" className="flex-1 bg-[var(--fos-bg)] border border-[var(--fos-border)] rounded-lg px-3 py-2 text-sm text-[var(--fos-text)] focus:outline-none focus:border-[var(--fos-accent)]/50" />
        <button onClick={add} className="px-4 rounded-lg bg-[var(--fos-accent)] text-white text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /></button>
      </div>
      <div className="space-y-1.5">
        {tasks.map((task) => (
          <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--fos-bg)] border border-[var(--fos-border)]/50 group">
            <button onClick={() => setTasks(tasks.map(t => t.id === task.id ? { ...t, done: !t.done } : t))}>
              {task.done ? <CheckCircle2 className="w-4 h-4 text-[var(--fos-success)]" /> : <Circle className="w-4 h-4 text-[var(--fos-muted)]/60" />}
            </button>
            <span className={`flex-1 text-sm ${task.done ? "text-[var(--fos-muted)] line-through" : "text-[var(--fos-text)]"}`}>{task.t}</span>
            <button onClick={() => setTasks(tasks.filter(t => t.id !== task.id))} className="opacity-0 group-hover:opacity-100 text-[var(--fos-muted)] hover:text-[var(--fos-danger)] transition"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
