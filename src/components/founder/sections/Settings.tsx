import { useFounderTheme } from "../FounderTheme";
export default function Settings() {
  const { mode, toggle } = useFounderTheme();
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="founder-card p-6">
        <h3 className="text-[var(--fos-text)] font-semibold text-sm mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[var(--fos-text)] text-sm font-medium">Theme</div>
            <div className="text-[var(--fos-muted)] text-xs">{mode === "dark" ? "Dark mode (default)" : "Light mode"}</div>
          </div>
          <button onClick={toggle} className="px-4 py-2 rounded-lg bg-[var(--fos-accent)] text-white text-xs font-semibold">Switch to {mode === "dark" ? "Light" : "Dark"}</button>
        </div>
      </div>
      <div className="founder-card p-6">
        <h3 className="text-[var(--fos-text)] font-semibold text-sm mb-2">Currency</h3>
        <p className="text-[var(--fos-muted)] text-xs">Base currency: <span className="text-[var(--fos-text)] font-semibold">GBP (£)</span> · multi-currency display via the public site switcher.</p>
      </div>
    </div>
  );
}
