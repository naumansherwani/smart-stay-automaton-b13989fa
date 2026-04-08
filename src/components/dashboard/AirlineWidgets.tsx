import { 
  Plane, Clock, Users, AlertTriangle, Fuel, Wrench, 
  MapPin, TrendingUp, BarChart3, Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function CrewScheduler() {
  const crew = [
    { name: "Capt. Williams", role: "Pilot", hours: 62, maxHours: 80, status: "on-duty", nextFlight: "AA1042" },
    { name: "FO. Martinez", role: "First Officer", hours: 48, maxHours: 80, status: "available", nextFlight: "AA1042" },
    { name: "FA. Chen", role: "Lead Attendant", hours: 71, maxHours: 85, status: "rest", nextFlight: "—" },
    { name: "FA. Patel", role: "Attendant", hours: 55, maxHours: 85, status: "on-duty", nextFlight: "AA2187" },
  ];
  const statusColors: Record<string, string> = { "on-duty": "bg-success/10 text-success", available: "bg-primary/10 text-primary", rest: "bg-warning/10 text-warning" };

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Crew Duty Scheduler</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {crew.map(c => (
          <div key={c.name} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{c.name}</p>
              <p className="text-[10px] text-muted-foreground">{c.role} · Next: {c.nextFlight}</p>
            </div>
            <div className="text-right space-y-1">
              <Badge variant="outline" className={`text-[10px] ${statusColors[c.status]}`}>{c.status}</Badge>
              <p className="text-[10px] text-muted-foreground">{c.hours}/{c.maxHours}h flown</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function GateAssignment() {
  const gates = [
    { gate: "A1", flight: "AA1042", dest: "LAX", time: "10:30", status: "boarding", aircraft: "B737" },
    { gate: "A3", flight: "UA589", dest: "ORD", time: "11:15", status: "scheduled", aircraft: "A320" },
    { gate: "B2", flight: "DL221", dest: "ATL", time: "11:45", status: "delayed", aircraft: "B757" },
    { gate: "B5", flight: "—", dest: "—", time: "—", status: "available", aircraft: "—" },
    { gate: "C1", flight: "SW834", dest: "DEN", time: "12:00", status: "scheduled", aircraft: "B737" },
  ];
  const statusColors: Record<string, string> = { boarding: "text-success", scheduled: "text-primary", delayed: "text-destructive", available: "text-muted-foreground" };

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Gate Assignment Board</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {gates.map(g => (
            <div key={g.gate} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-foreground w-8">{g.gate}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{g.flight} → {g.dest}</p>
                  <p className="text-[10px] text-muted-foreground">{g.aircraft} · {g.time}</p>
                </div>
              </div>
              <span className={`text-xs font-medium capitalize ${statusColors[g.status]}`}>{g.status}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function FlightLoadFactor() {
  const flights = [
    { flight: "AA1042", route: "JFK→LAX", load: 94, seats: 180, booked: 169 },
    { flight: "UA589", route: "JFK→ORD", load: 78, seats: 160, booked: 125 },
    { flight: "DL221", route: "JFK→ATL", load: 88, seats: 200, booked: 176 },
    { flight: "SW834", route: "JFK→DEN", load: 62, seats: 175, booked: 109 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Load Factor Analysis</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {flights.map(f => (
          <div key={f.flight} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-foreground">{f.flight} {f.route}</span>
              <span className={`font-bold ${f.load >= 90 ? "text-success" : f.load >= 70 ? "text-primary" : "text-warning"}`}>{f.load}%</span>
            </div>
            <Progress value={f.load} className="h-2" />
            <p className="text-[10px] text-muted-foreground">{f.booked}/{f.seats} seats</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function DelayTracker() {
  const delays = [
    { flight: "DL221", reason: "Weather (thunderstorm)", delay: "45 min", impact: "3 connections affected", severity: "high" },
    { flight: "UA589", reason: "Crew rotation", delay: "15 min", impact: "No connections affected", severity: "low" },
    { flight: "AA2187", reason: "Mechanical check", delay: "90 min", impact: "12 passengers rebooking", severity: "high" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" />Delay & Disruption Tracker</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {delays.map(d => (
          <div key={d.flight} className={`p-3 rounded-lg border ${d.severity === "high" ? "border-destructive/30 bg-destructive/5" : "border-border bg-secondary/30"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">{d.flight}</span>
              <Badge variant="outline" className={`text-[10px] ${d.severity === "high" ? "text-destructive" : "text-warning"}`}>+{d.delay}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{d.reason}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{d.impact}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
