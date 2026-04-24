import { ReactNode } from "react";
import FounderSidebar, { FounderSection } from "./FounderSidebar";
import FounderHeader from "./FounderHeader";
import { FounderThemeProvider } from "./FounderTheme";

const TITLES: Record<FounderSection, string> = {
  overview: "Overview", executive: "Executive HQ", revenue: "Revenue", customers: "Customers", leads: "Leads",
  crm: "Enterprise CRM", emails: "AI Email Center",
  security: "Security", tasks: "Tasks", ai: "AI Co-Owner",
  analytics: "Analytics", settings: "Settings", profile: "Founder Profile",
};

export default function FounderLayout({ active, onSelect, children }: { active: FounderSection; onSelect: (s: FounderSection) => void; children: ReactNode }) {
  return (
    <FounderThemeProvider>
      <div className="founder-shell min-h-screen">
        <FounderSidebar active={active} onSelect={onSelect} />
        <div className="ml-0 md:ml-[280px] flex flex-col min-h-screen">
          <FounderHeader title={TITLES[active]} onSelect={(s) => onSelect(s as FounderSection)} />
          <main className="flex-1 p-8 md:p-12 space-y-8 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </FounderThemeProvider>
  );
}
