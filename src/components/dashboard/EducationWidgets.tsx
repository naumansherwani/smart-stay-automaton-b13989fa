import { GraduationCap, Users, Clock, BarChart3, Calendar, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function ClassScheduleBoard() {
  const classes = [
    { time: "8:00 AM", name: "Advanced Mathematics", room: "Room 201", instructor: "Prof. Miller", enrolled: 28, max: 30 },
    { time: "9:30 AM", name: "Physics Lab", room: "Lab B", instructor: "Dr. Chen", enrolled: 18, max: 20 },
    { time: "11:00 AM", name: "English Literature", room: "Room 105", instructor: "Prof. Davis", enrolled: 35, max: 40 },
    { time: "1:00 PM", name: "Computer Science", room: "Lab A", instructor: "Dr. Park", enrolled: 25, max: 25 },
    { time: "2:30 PM", name: "Art History", room: "Room 302", instructor: "Prof. Lee", enrolled: 12, max: 30 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" />Today's Class Schedule</CardTitle></CardHeader>
      <CardContent className="space-y-2.5">
        {classes.map(c => (
          <div key={c.time} className="flex items-center justify-between p-2 rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16">{c.time}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.instructor} · {c.room}</p>
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

export function AttendanceTracker() {
  const courses = [
    { name: "Mathematics", rate: 92, trend: "+2%" },
    { name: "Physics", rate: 88, trend: "+1%" },
    { name: "English", rate: 85, trend: "-3%" },
    { name: "Comp. Science", rate: 95, trend: "+4%" },
    { name: "Art History", rate: 72, trend: "-5%" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4 text-primary" />Attendance Tracker</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {courses.map(c => (
          <div key={c.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">{c.name}</span>
              <span className={`text-xs ${c.trend.startsWith("+") ? "text-success" : "text-destructive"}`}>{c.rate}% {c.trend}</span>
            </div>
            <Progress value={c.rate} className="h-1.5" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function InstructorAvailability() {
  const instructors = [
    { name: "Prof. Miller", dept: "Mathematics", classes: 4, hoursLeft: 6, status: "teaching" },
    { name: "Dr. Chen", dept: "Physics", classes: 3, hoursLeft: 8, status: "available" },
    { name: "Prof. Davis", dept: "English", classes: 5, hoursLeft: 2, status: "teaching" },
    { name: "Dr. Park", dept: "CS", classes: 3, hoursLeft: 5, status: "office-hours" },
  ];
  const statusColors: Record<string, string> = { teaching: "text-primary", available: "text-success", "office-hours": "text-warning" };

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" />Instructor Availability</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {instructors.map(i => (
          <div key={i.name} className="flex items-center justify-between p-2 rounded-lg border border-border">
            <div>
              <p className="text-sm font-medium text-foreground">{i.name}</p>
              <p className="text-[10px] text-muted-foreground">{i.dept} · {i.classes} classes today</p>
            </div>
            <div className="text-right">
              <span className={`text-xs capitalize ${statusColors[i.status]}`}>{i.status}</span>
              <p className="text-[10px] text-muted-foreground">{i.hoursLeft}h available</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
