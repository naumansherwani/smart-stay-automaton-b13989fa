import { ReactNode, useEffect, useState } from "react";
import FounderSidebar, { FounderSection } from "./FounderSidebar";
import FounderHeader from "./FounderHeader";
import { FounderThemeProvider } from "./FounderTheme";

const TITLES: Record<FounderSection, string> = {
  overview: "Overview", executive: "Executive HQ", revenue: "Revenue", customers: "Customers", leads: "Leads",
  crm: "Enterprise CRM", emails: "AI Email Center", agents_email: "AI Agents Email Center",
  security: "Security", tasks: "Tasks", ai: "AI Advisor", sherlock: "Sherlock",
  analytics: "Analytics", settings: "Settings", profile: "Founder Profile",
  revenue_intel: "AI Revenue Intelligence",
};

export default function FounderLayout({ active, onSelect, children }: { active: FounderSection; onSelect: (s: FounderSection) => void; children: ReactNode }) {
  const [pinned, setPinned] = useState<boolean>(() => {
    try { const v = localStorage.getItem("fos-sidebar-pinned"); return v === null ? true : v === "1"; } catch { return true; }
  });
  useEffect(() => {
    const onStorage = () => {
      try { const v = localStorage.getItem("fos-sidebar-pinned"); setPinned(v === null ? true : v === "1"); } catch { /* noop */ }
    };
    window.addEventListener("storage", onStorage);
    const id = setInterval(onStorage, 400);
    return () => { window.removeEventListener("storage", onStorage); clearInterval(id); };
  }, []);
  return (
    <FounderThemeProvider>
      <div className="founder-shell min-h-screen">
        <FounderSidebar active={active} onSelect={onSelect} />
        <div className={`ml-0 ${pinned ? "md:ml-[280px]" : "md:ml-0"} transition-[margin] duration-300 flex flex-col min-h-screen`}>
          <FounderHeader title={TITLES[active]} onSelect={(s) => onSelect(s as FounderSection)} />
          <main className="flex-1 p-8 md:p-12 space-y-8 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </FounderThemeProvider>
  );
}
