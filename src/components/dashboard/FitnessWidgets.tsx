import { Dumbbell, Users, Clock, TrendingUp, Heart, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function ClassScheduleFitness() {
  const classes = [
    { time: "6:00 AM", name: "HIIT Burn", trainer: "Alex M.", enrolled: 18, max: 20, type: "Cardio" },
    { time: "8:00 AM", name: "Power Yoga", trainer: "Sarah K.", enrolled: 15, max: 15, type: "Flexibility" },
    { time: "10:00 AM", name: "Spin Class", trainer: "Mike R.", enrolled: 22, max: 25, type: "Cardio" },
    { time: "12:00 PM", name: "Strength Training", trainer: "Lisa T.", enrolled: 8, max: 12, type: "Strength" },
    { time: "5:30 PM", name: "CrossFit", trainer: "Alex M.", enrolled: 16, max: 16, type: "Strength" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" />Today's Classes</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {classes.map(c => (
          <div key={c.time} className="flex items-center justify-between p-2 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16">{c.time}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.trainer} · {c.type}</p>
              </div>
            </div>
            <Badge variant={c.enrolled >= c.max ? "destructive" : "secondary"} className="text-[10px]">
              {c.enrolled}/{c.max}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function MemberRetention() {
  const metrics = [
    { period: "This Month", newMembers: 24, churned: 5, retention: 94 },
    { period: "Last Month", newMembers: 18, churned: 8, retention: 91 },
    { period: "2 Months Ago", newMembers: 22, churned: 6, retention: 93 },
    { period: "3 Months Ago", newMembers: 15, churned: 12, retention: 87 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" />Member Retention</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {metrics.map(m => (
          <div key={m.period} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">{m.period}</span>
              <span className="text-xs text-muted-foreground">+{m.newMembers} / -{m.churned}</span>
            </div>
            <Progress value={m.retention} className="h-1.5" />
            <p className="text-[10px] text-right text-muted-foreground">{m.retention}% retention</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function TrainerBooking() {
  const trainers = [
    { name: "Alex M.", specialties: ["HIIT", "CrossFit"], sessions: 6, rating: 4.9, available: true },
    { name: "Sarah K.", specialties: ["Yoga", "Pilates"], sessions: 5, rating: 4.8, available: false },
    { name: "Mike R.", specialties: ["Spin", "Cardio"], sessions: 4, rating: 4.7, available: true },
    { name: "Lisa T.", specialties: ["Strength", "Rehab"], sessions: 3, rating: 4.9, available: true },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Trainer Booking</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {trainers.map(t => (
          <div key={t.name} className="flex items-center justify-between p-2 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{t.name} ⭐ {t.rating}</p>
              <p className="text-[10px] text-muted-foreground">{t.specialties.join(", ")} · {t.sessions} sessions today</p>
            </div>
            <Badge variant="outline" className={`text-[10px] ${t.available ? "text-success" : "text-muted-foreground"}`}>
              {t.available ? "Available" : "Busy"}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
