import { ReactNode } from "react";
import FounderSidebar, { FounderSection } from "./FounderSidebar";
import FounderHeader from "./FounderHeader";
import { FounderThemeProvider } from "./FounderTheme";

const TITLES: Record<FounderSection, string> = {
  overview: "Overview", executive: "Executive HQ", revenue: "Revenue", customers: "Customers", leads: "Leads",
  crm: "Enterprise CRM", emails: "AI Email Center",
  security: "Security", tasks: "Tasks", ai: "AI Strategist",
  analytics: "Analytics", settings: "Settings", profile: "Founder Profile",
};

export default function FounderLayout({ active, onSelect, children }: { active: FounderSection; onSelect: (s: FounderSection) => void; children: ReactNode }) {
  return (
    <FounderThemeProvider>
      <div className="founder-shell min-h-screen">
        <FounderSidebar active={active} onSelect={onSelect} />
        <div className="ml-0 md:ml-[280px] flex flex-col min-h-screen">
          <FounderHeader title={TITLES[active]} />
          <main className="flex-1 p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </FounderThemeProvider>
  );
}
