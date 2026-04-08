import { Home, Users, Calendar, TrendingUp, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ShowingCalendar() {
  const showings = [
    { property: "123 Oak Lane", price: "$425,000", time: "10:00 AM", agent: "R. Thompson", leads: 3, type: "Open House" },
    { property: "456 Maple Ave", price: "$680,000", time: "1:00 PM", agent: "L. Davis", leads: 1, type: "Private" },
    { property: "789 Pine St #4B", price: "$320,000", time: "3:30 PM", agent: "R. Thompson", leads: 2, type: "Virtual" },
    { property: "101 Beach Rd", price: "$1,200,000", time: "5:00 PM", agent: "M. Chen", leads: 5, type: "Open House" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Home className="w-4 h-4 text-primary" />Today's Showings</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {showings.map(s => (
          <div key={s.property} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{s.property}</p>
              <p className="text-[10px] text-muted-foreground">{s.price} · {s.agent} · {s.leads} interested leads</p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-[10px]">{s.type}</Badge>
              <p className="text-[10px] text-muted-foreground">{s.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function LeadTracker() {
  const leads = [
    { name: "J. Hoffman", property: "123 Oak Lane", stage: "offer", budget: "$430K", lastContact: "Today" },
    { name: "S. Williams", property: "101 Beach Rd", stage: "interested", budget: "$1.2M", lastContact: "Yesterday" },
    { name: "A. Patel", property: "Multiple", stage: "searching", budget: "$350-500K", lastContact: "2 days ago" },
    { name: "M. Garcia", property: "789 Pine St", stage: "viewing", budget: "$300K", lastContact: "Today" },
  ];
  const stageColors: Record<string, string> = { offer: "text-success", interested: "text-primary", searching: "text-warning", viewing: "text-muted-foreground" };

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Lead Pipeline</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {leads.map(l => (
          <div key={l.name} className="flex items-center justify-between p-2 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{l.name}</p>
              <p className="text-[10px] text-muted-foreground">{l.property} · Budget: {l.budget}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs capitalize ${stageColors[l.stage]}`}>{l.stage}</span>
              <p className="text-[10px] text-muted-foreground">{l.lastContact}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function MarketAnalysis() {
  const metrics = [
    { area: "Downtown", avgPrice: "$520K", daysOnMarket: 18, trend: "+5%", listings: 24 },
    { area: "Suburbs", avgPrice: "$380K", daysOnMarket: 28, trend: "+2%", listings: 42 },
    { area: "Beachfront", avgPrice: "$950K", daysOnMarket: 35, trend: "+8%", listings: 11 },
    { area: "Historic Dist.", avgPrice: "$440K", daysOnMarket: 22, trend: "-1%", listings: 15 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Market Analysis</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {metrics.map(m => (
          <div key={m.area} className="flex items-center justify-between p-2 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{m.area}</p>
              <p className="text-[10px] text-muted-foreground">{m.listings} listings · {m.daysOnMarket}d avg</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-foreground">{m.avgPrice}</p>
              <span className={`text-[10px] ${m.trend.startsWith("+") ? "text-success" : "text-destructive"}`}>{m.trend}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
