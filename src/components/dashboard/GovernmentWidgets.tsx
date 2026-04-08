import { Landmark, Users, Clock, FileText, Shield, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function CitizenAppointments() {
  const appointments = [
    { time: "9:00 AM", citizen: "R. Thompson", service: "Passport Renewal", window: "W-3", status: "in-progress" },
    { time: "9:15 AM", citizen: "M. Garcia", service: "Driver's License", window: "W-1", status: "waiting" },
    { time: "9:30 AM", citizen: "K. Lee", service: "Property Tax", window: "—", status: "scheduled" },
    { time: "9:45 AM", citizen: "S. Brown", service: "Building Permit", window: "W-5", status: "in-progress" },
    { time: "10:00 AM", citizen: "J. Davis", service: "Birth Certificate", window: "—", status: "scheduled" },
  ];
  const statusColors: Record<string, string> = { "in-progress": "text-success", waiting: "text-warning", scheduled: "text-primary" };

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />Citizen Appointments</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {appointments.map(a => (
          <div key={a.time + a.citizen} className="flex items-center justify-between p-2 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16">{a.time}</span>
              <div>
                <p className="text-sm text-foreground">{a.citizen}</p>
                <p className="text-[10px] text-muted-foreground">{a.service} · {a.window !== "—" ? a.window : "Pending"}</p>
              </div>
            </div>
            <span className={`text-xs capitalize ${statusColors[a.status]}`}>{a.status}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function QueueManagement() {
  const queues = [
    { service: "Passport Services", waiting: 8, avgWait: "22 min", windows: 3, active: 2 },
    { service: "Driver's License", waiting: 12, avgWait: "35 min", windows: 4, active: 4 },
    { service: "Property Tax", waiting: 3, avgWait: "10 min", windows: 2, active: 1 },
    { service: "Building Permits", waiting: 5, avgWait: "18 min", windows: 2, active: 2 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Queue Management</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {queues.map(q => (
          <div key={q.service} className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">{q.service}</span>
              <span className="text-xs text-muted-foreground">{q.waiting} waiting · ~{q.avgWait}</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={(q.active / q.windows) * 100} className="h-1.5 flex-1" />
              <span className="text-[10px] text-muted-foreground">{q.active}/{q.windows} windows</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function ServiceSatisfaction() {
  const services = [
    { name: "Passport", rating: 4.2, responses: 156, trend: "+0.3" },
    { name: "License", rating: 3.8, responses: 234, trend: "-0.1" },
    { name: "Tax", rating: 4.5, responses: 89, trend: "+0.5" },
    { name: "Permits", rating: 3.6, responses: 67, trend: "+0.2" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-primary" />Citizen Satisfaction</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {services.map(s => (
          <div key={s.name} className="flex items-center justify-between p-2 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{s.name}</p>
              <p className="text-[10px] text-muted-foreground">{s.responses} responses</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-foreground">⭐ {s.rating}</span>
              <p className={`text-[10px] ${s.trend.startsWith("+") ? "text-success" : "text-destructive"}`}>{s.trend}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
