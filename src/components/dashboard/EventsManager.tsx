import { useState } from "react";
import {
  Theater, Ticket, Users, Calendar, MapPin, Star, Clock, Plus,
  TrendingUp, DollarSign, BarChart3, Sparkles, AlertTriangle,
  CheckCircle2, XCircle, Timer, Gauge, Search, Eye, Zap,
  ArrowUpRight, ArrowDownRight, Music, PartyPopper, Mic2,
  CircleDot, Crown, Flame, CalendarClock
} from "lucide-react";
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

interface Event {
  id: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  duration: string;
  category: "concert" | "conference" | "comedy" | "theater" | "sports" | "festival" | "private" | "workshop";
  capacity: number;
  sold: number;
  basePrice: number;
  currentPrice: number;
  status: "on-sale" | "sold-out" | "upcoming" | "live" | "completed" | "cancelled" | "rescheduled";
  demand: "low" | "medium" | "high" | "viral";
  revenue: number;
  priceOverridden: boolean;
  performers: string[];
  image: string;
}

interface Booking {
  id: string;
  eventId: string;
  eventName: string;
  customerName: string;
  email: string;
  tickets: number;
  ticketType: "general" | "vip" | "premium" | "backstage";
  totalPaid: number;
  bookedAt: string;
  status: "confirmed" | "pending" | "cancelled" | "refunded" | "checked-in";
}

interface Venue {
  id: string;
  name: string;
  type: "hall" | "theater" | "arena" | "outdoor" | "lounge" | "stadium";
  capacity: number;
  eventsThisMonth: number;
  utilization: number;
  amenities: string[];
  status: "available" | "in-use" | "setup" | "maintenance";
}

const categoryIcons: Record<string, string> = {
  concert: "🎵", conference: "🎤", comedy: "😂", theater: "🎭",
  sports: "⚽", festival: "🎪", private: "🔒", workshop: "📚"
};

const demandColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-primary/15 text-primary",
  high: "bg-warning/15 text-warning",
  viral: "bg-destructive/15 text-destructive",
};

const statusColors: Record<string, string> = {
  "on-sale": "text-success", "sold-out": "text-destructive", "upcoming": "text-primary",
  "live": "text-warning", "completed": "text-muted-foreground", "cancelled": "text-destructive",
  "rescheduled": "text-warning", "confirmed": "text-success", "pending": "text-warning",
  "refunded": "text-destructive", "checked-in": "text-primary",
  "available": "text-success", "in-use": "text-primary", "setup": "text-warning", "maintenance": "text-muted-foreground",
};

const MOCK_EVENTS: Event[] = [
  { id: "EVT-001", name: "Neon Nights Festival", venue: "Grand Arena", date: "Apr 12, 2026", time: "18:00–23:00", duration: "5h", category: "festival", capacity: 5000, sold: 4680, basePrice: 45, currentPrice: 78, status: "on-sale", demand: "viral", revenue: 364_840, priceOverridden: false, performers: ["DJ Shadow", "Marshmello", "Deadmau5"], image: "🎪" },
  { id: "EVT-002", name: "Tech Summit 2026", venue: "Convention Center", date: "Apr 15-16, 2026", time: "09:00–18:00", duration: "2 days", category: "conference", capacity: 800, sold: 645, basePrice: 120, currentPrice: 145, status: "on-sale", demand: "high", revenue: 93_525, priceOverridden: false, performers: ["Keynote: AI Future", "Panel: Cloud Native"], image: "🎤" },
  { id: "EVT-003", name: "Comedy Night Special", venue: "Laugh Lounge", date: "Apr 18, 2026", time: "20:00–22:30", duration: "2.5h", category: "comedy", capacity: 200, sold: 198, basePrice: 35, currentPrice: 55, status: "sold-out", demand: "viral", revenue: 10_890, priceOverridden: false, performers: ["Dave Chappelle", "Ali Wong"], image: "😂" },
  { id: "EVT-004", name: "Classical Orchestra", venue: "Royal Theater", date: "Apr 20, 2026", time: "19:30–21:30", duration: "2h", category: "theater", capacity: 350, sold: 180, basePrice: 60, currentPrice: 52, status: "on-sale", demand: "medium", revenue: 9_360, priceOverridden: false, performers: ["City Philharmonic"], image: "🎭" },
  { id: "EVT-005", name: "Startup Workshop", venue: "Innovation Hub", date: "Apr 22, 2026", time: "10:00–16:00", duration: "6h", category: "workshop", capacity: 50, sold: 12, basePrice: 80, currentPrice: 65, status: "upcoming", demand: "low", revenue: 780, priceOverridden: true, performers: ["Y Combinator Alumni"], image: "📚" },
  { id: "EVT-006", name: "Football Derby Finals", venue: "City Stadium", date: "Apr 25, 2026", time: "15:00–17:00", duration: "2h", category: "sports", capacity: 40000, sold: 38500, basePrice: 30, currentPrice: 85, status: "on-sale", demand: "viral", revenue: 3_272_500, priceOverridden: false, performers: ["City FC vs United FC"], image: "⚽" },
  { id: "EVT-007", name: "Private Gala Dinner", venue: "Skyline Ballroom", date: "Apr 28, 2026", time: "19:00–23:00", duration: "4h", category: "private", capacity: 150, sold: 150, basePrice: 250, currentPrice: 250, status: "sold-out", demand: "high", revenue: 37_500, priceOverridden: true, performers: ["Chef Gordon", "Live Jazz Band"], image: "🔒" },
  { id: "EVT-008", name: "Indie Music Showcase", venue: "Basement Club", date: "Apr 30, 2026", time: "21:00–02:00", duration: "5h", category: "concert", capacity: 300, sold: 88, basePrice: 20, currentPrice: 18, status: "on-sale", demand: "low", revenue: 1_584, priceOverridden: false, performers: ["The Waves", "Luna Park", "Echo Valley"], image: "🎵" },
];

const MOCK_BOOKINGS: Booking[] = [
  { id: "BK-8001", eventId: "EVT-001", eventName: "Neon Nights Festival", customerName: "Ali Raza", email: "ali@email.com", tickets: 4, ticketType: "vip", totalPaid: 312, bookedAt: "2 min ago", status: "confirmed" },
  { id: "BK-8002", eventId: "EVT-006", eventName: "Football Derby Finals", customerName: "Sarah Johnson", email: "sarah@email.com", tickets: 2, ticketType: "premium", totalPaid: 170, bookedAt: "5 min ago", status: "confirmed" },
  { id: "BK-8003", eventId: "EVT-002", eventName: "Tech Summit 2026", customerName: "Omar Sheikh", email: "omar@email.com", tickets: 1, ticketType: "general", totalPaid: 145, bookedAt: "12 min ago", status: "pending" },
  { id: "BK-8004", eventId: "EVT-003", eventName: "Comedy Night Special", customerName: "Fatima Noor", email: "fatima@email.com", tickets: 2, ticketType: "general", totalPaid: 110, bookedAt: "20 min ago", status: "checked-in" },
  { id: "BK-8005", eventId: "EVT-001", eventName: "Neon Nights Festival", customerName: "Chen Wei", email: "chen@email.com", tickets: 6, ticketType: "backstage", totalPaid: 780, bookedAt: "35 min ago", status: "confirmed" },
  { id: "BK-8006", eventId: "EVT-004", eventName: "Classical Orchestra", customerName: "Maria Garcia", email: "maria@email.com", tickets: 3, ticketType: "general", totalPaid: 156, bookedAt: "1h ago", status: "confirmed" },
  { id: "BK-8007", eventId: "EVT-005", eventName: "Startup Workshop", customerName: "James Park", email: "james@email.com", tickets: 1, ticketType: "general", totalPaid: 65, bookedAt: "2h ago", status: "cancelled" },
  { id: "BK-8008", eventId: "EVT-006", eventName: "Football Derby Finals", customerName: "Aisha Khan", email: "aisha@email.com", tickets: 8, ticketType: "general", totalPaid: 680, bookedAt: "3h ago", status: "confirmed" },
];

const MOCK_VENUES: Venue[] = [
  { id: "V-01", name: "Grand Arena", type: "arena", capacity: 5000, eventsThisMonth: 8, utilization: 88, amenities: ["LED Screens", "VIP Boxes", "Backstage", "Sound System", "Parking"], status: "in-use" },
  { id: "V-02", name: "Convention Center", type: "hall", capacity: 1200, eventsThisMonth: 12, utilization: 92, amenities: ["Projectors", "WiFi", "Catering", "Break Rooms"], status: "setup" },
  { id: "V-03", name: "Laugh Lounge", type: "lounge", capacity: 200, eventsThisMonth: 20, utilization: 95, amenities: ["Bar", "Stage Lighting", "Sound"], status: "available" },
  { id: "V-04", name: "Royal Theater", type: "theater", capacity: 350, eventsThisMonth: 6, utilization: 65, amenities: ["Orchestra Pit", "Balcony", "Dressing Rooms"], status: "available" },
  { id: "V-05", name: "City Stadium", type: "stadium", capacity: 40000, eventsThisMonth: 4, utilization: 78, amenities: ["Floodlights", "Scoreboard", "Press Box", "VIP Suites"], status: "in-use" },
  { id: "V-06", name: "Innovation Hub", type: "hall", capacity: 100, eventsThisMonth: 15, utilization: 45, amenities: ["Whiteboard", "WiFi", "Projector", "Coffee"], status: "available" },
  { id: "V-07", name: "Skyline Ballroom", type: "hall", capacity: 200, eventsThisMonth: 3, utilization: 70, amenities: ["Chandelier", "Stage", "Kitchen", "Dance Floor"], status: "maintenance" },
  { id: "V-08", name: "Basement Club", type: "lounge", capacity: 300, eventsThisMonth: 22, utilization: 82, amenities: ["DJ Booth", "Light Rig", "Bar", "VIP Area"], status: "available" },
];

const ticketTypeColors: Record<string, string> = {
  general: "bg-secondary text-secondary-foreground",
  vip: "bg-primary/15 text-primary border-primary/30",
  premium: "bg-warning/15 text-warning border-warning/30",
  backstage: "bg-destructive/15 text-destructive border-destructive/30",
};

const venueTypeIcons: Record<string, string> = {
  hall: "🏛️", theater: "🎭", arena: "🏟️", outdoor: "🌳", lounge: "🍸", stadium: "🏟️"
};

// ─── KPIs ───
function EventsKPIs() {
  const kpis = [
    { label: "Total Events", value: "8", change: "+2", up: true, icon: Theater },
    { label: "Tickets Sold", value: "44,453", change: "+1,240", up: true, icon: Ticket },
    { label: "Total Revenue", value: "$3.79M", change: "+18%", up: true, icon: DollarSign },
    { label: "Avg Fill Rate", value: "87%", change: "+5%", up: true, icon: Gauge },
    { label: "Sold Out Events", value: "2", change: "+1", up: true, icon: Flame },
    { label: "Avg Ticket Price", value: "$68", change: "+$12", up: true, icon: TrendingUp },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map(k => (
        <Card key={k.label} className="bg-card/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <k.icon className="w-4 h-4 text-primary" />
              <span className={`text-[10px] flex items-center gap-0.5 ${k.up ? "text-success" : "text-destructive"}`}>
                {k.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {k.change}
              </span>
            </div>
            <p className="text-lg font-bold text-foreground">{k.value}</p>
            <p className="text-[10px] text-muted-foreground">{k.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Events Tab ───
function EventsPanel() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const filtered = MOCK_EVENTS.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.venue.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || e.category === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-4">
      {/* Live Alert */}
      <div className="bg-gradient-to-r from-destructive/10 to-warning/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
        <Flame className="w-5 h-5 text-destructive shrink-0 animate-pulse" />
        <div>
          <p className="text-sm font-medium text-foreground">🔥 Viral Demand Alert</p>
          <p className="text-xs text-muted-foreground mt-0.5">Neon Nights Festival — 93.6% sold! AI has increased ticket price from $45 → $78 (+73%). Only 320 seats remaining.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {["concert","conference","comedy","theater","sports","festival","private","workshop"].map(c => (
              <SelectItem key={c} value={c}>{categoryIcons[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog>
          <DialogTrigger asChild><Button className="bg-gradient-primary gap-2"><Plus className="w-4 h-4" />Create Event</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create New Event</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Event Name</Label><Input placeholder="e.g. Summer Music Festival" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Category</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{["concert","conference","comedy","theater","sports","festival","private","workshop"].map(c => <SelectItem key={c} value={c}>{categoryIcons[c]} {c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Venue</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select venue" /></SelectTrigger>
                    <SelectContent>{MOCK_VENUES.filter(v => v.status !== "maintenance").map(v => <SelectItem key={v.id} value={v.id}>{venueTypeIcons[v.type]} {v.name} ({v.capacity})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2"><Label>Date</Label><Input type="date" /></div>
                <div className="space-y-2"><Label>Start Time</Label><Input type="time" defaultValue="19:00" /></div>
                <div className="space-y-2"><Label>End Time</Label><Input type="time" defaultValue="22:00" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Max Capacity</Label><Input type="number" placeholder="500" /></div>
                <div className="space-y-2"><Label>Base Ticket Price ($)</Label><Input type="number" placeholder="45" /></div>
              </div>
              <div className="space-y-2"><Label>Performers / Speakers</Label><Input placeholder="e.g. DJ Shadow, Marshmello (comma separated)" /></div>
              <Button className="w-full bg-gradient-primary">Create Event</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(e => {
          const fillPct = (e.sold / e.capacity) * 100;
          const seatsLeft = e.capacity - e.sold;
          const priceChange = ((e.currentPrice - e.basePrice) / e.basePrice) * 100;
          return (
            <Card key={e.id} className={`transition-all hover:shadow-lg ${e.status === "sold-out" ? "border-destructive/30" : e.demand === "viral" ? "border-warning/30" : ""}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">{e.image}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-foreground">{e.name}</h3>
                        {e.demand === "viral" && <Badge className="bg-destructive/15 text-destructive text-[9px] gap-1"><Flame className="w-2.5 h-2.5" />VIRAL</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{categoryIcons[e.category]} {e.category} · {e.venue}</p>
                      <p className="text-[10px] text-muted-foreground">{e.date} · {e.time} ({e.duration})</p>
                    </div>
                  </div>
                  <span className={`text-xs capitalize font-medium ${statusColors[e.status]}`}>● {e.status}</span>
                </div>

                {/* Performers */}
                <div className="flex gap-1.5 flex-wrap">
                  {e.performers.map(p => (
                    <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                  ))}
                </div>

                {/* Capacity Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{e.sold.toLocaleString()} / {e.capacity.toLocaleString()} seats</span>
                    <span className={seatsLeft <= 0 ? "text-destructive font-bold" : seatsLeft < e.capacity * 0.1 ? "text-warning font-medium" : "text-muted-foreground"}>
                      {seatsLeft <= 0 ? "SOLD OUT" : `${seatsLeft.toLocaleString()} left`}
                    </span>
                  </div>
                  <Progress value={fillPct} className="h-2" />
                </div>

                {/* Price & Revenue */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">${e.currentPrice}</span>
                    {priceChange !== 0 && (
                      <span className={`text-[10px] ${priceChange > 0 ? "text-success" : "text-destructive"}`}>
                        {priceChange > 0 ? "+" : ""}{Math.round(priceChange)}% from ${e.basePrice}
                      </span>
                    )}
                    {e.priceOverridden && <Badge variant="outline" className="text-[9px] border-warning/40 text-warning">Manual</Badge>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">${e.revenue.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Schedule Tab ───
function SchedulePanel() {
  const days = ["Mon Apr 13", "Tue Apr 14", "Wed Apr 15", "Thu Apr 16", "Fri Apr 17", "Sat Apr 18", "Sun Apr 19"];
  const eventsByDay: Record<string, typeof MOCK_EVENTS> = {
    "Mon Apr 13": [],
    "Tue Apr 14": [MOCK_EVENTS[7]],
    "Wed Apr 15": [MOCK_EVENTS[1]],
    "Thu Apr 16": [MOCK_EVENTS[1]],
    "Fri Apr 17": [MOCK_EVENTS[3]],
    "Sat Apr 18": [MOCK_EVENTS[0], MOCK_EVENTS[2]],
    "Sun Apr 19": [MOCK_EVENTS[4]],
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">AI Schedule Optimizer</p>
          <p className="text-xs text-muted-foreground">AI suggests moving "Startup Workshop" to Thursday for 35% higher expected attendance based on past patterns.</p>
          <Button size="sm" variant="outline" className="mt-2 h-7 text-xs border-primary/30 text-primary">Apply Suggestion</Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const events = eventsByDay[day] || [];
          const isToday = day === "Sat Apr 18";
          return (
            <Card key={day} className={`min-h-[200px] ${isToday ? "border-primary/40 bg-primary/5" : ""}`}>
              <CardContent className="p-2">
                <p className={`text-xs font-bold mb-2 ${isToday ? "text-primary" : "text-foreground"}`}>
                  {day.split(" ").slice(0, 2).join(" ")}
                  {isToday && <Badge className="ml-1 text-[8px] bg-primary text-primary-foreground">Today</Badge>}
                </p>
                <div className="space-y-1.5">
                  {events.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic">No events</p>
                  ) : events.map(e => (
                    <div key={e.id} className="p-1.5 rounded bg-secondary/50 border border-border">
                      <p className="text-[10px] font-medium text-foreground truncate">{e.image} {e.name}</p>
                      <p className="text-[8px] text-muted-foreground">{e.time}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Progress value={(e.sold / e.capacity) * 100} className="h-1 flex-1" />
                        <span className="text-[8px] text-muted-foreground">{Math.round((e.sold / e.capacity) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Venue Utilization */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />Venue Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {MOCK_VENUES.map(v => (
              <div key={v.id} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{venueTypeIcons[v.type]} {v.name}</span>
                  <span className={`text-[10px] capitalize ${statusColors[v.status]}`}>● {v.status}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Cap: {v.capacity.toLocaleString()}</span>
                  <span>{v.eventsThisMonth} events/mo</span>
                </div>
                <Progress value={v.utilization} className="h-1.5" />
                <div className="flex gap-1 flex-wrap">
                  {v.amenities.slice(0, 3).map(a => <Badge key={a} variant="outline" className="text-[8px]">{a}</Badge>)}
                  {v.amenities.length > 3 && <Badge variant="outline" className="text-[8px]">+{v.amenities.length - 3}</Badge>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Bookings Tab ───
function BookingsPanel() {
  const [search, setSearch] = useState("");
  const filtered = MOCK_BOOKINGS.filter(b =>
    b.customerName.toLowerCase().includes(search.toLowerCase()) ||
    b.eventName.toLowerCase().includes(search.toLowerCase()) ||
    b.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Real-time Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Today's Bookings", value: "124", icon: Ticket },
          { label: "Checked In", value: "86", icon: CheckCircle2 },
          { label: "Pending", value: "18", icon: Timer },
          { label: "Today's Revenue", value: "$8,420", icon: DollarSign },
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
          <Input placeholder="Search bookings..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map(b => (
          <Card key={b.id} className="transition-all hover:shadow-md">
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">{b.id}</span>
                    <Badge className={`text-[10px] ${ticketTypeColors[b.ticketType]}`}>{b.ticketType.toUpperCase()}</Badge>
                    <span className={`text-xs capitalize font-medium ${statusColors[b.status]}`}>● {b.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{b.customerName} · {b.email}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Theater className="w-3 h-3" />{b.eventName}</span>
                    <span className="flex items-center gap-1"><Ticket className="w-3 h-3" />{b.tickets} tickets</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{b.bookedAt}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-foreground">${b.totalPaid}</p>
                  <p className="text-[10px] text-muted-foreground">${(b.totalPaid / b.tickets).toFixed(0)}/ticket</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Pricing Tab ───
function EventsPricingPanel() {
  const [events, setEvents] = useState(MOCK_EVENTS);

  const resetPrice = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, currentPrice: e.basePrice, priceOverridden: false } : e));
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">AI Dynamic Pricing Engine Active</p>
            <p className="text-xs text-muted-foreground">Prices auto-adjust based on demand, remaining capacity, time to event, and peak dates. Avg surcharge today: +38%.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" />Event Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {events.map(e => {
              const priceChange = ((e.currentPrice - e.basePrice) / e.basePrice) * 100;
              const fillPct = (e.sold / e.capacity) * 100;
              return (
                <div key={e.id} className="p-3 rounded-lg border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.image} {e.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-[9px] ${demandColors[e.demand]}`}>{e.demand} demand</Badge>
                        <span className="text-[10px] text-muted-foreground">{Math.round(fillPct)}% filled</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">${e.currentPrice}</p>
                      {priceChange !== 0 && (
                        <p className={`text-[10px] ${priceChange > 0 ? "text-success" : "text-destructive"}`}>
                          Base: ${e.basePrice} ({priceChange > 0 ? "+" : ""}{Math.round(priceChange)}%)
                        </p>
                      )}
                      {e.priceOverridden && (
                        <Button size="sm" variant="ghost" className="h-5 text-[10px] text-warning p-0" onClick={() => resetPrice(e.id)}>Reset to AI</Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />AI Pricing Rules</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { rule: "High Demand Surge", desc: ">80% capacity filled", multiplier: "+50%", active: true },
                { rule: "Scarcity Premium", desc: "<50 seats remaining", multiplier: "+30%", active: true },
                { rule: "Last-Minute Boost", desc: "<48 hours to event", multiplier: "+25%", active: true },
                { rule: "Peak Day Surcharge", desc: "Weekends & holidays", multiplier: "+20%", active: true },
                { rule: "Early Bird Discount", desc: ">30 days before event", multiplier: "-15%", active: true },
                { rule: "Low Demand Drop", desc: "<30% capacity filled", multiplier: "-20%", active: true },
                { rule: "Group Discount", desc: "10+ tickets per booking", multiplier: "-10%", active: false },
              ].map(r => (
                <div key={r.rule} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.rule}</p>
                    <p className="text-[10px] text-muted-foreground">{r.desc}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{r.multiplier}</Badge>
                    <Badge className={`text-[9px] ${r.active ? "bg-success/20 text-success" : "bg-secondary text-muted-foreground"}`}>
                      {r.active ? "ON" : "OFF"}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Crown className="w-4 h-4 text-primary" />Revenue Leaderboard</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[...MOCK_EVENTS].sort((a, b) => b.revenue - a.revenue).slice(0, 5).map((e, i) => (
                <div key={e.id} className="flex items-center justify-between p-2 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.name}</p>
                      <p className="text-[10px] text-muted-foreground">{Math.round((e.sold / e.capacity) * 100)}% sold</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-foreground">${e.revenue.toLocaleString()}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function EventsManager({ config }: { config: IndustryConfig }) {
  return (
    <div className="space-y-6">
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Demo data — preview mode</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              The events, venues, bookings and pricing below are sample data so you can explore how the Events workspace works.
              Your real events (created via the "New Event" buttons) are saved to your account.
              Full real-data rebuild for this dashboard is rolling out shortly.
            </p>
          </div>
        </CardContent>
      </Card>

      <EventsKPIs />

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto lg:inline-grid gap-1">
          <TabsTrigger value="events" className="gap-1.5 text-xs md:text-sm"><Theater className="w-3.5 h-3.5" />Events</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5 text-xs md:text-sm"><CalendarClock className="w-3.5 h-3.5" />Schedule</TabsTrigger>
          <TabsTrigger value="bookings" className="gap-1.5 text-xs md:text-sm"><Ticket className="w-3.5 h-3.5" />Bookings</TabsTrigger>
          <TabsTrigger value="pricing" className="gap-1.5 text-xs md:text-sm"><DollarSign className="w-3.5 h-3.5" />Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="events"><EventsPanel /></TabsContent>
        <TabsContent value="schedule"><SchedulePanel /></TabsContent>
        <TabsContent value="bookings"><BookingsPanel /></TabsContent>
        <TabsContent value="pricing"><EventsPricingPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
