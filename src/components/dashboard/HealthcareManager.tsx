import { useState } from "react";
import {
  Stethoscope, Heart, Clock, Users, Calendar, AlertTriangle, Activity,
  Plus, Search, Phone, Mail, MapPin, Star, Shield, Zap, Brain,
  CheckCircle2, XCircle, Timer, Gauge, UserCheck, UserX, Bell,
  ArrowUpRight, ArrowDownRight, DollarSign, ClipboardList,
  CalendarClock, Pill, Thermometer, FileText, BadgeCheck, CircleDot, Mic, LayoutGrid
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { IndustryConfig } from "@/lib/industryConfig";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  status: "available" | "with-patient" | "break" | "off-duty" | "emergency";
  room: string;
  patientsToday: number;
  maxPatients: number;
  nextAvailable: string;
  rating: number;
  workingHours: string;
  workingDays: string;
  slotDuration: number;
  phone: string;
  avatar: string;
}

interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  doctorId: string;
  specialization: string;
  time: string;
  duration: string;
  type: "consultation" | "follow-up" | "procedure" | "emergency" | "checkup" | "lab";
  status: "scheduled" | "checked-in" | "in-progress" | "completed" | "no-show" | "cancelled" | "rescheduled";
  fee: number;
  notes: string;
  noShowRisk: number;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  lastVisit: string;
  totalVisits: number;
  upcomingAppt: string;
  condition: string;
  doctor: string;
  status: "active" | "new" | "inactive";
  noShowCount: number;
}

interface TimeSlot {
  time: string;
  booked: number;
  capacity: number;
  doctor: string;
  type: string;
  status: "available" | "booked" | "break" | "blocked";
}

const specIcons: Record<string, string> = {
  "Cardiology": "❤️", "Dermatology": "🧴", "Orthopedics": "🦴", "General Medicine": "🩺",
  "Pediatrics": "👶", "Neurology": "🧠", "Ophthalmology": "👁️", "ENT": "👂",
  "Psychiatry": "🧘", "Surgery": "🔪"
};

const statusColors: Record<string, string> = {
  "available": "text-success", "with-patient": "text-primary", "break": "text-warning",
  "off-duty": "text-muted-foreground", "emergency": "text-destructive",
  "scheduled": "text-primary", "checked-in": "text-warning", "in-progress": "text-success",
  "completed": "text-muted-foreground", "no-show": "text-destructive", "cancelled": "text-destructive",
  "rescheduled": "text-warning", "booked": "text-primary", "blocked": "text-destructive",
  "active": "text-success", "new": "text-primary", "inactive": "text-muted-foreground",
};

const typeColors: Record<string, string> = {
  consultation: "bg-primary/15 text-primary",
  "follow-up": "bg-secondary text-secondary-foreground",
  procedure: "bg-warning/15 text-warning",
  emergency: "bg-destructive/15 text-destructive",
  checkup: "bg-success/15 text-success",
  lab: "bg-accent/30 text-accent-foreground",
};

const MOCK_DOCTORS: Doctor[] = [
  { id: "DR-001", name: "Dr. Sarah Ahmed", specialization: "Cardiology", status: "with-patient", room: "Room 101", patientsToday: 8, maxPatients: 16, nextAvailable: "10:30 AM", rating: 4.9, workingHours: "09:00–17:00", workingDays: "Mon–Sat", slotDuration: 30, phone: "+1 555-0201", avatar: "❤️" },
  { id: "DR-002", name: "Dr. Omar Khalid", specialization: "Orthopedics", status: "available", room: "Room 102", patientsToday: 5, maxPatients: 12, nextAvailable: "Now", rating: 4.8, workingHours: "08:00–16:00", workingDays: "Mon–Fri", slotDuration: 30, phone: "+1 555-0202", avatar: "🦴" },
  { id: "DR-003", name: "Dr. Aisha Malik", specialization: "Dermatology", status: "with-patient", room: "Room 103", patientsToday: 11, maxPatients: 20, nextAvailable: "11:00 AM", rating: 4.95, workingHours: "09:00–18:00", workingDays: "Mon–Sat", slotDuration: 15, phone: "+1 555-0203", avatar: "🧴" },
  { id: "DR-004", name: "Dr. Chen Wei", specialization: "Pediatrics", status: "break", room: "Room 104", patientsToday: 14, maxPatients: 24, nextAvailable: "11:30 AM", rating: 4.85, workingHours: "08:00–17:00", workingDays: "Mon–Sat", slotDuration: 15, phone: "+1 555-0204", avatar: "👶" },
  { id: "DR-005", name: "Dr. Fatima Noor", specialization: "Neurology", status: "with-patient", room: "Room 105", patientsToday: 4, maxPatients: 10, nextAvailable: "12:00 PM", rating: 4.7, workingHours: "10:00–18:00", workingDays: "Mon–Fri", slotDuration: 45, phone: "+1 555-0205", avatar: "🧠" },
  { id: "DR-006", name: "Dr. James Park", specialization: "General Medicine", status: "available", room: "Room 106", patientsToday: 9, maxPatients: 20, nextAvailable: "Now", rating: 4.6, workingHours: "08:00–16:00", workingDays: "Mon–Sat", slotDuration: 15, phone: "+1 555-0206", avatar: "🩺" },
  { id: "DR-007", name: "Dr. Maria Garcia", specialization: "Psychiatry", status: "off-duty", room: "Room 107", patientsToday: 0, maxPatients: 8, nextAvailable: "Tomorrow", rating: 4.92, workingHours: "10:00–17:00", workingDays: "Tue–Sat", slotDuration: 60, phone: "+1 555-0207", avatar: "🧘" },
  { id: "DR-008", name: "Dr. Ali Hassan", specialization: "ENT", status: "available", room: "Room 108", patientsToday: 6, maxPatients: 16, nextAvailable: "Now", rating: 4.75, workingHours: "09:00–17:00", workingDays: "Mon–Fri", slotDuration: 20, phone: "+1 555-0208", avatar: "👂" },
];

const MOCK_APPOINTMENTS: Appointment[] = [
  { id: "APT-3001", patientName: "Muhammad Ali", patientPhone: "+1 555-1001", doctorName: "Dr. Sarah Ahmed", doctorId: "DR-001", specialization: "Cardiology", time: "09:00 AM", duration: "30 min", type: "consultation", status: "completed", fee: 150, notes: "ECG required", noShowRisk: 5 },
  { id: "APT-3002", patientName: "Zara Khan", patientPhone: "+1 555-1002", doctorName: "Dr. Sarah Ahmed", doctorId: "DR-001", specialization: "Cardiology", time: "09:30 AM", duration: "30 min", type: "follow-up", status: "completed", fee: 100, notes: "Post-op check", noShowRisk: 8 },
  { id: "APT-3003", patientName: "Ravi Patel", patientPhone: "+1 555-1003", doctorName: "Dr. Sarah Ahmed", doctorId: "DR-001", specialization: "Cardiology", time: "10:00 AM", duration: "30 min", type: "procedure", status: "in-progress", fee: 300, notes: "Stress test", noShowRisk: 3 },
  { id: "APT-3004", patientName: "Emily Brown", patientPhone: "+1 555-1004", doctorName: "Dr. Aisha Malik", doctorId: "DR-003", specialization: "Dermatology", time: "10:15 AM", duration: "15 min", type: "checkup", status: "checked-in", fee: 80, notes: "Skin screening", noShowRisk: 12 },
  { id: "APT-3005", patientName: "Hassan Shah", patientPhone: "+1 555-1005", doctorName: "Dr. Omar Khalid", doctorId: "DR-002", specialization: "Orthopedics", time: "10:30 AM", duration: "30 min", type: "consultation", status: "scheduled", fee: 120, notes: "Knee pain evaluation", noShowRisk: 22 },
  { id: "APT-3006", patientName: "Lisa Chen", patientPhone: "+1 555-1006", doctorName: "Dr. Chen Wei", doctorId: "DR-004", specialization: "Pediatrics", time: "11:30 AM", duration: "15 min", type: "checkup", status: "scheduled", fee: 60, notes: "Vaccination", noShowRisk: 15 },
  { id: "APT-3007", patientName: "Ahmed Rizvi", patientPhone: "+1 555-1007", doctorName: "Dr. Fatima Noor", doctorId: "DR-005", specialization: "Neurology", time: "12:00 PM", duration: "45 min", type: "consultation", status: "scheduled", fee: 200, notes: "Migraine assessment", noShowRisk: 42 },
  { id: "APT-3008", patientName: "Sophie Turner", patientPhone: "+1 555-1008", doctorName: "Dr. James Park", doctorId: "DR-006", specialization: "General Medicine", time: "01:00 PM", duration: "15 min", type: "follow-up", status: "scheduled", fee: 60, notes: "Blood results review", noShowRisk: 8 },
  { id: "APT-3009", patientName: "— EMERGENCY —", patientPhone: "—", doctorName: "Dr. Omar Khalid", doctorId: "DR-002", specialization: "Orthopedics", time: "02:00 PM", duration: "60 min", type: "emergency", status: "scheduled", fee: 0, notes: "Fracture - ER referral", noShowRisk: 0 },
  { id: "APT-3010", patientName: "Nadia Abbas", patientPhone: "+1 555-1010", doctorName: "Dr. Ali Hassan", doctorId: "DR-008", specialization: "ENT", time: "02:30 PM", duration: "20 min", type: "consultation", status: "scheduled", fee: 100, notes: "Hearing test", noShowRisk: 55 },
];

const MOCK_PATIENTS: Patient[] = [
  { id: "PT-001", name: "Muhammad Ali", age: 52, gender: "Male", phone: "+1 555-1001", email: "mali@email.com", lastVisit: "Today", totalVisits: 12, upcomingAppt: "—", condition: "Hypertension", doctor: "Dr. Sarah Ahmed", status: "active", noShowCount: 0 },
  { id: "PT-002", name: "Zara Khan", age: 34, gender: "Female", phone: "+1 555-1002", email: "zara@email.com", lastVisit: "Today", totalVisits: 4, upcomingAppt: "Apr 20", condition: "Post-surgery", doctor: "Dr. Sarah Ahmed", status: "active", noShowCount: 1 },
  { id: "PT-003", name: "Ravi Patel", age: 45, gender: "Male", phone: "+1 555-1003", email: "ravi@email.com", lastVisit: "Today", totalVisits: 8, upcomingAppt: "—", condition: "Cardiac monitoring", doctor: "Dr. Sarah Ahmed", status: "active", noShowCount: 0 },
  { id: "PT-004", name: "Emily Brown", age: 28, gender: "Female", phone: "+1 555-1004", email: "emily@email.com", lastVisit: "Today", totalVisits: 1, upcomingAppt: "—", condition: "Skin screening", doctor: "Dr. Aisha Malik", status: "new", noShowCount: 0 },
  { id: "PT-005", name: "Hassan Shah", age: 60, gender: "Male", phone: "+1 555-1005", email: "hassan@email.com", lastVisit: "Mar 28", totalVisits: 6, upcomingAppt: "Today", condition: "Knee replacement", doctor: "Dr. Omar Khalid", status: "active", noShowCount: 2 },
  { id: "PT-006", name: "Lisa Chen", age: 4, gender: "Female", phone: "+1 555-1006", email: "lchen@email.com", lastVisit: "Feb 15", totalVisits: 10, upcomingAppt: "Today", condition: "Routine checkup", doctor: "Dr. Chen Wei", status: "active", noShowCount: 0 },
  { id: "PT-007", name: "Ahmed Rizvi", age: 38, gender: "Male", phone: "+1 555-1007", email: "arizvi@email.com", lastVisit: "Mar 10", totalVisits: 3, upcomingAppt: "Today", condition: "Chronic migraine", doctor: "Dr. Fatima Noor", status: "active", noShowCount: 3 },
  { id: "PT-008", name: "Nadia Abbas", age: 42, gender: "Female", phone: "+1 555-1008", email: "nadia@email.com", lastVisit: "Jan 20", totalVisits: 2, upcomingAppt: "Today", condition: "Hearing loss", doctor: "Dr. Ali Hassan", status: "active", noShowCount: 4 },
];

// ─── Healthcare Top Metric Cards ───
function HealthcareKPIs() {
  const triageCounts = { emergency: 5, urgent: 12, routine: 28 };
  const bedOccupancy = 82;
  const avgWaitMinutes = 18;
  const criticalAlerts = [
    { patient: "M. Garcia", alert: "Irregular heart rate detected — BP 160/95", time: "2 min ago" },
    { patient: "R. Patel", alert: "SpO₂ dropped below 92%", time: "8 min ago" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Patient Triage Status */}
      <Card className="bg-[hsl(204,100%,94%)]/40 border-[hsl(204,100%,86%)]/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(204,100%,88%)] flex items-center justify-center">
              <Activity className="w-4 h-4 text-[hsl(204,80%,40%)]" />
            </div>
            <p className="text-sm font-semibold text-foreground">Patient Triage</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center flex-1">
              <p className="text-xl font-bold text-destructive">{triageCounts.emergency}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Emergency</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center flex-1">
              <p className="text-xl font-bold text-[hsl(35,90%,50%)]">{triageCounts.urgent}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Urgent</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center flex-1">
              <p className="text-xl font-bold text-[hsl(152,60%,42%)]">{triageCounts.routine}</p>
              <p className="text-[10px] text-muted-foreground font-medium">Routine</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Live Bed Occupancy — Circular Progress */}
      <Card className="bg-[hsl(204,100%,94%)]/40 border-[hsl(204,100%,86%)]/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(174,60%,88%)] flex items-center justify-center">
              <Heart className="w-4 h-4 text-[hsl(174,60%,35%)]" />
            </div>
            <p className="text-sm font-semibold text-foreground">Bed Occupancy</p>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(174,30%,90%)" strokeWidth="7" />
                <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(174,60%,42%)" strokeWidth="7"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - bedOccupancy / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-foreground">{bedOccupancy}%</span>
                <span className="text-[9px] text-muted-foreground">Full</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Avg Wait Time */}
      <Card className="bg-[hsl(204,100%,94%)]/40 border-[hsl(204,100%,86%)]/60 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[hsl(204,100%,88%)] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[hsl(204,80%,40%)]" />
            </div>
            <p className="text-sm font-semibold text-foreground">Avg. Wait Time</p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Timer className="w-6 h-6 text-[hsl(204,80%,50%)]" />
            <span className="text-3xl font-bold text-foreground">{avgWaitMinutes}</span>
            <span className="text-sm text-muted-foreground font-medium">Mins</span>
          </div>
          <div className="flex items-center justify-center gap-1 mt-2">
            <ArrowDownRight className="w-3 h-3 text-[hsl(152,60%,42%)]" />
            <span className="text-[10px] text-[hsl(152,60%,42%)] font-medium">-3 min from yesterday</span>
          </div>
        </CardContent>
      </Card>

      {/* 4. AI Critical Alerts — Pulse */}
      <Card className={`border shadow-sm relative overflow-hidden ${criticalAlerts.length > 0 ? "bg-destructive/5 border-destructive/20 animate-[pulse_3s_ease-in-out_infinite]" : "bg-[hsl(204,100%,94%)]/40 border-[hsl(204,100%,86%)]/60"}`}>
        <CardContent className="p-4 relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${criticalAlerts.length > 0 ? "bg-destructive/15" : "bg-[hsl(152,60%,88%)]"}`}>
              <AlertTriangle className={`w-4 h-4 ${criticalAlerts.length > 0 ? "text-destructive" : "text-[hsl(152,60%,42%)]"}`} />
            </div>
            <p className="text-sm font-semibold text-foreground">AI Critical Alerts</p>
            {criticalAlerts.length > 0 && (
              <Badge variant="destructive" className="text-[10px] ml-auto">{criticalAlerts.length}</Badge>
            )}
          </div>
          {criticalAlerts.length > 0 ? (
            <div className="space-y-2">
              {criticalAlerts.map((a, i) => (
                <div key={i} className="p-2 bg-background/80 rounded-md border border-destructive/10">
                  <p className="text-xs font-medium text-foreground">{a.patient}</p>
                  <p className="text-[10px] text-muted-foreground">{a.alert}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">{a.time}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-2">
              <CheckCircle2 className="w-6 h-6 text-[hsl(152,60%,42%)] mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">All vitals normal</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Appointments Tab ───
function AppointmentsPanel() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const filtered = MOCK_APPOINTMENTS.filter(a => {
    const matchSearch = a.patientName.toLowerCase().includes(search.toLowerCase()) || a.doctorName.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const upcoming = filtered.filter(a => ["scheduled", "checked-in"].includes(a.status));
  const active = filtered.filter(a => a.status === "in-progress");
  const completed = filtered.filter(a => ["completed", "no-show", "cancelled"].includes(a.status));

  return (
    <div className="space-y-4">
      {/* AI Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">AI No-Show Alert</p>
            <p className="text-xs text-muted-foreground mt-0.5">Nadia Abbas (2:30 PM, ENT) has 55% no-show risk — 4 previous no-shows. AI suggests sending reminder & preparing waitlist patient.</p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="destructive" className="h-7 text-xs gap-1"><Bell className="w-3 h-3" />Send Reminder</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs">Activate Waitlist</Button>
            </div>
          </div>
        </div>
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 flex items-start gap-3">
          <Zap className="w-5 h-5 text-warning shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Emergency Override</p>
            <p className="text-xs text-muted-foreground mt-0.5">Emergency fracture patient added to Dr. Omar Khalid's schedule at 2:00 PM. Following appointments shifted by 30 min automatically.</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search appointments..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="checked-in">Checked In</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="no-show">No Show</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Dialog>
          <DialogTrigger asChild><Button className="bg-gradient-primary gap-2"><Plus className="w-4 h-4" />Book Appointment</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Book New Appointment</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Patient Name</Label><Input placeholder="Full name" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Phone</Label><Input placeholder="+1 555-0000" /></div>
                <div className="space-y-2"><Label>Email</Label><Input placeholder="patient@email.com" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Doctor</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                    <SelectContent>{MOCK_DOCTORS.filter(d => d.status !== "off-duty").map(d => <SelectItem key={d.id} value={d.id}>{d.avatar} {d.name} — {d.specialization}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Appointment Type</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="procedure">Procedure</SelectItem>
                      <SelectItem value="checkup">Checkup</SelectItem>
                      <SelectItem value="lab">Lab Work</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Date</Label><Input type="date" /></div>
                <div className="space-y-2"><Label>Time Slot</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select slot" /></SelectTrigger>
                    <SelectContent>
                      {["09:00 AM","09:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","01:00 PM","01:30 PM","02:00 PM","02:30 PM","03:00 PM","03:30 PM","04:00 PM"].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Input placeholder="e.g. Allergies, referral info..." /></div>
              <Button className="w-full bg-gradient-primary">Confirm Appointment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Now */}
      {active.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><Activity className="w-4 h-4 text-success" />In Progress</h3>
          <div className="space-y-2">
            {active.map(a => <AppointmentCard key={a.id} apt={a} />)}
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div>
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />Upcoming ({upcoming.length})</h3>
        <div className="space-y-2">
          {upcoming.map(a => <AppointmentCard key={a.id} apt={a} />)}
        </div>
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-muted-foreground" />Completed ({completed.length})</h3>
          <div className="space-y-2">
            {completed.map(a => <AppointmentCard key={a.id} apt={a} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ apt }: { apt: Appointment }) {
  return (
    <Card className={`transition-all hover:shadow-md ${apt.type === "emergency" ? "border-destructive/40 bg-destructive/5" : apt.noShowRisk > 40 ? "border-warning/30" : ""}`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-foreground">{apt.id}</span>
              <Badge className={`text-[10px] ${typeColors[apt.type]}`}>{apt.type}</Badge>
              <span className={`text-xs capitalize font-medium ${statusColors[apt.status]}`}>● {apt.status}</span>
              {apt.noShowRisk > 30 && (
                <Badge variant="outline" className="text-[9px] text-destructive border-destructive/30 gap-0.5">
                  <AlertTriangle className="w-2.5 h-2.5" />{apt.noShowRisk}% risk
                </Badge>
              )}
            </div>
            <p className="text-sm text-foreground mt-1 font-medium">{apt.patientName}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.time} · {apt.duration}</span>
              <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" />{apt.doctorName}</span>
              <span className="flex items-center gap-1">{specIcons[apt.specialization] || "🩺"} {apt.specialization}</span>
            </div>
            {apt.notes && <p className="text-[10px] text-muted-foreground mt-1 italic">📝 {apt.notes}</p>}
          </div>
          <div className="text-right shrink-0">
            {apt.fee > 0 && <p className="text-lg font-bold text-foreground">${apt.fee}</p>}
            {apt.fee === 0 && <Badge className="bg-destructive/15 text-destructive text-[10px]">Emergency</Badge>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Doctors Tab ───
function DoctorsPanel() {
  const [filterSpec, setFilterSpec] = useState("all");
  const filtered = MOCK_DOCTORS.filter(d => filterSpec === "all" || d.specialization === filterSpec);
  const specs = [...new Set(MOCK_DOCTORS.map(d => d.specialization))];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          <Badge variant={filterSpec === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterSpec("all")}>All ({MOCK_DOCTORS.length})</Badge>
          {specs.map(s => (
            <Badge key={s} variant={filterSpec === s ? "default" : "outline"} className="cursor-pointer" onClick={() => setFilterSpec(s)}>
              {specIcons[s]} {s}
            </Badge>
          ))}
        </div>
        <Button className="bg-gradient-primary gap-2"><Plus className="w-4 h-4" />Add Doctor</Button>
      </div>

      {/* Patient Flow Board */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Live Patient Flow</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {MOCK_DOCTORS.filter(d => d.status !== "off-duty").map(d => (
              <div key={d.id} className={`p-3 rounded-lg border ${d.status === "with-patient" ? "border-primary/30 bg-primary/5" : d.status === "break" ? "border-warning/30 bg-warning/5" : "border-border"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{d.avatar}</span>
                  <div>
                    <p className="text-xs font-bold text-foreground truncate">{d.name.replace("Dr. ", "")}</p>
                    <span className={`text-[10px] capitalize ${statusColors[d.status]}`}>● {d.status.replace("-", " ")}</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">{d.room} · {d.patientsToday}/{d.maxPatients} patients</p>
                <Progress value={(d.patientsToday / d.maxPatients) * 100} className="h-1 mt-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(d => (
          <Card key={d.id} className={`transition-all hover:shadow-md ${d.status === "off-duty" ? "opacity-60" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">{d.avatar}</div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.specialization} · {d.id}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-warning fill-warning" />
                      <span className="text-xs font-medium text-foreground">{d.rating}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs capitalize font-medium ${statusColors[d.status]}`}>● {d.status.replace("-", " ")}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{d.patientsToday}</p>
                  <p className="text-[10px] text-muted-foreground">Today</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{d.maxPatients}</p>
                  <p className="text-[10px] text-muted-foreground">Max/Day</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{d.slotDuration}m</p>
                  <p className="text-[10px] text-muted-foreground">Per Slot</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between"><span>🕐 {d.workingHours}</span><span>📅 {d.workingDays}</span></div>
                <div className="flex justify-between"><span>🏥 {d.room}</span><span>📱 {d.phone}</span></div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-foreground font-medium">Next available:</span>
                  <Badge variant="outline" className={`text-[10px] ${d.nextAvailable === "Now" ? "text-success border-success/30" : ""}`}>{d.nextAvailable}</Badge>
                </div>
              </div>
              <div className="mt-3">
                <Progress value={(d.patientsToday / d.maxPatients) * 100} className="h-1.5" />
                <p className="text-[10px] text-muted-foreground mt-1">{Math.round((d.patientsToday / d.maxPatients) * 100)}% daily capacity used</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Schedule Tab ───
function SchedulePanel() {
  const hours = ["08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","01:00","01:30","02:00","02:30","03:00","03:30","04:00","04:30"];
  const activeDoctors = MOCK_DOCTORS.filter(d => d.status !== "off-duty");

  const getSlotStatus = (doctor: string, time: string): { status: string; patient?: string; type?: string } => {
    const apt = MOCK_APPOINTMENTS.find(a => a.doctorName === doctor && a.time.replace(" ", "").toLowerCase().includes(time.replace(":","").toLowerCase().slice(0,4)));
    if (apt) return { status: apt.status, patient: apt.patientName, type: apt.type };
    if (time === "12:00" || time === "12:30") return { status: "break" };
    return { status: "available" };
  };

  const slotBg: Record<string, string> = {
    "available": "bg-success/10 border-success/20 hover:bg-success/20 cursor-pointer",
    "scheduled": "bg-primary/10 border-primary/20",
    "checked-in": "bg-warning/10 border-warning/20",
    "in-progress": "bg-primary/20 border-primary/40",
    "completed": "bg-muted/50 border-border",
    "break": "bg-secondary border-border",
    "no-show": "bg-destructive/10 border-destructive/20",
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
        <Brain className="w-5 h-5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">AI Smart Scheduling</p>
          <p className="text-xs text-muted-foreground">AI detects 3 available gaps today. Suggested: Move waitlist patient "E. Williams" (urgent, Dermatology) to Dr. Aisha Malik at 11:15 AM.</p>
          <Button size="sm" variant="outline" className="mt-2 h-7 text-xs border-primary/30 text-primary">Auto-Fill Gaps</Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: "Available", color: "bg-success/30" },
          { label: "Scheduled", color: "bg-primary/30" },
          { label: "In Progress", color: "bg-primary/50" },
          { label: "Checked In", color: "bg-warning/30" },
          { label: "Completed", color: "bg-muted" },
          { label: "Break", color: "bg-secondary" },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded ${l.color}`} />
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Schedule Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header */}
          <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${activeDoctors.length}, 1fr)` }}>
            <div className="p-2 text-xs font-bold text-muted-foreground">Time</div>
            {activeDoctors.map(d => (
              <div key={d.id} className="p-2 text-center">
                <span className="text-sm">{d.avatar}</span>
                <p className="text-[10px] font-bold text-foreground truncate">{d.name.replace("Dr. ", "")}</p>
                <span className={`text-[8px] capitalize ${statusColors[d.status]}`}>● {d.status.replace("-", " ")}</span>
              </div>
            ))}
          </div>
          {/* Rows */}
          {hours.map(h => (
            <div key={h} className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${activeDoctors.length}, 1fr)` }}>
              <div className="p-1.5 text-[10px] font-medium text-muted-foreground flex items-center">{h}</div>
              {activeDoctors.map(d => {
                const slot = getSlotStatus(d.name, h);
                return (
                  <div key={`${d.id}-${h}`} className={`p-1.5 rounded border text-center ${slotBg[slot.status] || slotBg.available}`}>
                    {slot.patient ? (
                      <>
                        <p className="text-[9px] font-medium text-foreground truncate">{slot.patient}</p>
                        <p className="text-[8px] text-muted-foreground">{slot.type}</p>
                      </>
                    ) : slot.status === "break" ? (
                      <p className="text-[9px] text-muted-foreground">☕ Break</p>
                    ) : (
                      <p className="text-[9px] text-success">+</p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* AI No-Show Predictor */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" />AI No-Show Predictor</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {MOCK_APPOINTMENTS.filter(a => a.noShowRisk > 20 && a.status === "scheduled").sort((a, b) => b.noShowRisk - a.noShowRisk).map(a => (
            <div key={a.id} className={`p-2.5 rounded-lg border ${a.noShowRisk > 40 ? "border-destructive/20 bg-destructive/5" : "border-warning/20 bg-warning/5"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{a.patientName}</p>
                  <p className="text-[10px] text-muted-foreground">{a.time} · {a.doctorName} · {a.specialization}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] ${a.noShowRisk > 40 ? "text-destructive border-destructive/30" : "text-warning border-warning/30"}`}>
                    {a.noShowRisk}% risk
                  </Badge>
                  <Button size="sm" variant="ghost" className="h-6 text-[10px]"><Bell className="w-3 h-3" /></Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Patients Tab ───
function PatientsPanel() {
  const [search, setSearch] = useState("");
  const filtered = MOCK_PATIENTS.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.condition.toLowerCase().includes(search.toLowerCase()) || p.doctor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Patients", value: MOCK_PATIENTS.length.toString(), icon: Users },
          { label: "New This Month", value: "1", icon: UserCheck },
          { label: "Active", value: MOCK_PATIENTS.filter(p => p.status === "active").length.toString(), icon: Heart },
          { label: "High No-Show Risk", value: MOCK_PATIENTS.filter(p => p.noShowCount >= 3).length.toString(), icon: AlertTriangle },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><s.icon className="w-5 h-5 text-primary" /></div>
              <div><p className="text-lg font-bold text-foreground">{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button className="bg-gradient-primary gap-2"><Plus className="w-4 h-4" />Add Patient</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(p => (
          <Card key={p.id} className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{p.name}</p>
                    <Badge variant="outline" className={`text-[9px] ${statusColors[p.status]}`}>{p.status}</Badge>
                    {p.noShowCount >= 3 && <Badge variant="outline" className="text-[9px] text-destructive border-destructive/30">⚠️ {p.noShowCount} no-shows</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.id} · {p.age}y · {p.gender}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-foreground">{p.totalVisits} visits</p>
                  <p className="text-[10px] text-muted-foreground">Last: {p.lastVisit}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><Stethoscope className="w-3 h-3" />{p.doctor}</span>
                  <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{p.condition}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{p.phone}</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{p.email}</span>
                </div>
                {p.upcomingAppt !== "—" && (
                  <div className="flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3 text-primary" />
                    <span className="text-primary font-medium">Next: {p.upcomingAppt}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Middle Row: Patient Admission Forecast ───
function AdmissionForecast() {
  const pastData = [
    { day: "Apr 6", patients: 38 },
    { day: "Apr 7", patients: 42 },
    { day: "Apr 8", patients: 35 },
    { day: "Apr 9", patients: 48 },
    { day: "Apr 10", patients: 44 },
    { day: "Apr 11", patients: 51 },
    { day: "Apr 12", patients: 46 },
  ];
  const forecastData = [
    { day: "Apr 13", patients: 52, predicted: true },
    { day: "Apr 14", patients: 58, predicted: true },
    { day: "Apr 15", patients: 63, predicted: true },
    { day: "Apr 16", patients: 55, predicted: true },
    { day: "Apr 17", patients: 49, predicted: true },
    { day: "Apr 18", patients: 61, predicted: true },
    { day: "Apr 19", patients: 67, predicted: true },
  ];
  const allData = [...pastData.map(d => ({ ...d, predicted: false })), ...forecastData];
  const maxVal = Math.max(...allData.map(d => d.patients));

  // SVG line chart points
  const chartW = 500;
  const chartH = 140;
  const padX = 10;
  const padY = 10;
  const stepX = (chartW - padX * 2) / (allData.length - 1);
  const points = allData.map((d, i) => ({
    x: padX + i * stepX,
    y: padY + (1 - (d.patients - 30) / (maxVal - 25)) * (chartH - padY * 2),
    ...d,
  }));
  const actualPts = points.filter(p => !p.predicted);
  const forecastPts = points.filter(p => p.predicted);
  // Include last actual point in forecast line for continuity
  const forecastLinePts = [points[pastData.length - 1], ...forecastPts];
  const toPath = (pts: typeof points) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  // Confidence band (±8 around forecast)
  const bandTop = forecastLinePts.map(p => `${p.x},${Math.max(padY, p.y - 12)}`).join(" L");
  const bandBottom = [...forecastLinePts].reverse().map(p => `${p.x},${Math.min(chartH - padY, p.y + 12)}`).join(" L");

  return (
    <Card className="bg-[hsl(204,100%,94%)]/40 border-[hsl(204,100%,86%)]/60 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="w-4 h-4 text-[hsl(174,60%,42%)]" />
          AI Admission Forecast
          <Badge variant="outline" className="text-[10px] ml-auto">AI Powered</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">7-day history + 7-day AI prediction with confidence bands</p>
      </CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-40">
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map(f => (
            <line key={f} x1={padX} x2={chartW - padX} y1={padY + f * (chartH - padY * 2)} y2={padY + f * (chartH - padY * 2)}
              stroke="hsl(204,20%,85%)" strokeWidth="0.5" strokeDasharray="4 4" />
          ))}
          {/* Confidence band */}
          <path d={`M${bandTop} L${bandBottom} Z`} fill="hsl(204,80%,60%)" fillOpacity="0.12" />
          {/* Actual line */}
          <path d={toPath(actualPts)} fill="none" stroke="hsl(174,60%,42%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Forecast line (dashed) */}
          <path d={toPath(forecastLinePts)} fill="none" stroke="hsl(204,80%,55%)" strokeWidth="2" strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" />
          {/* Dots */}
          {actualPts.map(p => (
            <circle key={p.day} cx={p.x} cy={p.y} r="3.5" fill="hsl(174,60%,42%)" stroke="white" strokeWidth="1.5" />
          ))}
          {forecastPts.map(p => (
            <circle key={p.day} cx={p.x} cy={p.y} r="3.5" fill="hsl(204,80%,55%)" stroke="white" strokeWidth="1.5" />
          ))}
          {/* Labels */}
          {points.map(p => (
            <g key={p.day}>
              <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[7px] fill-muted-foreground">{p.patients}</text>
              <text x={p.x} y={chartH - 1} textAnchor="middle" className={`text-[7px] ${p.predicted ? "fill-[hsl(204,80%,55%)]" : "fill-muted-foreground"}`}>
                {p.day.split(" ")[1]}
              </text>
            </g>
          ))}
        </svg>
        <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded-full bg-[hsl(174,60%,42%)]" />
            <span className="text-[10px] text-muted-foreground">Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded-full bg-[hsl(204,80%,55%)] border-t border-dashed" style={{ borderTopStyle: "dashed" }} />
            <span className="text-[10px] text-muted-foreground">AI Forecast</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2 rounded-sm bg-[hsl(204,80%,60%)]/20" />
            <span className="text-[10px] text-muted-foreground">Confidence Band</span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <ArrowUpRight className="w-3 h-3 text-[hsl(35,90%,50%)]" />
            <span className="text-[10px] text-[hsl(35,90%,50%)] font-medium">+22% expected (flu season)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Middle Row: Sentiment & Mood Heatmap ───
function SentimentHeatmap() {
  const sentimentData = { happy: 64, neutral: 22, distressed: 14 };
  const total = sentimentData.happy + sentimentData.neutral + sentimentData.distressed;
  const segments = [
    { label: "Happy", value: sentimentData.happy, pct: Math.round((sentimentData.happy / total) * 100), color: "hsl(152,60%,45%)", emoji: "😊" },
    { label: "Neutral", value: sentimentData.neutral, pct: Math.round((sentimentData.neutral / total) * 100), color: "hsl(40,90%,55%)", emoji: "😐" },
    { label: "Distressed", value: sentimentData.distressed, pct: Math.round((sentimentData.distressed / total) * 100), color: "hsl(0,70%,60%)", emoji: "😟" },
  ];

  // SVG donut
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <Card className="bg-[hsl(204,100%,94%)]/40 border-[hsl(204,100%,86%)]/60 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Heart className="w-4 h-4 text-[hsl(0,70%,60%)]" />
          Patient Sentiment
          <Badge variant="outline" className="text-[10px] ml-auto">Live</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">Real-time patient mood from feedback & nurse inputs</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Donut Chart */}
          <div className="relative w-32 h-32 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {segments.map((seg) => {
                const dashLength = (seg.pct / 100) * circumference;
                const currentOffset = offset;
                offset += dashLength;
                return (
                  <circle
                    key={seg.label}
                    cx="50" cy="50" r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="10"
                    strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                    strokeDashoffset={-currentOffset}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-foreground">{total}</span>
              <span className="text-[9px] text-muted-foreground">Responses</span>
            </div>
          </div>

          {/* Legend + Details */}
          <div className="flex-1 space-y-3">
            {segments.map(seg => (
              <div key={seg.label} className="flex items-center gap-3">
                <span className="text-lg">{seg.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-foreground">{seg.label}</span>
                    <span className="text-sm font-bold text-foreground">{seg.value} ({seg.pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${seg.pct}%`, backgroundColor: seg.color }} />
                  </div>
                </div>
              </div>
            ))}
            {sentimentData.distressed > 10 && (
              <div className="p-2 bg-destructive/5 rounded-md border border-destructive/10 flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground">
                  <strong className="text-destructive">Alert:</strong> Distressed count above threshold — AI recommends wellness check rounds
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Bottom Row: Critical Patient Monitor ───
function CriticalPatientMonitor() {
  const criticalPatients = [
    { name: "M. Garcia", room: "ICU-3", score: 98, condition: "Irregular HR, BP 160/95", sentiment: "😡", specialist: "Cardiologist", critical: true },
    { name: "R. Patel", room: "Room 201", score: 91, condition: "SpO₂ 89%, post-op fever", sentiment: "😟", specialist: "Pulmonologist", critical: true },
    { name: "A. Thompson", room: "Room 105", score: 74, condition: "Diabetic ketoacidosis risk", sentiment: "😐", specialist: "Endocrinologist", critical: false },
    { name: "K. Lee", room: "Room 302", score: 62, condition: "Elevated WBC, awaiting labs", sentiment: "😐", specialist: "Internal Medicine", critical: false },
    { name: "J. Taylor", room: "Room 108", score: 45, condition: "Stable, scheduled discharge", sentiment: "😊", specialist: "General", critical: false },
    { name: "S. Brown", room: "Room 204", score: 38, condition: "Routine post-op recovery", sentiment: "😊", specialist: "Surgeon", critical: false },
  ];

  return (
    <Card className="bg-[hsl(204,100%,94%)]/40 border-[hsl(204,100%,86%)]/60 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-destructive" />
            Critical Patient Monitor
            <Badge variant="outline" className="text-[10px]">AI Scored</Badge>
          </CardTitle>
          <Badge variant="destructive" className="text-[10px]">
            {criticalPatients.filter(p => p.critical).length} Critical
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">AI-prioritized patient list — attend highest scores first</p>
      </CardHeader>
      <CardContent>
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">
          <div className="col-span-3">Patient</div>
          <div className="col-span-1 text-center">Room</div>
          <div className="col-span-1 text-center">Score</div>
          <div className="col-span-1 text-center">Mood</div>
          <div className="col-span-3">Condition</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-border/30">
          {criticalPatients.map((p, i) => (
            <div
              key={p.name}
              className={`grid grid-cols-12 gap-2 px-3 py-3 items-center transition-colors ${
                p.critical ? "bg-[hsl(0,86%,97%)] dark:bg-destructive/5" : "hover:bg-muted/30"
              }`}
            >
              {/* Patient Name */}
              <div className="col-span-3 flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  p.critical ? "bg-destructive/15 text-destructive" : "bg-primary/10 text-primary"
                }`}>
                  {p.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  {p.critical && <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5">CRITICAL</Badge>}
                </div>
              </div>

              {/* Room */}
              <div className="col-span-1 text-center">
                <Badge variant="outline" className="text-[10px]">{p.room}</Badge>
              </div>

              {/* AI Score */}
              <div className="col-span-1 text-center">
                <span className={`text-sm font-bold ${
                  p.score >= 90 ? "text-destructive" : p.score >= 60 ? "text-[hsl(35,90%,50%)]" : "text-[hsl(152,60%,42%)]"
                }`}>
                  {p.score}
                </span>
              </div>

              {/* Sentiment */}
              <div className="col-span-1 text-center text-lg">{p.sentiment}</div>

              {/* Condition */}
              <div className="col-span-3">
                <p className="text-xs text-muted-foreground">{p.condition}</p>
              </div>

              {/* Actions */}
              <div className="col-span-3 flex items-center justify-end gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] gap-1 border-purple-300 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10"
                  onClick={() => toast.info(`AI Scribe activated for ${p.name} — speak your notes now`)}
                >
                  <Mic className="w-3 h-3" />
                  AI Scribe
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-[10px] gap-1 border-blue-300 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                  onClick={() => toast.success(`Alert sent to ${p.specialist} for ${p.name}`)}
                >
                  <Bell className="w-3 h-3" />
                  {p.specialist}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── AI Bed-Traffic & Discharge Predictor ───
function BedDischargePredictor() {
  const dischargePatients = [
    { name: "J. Taylor", room: "Room 108", probability: 94, reason: "Vitals stable 48h, wound healing well", eta: "Tomorrow AM" },
    { name: "S. Brown", room: "Room 204", probability: 88, reason: "Post-op recovery on track, no complications", eta: "Tomorrow PM" },
    { name: "F. Anderson", room: "Room 301", probability: 82, reason: "Lab results normal, awaiting final review", eta: "Tomorrow AM" },
    { name: "D. Kim", room: "Room 112", probability: 75, reason: "Responding well to antibiotics, temp normalized", eta: "Tomorrow PM" },
    { name: "L. Johnson", room: "Room 205", probability: 61, reason: "Mobility improving, PT clearance pending", eta: "48h" },
    { name: "H. Jackson", room: "ICU-2", probability: 42, reason: "Stable but monitoring BP fluctuations", eta: "72h+" },
  ];

  const bedsFreeing = dischargePatients.filter(p => p.probability >= 75).length;

  return (
    <Card className="bg-[hsl(204,100%,94%)]/40 border-[hsl(204,100%,86%)]/60 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="w-4 h-4 text-[hsl(174,60%,42%)]" />
            AI Bed-Traffic & Discharge Predictor
            <Badge variant="outline" className="text-[10px]">Next 24h</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="bg-[hsl(174,60%,42%)]/15 text-[hsl(174,60%,35%)] border-[hsl(174,60%,42%)]/20 text-[10px]">
              ~{bedsFreeing} beds freeing soon
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">AI predicts which patients are likely to be discharged — plan new admissions ahead</p>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {dischargePatients.map(p => (
          <div key={p.name} className="flex items-center gap-3 p-2.5 rounded-lg bg-background/60 border border-border/30">
            <div className="w-7 h-7 rounded-full bg-[hsl(174,60%,42%)]/10 flex items-center justify-center text-xs font-bold text-[hsl(174,60%,42%)]">
              {p.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-foreground">{p.name}</span>
                <Badge variant="outline" className="text-[9px]">{p.room}</Badge>
                <span className="text-[10px] text-muted-foreground ml-auto">ETA: {p.eta}</span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{p.reason}</p>
            </div>
            <div className="w-28 shrink-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] text-muted-foreground">Discharge</span>
                <span className={`text-xs font-bold ${
                  p.probability >= 80 ? "text-[hsl(152,60%,42%)]" : p.probability >= 60 ? "text-[hsl(35,90%,50%)]" : "text-muted-foreground"
                }`}>{p.probability}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${p.probability}%`,
                    backgroundColor: p.probability >= 80 ? "hsl(152,60%,42%)" : p.probability >= 60 ? "hsl(35,90%,50%)" : "hsl(220,10%,70%)",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Incoming Ambulance / Emergency Alerts ───
function AmbulanceAlerts() {
  const alerts = [
    { id: "AMB-01", eta: "4 min", patient: "Male, ~55y", condition: "Chest pain, suspected MI", severity: "critical", from: "Downtown Station" },
    { id: "AMB-02", eta: "12 min", patient: "Female, ~30y", condition: "Severe allergic reaction", severity: "high", from: "West District" },
    { id: "AMB-03", eta: "18 min", patient: "Child, ~8y", condition: "Fractured arm, stable", severity: "moderate", from: "School Zone 4" },
    { id: "AMB-04", eta: "25 min", patient: "Male, ~70y", condition: "Difficulty breathing, COPD history", severity: "high", from: "Nursing Home" },
  ];

  return (
    <Card className="bg-[hsl(204,100%,94%)]/40 border-[hsl(204,100%,86%)]/60 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-destructive" />
          Incoming Emergency Alerts
          <span className="relative flex h-2.5 w-2.5 ml-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(152,70%,45%)] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(152,70%,45%)]" />
          </span>
          <Badge variant="outline" className="text-[10px] ml-auto">Live</Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">Ambulance dispatch feed — prepare rooms & staff</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.map(a => (
          <div key={a.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${
            a.severity === "critical" ? "bg-[hsl(0,86%,97%)] border-destructive/15 dark:bg-destructive/5" : "bg-background/60 border-border/30"
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              a.severity === "critical" ? "bg-destructive/15 text-destructive" : a.severity === "high" ? "bg-[hsl(35,90%,50%)]/15 text-[hsl(35,90%,50%)]" : "bg-primary/10 text-primary"
            }`}>
              {a.eta.split(" ")[0]}m
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{a.patient}</span>
                <Badge variant={a.severity === "critical" ? "destructive" : "outline"} className="text-[9px]">{a.severity}</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">{a.condition}</p>
              <p className="text-[9px] text-muted-foreground">From: {a.from} · ETA: {a.eta}</p>
            </div>
            <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 shrink-0" onClick={() => toast.info(`Room prep initiated for ${a.id}`)}>
              <CheckCircle2 className="w-3 h-3" />Prep Room
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Staffing Optimization Indicator ───
function StaffingOptimizer() {
  const departments = [
    { name: "ICU", nurses: 4, needed: 6, patients: 8, criticalCount: 5, status: "understaffed" },
    { name: "Emergency", nurses: 6, needed: 7, patients: 12, criticalCount: 3, status: "understaffed" },
    { name: "General Ward", nurses: 8, needed: 6, patients: 18, criticalCount: 0, status: "optimal" },
    { name: "Pediatrics", nurses: 3, needed: 3, patients: 6, criticalCount: 1, status: "optimal" },
    { name: "Surgery Recovery", nurses: 2, needed: 4, patients: 7, criticalCount: 2, status: "understaffed" },
  ];

  const understaffed = departments.filter(d => d.status === "understaffed").length;

  return (
    <Card className="bg-[hsl(204,100%,94%)]/40 border-[hsl(204,100%,86%)]/60 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            AI Staffing Optimizer
            <span className="relative flex h-2.5 w-2.5 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(152,70%,45%)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(152,70%,45%)]" />
            </span>
          </CardTitle>
          {understaffed > 0 && (
            <Badge variant="destructive" className="text-[10px]">{understaffed} need attention</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">AI recommends nurse allocation based on patient critical scores</p>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {departments.map(d => (
          <div key={d.name} className={`p-2.5 rounded-lg border ${
            d.status === "understaffed" ? "bg-[hsl(0,86%,97%)] border-destructive/15 dark:bg-destructive/5" : "bg-background/60 border-border/30"
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{d.name}</span>
                {d.status === "understaffed" && (
                  <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5">NEED STAFF</Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span>{d.patients} patients</span>
                <span>{d.criticalCount} critical</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((d.nurses / d.needed) * 100, 100)}%`,
                    backgroundColor: d.nurses >= d.needed ? "hsl(152,60%,42%)" : d.nurses >= d.needed * 0.7 ? "hsl(35,90%,50%)" : "hsl(0,70%,55%)",
                  }}
                />
              </div>
              <span className={`text-xs font-bold ${d.nurses >= d.needed ? "text-[hsl(152,60%,42%)]" : "text-destructive"}`}>
                {d.nurses}/{d.needed}
              </span>
            </div>
            {d.status === "understaffed" && (
              <p className="text-[10px] text-destructive mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                AI suggests +{d.needed - d.nurses} nurse(s) — {d.criticalCount} critical patients need closer monitoring
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── AI Ward-Map Heatmap ───
function WardMapHeatmap() {
  const wards = [
    { name: "ICU", floor: 3, beds: 12, occupied: 11, critical: 4, x: 10, y: 10, w: 28, h: 40 },
    { name: "Emergency", floor: 1, beds: 20, occupied: 18, critical: 6, x: 42, y: 10, w: 25, h: 40 },
    { name: "Ward A", floor: 2, beds: 30, occupied: 22, critical: 1, x: 71, y: 10, w: 25, h: 18 },
    { name: "Ward B", floor: 2, beds: 28, occupied: 25, critical: 3, x: 71, y: 32, w: 25, h: 18 },
    { name: "Pediatrics", floor: 1, beds: 15, occupied: 9, critical: 0, x: 10, y: 55, w: 22, h: 35 },
    { name: "Surgery", floor: 3, beds: 8, occupied: 7, critical: 2, x: 36, y: 55, w: 20, h: 35 },
    { name: "Maternity", floor: 1, beds: 18, occupied: 12, critical: 0, x: 60, y: 55, w: 18, h: 35 },
    { name: "Rehab", floor: 2, beds: 16, occupied: 10, critical: 0, x: 82, y: 55, w: 14, h: 35 },
  ];

  const getHeatColor = (critical: number, occupied: number, beds: number) => {
    if (critical >= 4) return { bg: "hsl(0,70%,55%)", glow: "hsl(0,70%,55%)", label: "Critical" };
    if (critical >= 2) return { bg: "hsl(25,90%,55%)", glow: "hsl(25,90%,55%)", label: "High" };
    if (occupied / beds > 0.85) return { bg: "hsl(45,90%,50%)", glow: "hsl(45,90%,50%)", label: "Busy" };
    return { bg: "hsl(152,60%,42%)", glow: "hsl(152,60%,42%)", label: "Normal" };
  };

  const totalCritical = wards.reduce((s, w) => s + w.critical, 0);

  return (
    <Card className="bg-[hsl(204,100%,94%)]/40 border-[hsl(204,100%,86%)]/60 shadow-sm backdrop-blur-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-primary" />
            AI Ward-Map Heatmap
            <span className="relative flex h-2.5 w-2.5 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(152,70%,45%)] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[hsl(152,70%,45%)]" />
            </span>
          </CardTitle>
          <Badge className="bg-[hsl(204,100%,94%)] text-primary border-primary/20 text-[10px]">
            {totalCritical} critical zones
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">Real-time spatial view — ward urgency at a glance</p>
      </CardHeader>
      <CardContent>
        <div className="relative w-full rounded-xl border border-border/40 bg-background/80 overflow-hidden" style={{ aspectRatio: "2.2/1" }}>
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "10% 10%",
          }} />

          {wards.map(ward => {
            const heat = getHeatColor(ward.critical, ward.occupied, ward.beds);
            return (
              <div
                key={ward.name}
                className="absolute rounded-lg border flex flex-col items-center justify-center cursor-default transition-all duration-300 hover:scale-[1.04] hover:z-10 group"
                style={{
                  left: `${ward.x}%`, top: `${ward.y}%`, width: `${ward.w}%`, height: `${ward.h}%`,
                  backgroundColor: `${heat.bg}20`,
                  borderColor: `${heat.bg}60`,
                  boxShadow: ward.critical >= 2 ? `0 0 12px ${heat.glow}30` : "none",
                }}
              >
                {/* Pulse dot for critical */}
                {ward.critical >= 2 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute h-full w-full rounded-full opacity-75" style={{ backgroundColor: heat.bg }} />
                    <span className="relative rounded-full h-2 w-2" style={{ backgroundColor: heat.bg }} />
                  </span>
                )}
                <span className="text-[10px] sm:text-xs font-bold text-foreground">{ward.name}</span>
                <span className="text-[8px] sm:text-[10px] text-muted-foreground">{ward.occupied}/{ward.beds} beds</span>
                {ward.critical > 0 && (
                  <span className="text-[8px] font-semibold mt-0.5" style={{ color: heat.bg }}>
                    {ward.critical} critical
                  </span>
                )}

                {/* Hover tooltip */}
                <div className="hidden group-hover:flex absolute -top-14 left-1/2 -translate-x-1/2 bg-popover border rounded-lg shadow-lg p-2 z-20 min-w-[120px] flex-col items-center">
                  <span className="text-[10px] font-bold text-foreground">{ward.name} — Floor {ward.floor}</span>
                  <span className="text-[9px] text-muted-foreground">{ward.occupied}/{ward.beds} occupied · {ward.critical} critical</span>
                  <Badge className="mt-1 text-[8px] px-1.5 py-0" style={{ backgroundColor: `${heat.bg}20`, color: heat.bg, borderColor: `${heat.bg}40` }}>
                    {heat.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3">
          {[
            { color: "hsl(152,60%,42%)", label: "Normal" },
            { color: "hsl(45,90%,50%)", label: "Busy" },
            { color: "hsl(25,90%,55%)", label: "High" },
            { color: "hsl(0,70%,55%)", label: "Critical" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-[10px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───
export default function HealthcareManager({ config }: { config: IndustryConfig }) {
  return (
    <div className="space-y-6">
      <HealthcareKPIs />

      {/* Middle Row: Intelligence Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdmissionForecast />
        <SentimentHeatmap />
      </div>

      {/* Bottom Row: Action Center */}
      <CriticalPatientMonitor />

      {/* AI Bed-Traffic & Discharge Predictor */}
      <BedDischargePredictor />

      {/* AI Resource Predictor: Ambulance + Staffing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AmbulanceAlerts />
        <StaffingOptimizer />
      </div>

      {/* AI Ward-Map Heatmap */}
      <WardMapHeatmap />

      <Tabs defaultValue="appointments" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto lg:inline-grid gap-1">
          <TabsTrigger value="appointments" className="gap-1.5 text-xs md:text-sm"><ClipboardList className="w-3.5 h-3.5" />Appointments</TabsTrigger>
          <TabsTrigger value="doctors" className="gap-1.5 text-xs md:text-sm"><Stethoscope className="w-3.5 h-3.5" />Doctors</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5 text-xs md:text-sm"><CalendarClock className="w-3.5 h-3.5" />Schedule</TabsTrigger>
          <TabsTrigger value="patients" className="gap-1.5 text-xs md:text-sm"><Users className="w-3.5 h-3.5" />Patients</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments"><AppointmentsPanel /></TabsContent>
        <TabsContent value="doctors"><DoctorsPanel /></TabsContent>
        <TabsContent value="schedule"><SchedulePanel /></TabsContent>
        <TabsContent value="patients"><PatientsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
