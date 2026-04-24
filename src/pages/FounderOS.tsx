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
import ArcEngine from "@/components/founder/sections/ArcEngine";
import Analytics from "@/components/founder/sections/Analytics";
import Settings from "@/components/founder/sections/Settings";
import FounderProfile from "@/components/founder/sections/FounderProfile";

export default function FounderOS() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const validSections: FounderSection[] = ["overview","executive","revenue","customers","leads","crm","emails","tasks","ai","arc","analytics","security","settings","profile"];
  const sectionParam = searchParams.get("section") as FounderSection | null;
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
      {active === "customers" && <Customers />}
      {active === "leads" && <Leads />}
      {active === "crm" && <CRM />}
      {active === "emails" && <Emails />}
      {active === "security" && <Security />}
      {active === "tasks" && <Tasks />}
      {active === "ai" && <AIAdviser />}
      {active === "arc" && <ArcEngine />}
      {active === "analytics" && <Analytics />}
      {active === "settings" && <Settings />}
      {active === "profile" && <FounderProfile />}
    </FounderLayout>
  );
}
