import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Plane, AlertTriangle, Calendar, Clock, DollarSign, Users,
  ChevronLeft, ChevronRight, Shield, Zap, TrendingUp
} from "lucide-react";
import { format, addDays, startOfWeek, isSameDay } from "date-fns";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Generate flight schedule from real bookings data
const generateFlightSchedule = (weekStart: Date, bookingsData: any[]) => {
  if (bookingsData.length === 0) return [];

  return bookingsData.map((b, i) => {
    const checkIn = new Date(b.check_in);
    const meta = (b.metadata as any) || {};
    const seatsTotal = meta.seats_total || 180;
    const seatsSold = meta.seats_sold || 0;
    const basePrice = Number(b.nightly_rate) || 150;
    const fillRatio = seatsTotal > 0 ? seatsSold / seatsTotal : 0;
    const aiPrice = Math.round(basePrice * (fillRatio > 0.8 ? 1.3 : fillRatio < 0.5 ? 0.85 : 1.0));

    return {
      id: b.id,
      code: meta.flight_code || `FL-${String(i + 1).padStart(3, "0")}`,
      from: meta.origin || "—",
      to: meta.destination || "—",
      aircraft: meta.aircraft || "—",
      pilot: meta.pilot || b.guest_name || "—",
      date: checkIn,
      departureTime: format(checkIn, "HH:mm"),
      arrivalTime: meta.arrival_time || "—",
      seatsTotal,
      seatsSold,
      basePrice,
      aiPrice,
      status: fillRatio > 0.9 ? "full" : fillRatio > 0.7 ? "filling" : "available",
    };
  });
};

// Detect double-booking conflicts
const detectConflicts = (flights: any[]) => {
  const conflicts: { type: string; detail: string; flights: string[] }[] = [];
  const dayGroups: Record<string, any[]> = {};

  flights.forEach(f => {
    const key = format(f.date, "yyyy-MM-dd");
    if (!dayGroups[key]) dayGroups[key] = [];
    dayGroups[key].push(f);
  });

  Object.entries(dayGroups).forEach(([day, dayFlights]) => {
    // Check pilot conflicts
    const pilotFlights: Record<string, any[]> = {};
    dayFlights.forEach(f => {
      if (!pilotFlights[f.pilot]) pilotFlights[f.pilot] = [];
      pilotFlights[f.pilot].push(f);
    });
    Object.entries(pilotFlights).forEach(([pilot, pf]) => {
      if (pf.length > 1) {
        // Check time overlap
        for (let i = 0; i < pf.length - 1; i++) {
          for (let j = i + 1; j < pf.length; j++) {
            const diff = Math.abs(parseInt(pf[i].departureTime) - parseInt(pf[j].departureTime));
            if (diff < 4) {
              conflicts.push({
                type: "pilot",
                detail: `${pilot} assigned to ${pf[i].code} & ${pf[j].code} on ${day} (overlap risk)`,
                flights: [pf[i].id, pf[j].id],
              });
            }
          }
        }
      }
    });

    // Check aircraft conflicts
    const acFlights: Record<string, any[]> = {};
    dayFlights.forEach(f => {
      if (!acFlights[f.aircraft]) acFlights[f.aircraft] = [];
      acFlights[f.aircraft].push(f);
    });
    Object.entries(acFlights).forEach(([ac, af]) => {
      if (af.length > 1) {
        for (let i = 0; i < af.length - 1; i++) {
          for (let j = i + 1; j < af.length; j++) {
            const diff = Math.abs(parseInt(af[i].departureTime) - parseInt(af[j].departureTime));
            if (diff < 5) {
              conflicts.push({
                type: "aircraft",
                detail: `${ac} assigned to ${af[i].code} & ${af[j].code} on ${day} (turnaround risk)`,
                flights: [af[i].id, af[j].id],
              });
            }
          }
        }
      }
    });
  });

  return conflicts;
};

export default function CrmFlightOpsCalendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [priceView, setPriceView] = useState<"base" | "ai">("ai");

  const weekStart = useMemo(() => {
    const today = new Date();
    return addDays(startOfWeek(today, { weekStartsOn: 1 }), weekOffset * 7);
  }, [weekOffset]);

  const { user } = useAuth();
  const [bookingsData, setBookingsData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const ws = weekStart.toISOString();
      const we = addDays(weekStart, 7).toISOString();
      const { data } = await supabase.from("bookings").select("*").gte("check_in", ws).lt("check_in", we);
      setBookingsData(data || []);
    };
    load();
  }, [user, weekStart]);

  const flights = useMemo(() => generateFlightSchedule(weekStart, bookingsData), [weekStart, bookingsData]);
  const conflicts = useMemo(() => detectConflicts(flights), [flights]);
  const conflictFlightIds = new Set(conflicts.flatMap(c => c.flights));

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const displayFlights = selectedDay
    ? flights.filter(f => isSameDay(f.date, selectedDay))
    : flights;

  const totalRevenue = displayFlights.reduce((s, f) => s + f.aiPrice * f.seatsSold, 0);
  const avgOccupancy = displayFlights.length > 0
    ? Math.round(displayFlights.reduce((s, f) => s + (f.seatsSold / f.seatsTotal) * 100, 0) / displayFlights.length)
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Flight Ops & Smart Calendar</h3>
          <Badge variant="secondary" className="text-[10px]">AI Pricing</Badge>
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-2 h-2 rounded-full bg-[hsl(160,60%,45%)] animate-pulse" />
            <span className="text-[10px] text-muted-foreground">Live</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={priceView} onValueChange={(v: "base" | "ai") => setPriceView(v)}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ai">AI Optimized Price</SelectItem>
              <SelectItem value="base">Base Price</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-lg">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs font-medium px-2">
              {format(weekStart, "MMM d")} — {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => { setWeekOffset(0); setSelectedDay(null); }}>
            Today
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Plane className="h-5 w-5 text-primary" />
            <div>
              <p className="text-lg font-bold text-foreground">{displayFlights.length}</p>
              <p className="text-[10px] text-muted-foreground">Flights</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Users className="h-5 w-5 text-[hsl(217,91%,60%)]" />
            <div>
              <p className="text-lg font-bold text-foreground">{avgOccupancy}%</p>
              <p className="text-[10px] text-muted-foreground">Avg Occupancy</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-[hsl(160,60%,45%)]" />
            <div>
              <p className="text-lg font-bold text-foreground">${(totalRevenue / 1000).toFixed(0)}k</p>
              <p className="text-[10px] text-muted-foreground">Est. Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card className={conflicts.length > 0 ? "border-destructive/50" : ""}>
          <CardContent className="p-3 flex items-center gap-3">
            <Shield className={`h-5 w-5 ${conflicts.length > 0 ? "text-destructive" : "text-[hsl(160,60%,45%)]"}`} />
            <div>
              <p className="text-lg font-bold text-foreground">{conflicts.length}</p>
              <p className="text-[10px] text-muted-foreground">Conflicts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Double Booking Conflicts Alert */}
      {conflicts.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Double Booking Guard — {conflicts.length} Conflict{conflicts.length > 1 ? "s" : ""} Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {conflicts.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <Badge variant="destructive" className="text-[9px]">{c.type.toUpperCase()}</Badge>
                <span className="text-muted-foreground">{c.detail}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Week Day Selector */}
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const dayFlights = flights.filter(f => isSameDay(f.date, day));
          const dayConflicts = conflicts.filter(c =>
            c.flights.some(fid => dayFlights.some(f => f.id === fid))
          );
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`p-2 rounded-xl border text-center transition-all ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : isToday
                  ? "border-primary/40 bg-primary/5"
                  : "border-border hover:border-primary/30"
              } ${dayConflicts.length > 0 ? "ring-1 ring-destructive/40" : ""}`}
            >
              <p className="text-[10px] text-muted-foreground">{format(day, "EEE")}</p>
              <p className={`text-sm font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                {format(day, "d")}
              </p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Plane className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{dayFlights.length}</span>
              </div>
              {dayConflicts.length > 0 && (
                <Badge variant="destructive" className="text-[8px] mt-1 px-1">{dayConflicts.length}⚠</Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Flight Schedule Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plane className="h-4 w-4 text-primary" />
            {selectedDay ? `Flights on ${format(selectedDay, "EEEE, MMM d")}` : "All Week Flights"}
            <Badge variant="outline" className="text-[10px] ml-auto">{displayFlights.length} flights</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b text-xs">
                  <th className="pb-2 font-medium">Flight</th>
                  <th className="pb-2 font-medium">Route</th>
                  <th className="pb-2 font-medium">Aircraft</th>
                  <th className="pb-2 font-medium">Pilot</th>
                  <th className="pb-2 font-medium">Time</th>
                  <th className="pb-2 font-medium text-center">Seats</th>
                  <th className="pb-2 font-medium text-center">Price</th>
                  <th className="pb-2 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayFlights.map(f => {
                  const occupancy = Math.round((f.seatsSold / f.seatsTotal) * 100);
                  const isConflict = conflictFlightIds.has(f.id);
                  const displayPrice = priceView === "ai" ? f.aiPrice : f.basePrice;
                  const priceDiff = f.aiPrice - f.basePrice;

                  return (
                    <tr
                      key={f.id}
                      className={`border-b border-border/50 ${isConflict ? "bg-destructive/5" : ""}`}
                    >
                      <td className="py-2">
                        <div className="flex items-center gap-1.5">
                          {isConflict && <AlertTriangle className="h-3 w-3 text-destructive" />}
                          <span className="font-mono font-medium text-foreground">{f.code}</span>
                        </div>
                      </td>
                      <td className="py-2 text-muted-foreground">{f.from} → {f.to}</td>
                      <td className="py-2 text-muted-foreground text-xs">{f.aircraft}</td>
                      <td className="py-2 text-muted-foreground text-xs">{f.pilot}</td>
                      <td className="py-2 text-xs">
                        <span className="text-foreground">{f.departureTime}</span>
                        <span className="text-muted-foreground"> → {f.arrivalTime}</span>
                      </td>
                      <td className="py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-xs font-medium ${occupancy > 90 ? "text-destructive" : occupancy > 70 ? "text-[hsl(38,92%,50%)]" : "text-[hsl(160,60%,45%)]"}`}>
                            {f.seatsSold}/{f.seatsTotal}
                          </span>
                          <span className="text-[10px] text-muted-foreground">({occupancy}%)</span>
                        </div>
                      </td>
                      <td className="py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`text-xs font-bold ${priceView === "ai" ? "text-[hsl(160,60%,45%)]" : "text-foreground"}`}>
                            ${displayPrice}
                          </span>
                          {priceView === "ai" && priceDiff !== 0 && (
                            <Badge className={`text-[8px] px-1 border-0 ${priceDiff > 0 ? "bg-[hsl(160,60%,45%)]/15 text-[hsl(160,60%,45%)]" : "bg-[hsl(38,92%,50%)]/15 text-[hsl(38,92%,50%)]"}`}>
                              {priceDiff > 0 ? `+$${priceDiff} ↑` : `-$${Math.abs(priceDiff)} ↓`}
                            </Badge>
                          )}
                          {priceView === "ai" && (
                            <Zap className="h-3 w-3 text-[hsl(160,60%,45%)]" />
                          )}
                        </div>
                      </td>
                      <td className="py-2 text-center">
                        <Badge
                          variant={f.status === "full" ? "destructive" : f.status === "filling" ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {f.status === "full" ? "Full" : f.status === "filling" ? "Filling" : "Available"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {displayFlights.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No flights scheduled</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
