import { Anchor, Ship, Clock, MapPin, Users, Waves } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function BerthSchedule() {
  const berths = [
    { berth: "Berth A1", vessel: "MV Oceanic Star", type: "Container", arrival: "06:00", departure: "18:00", status: "docked" },
    { berth: "Berth A2", vessel: "SS Pacific Wind", type: "Tanker", arrival: "10:30", departure: "Apr 10", status: "approaching" },
    { berth: "Berth B1", vessel: "—", type: "—", arrival: "—", departure: "—", status: "available" },
    { berth: "Berth B2", vessel: "MV Coral Queen", type: "Cruise", arrival: "08:00", departure: "22:00", status: "docked" },
  ];
  const statusColors: Record<string, string> = { docked: "text-success", approaching: "text-primary", available: "text-muted-foreground", departed: "text-warning" };

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Anchor className="w-4 h-4 text-primary" />Berth Schedule</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {berths.map(b => (
          <div key={b.berth} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{b.berth}: {b.vessel}</p>
              <p className="text-[10px] text-muted-foreground">{b.type} · {b.arrival} → {b.departure}</p>
            </div>
            <span className={`text-xs capitalize ${statusColors[b.status]}`}>{b.status}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function CrewRotation() {
  const crew = [
    { name: "Chief Eng. Torres", vessel: "MV Oceanic Star", daysOnboard: 42, maxDays: 60, nextRotation: "Apr 26" },
    { name: "Capt. Hansen", vessel: "SS Pacific Wind", daysOnboard: 55, maxDays: 60, nextRotation: "Apr 13" },
    { name: "Bosun Murphy", vessel: "MV Coral Queen", daysOnboard: 28, maxDays: 90, nextRotation: "Jun 5" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Crew Rotation</CardTitle></CardHeader>
      <CardContent className="space-y-2.5">
        {crew.map(c => (
          <div key={c.name} className="p-2.5 rounded-lg border border-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{c.name}</span>
              <Badge variant="outline" className={`text-[10px] ${c.daysOnboard > c.maxDays * 0.85 ? "text-destructive" : "text-muted-foreground"}`}>
                {c.daysOnboard}/{c.maxDays}d
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">{c.vessel} · Rotation: {c.nextRotation}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TideCalendar() {
  const tides = [
    { time: "05:42 AM", type: "High", height: "5.8m", safe: true },
    { time: "11:58 AM", type: "Low", height: "1.2m", safe: false },
    { time: "06:15 PM", type: "High", height: "5.5m", safe: true },
    { time: "12:30 AM", type: "Low", height: "1.4m", safe: false },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Waves className="w-4 h-4 text-primary" />Tide & Port Conditions</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {tides.map(t => (
          <div key={t.time} className={`flex items-center justify-between p-2 rounded-lg ${t.safe ? "bg-success/5" : "bg-warning/5"}`}>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t.time}</span>
              <span className="text-sm font-medium text-foreground">{t.type} Tide</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t.height}</span>
              <Badge variant="outline" className={`text-[10px] ${t.safe ? "text-success" : "text-warning"}`}>
                {t.safe ? "Safe" : "Restricted"}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
