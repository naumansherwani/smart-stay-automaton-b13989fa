import { Scale, Clock, Users, FileText, DollarSign, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CourtDateTracker() {
  const cases = [
    { case: "Smith v. Corp", court: "District Court", date: "Apr 10", time: "9:00 AM", attorney: "J. Anderson", type: "Hearing" },
    { case: "Estate of Johnson", court: "Probate", date: "Apr 12", time: "2:00 PM", attorney: "M. Williams", type: "Filing" },
    { case: "Lee v. State", court: "Appeals", date: "Apr 15", time: "10:30 AM", attorney: "S. Park", type: "Oral Argument" },
    { case: "Davis Contract", court: "—", date: "Apr 11", time: "3:00 PM", attorney: "J. Anderson", type: "Mediation" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Scale className="w-4 h-4 text-primary" />Court Dates & Deadlines</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {cases.map(c => (
          <div key={c.case} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{c.case}</p>
              <p className="text-[10px] text-muted-foreground">{c.court} · {c.attorney}</p>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-[10px]">{c.type}</Badge>
              <p className="text-[10px] text-muted-foreground">{c.date} {c.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function BillableHoursTracker() {
  const attorneys = [
    { name: "J. Anderson", billed: 32.5, target: 40, rate: "$350", revenue: "$11,375" },
    { name: "M. Williams", billed: 38, target: 40, rate: "$400", revenue: "$15,200" },
    { name: "S. Park", billed: 28, target: 35, rate: "$300", revenue: "$8,400" },
    { name: "L. Chen", billed: 42, target: 40, rate: "$450", revenue: "$18,900" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />Billable Hours This Week</CardTitle></CardHeader>
      <CardContent className="space-y-2.5">
        {attorneys.map(a => (
          <div key={a.name} className="p-2.5 rounded-lg border border-border space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{a.name}</span>
              <span className="text-sm font-bold text-foreground">{a.revenue}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>{a.billed}/{a.target}h · {a.rate}/hr</span>
              <span className={a.billed >= a.target ? "text-success" : "text-warning"}>{Math.round((a.billed / a.target) * 100)}% target</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function CaseDeadlines() {
  const deadlines = [
    { case: "Smith v. Corp", deadline: "Motion to Dismiss", due: "Apr 9", daysLeft: 1, priority: "urgent" },
    { case: "Lee v. State", deadline: "Brief Filing", due: "Apr 14", daysLeft: 6, priority: "normal" },
    { case: "Davis Contract", deadline: "Discovery Response", due: "Apr 10", daysLeft: 2, priority: "urgent" },
    { case: "Johnson Estate", deadline: "Inventory Filing", due: "Apr 20", daysLeft: 12, priority: "low" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" />Case Deadlines</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {deadlines.map(d => (
          <div key={d.deadline} className={`p-2.5 rounded-lg border ${d.priority === "urgent" ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{d.deadline}</span>
              <Badge variant="outline" className={`text-[10px] ${d.priority === "urgent" ? "text-destructive" : d.priority === "normal" ? "text-primary" : "text-muted-foreground"}`}>
                {d.daysLeft}d left
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">{d.case} · Due: {d.due}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
