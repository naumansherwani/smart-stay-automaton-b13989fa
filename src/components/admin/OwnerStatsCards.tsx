import { Card, CardContent } from "@/components/ui/card";
import {
  Users, DollarSign, Calendar, Globe, Shield, Activity,
  MessageSquare, Briefcase, FileText, Layers
} from "lucide-react";

interface OwnerStatsCardsProps {
  stats: {
    totalUsers: number;
    totalBookings: number;
    totalResources: number;
    activeSubscriptions: number;
    trialingUsers: number;
    totalCrmContacts: number;
    totalCrmDeals: number;
    totalWorkspaces: number;
    totalActivityLogs: number;
    totalFeatureUsage: number;
  };
  totalRevenue: number;
  showSecret: boolean;
}

const OwnerStatsCards = ({ stats, totalRevenue, showSecret }: OwnerStatsCardsProps) => {
  const items = [
    { icon: Users, label: "Total Users", value: stats.totalUsers, color: "text-primary" },
    { icon: Calendar, label: "Bookings", value: stats.totalBookings, color: "text-[hsl(217,91%,60%)]" },
    { icon: Globe, label: "Resources", value: stats.totalResources, color: "text-[hsl(160,60%,45%)]" },
    { icon: Shield, label: "Active Subs", value: stats.activeSubscriptions, color: "text-[hsl(270,80%,70%)]" },
    { icon: Activity, label: "Trialing", value: stats.trialingUsers, color: "text-[hsl(38,92%,60%)]" },
    { icon: DollarSign, label: "Revenue", value: `$${totalRevenue.toLocaleString()}`, color: "text-[hsl(160,60%,45%)]" },
    { icon: Briefcase, label: "CRM Contacts", value: stats.totalCrmContacts, color: "text-[hsl(200,80%,55%)]" },
    { icon: FileText, label: "CRM Deals", value: stats.totalCrmDeals, color: "text-[hsl(330,70%,55%)]" },
    { icon: Layers, label: "Workspaces", value: stats.totalWorkspaces, color: "text-[hsl(45,90%,50%)]" },
    { icon: MessageSquare, label: "Activity Logs", value: stats.totalActivityLogs, color: "text-[hsl(190,70%,50%)]" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-3">
      {items.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-3 text-center space-y-1">
            <s.icon className={`w-5 h-5 mx-auto ${s.color}`} />
            <p className={`text-xl font-bold ${s.color}`}>{showSecret ? s.value : "•••"}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OwnerStatsCards;
