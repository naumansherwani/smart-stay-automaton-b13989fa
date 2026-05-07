import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import FounderLayout from "@/components/founder/FounderLayout";
import { FounderSection } from "@/components/founder/FounderSidebar";
import Overview from "@/components/founder/sections/Overview";
import ExecutiveHQ from "@/components/founder/sections/ExecutiveHQ";
import Revenue from "@/components/founder/sections/Revenue";
import Customers from "@/components/founder/sections/Customers";
import Leads from "@/components/founder/sections/Leads";
import CRM from "@/components/founder/sections/CRM";
import Emails from "@/components/founder/sections/Emails";
import Security from "@/components/founder/sections/Security";
import Tasks from "@/components/founder/sections/Tasks";
import AIAdviser from "@/components/founder/sections/AIAdviser";
import Sherlock from "@/components/founder/sections/Sherlock";
import RevenueIntelligence from "@/components/founder/sections/RevenueIntelligence";
import { useAuth } from "@/hooks/useAuth";
import Analytics from "@/components/founder/sections/Analytics";
import Settings from "@/components/founder/sections/Settings";
import FounderProfile from "@/components/founder/sections/FounderProfile";

export default function FounderOS() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const SHERLOCK_USER_ID = "d089432d-5d6b-416e-bd29-abe913121d99";
  const [sherlockHidden, setSherlockHidden] = useState(false);
  const sherlockAllowed = user?.id === SHERLOCK_USER_ID && !sherlockHidden;
  const validSections: FounderSection[] = ["overview","executive","revenue","revenue_intel","customers","leads","crm","emails","tasks","ai","sherlock","analytics","security","settings","profile"];
  const rawSection = searchParams.get("section");
  // Backward-compat: old "arc" links open the AI Co-Owner (Autopilot lives inside it)
  const sectionParam = (rawSection === "arc" ? "ai" : rawSection) as FounderSection | null;
  const initial: FounderSection =
    sectionParam && validSections.includes(sectionParam) ? sectionParam :
    location.pathname.startsWith("/owner/email") ? "emails" :
    location.pathname.startsWith("/owner/executive") ? "executive" :
    "overview";
  const [active, setActive] = useState<FounderSection>(initial);
  useEffect(() => { setActive(initial); /* eslint-disable-next-line */ }, [location.pathname, sectionParam]);
  return (
    <FounderLayout active={active} onSelect={setActive}>
      {active === "overview" && <Overview />}
      {active === "executive" && <ExecutiveHQ onNavigate={(s) => setActive(s as FounderSection)} />}
      {active === "revenue" && <Revenue />}
      {active === "revenue_intel" && <RevenueIntelligence />}
      {active === "customers" && <Customers />}
      {active === "leads" && <Leads />}
      {active === "crm" && <CRM />}
      {active === "emails" && <Emails />}
      {active === "security" && <Security />}
      {active === "tasks" && <Tasks />}
      {active === "ai" && <AIAdviser />}
      {active === "sherlock" && sherlockAllowed && (
        <Sherlock onForbidden={() => setSherlockHidden(true)} />
      )}
      {active === "analytics" && <Analytics />}
      {active === "settings" && <Settings />}
      {active === "profile" && <FounderProfile />}
    </FounderLayout>
  );
}
