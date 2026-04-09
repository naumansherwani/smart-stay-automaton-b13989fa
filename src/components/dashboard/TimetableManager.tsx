import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus, Edit2, Trash2, GraduationCap, BookOpen, Users, Clock,
  MapPin, AlertTriangle, CheckCircle2, XCircle, Calendar,
  Shield, Sparkles, RefreshCw, Copy, UserX, DoorOpen, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { IndustryConfig } from "@/lib/industryConfig";

interface Resource {
  id: string;
  name: string;
  location: string | null;
  max_capacity: number | null;
  is_active: boolean | null;
  business_type: string | null;
  metadata: Record<string, unknown> | null;
}

interface ClassEntry {
  id: string;
  guest_name: string; // class name
  resource_id: string; // room
  check_in: string;
  check_out: string;
  status: string;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  assigned_staff: string[] | null;
  platform: string | null;
}

interface TimetableManagerProps {
  config: IndustryConfig;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const h = 7 + i;
  return `${h.toString().padStart(2, "0")}:00`;
});

const SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English",
  "Computer Science", "History", "Geography", "Art", "Music",
  "Physical Education", "Economics", "Psychology", "Philosophy",
  "Engineering", "Law", "Medicine", "Business Studies",
];

const CLASS_COLORS: Record<string, string> = {
  Mathematics: "bg-blue-500/80",
  Physics: "bg-purple-500/80",
  Chemistry: "bg-green-500/80",
  Biology: "bg-emerald-500/80",
  English: "bg-amber-500/80",
  "Computer Science": "bg-cyan-500/80",
  History: "bg-orange-500/80",
  Geography: "bg-teal-500/80",
  Art: "bg-pink-500/80",
  Music: "bg-violet-500/80",
  "Physical Education": "bg-red-500/80",
  Economics: "bg-indigo-500/80",
  default: "bg-primary/80",
};

const getClassColor = (name: string) => {
  for (const [key, color] of Object.entries(CLASS_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return CLASS_COLORS.default;
};

const TimetableManager = ({ config }: TimetableManagerProps) => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Resource[]>([]);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("timetable");

  // Class form
  const [classDialogOpen, setClassDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassEntry | null>(null);
  const [classForm, setClassForm] = useState({
    name: "",
    room_id: "",
    teacher: "",
    day: "Monday",
    start_time: "09:00",
    end_time: "10:00",
    subject: "",
    enrolled: "0",
    max_students: "30",
    recurring: true,
  });

  // Room form
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Resource | null>(null);
  const [roomForm, setRoomForm] = useState({
    name: "",
    location: "",
    max_capacity: "30",
    room_type: "lecture",
    has_projector: true,
    has_whiteboard: true,
    has_computers: false,
  });

  const fetchData = async () => {
    if (!user) return;
    const [rRes, cRes] = await Promise.all([
      supabase.from("resources").select("*").eq("user_id", user.id).eq("industry", "education").order("name"),
      supabase.from("bookings").select("*").eq("user_id", user.id).order("check_in"),
    ]);
    if (rRes.data) setRooms(rRes.data as unknown as Resource[]);
    if (cRes.data) setClasses(cRes.data as unknown as ClassEntry[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("education-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "resources", filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Extract teachers from class metadata
  const teachers = useMemo(() => {
    const set = new Set<string>();
    classes.forEach(c => {
      const teacher = (c.metadata as any)?.teacher;
      if (teacher) set.add(teacher);
    });
    return Array.from(set).sort();
  }, [classes]);

  // Conflict detection
  const getConflicts = useMemo(() => {
    const conflicts: { type: string; message: string; classIds: string[] }[] = [];
    
    for (let i = 0; i < classes.length; i++) {
      for (let j = i + 1; j < classes.length; j++) {
        const a = classes[i];
        const b = classes[j];
        if (a.status === "cancelled" || b.status === "cancelled") continue;
        
        const aDay = (a.metadata as any)?.day;
        const bDay = (b.metadata as any)?.day;
        if (aDay !== bDay) continue;

        const aStart = a.check_in;
        const aEnd = a.check_out;
        const bStart = b.check_in;
        const bEnd = b.check_out;

        // Time overlap check
        if (aStart < bEnd && bStart < aEnd) {
          // Room conflict
          if (a.resource_id === b.resource_id) {
            const roomName = rooms.find(r => r.id === a.resource_id)?.name || "Unknown Room";
            conflicts.push({
              type: "room",
              message: `Room conflict: ${roomName} is double-booked on ${aDay} (${a.guest_name} & ${b.guest_name})`,
              classIds: [a.id, b.id],
            });
          }
          // Teacher conflict
          const aTeacher = (a.metadata as any)?.teacher;
          const bTeacher = (b.metadata as any)?.teacher;
          if (aTeacher && bTeacher && aTeacher === bTeacher) {
            conflicts.push({
              type: "teacher",
              message: `Teacher conflict: ${aTeacher} has overlapping classes on ${aDay} (${a.guest_name} & ${b.guest_name})`,
              classIds: [a.id, b.id],
            });
          }
        }
      }
    }
    return conflicts;
  }, [classes, rooms]);

  const conflictClassIds = new Set(getConflicts.flatMap(c => c.classIds));

  // Get classes for a specific day and time
  const getClassesForSlot = (day: string, time: string) => {
    return classes.filter(c => {
      if (c.status === "cancelled") return false;
      const cDay = (c.metadata as any)?.day;
      const startTime = (c.metadata as any)?.start_time;
      return cDay === day && startTime === time;
    });
  };

  // Teacher's schedule for a day
  const getTeacherSchedule = (teacher: string, day: string) => {
    return classes.filter(c => {
      const t = (c.metadata as any)?.teacher;
      const d = (c.metadata as any)?.day;
      return t === teacher && d === day && c.status !== "cancelled";
    }).sort((a, b) => {
      const aTime = (a.metadata as any)?.start_time || "";
      const bTime = (b.metadata as any)?.start_time || "";
      return aTime.localeCompare(bTime);
    });
  };

  // Check for conflicts before saving
  const checkConflict = (roomId: string, teacher: string, day: string, startTime: string, endTime: string, excludeId?: string) => {
    for (const c of classes) {
      if (c.id === excludeId || c.status === "cancelled") continue;
      const cDay = (c.metadata as any)?.day;
      if (cDay !== day) continue;
      const cStart = (c.metadata as any)?.start_time || "";
      const cEnd = (c.metadata as any)?.end_time || "";
      if (startTime < cEnd && cStart < endTime) {
        if (c.resource_id === roomId) {
          return `Room is already booked for "${c.guest_name}" at ${cStart}-${cEnd}`;
        }
        const cTeacher = (c.metadata as any)?.teacher;
        if (cTeacher === teacher && teacher) {
          return `${teacher} already has "${c.guest_name}" at ${cStart}-${cEnd}`;
        }
      }
    }
    return null;
  };

  // === Room CRUD ===
  const openCreateRoom = () => {
    setEditingRoom(null);
    setRoomForm({ name: "", location: "", max_capacity: "30", room_type: "lecture", has_projector: true, has_whiteboard: true, has_computers: false });
    setRoomDialogOpen(true);
  };

  const openEditRoom = (r: Resource) => {
    setEditingRoom(r);
    const meta = r.metadata as any || {};
    setRoomForm({
      name: r.name,
      location: r.location || "",
      max_capacity: String(r.max_capacity || 30),
      room_type: meta.room_type || "lecture",
      has_projector: meta.has_projector ?? true,
      has_whiteboard: meta.has_whiteboard ?? true,
      has_computers: meta.has_computers ?? false,
    });
    setRoomDialogOpen(true);
  };

  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const payload = {
      name: roomForm.name,
      location: roomForm.location || null,
      max_capacity: Number(roomForm.max_capacity) || 30,
      is_active: true,
      industry: "education" as const,
      user_id: user.id,
      business_type: roomForm.room_type,
      metadata: {
        room_type: roomForm.room_type,
        has_projector: roomForm.has_projector,
        has_whiteboard: roomForm.has_whiteboard,
        has_computers: roomForm.has_computers,
      } as unknown as Record<string, never>,
    };
    if (editingRoom) {
      const { error } = await supabase.from("resources").update(payload).eq("id", editingRoom.id);
      if (error) { toast.error("Failed to update room"); return; }
      toast.success("Room updated!");
    } else {
      const { error } = await supabase.from("resources").insert(payload);
      if (error) { toast.error("Failed to add room"); return; }
      toast.success("Room added!");
    }
    setRoomDialogOpen(false);
    fetchData();
  };

  const deleteRoom = async (id: string) => {
    await supabase.from("resources").delete().eq("id", id);
    toast.success("Room removed");
    fetchData();
  };

  // === Class CRUD ===
  const openCreateClass = () => {
    setEditingClass(null);
    setClassForm({ name: "", room_id: "", teacher: "", day: "Monday", start_time: "09:00", end_time: "10:00", subject: "", enrolled: "0", max_students: "30", recurring: true });
    setClassDialogOpen(true);
  };

  const openEditClass = (c: ClassEntry) => {
    setEditingClass(c);
    const meta = c.metadata as any || {};
    setClassForm({
      name: c.guest_name,
      room_id: c.resource_id,
      teacher: meta.teacher || "",
      day: meta.day || "Monday",
      start_time: meta.start_time || "09:00",
      end_time: meta.end_time || "10:00",
      subject: meta.subject || "",
      enrolled: String(meta.enrolled || 0),
      max_students: String(meta.max_students || 30),
      recurring: meta.recurring ?? true,
    });
    setClassDialogOpen(true);
  };

  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !classForm.room_id) return;

    // Conflict check
    const conflict = checkConflict(
      classForm.room_id, classForm.teacher, classForm.day,
      classForm.start_time, classForm.end_time, editingClass?.id
    );
    if (conflict) {
      toast.error(`🛡️ AI Conflict Detected: ${conflict}`);
      return;
    }

    // Create date-based check_in/check_out for the current week
    const now = new Date();
    const dayIndex = DAYS.indexOf(classForm.day);
    const currentDay = now.getDay();
    const diff = dayIndex + 1 - currentDay;
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + diff);
    
    const [sh, sm] = classForm.start_time.split(":").map(Number);
    const [eh, em] = classForm.end_time.split(":").map(Number);
    const checkIn = new Date(targetDate);
    checkIn.setHours(sh, sm, 0, 0);
    const checkOut = new Date(targetDate);
    checkOut.setHours(eh, em, 0, 0);

    const metadata = {
      teacher: classForm.teacher,
      day: classForm.day,
      start_time: classForm.start_time,
      end_time: classForm.end_time,
      subject: classForm.subject || classForm.name,
      enrolled: Number(classForm.enrolled) || 0,
      max_students: Number(classForm.max_students) || 30,
      recurring: classForm.recurring,
      booking_type: "class",
    };

    const payload = {
      user_id: user.id,
      resource_id: classForm.room_id,
      guest_name: classForm.name,
      check_in: checkIn.toISOString(),
      check_out: checkOut.toISOString(),
      status: "scheduled",
      platform: "direct",
      notes: `${classForm.teacher} | ${classForm.day} ${classForm.start_time}-${classForm.end_time}`,
      metadata: metadata as unknown as Record<string, never>,
      assigned_staff: classForm.teacher ? [classForm.teacher] : [],
    };

    if (editingClass) {
      const { error } = await supabase.from("bookings").update(payload).eq("id", editingClass.id);
      if (error) { toast.error("Failed to update class"); return; }
      toast.success("Class updated!");
    } else {
      const { error } = await supabase.from("bookings").insert(payload as any);
      if (error) { toast.error("Failed to create class"); return; }
      toast.success("Class scheduled!");
    }
    setClassDialogOpen(false);
    fetchData();
  };

  const deleteClass = async (id: string) => {
    await supabase.from("bookings").delete().eq("id", id);
    toast.success("Class removed");
    fetchData();
  };

  // Stats
  const totalClasses = classes.filter(c => c.status !== "cancelled").length;
  const activeRooms = rooms.filter(r => r.is_active).length;
  const roomUtilization = activeRooms > 0 ? Math.round((totalClasses / (activeRooms * 6 * 6)) * 100) : 0; // 6 days × 6 slots approx

  const ROOM_TYPES = [
    { value: "lecture", label: "Lecture Hall" },
    { value: "lab", label: "Laboratory" },
    { value: "seminar", label: "Seminar Room" },
    { value: "auditorium", label: "Auditorium" },
    { value: "gym", label: "Gymnasium" },
    { value: "library", label: "Library" },
  ];

  if (loading) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Loading timetable...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <BookOpen className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{totalClasses}</p>
            <p className="text-[10px] text-muted-foreground">Total Classes</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="p-4 text-center">
            <DoorOpen className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{activeRooms}</p>
            <p className="text-[10px] text-muted-foreground">Rooms</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <CardContent className="p-4 text-center">
            <GraduationCap className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{teachers.length}</p>
            <p className="text-[10px] text-muted-foreground">Teachers</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{getConflicts.length}</p>
            <p className="text-[10px] text-muted-foreground">Conflicts</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/5 to-accent/10 border-primary/20">
          <CardContent className="p-4 text-center">
            <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold text-foreground">{Math.min(roomUtilization, 100)}%</p>
            <p className="text-[10px] text-muted-foreground">Room Utilization</p>
          </CardContent>
        </Card>
      </div>

      {/* Conflicts Banner */}
      {getConflicts.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">{getConflicts.length} Scheduling Conflict{getConflicts.length > 1 ? "s" : ""} Detected</span>
            </div>
            <div className="space-y-1">
              {getConflicts.map((c, i) => (
                <p key={i} className="text-xs text-destructive/80">⚠️ {c.message}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid gap-1">
          <TabsTrigger value="timetable" className="gap-1.5 text-xs md:text-sm">
            <Calendar className="w-3.5 h-3.5" /> Timetable
          </TabsTrigger>
          <TabsTrigger value="classes" className="gap-1.5 text-xs md:text-sm">
            <BookOpen className="w-3.5 h-3.5" /> Classes
          </TabsTrigger>
          <TabsTrigger value="rooms" className="gap-1.5 text-xs md:text-sm">
            <DoorOpen className="w-3.5 h-3.5" /> Rooms
          </TabsTrigger>
          <TabsTrigger value="teachers" className="gap-1.5 text-xs md:text-sm">
            <GraduationCap className="w-3.5 h-3.5" /> Teachers
          </TabsTrigger>
        </TabsList>

        {/* ===== TIMETABLE VIEW ===== */}
        <TabsContent value="timetable" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> Weekly Timetable
                  <Badge variant="secondary" className="bg-success/10 text-success text-[10px]">AI Conflict Guard</Badge>
                </CardTitle>
                <Button onClick={openCreateClass} size="sm" className="bg-gradient-primary">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Class
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header */}
                  <div className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-border">
                    <div className="p-2 text-xs font-semibold text-muted-foreground">Time</div>
                    {DAY_SHORT.map(d => (
                      <div key={d} className="p-2 text-center text-xs font-semibold text-foreground border-l border-border">{d}</div>
                    ))}
                  </div>
                  {/* Slots */}
                  {TIME_SLOTS.map(time => (
                    <div key={time} className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-border/50 min-h-[60px]">
                      <div className="p-2 text-[10px] text-muted-foreground flex items-start pt-2">{time}</div>
                      {DAYS.map(day => {
                        const slotClasses = getClassesForSlot(day, time);
                        return (
                          <div key={day} className="border-l border-border/50 p-0.5 min-h-[60px]">
                            {slotClasses.map(c => {
                              const meta = c.metadata as any || {};
                              const isConflict = conflictClassIds.has(c.id);
                              return (
                                <Tooltip key={c.id}>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => openEditClass(c)}
                                      className={`w-full text-left p-1.5 rounded-md text-primary-foreground text-[10px] leading-tight mb-0.5 transition-all hover:opacity-80 ${
                                        isConflict ? "ring-2 ring-destructive bg-destructive/80" : getClassColor(c.guest_name)
                                      }`}
                                    >
                                      <p className="font-semibold truncate">{c.guest_name}</p>
                                      <p className="opacity-80 truncate">{meta.teacher}</p>
                                      <p className="opacity-70">{rooms.find(r => r.id === c.resource_id)?.name}</p>
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-[200px]">
                                    <p className="font-semibold text-xs">{c.guest_name}</p>
                                    <p className="text-[10px] text-muted-foreground">{meta.teacher} • {rooms.find(r => r.id === c.resource_id)?.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{meta.start_time} - {meta.end_time}</p>
                                    <p className="text-[10px] text-muted-foreground">{meta.enrolled}/{meta.max_students} students</p>
                                    {isConflict && <p className="text-[10px] text-destructive font-semibold mt-1">⚠️ CONFLICT</p>}
                                  </TooltipContent>
                                </Tooltip>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== CLASSES LIST ===== */}
        <TabsContent value="classes" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">All Classes ({totalClasses})</h3>
            <Button onClick={openCreateClass} className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-1" /> Schedule Class
            </Button>
          </div>
          {classes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Classes Scheduled</h3>
                <p className="text-sm text-muted-foreground mb-4">Create your first class to build the timetable.</p>
                <Button onClick={openCreateClass} className="bg-gradient-primary">
                  <Plus className="w-4 h-4 mr-1" /> Schedule First Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {classes.filter(c => c.status !== "cancelled").map(c => {
                const meta = c.metadata as any || {};
                const isConflict = conflictClassIds.has(c.id);
                return (
                  <Card key={c.id} className={`hover:shadow-md transition-shadow ${isConflict ? "border-destructive/50 bg-destructive/5" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-8 rounded-full ${getClassColor(c.guest_name)}`} />
                          <div>
                            <p className="text-sm font-semibold text-foreground">{c.guest_name}</p>
                            <p className="text-[10px] text-muted-foreground">{meta.subject || "General"}</p>
                          </div>
                        </div>
                        {isConflict && <Badge variant="destructive" className="text-[9px]">Conflict</Badge>}
                      </div>
                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5"><GraduationCap className="w-3 h-3" /> {meta.teacher || "Unassigned"}</div>
                        <div className="flex items-center gap-1.5"><DoorOpen className="w-3 h-3" /> {rooms.find(r => r.id === c.resource_id)?.name || "No Room"}</div>
                        <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {meta.day} {meta.start_time}-{meta.end_time}</div>
                        <div className="flex items-center gap-1.5"><Users className="w-3 h-3" /> {meta.enrolled}/{meta.max_students} students</div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openEditClass(c)}>
                          <Edit2 className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => deleteClass(c.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== ROOMS ===== */}
        <TabsContent value="rooms" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Rooms & Labs ({rooms.length})</h3>
            <Button onClick={openCreateRoom} className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-1" /> Add Room
            </Button>
          </div>
          {rooms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DoorOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Rooms Added</h3>
                <p className="text-sm text-muted-foreground mb-4">Add classrooms and labs to start scheduling.</p>
                <Button onClick={openCreateRoom} className="bg-gradient-primary">
                  <Plus className="w-4 h-4 mr-1" /> Add First Room
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rooms.map(r => {
                const meta = r.metadata as any || {};
                const roomClasses = classes.filter(c => c.resource_id === r.id && c.status !== "cancelled");
                return (
                  <Card key={r.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{r.name}</p>
                          <Badge variant="outline" className="text-[10px] mt-0.5">{meta.room_type || "Lecture"}</Badge>
                        </div>
                        <Badge variant={r.is_active ? "default" : "secondary"} className={`text-[10px] ${r.is_active ? "bg-success text-success-foreground" : ""}`}>
                          {r.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {r.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2"><MapPin className="w-3 h-3" /> {r.location}</p>}
                      <div className="flex gap-3 text-xs text-muted-foreground mb-2">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {r.max_capacity} seats</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {roomClasses.length} classes</span>
                      </div>
                      <div className="flex gap-1.5 flex-wrap mb-3">
                        {meta.has_projector && <Badge variant="outline" className="text-[9px]">📽 Projector</Badge>}
                        {meta.has_whiteboard && <Badge variant="outline" className="text-[9px]">📝 Whiteboard</Badge>}
                        {meta.has_computers && <Badge variant="outline" className="text-[9px]">💻 Computers</Badge>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openEditRoom(r)}>
                          <Edit2 className="w-3 h-3 mr-1" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => deleteRoom(r.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== TEACHERS ===== */}
        <TabsContent value="teachers" className="mt-4 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Teachers & Instructors ({teachers.length})</h3>
          {teachers.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Teachers Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Teachers appear here automatically when you assign them to classes.</p>
                <Button onClick={openCreateClass} className="bg-gradient-primary">
                  <Plus className="w-4 h-4 mr-1" /> Schedule a Class
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {teachers.map(teacher => {
                const teacherClasses = classes.filter(c => (c.metadata as any)?.teacher === teacher && c.status !== "cancelled");
                const teacherConflicts = getConflicts.filter(c => c.message.includes(teacher));
                const totalHours = teacherClasses.reduce((sum, c) => {
                  const meta = c.metadata as any;
                  if (!meta?.start_time || !meta?.end_time) return sum;
                  const [sh] = meta.start_time.split(":").map(Number);
                  const [eh] = meta.end_time.split(":").map(Number);
                  return sum + (eh - sh);
                }, 0);
                return (
                  <Card key={teacher} className={teacherConflicts.length > 0 ? "border-warning/30" : ""}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-primary" />
                          <CardTitle className="text-sm">{teacher}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-[10px]">{teacherClasses.length} classes</Badge>
                          <Badge variant="outline" className="text-[10px]">{totalHours}h/week</Badge>
                          {teacherConflicts.length > 0 && (
                            <Badge variant="destructive" className="text-[10px]">{teacherConflicts.length} conflicts</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-6 gap-1">
                        {DAYS.map(day => {
                          const dayClasses = getTeacherSchedule(teacher, day);
                          return (
                            <div key={day} className="space-y-0.5">
                              <p className="text-[10px] font-semibold text-muted-foreground text-center">{day.slice(0, 3)}</p>
                              {dayClasses.length === 0 ? (
                                <div className="text-[9px] text-muted-foreground/50 text-center py-2">Free</div>
                              ) : (
                                dayClasses.map(c => {
                                  const meta = c.metadata as any;
                                  return (
                                    <div key={c.id} className={`${getClassColor(c.guest_name)} text-primary-foreground text-[9px] p-1 rounded leading-tight`}>
                                      <p className="font-semibold truncate">{c.guest_name}</p>
                                      <p className="opacity-80">{meta.start_time}-{meta.end_time}</p>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* === Class Dialog === */}
      <Dialog open={classDialogOpen} onOpenChange={setClassDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingClass ? "Edit" : "Schedule"} Class
              <Badge variant="secondary" className="bg-success/10 text-success text-[10px]">
                <Shield className="w-3 h-3 mr-0.5" /> AI Conflict Guard
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleClassSubmit} className="space-y-4">
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-2.5 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary flex-shrink-0" />
              <p className="text-[11px] text-muted-foreground">AI checks for teacher & room conflicts before scheduling.</p>
            </div>

            <div>
              <Label>Class Name</Label>
              <Input value={classForm.name} onChange={e => setClassForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Advanced Mathematics" />
            </div>

            <div>
              <Label>Subject</Label>
              <Select value={classForm.subject} onValueChange={v => setClassForm(f => ({ ...f, subject: v, name: f.name || v }))}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Teacher / Instructor</Label>
                <Input value={classForm.teacher} onChange={e => setClassForm(f => ({ ...f, teacher: e.target.value }))} required placeholder="e.g. Prof. Smith" />
              </div>
              <div>
                <Label>Room</Label>
                <Select value={classForm.room_id} onValueChange={v => setClassForm(f => ({ ...f, room_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                  <SelectContent>
                    {rooms.filter(r => r.is_active).map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} ({r.max_capacity} seats)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Day</Label>
              <Select value={classForm.day} onValueChange={v => setClassForm(f => ({ ...f, day: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={classForm.start_time} onChange={e => setClassForm(f => ({ ...f, start_time: e.target.value }))} required />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={classForm.end_time} onChange={e => setClassForm(f => ({ ...f, end_time: e.target.value }))} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Enrolled Students</Label>
                <Input type="number" value={classForm.enrolled} onChange={e => setClassForm(f => ({ ...f, enrolled: e.target.value }))} />
              </div>
              <div>
                <Label>Max Students</Label>
                <Input type="number" value={classForm.max_students} onChange={e => setClassForm(f => ({ ...f, max_students: e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Recurring Weekly</Label>
              <Switch checked={classForm.recurring} onCheckedChange={v => setClassForm(f => ({ ...f, recurring: v }))} />
            </div>

            <Button type="submit" className="w-full bg-gradient-primary">
              <Shield className="w-4 h-4 mr-2" /> {editingClass ? "Update" : "Schedule"} Class
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* === Room Dialog === */}
      <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRoom ? "Edit" : "Add"} Room</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRoomSubmit} className="space-y-4">
            <div>
              <Label>Room Name</Label>
              <Input value={roomForm.name} onChange={e => setRoomForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Room 201" />
            </div>
            <div>
              <Label>Building / Location</Label>
              <Input value={roomForm.location} onChange={e => setRoomForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Science Building, Floor 2" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Room Type</Label>
                <Select value={roomForm.room_type} onValueChange={v => setRoomForm(f => ({ ...f, room_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Capacity (seats)</Label>
                <Input type="number" min={1} value={roomForm.max_capacity} onChange={e => setRoomForm(f => ({ ...f, max_capacity: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Has Projector</Label>
                <Switch checked={roomForm.has_projector} onCheckedChange={v => setRoomForm(f => ({ ...f, has_projector: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Has Whiteboard</Label>
                <Switch checked={roomForm.has_whiteboard} onCheckedChange={v => setRoomForm(f => ({ ...f, has_whiteboard: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Has Computers</Label>
                <Switch checked={roomForm.has_computers} onCheckedChange={v => setRoomForm(f => ({ ...f, has_computers: v }))} />
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-primary">
              {editingRoom ? "Update" : "Add"} Room
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TimetableManager;
