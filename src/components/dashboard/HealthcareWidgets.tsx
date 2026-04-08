import { Heart, Clock, Users, Calendar, AlertTriangle, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function PatientFlowBoard() {
  const rooms = [
    { room: "Room 101", patient: "M. Garcia", provider: "Dr. Smith", status: "in-progress", waitTime: "0 min", type: "Consultation" },
    { room: "Room 102", patient: "K. Lee", provider: "Dr. Patel", status: "checked-in", waitTime: "12 min", type: "Follow-up" },
    { room: "Room 103", patient: "—", provider: "—", status: "available", waitTime: "—", type: "—" },
    { room: "Room 104", patient: "S. Brown", provider: "Dr. Wong", status: "in-progress", waitTime: "0 min", type: "Procedure" },
    { room: "Lab 1", patient: "J. Taylor", provider: "Tech. Adams", status: "waiting", waitTime: "25 min", type: "Blood work" },
  ];
  const statusColors: Record<string, string> = { "in-progress": "text-success", "checked-in": "text-primary", available: "text-muted-foreground", waiting: "text-warning" };

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Patient Flow Board</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {rooms.map(r => (
          <div key={r.room} className="flex items-center justify-between p-2 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-foreground w-16">{r.room}</span>
              <div>
                <p className="text-sm text-foreground">{r.patient}</p>
                <p className="text-[10px] text-muted-foreground">{r.provider} · {r.type}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs capitalize ${statusColors[r.status]}`}>{r.status}</span>
              {r.waitTime !== "—" && <p className="text-[10px] text-muted-foreground">Wait: {r.waitTime}</p>}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function NoShowPredictor() {
  const slots = [
    { time: "9:00 AM", patient: "A. Thompson", risk: 8, factors: ["Repeat patient", "Good history"] },
    { time: "10:30 AM", patient: "R. Martinez", risk: 45, factors: ["2 past no-shows", "Monday slot"] },
    { time: "11:00 AM", patient: "New Patient", risk: 32, factors: ["First visit", "No phone confirmed"] },
    { time: "2:00 PM", patient: "D. Kim", risk: 12, factors: ["Confirmed yesterday", "Regular"] },
    { time: "3:30 PM", patient: "L. Johnson", risk: 68, factors: ["3 cancellations", "Late afternoon"] },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" />AI No-Show Predictor</CardTitle></CardHeader>
      <CardContent className="space-y-2.5">
        {slots.map(s => (
          <div key={s.time} className={`p-2.5 rounded-lg border ${s.risk > 40 ? "border-destructive/20 bg-destructive/5" : "border-border"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{s.time}</span>
                <span className="text-sm font-medium text-foreground">{s.patient}</span>
              </div>
              <Badge variant="outline" className={`text-[10px] ${s.risk > 40 ? "text-destructive" : s.risk > 20 ? "text-warning" : "text-success"}`}>
                {s.risk}% risk
              </Badge>
            </div>
            <div className="flex gap-1 mt-1">
              {s.factors.map(f => <span key={f} className="text-[10px] bg-secondary/80 px-1.5 py-0.5 rounded text-muted-foreground">{f}</span>)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function WaitlistManager() {
  const waitlist = [
    { patient: "E. Williams", type: "Dermatology", priority: "urgent", waitDays: 2, preferred: "Morning" },
    { patient: "F. Anderson", type: "Orthopedics", priority: "normal", waitDays: 5, preferred: "Any" },
    { patient: "G. Thomas", type: "Cardiology", priority: "urgent", waitDays: 1, preferred: "Afternoon" },
    { patient: "H. Jackson", type: "General", priority: "normal", waitDays: 8, preferred: "Morning" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Smart Waitlist</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {waitlist.map(w => (
          <div key={w.patient} className="flex items-center justify-between p-2 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{w.patient}</p>
              <p className="text-[10px] text-muted-foreground">{w.type} · Prefers: {w.preferred}</p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className={`text-[10px] ${w.priority === "urgent" ? "text-destructive" : "text-muted-foreground"}`}>{w.priority}</Badge>
              <p className="text-[10px] text-muted-foreground">{w.waitDays}d waiting</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
