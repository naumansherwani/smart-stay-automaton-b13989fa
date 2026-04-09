import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, TicketCheck, TrendingUp, DollarSign, Clock, CheckCircle2, AlertTriangle, Activity } from "lucide-react";
import { useCrmContacts, useCrmTickets, useCrmDeals } from "@/hooks/useCrm";
import { getCrmConfig } from "@/lib/crmConfig";
import type { IndustryType } from "@/lib/industryConfig";

interface Props { industry: IndustryType; }

export default function CrmLiveKPIs({ industry }: Props) {
  const config = getCrmConfig(industry);
  const { contacts } = useCrmContacts();
  const { tickets } = useCrmTickets();
  const { deals } = useCrmDeals();
  const [pulse, setPulse] = useState(false);

  // Pulse animation every 5 seconds to show "live"
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 500);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const openTickets = tickets.filter(t => t.status === "open").length;
  const inProgressTickets = tickets.filter(t => t.status === "in_progress").length;
  const resolvedToday = tickets.filter(t => {
    if (t.status !== "resolved" && t.status !== "closed") return false;
    const resolved = t.resolved_at ? new Date(t.resolved_at) : new Date(t.updated_at);
    const today = new Date();
    return resolved.toDateString() === today.toDateString();
  }).length;
  
  const totalPipeline = deals.filter(d => d.stage !== "Won" && d.stage !== "Lost").reduce((s, d) => s + (d.value || 0), 0);
  const wonDeals = deals.filter(d => d.stage === "Won").length;
  const activeContacts = contacts.filter(c => c.lifecycle_stage === "customer").length;
  const newLeads = contacts.filter(c => {
    const created = new Date(c.created_at);
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    return created > weekAgo && c.lifecycle_stage === "lead";
  }).length;

  const kpis = [
    { icon: <Users className="h-4 w-4" />, label: config.contactLabelPlural, value: contacts.length, sub: `${activeContacts} active`, color: "text-blue-500" },
    { icon: <AlertTriangle className="h-4 w-4" />, label: `Open ${config.ticketLabelPlural}`, value: openTickets, sub: `${inProgressTickets} in progress`, color: "text-orange-500" },
    { icon: <CheckCircle2 className="h-4 w-4" />, label: "Resolved Today", value: resolvedToday, sub: `${tickets.length} total`, color: "text-green-500" },
    { icon: <DollarSign className="h-4 w-4" />, label: "Pipeline", value: `$${(totalPipeline / 1000).toFixed(1)}k`, sub: `${wonDeals} won`, color: "text-primary" },
    { icon: <TrendingUp className="h-4 w-4" />, label: "New Leads (7d)", value: newLeads, sub: "this week", color: "text-purple-500" },
    { icon: <Activity className="h-4 w-4" />, label: "Active Deals", value: deals.filter(d => d.stage !== "Won" && d.stage !== "Lost").length, sub: `${deals.length} total`, color: "text-teal-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
      {kpis.map((kpi, i) => (
        <Card key={i} className="relative overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={kpi.color}>{kpi.icon}</span>
              <span className="text-xs text-muted-foreground truncate">{kpi.label}</span>
            </div>
            <p className={`text-xl font-bold ${pulse ? "scale-105" : ""} transition-transform`}>{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.sub}</p>
          </CardContent>
          <div className={`absolute top-2 right-2 h-2 w-2 rounded-full bg-green-500 ${pulse ? "animate-ping" : ""}`} />
        </Card>
      ))}
    </div>
  );
}
