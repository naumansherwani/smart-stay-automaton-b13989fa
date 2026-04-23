import { useState } from "react";
import FounderLayout from "@/components/founder/FounderLayout";
import { FounderSection } from "@/components/founder/FounderSidebar";
import Overview from "@/components/founder/sections/Overview";
import Revenue from "@/components/founder/sections/Revenue";
import Customers from "@/components/founder/sections/Customers";
import Leads from "@/components/founder/sections/Leads";
import CRM from "@/components/founder/sections/CRM";
import Emails from "@/components/founder/sections/Emails";
import Tasks from "@/components/founder/sections/Tasks";
import AIAdviser from "@/components/founder/sections/AIAdviser";
import Analytics from "@/components/founder/sections/Analytics";
import Settings from "@/components/founder/sections/Settings";
import FounderProfile from "@/components/founder/sections/FounderProfile";

export default function FounderOS() {
  const [active, setActive] = useState<FounderSection>("overview");
  return (
    <FounderLayout active={active} onSelect={setActive}>
      {active === "overview" && <Overview />}
      {active === "revenue" && <Revenue />}
      {active === "customers" && <Customers />}
      {active === "leads" && <Leads />}
      {active === "crm" && <CRM />}
      {active === "emails" && <Emails />}
      {active === "tasks" && <Tasks />}
      {active === "ai" && <AIAdviser />}
      {active === "analytics" && <Analytics />}
      {active === "settings" && <Settings />}
      {active === "profile" && <FounderProfile />}
    </FounderLayout>
  );
}
