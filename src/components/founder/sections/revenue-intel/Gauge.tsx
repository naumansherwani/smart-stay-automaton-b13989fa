/**
 * Minimal circular gauge — calm, no over-animation.
 */
export default function Gauge({ value = 0, size = 96, label }: { value?: number; size?: number; label?: string }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--fos-border)" strokeWidth={6} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#22D3EE"
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="-mt-[calc(100%/2+18px)] tabular-nums text-[var(--fos-text)] font-bold" style={{ fontSize: size * 0.22 }}>
        {v}
      </div>
      {label && <div className="text-[10px] uppercase tracking-wider text-[var(--fos-muted)] mt-2">{label}</div>}
    </div>
  );
}