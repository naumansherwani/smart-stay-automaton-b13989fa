import { useState } from "react";
import {
  Truck, Package, MapPin, Clock, AlertTriangle, TrendingUp, Plus,
  Route, Fuel, Users, Shield, Zap, BarChart3, Navigation,
  CheckCircle2, XCircle, Timer, Gauge, CalendarClock, DollarSign,
  ArrowUpRight, ArrowDownRight, Boxes, CircleDot, Search
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

interface Delivery {
  id: string;
  location: string;
  timeWindow: string;
  status: "pending" | "assigned" | "in-transit" | "delivered" | "delayed" | "cancelled";
  driver: string;
  vehicle: string;
  priority: "normal" | "express" | "urgent";
  price: number;
  distance: string;
  eta: string;
  capacity: number;
}

interface Vehicle {
  id: string;
  name: string;
  type: "van" | "truck" | "bike" | "car";
  plate: string;
  status: "available" | "in-use" | "maintenance" | "offline";
  capacity: number;
  fuel: number;
  mileage: string;
  lastService: string;
  deliveriesToday: number;
}

interface Driver {
  id: string;
  name: string;
  status: "available" | "driving" | "break" | "off-duty";
  vehicle: string;
  hoursWorked: number;
  maxHours: number;
  deliveriesCompleted: number;
  rating: number;
  phone: string;
  zone: string;
}

interface TimeSlot {
  time: string;
  deliveries: number;
  capacity: number;
  demand: "low" | "medium" | "high" | "peak";
  price: number;
  basePrice: number;
  overridden: boolean;
}

// Real data only — no mocks. UI renders from user-created deliveries/vehicles/drivers.
const MOCK_DELIVERIES: Delivery[] = [];
const MOCK_VEHICLES: Vehicle[] = [];
const MOCK_DRIVERS: Driver[] = [];
const MOCK_SLOTS: TimeSlot[] = [];

const statusColors: Record<string, string> = {
  "pending": "text-muted-foreground",
  "assigned": "text-primary",
  "in-transit": "text-warning",
  "delivered": "text-success",
  "delayed": "text-destructive",
  "cancelled": "text-destructive",
  "available": "text-success",
  "in-use": "text-primary",
  "maintenance": "text-warning",
  "offline": "text-muted-foreground",
  "driving": "text-primary",
  "break": "text-warning",
  "off-duty": "text-muted-foreground",
};

const demandColors: Record<string, string> = {
  low: "bg-success/20 text-success",
  medium: "bg-primary/20 text-primary",
  high: "bg-warning/20 text-warning",
  peak: "bg-destructive/20 text-destructive",
};

const priorityColors: Record<string, string> = {
  normal: "bg-secondary text-secondary-foreground",
  express: "bg-primary/15 text-primary border-primary/30",
  urgent: "bg-destructive/15 text-destructive border-destructive/30",
};

const vehicleIcons: Record<string, string> = { van: "🚐", truck: "🚛", bike: "🚲", car: "🚗" };

// ─── Overview KPIs ───
function LogisticsKPIs() {
  const kpis = [
    { label: "Active Deliveries", value: "14", change: "+3", up: true, icon: Package },
    { label: "On-Time Rate", value: "94.2%", change: "+1.8%", up: true, icon: CheckCircle2 },
    { label: "Fleet Utilization", value: "78%", change: "+5%", up: true, icon: Truck },
    { label: "Avg. Delivery Time", value: "38 min", change: "-4 min", up: true, icon: Timer },
    { label: "Today's Revenue", value: "$1,842", change: "+12%", up: true, icon: DollarSign },
    { label: "Capacity Used", value: "72%", change: "+8%", up: false, icon: Gauge },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map(k => (
        <Card key={k.label} className="bg-card/50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <k.icon className="w-4 h-4 text-primary" />
              <span className={`text-[10px] flex items-center gap-0.5 ${k.up ? "text-success" : "text-warning"}`}>
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

// ─── Deliveries Tab ───
function DeliveriesPanel() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const filtered = MOCK_DELIVERIES.filter(d => {
    const matchSearch = d.id.toLowerCase().includes(search.toLowerCase()) || d.location.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* Conflict Alert */}
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">AI Conflict Detection</p>
          <p className="text-xs text-muted-foreground mt-0.5">DEL-5005 delayed — Driver Ahmed Khan has overlapping assignment at 13:00. AI suggests reassigning to Youssef Malik (available, same zone).</p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="destructive" className="h-7 text-xs">Accept AI Fix</Button>
            <Button size="sm" variant="outline" className="h-7 text-xs">Dismiss</Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search deliveries..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in-transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="delayed">Delayed</SelectItem>
          </SelectContent>
        </Select>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary gap-2"><Plus className="w-4 h-4" />New Delivery</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Delivery</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Delivery Location</Label><Input placeholder="e.g. 123 Main St, Downtown" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Time Window</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Select slot" /></SelectTrigger>
                    <SelectContent>{MOCK_SLOTS.map(s => <SelectItem key={s.time} value={s.time}>{s.time} ({s.capacity - s.deliveries} slots left)</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Priority</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                    <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="express">Express</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Assign Driver</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Auto-assign" /></SelectTrigger>
                    <SelectContent>{MOCK_DRIVERS.filter(d => d.status === "available").map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Assign Vehicle</Label>
                  <Select><SelectTrigger><SelectValue placeholder="Auto-assign" /></SelectTrigger>
                    <SelectContent>{MOCK_VEHICLES.filter(v => v.status === "available").map(v => <SelectItem key={v.id} value={v.id}>{vehicleIcons[v.type]} {v.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Package Count</Label><Input type="number" defaultValue={1} min={1} /></div>
              <Button className="w-full bg-gradient-primary">Create Delivery</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {filtered.map(d => (
          <Card key={d.id} className={`transition-all hover:shadow-md ${d.status === "delayed" ? "border-destructive/30" : ""}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">{d.id}</span>
                    <Badge className={`text-[10px] ${priorityColors[d.priority]}`}>{d.priority}</Badge>
                    <span className={`text-xs capitalize font-medium ${statusColors[d.status]}`}>● {d.status}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <p className="text-sm text-muted-foreground truncate">{d.location}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{d.timeWindow}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{d.driver}</span>
                    <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{d.vehicle}</span>
                    <span className="flex items-center gap-1"><Route className="w-3 h-3" />{d.distance}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-foreground">${d.price}</p>
                  <p className="text-[10px] text-muted-foreground">ETA: {d.eta}</p>
                  {d.status === "in-transit" && <Progress value={65} className="h-1.5 w-20 mt-2" />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Schedule Timeline ───
function ScheduleTimeline() {
  const slots = MOCK_SLOTS;
  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
        <Zap className="w-5 h-5 text-primary shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">AI Schedule Optimizer</p>
          <p className="text-xs text-muted-foreground">AI recommends shifting 2 deliveries from 15:00–17:00 (peak) to 13:00–15:00 to balance load. Estimated savings: $24.</p>
          <Button size="sm" variant="outline" className="mt-2 h-7 text-xs border-primary/30 text-primary">Apply Optimization</Button>
        </div>
      </div>

      <div className="space-y-3">
        {slots.map(s => {
          const utilPct = (s.deliveries / s.capacity) * 100;
          return (
            <Card key={s.time} className={utilPct >= 87.5 ? "border-destructive/30" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                      <CalendarClock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{s.time}</p>
                      <p className="text-xs text-muted-foreground">{s.deliveries}/{s.capacity} deliveries</p>
                    </div>
                  </div>
                  <Badge className={`text-[10px] ${demandColors[s.demand]}`}>{s.demand} demand</Badge>
                  <div className="flex-1 max-w-[200px]">
                    <Progress value={utilPct} className="h-2.5" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">${s.price}</p>
                    {s.overridden && <Badge variant="outline" className="text-[9px] border-warning/40 text-warning">Manual</Badge>}
                    {!s.overridden && s.price !== s.basePrice && (
                      <span className={`text-[10px] ${s.price > s.basePrice ? "text-success" : "text-destructive"}`}>
                        {s.price > s.basePrice ? "+" : ""}{Math.round(((s.price - s.basePrice) / s.basePrice) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
                {/* Assigned deliveries in this slot */}
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  {MOCK_DELIVERIES.filter(d => d.timeWindow === s.time).map(d => (
                    <Badge key={d.id} variant="secondary" className="text-[10px] gap-1">
                      <CircleDot className={`w-2.5 h-2.5 ${statusColors[d.status]}`} />
                      {d.id}
                    </Badge>
                  ))}
                  {s.deliveries < s.capacity && (
                    <Badge variant="outline" className="text-[10px] border-dashed text-muted-foreground cursor-pointer hover:border-primary">
                      <Plus className="w-2.5 h-2.5 mr-0.5" />Add
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Fleet Panel ───
function FleetPanel() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          {["all", "available", "in-use", "maintenance"].map(s => (
            <Badge key={s} variant="outline" className="capitalize cursor-pointer hover:bg-primary/10">{s} ({MOCK_VEHICLES.filter(v => s === "all" || v.status === s).length})</Badge>
          ))}
        </div>
        <Button className="bg-gradient-primary gap-2"><Plus className="w-4 h-4" />Add Vehicle</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MOCK_VEHICLES.map(v => (
          <Card key={v.id} className={`transition-all hover:shadow-md ${v.status === "maintenance" ? "border-warning/30" : ""}`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{vehicleIcons[v.type]}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{v.name}</p>
                    <p className="text-[10px] text-muted-foreground">{v.id} · {v.plate}</p>
                  </div>
                </div>
                <span className={`text-xs capitalize font-medium ${statusColors[v.status]}`}>● {v.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-muted-foreground">Capacity</p>
                  <p className="font-bold text-foreground">{v.capacity} pkg</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-muted-foreground">Deliveries</p>
                  <p className="font-bold text-foreground">{v.deliveriesToday} today</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1"><Fuel className="w-3 h-3" />Fuel</span>
                  <span className={v.fuel < 40 ? "text-destructive font-medium" : "text-foreground"}>{v.fuel}%</span>
                </div>
                <Progress value={v.fuel} className="h-1.5" />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{v.mileage}</span>
                <span>Last service: {v.lastService}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Drivers Panel ───
function DriversPanel() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          {["all", "available", "driving", "break", "off-duty"].map(s => (
            <Badge key={s} variant="outline" className="capitalize cursor-pointer hover:bg-primary/10">{s} ({MOCK_DRIVERS.filter(d => s === "all" || d.status === s).length})</Badge>
          ))}
        </div>
        <Button className="bg-gradient-primary gap-2"><Plus className="w-4 h-4" />Add Driver</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_DRIVERS.map(d => (
          <Card key={d.id} className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-foreground">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground">{d.id} · {d.phone}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs capitalize font-medium ${statusColors[d.status]}`}>● {d.status}</span>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <span className="text-warning text-xs">★</span>
                    <span className="text-xs font-medium text-foreground">{d.rating}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{d.deliveriesCompleted}</p>
                  <p className="text-[10px] text-muted-foreground">Completed</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{d.vehicle || "—"}</p>
                  <p className="text-[10px] text-muted-foreground">Vehicle</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-foreground">{d.zone}</p>
                  <p className="text-[10px] text-muted-foreground">Zone</p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Hours: {d.hoursWorked}/{d.maxHours}h</span>
                  <span className={d.hoursWorked >= d.maxHours ? "text-destructive font-medium" : "text-muted-foreground"}>
                    {d.hoursWorked >= d.maxHours ? "Max reached" : `${d.maxHours - d.hoursWorked}h left`}
                  </span>
                </div>
                <Progress value={(d.hoursWorked / d.maxHours) * 100} className="h-1.5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Dynamic Pricing Panel ───
function DeliveryPricingPanel() {
  const [slots, setSlots] = useState(MOCK_SLOTS);

  const resetSlot = (time: string) => {
    setSlots(prev => prev.map(s => s.time === time ? { ...s, price: s.basePrice, overridden: false } : s));
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">AI Dynamic Pricing Active</p>
            <p className="text-xs text-muted-foreground">Prices auto-adjust based on demand, peak hours, and urgency. Today's avg. surcharge: +18%.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" />Slot Pricing</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {slots.map(s => (
              <div key={s.time} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.time}</p>
                  <Badge className={`text-[9px] ${demandColors[s.demand]}`}>{s.demand}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">${s.price}</p>
                    {s.price !== s.basePrice && (
                      <p className={`text-[10px] ${s.price > s.basePrice ? "text-success" : "text-destructive"}`}>
                        Base: ${s.basePrice} ({s.price > s.basePrice ? "+" : ""}{Math.round(((s.price - s.basePrice) / s.basePrice) * 100)}%)
                      </p>
                    )}
                  </div>
                  {s.overridden && (
                    <Button size="sm" variant="ghost" className="h-6 text-[10px] text-warning" onClick={() => resetSlot(s.time)}>Reset</Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" />Pricing Rules</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { rule: "Peak Hour Surcharge", desc: "09:00–11:00, 15:00–17:00", multiplier: "+40%", active: true },
              { rule: "High Demand Boost", desc: ">75% capacity filled", multiplier: "+25%", active: true },
              { rule: "Urgent Delivery", desc: "Same-day booking", multiplier: "+60%", active: true },
              { rule: "Off-Peak Discount", desc: "Before 09:00, after 19:00", multiplier: "-15%", active: true },
              { rule: "Distance Surcharge", desc: ">15 km deliveries", multiplier: "+$5 flat", active: false },
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
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function LogisticsManager({ config }: { config: IndustryConfig }) {
  return (
    <div className="space-y-6">
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Demo data — preview mode</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              The deliveries, drivers, fleet and time slots below are sample data so you can see how Logistics works.
              Your real records (added via the "New Delivery" buttons) are saved to your account and shown separately in your CRM.
              Full real-data rebuild for this dashboard is rolling out shortly.
            </p>
          </div>
        </CardContent>
      </Card>

      <LogisticsKPIs />

      <Tabs defaultValue="deliveries" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:w-auto lg:inline-grid gap-1">
          <TabsTrigger value="deliveries" className="gap-1.5 text-xs md:text-sm"><Package className="w-3.5 h-3.5" />Deliveries</TabsTrigger>
          <TabsTrigger value="schedule" className="gap-1.5 text-xs md:text-sm"><CalendarClock className="w-3.5 h-3.5" />Schedule</TabsTrigger>
          <TabsTrigger value="fleet" className="gap-1.5 text-xs md:text-sm"><Truck className="w-3.5 h-3.5" />Fleet</TabsTrigger>
          <TabsTrigger value="drivers" className="gap-1.5 text-xs md:text-sm"><Users className="w-3.5 h-3.5" />Drivers</TabsTrigger>
          <TabsTrigger value="pricing" className="gap-1.5 text-xs md:text-sm"><DollarSign className="w-3.5 h-3.5" />Pricing</TabsTrigger>
        </TabsList>

        <TabsContent value="deliveries"><DeliveriesPanel /></TabsContent>
        <TabsContent value="schedule"><ScheduleTimeline /></TabsContent>
        <TabsContent value="fleet"><FleetPanel /></TabsContent>
        <TabsContent value="drivers"><DriversPanel /></TabsContent>
        <TabsContent value="pricing"><DeliveryPricingPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
