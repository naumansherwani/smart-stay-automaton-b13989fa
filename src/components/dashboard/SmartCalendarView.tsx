import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, startOfWeek, endOfWeek, addDays, addWeeks, subWeeks, addMonths, subMonths, startOfDay, isToday as isDateToday } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutGrid, List, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { IndustryConfig } from "@/lib/industryConfig";
import type { IndustryType } from "@/lib/industryConfig";
import { getDayPrice, type PriceOverrides } from "./AutoPricingPanel";
import { supportsAutoPricing } from "@/lib/industryFeatures";

interface CalendarBooking {
  id: string;
  guest_name: string;
  resource_name: string;
  check_in: string;
  check_out: string;
  status: string;
  platform: string;
}

interface SmartCalendarViewProps {
  bookings: CalendarBooking[];
  config: IndustryConfig;
  industry: IndustryType;
  basePrice?: number;
  pricingMode?: "ai" | "manual";
  priceOverrides?: PriceOverrides;
  onSlotClick?: (date: Date, time?: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-primary",
  pending: "bg-warning",
  cancelled: "bg-destructive/50",
  completed: "bg-success",
  "checked-in": "bg-accent",
  scheduled: "bg-primary",
  active: "bg-success",
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const SmartCalendarView = ({ bookings, config, industry, basePrice = 100, pricingMode = "manual", priceOverrides = {}, onSlotClick }: SmartCalendarViewProps) => {
  const [view, setView] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const aiSupported = supportsAutoPricing(industry);

  const navigate = (dir: -1 | 1) => {
    if (view === "month") setCurrentDate(p => dir === 1 ? addMonths(p, 1) : subMonths(p, 1));
    else if (view === "week") setCurrentDate(p => dir === 1 ? addWeeks(p, 1) : subWeeks(p, 1));
    else setCurrentDate(p => addDays(p, dir));
  };

  const goToday = () => setCurrentDate(new Date());

  const getBookingsForDate = (date: Date) =>
    bookings.filter(b => {
      const ci = new Date(b.check_in);
      const co = new Date(b.check_out);
      return b.status !== "cancelled" && date >= startOfDay(ci) && date < startOfDay(co);
    });

  const getPriceForDate = (date: Date) =>
    getDayPrice(basePrice, date, pricingMode, priceOverrides, aiSupported);

  const title = useMemo(() => {
    if (view === "month") return format(currentDate, "MMMM yyyy");
    if (view === "week") {
      const ws = startOfWeek(currentDate);
      const we = endOfWeek(currentDate);
      return `${format(ws, "MMM d")} – ${format(we, "MMM d, yyyy")}`;
    }
    return format(currentDate, "EEEE, MMMM d, yyyy");
  }, [view, currentDate]);

  const monthDays = useMemo(() => {
    const ms = startOfMonth(currentDate);
    const me = endOfMonth(currentDate);
    return eachDayOfInterval({ start: startOfWeek(ms), end: endOfWeek(me) });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const ws = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  }, [currentDate]);

  return (
    <div className="bg-card rounded-xl border border-border shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <Button variant="outline" size="sm" onClick={goToday}>Today</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Tabs value={view} onValueChange={v => setView(v as any)}>
            <TabsList className="h-8">
              <TabsTrigger value="month" className="text-xs px-2 h-6"><LayoutGrid className="w-3 h-3 mr-1" />Month</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-2 h-6"><CalendarIcon className="w-3 h-3 mr-1" />Week</TabsTrigger>
              <TabsTrigger value="day" className="text-xs px-2 h-6"><List className="w-3 h-3 mr-1" />Day</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Month View */}
      {view === "month" && (
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map(day => {
              const dayBookings = getBookingsForDate(day);
              const today = isDateToday(day);
              const inMonth = isSameMonth(day, currentDate);
              const dayPrice = getPriceForDate(day);
              return (
                <Tooltip key={day.toISOString()}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => { setCurrentDate(day); setView("day"); }}
                      className={`relative p-2 min-h-[80px] rounded-lg text-left transition-all hover:bg-secondary/50 ${!inMonth ? "opacity-30" : ""} ${today ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${today ? "text-primary font-bold" : "text-foreground"}`}>
                          {format(day, "d")}
                        </span>
                        {inMonth && (
                          <span className={`text-[9px] font-semibold px-1 rounded ${
                            dayPrice.isOverride
                              ? "bg-warning/15 text-warning"
                              : dayPrice.isAI
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground"
                          }`}>
                            ${dayPrice.price}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {dayBookings.slice(0, 2).map(b => (
                          <div key={b.id} className={`${STATUS_COLORS[b.status] || "bg-muted"} text-[9px] px-1 py-0.5 rounded text-primary-foreground truncate font-medium`}>
                            {b.guest_name.split(" ")[0]}
                          </div>
                        ))}
                        {dayBookings.length > 2 && (
                          <div className="text-[9px] text-muted-foreground">+{dayBookings.length - 2} more</div>
                        )}
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px]">
                    <p className="font-medium text-xs">{format(day, "EEE, MMM d")}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <DollarSign className="w-3 h-3" />
                      <span className="text-xs font-bold">${dayPrice.price}</span>
                      {dayPrice.isOverride && <Badge variant="outline" className="text-[8px] h-3 px-1">Override</Badge>}
                      {dayPrice.isAI && <Badge variant="outline" className="text-[8px] h-3 px-1">AI</Badge>}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{dayPrice.reasoning}</p>
                    {dayBookings.length > 0 && (
                      <p className="text-[10px] mt-1 border-t border-border pt-1">{dayBookings.length} booking{dayBookings.length > 1 ? "s" : ""}</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {view === "week" && (
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
              <div className="p-2" />
              {weekDays.map(day => {
                const dayPrice = getPriceForDate(day);
                return (
                  <div key={day.toISOString()} className={`p-2 text-center border-l border-border ${isDateToday(day) ? "bg-primary/5" : ""}`}>
                    <div className="text-xs text-muted-foreground">{format(day, "EEE")}</div>
                    <div className={`text-sm font-semibold ${isDateToday(day) ? "text-primary" : "text-foreground"}`}>{format(day, "d")}</div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={`text-[10px] font-medium px-1 rounded cursor-default ${
                          dayPrice.isOverride ? "bg-warning/15 text-warning" : dayPrice.isAI ? "bg-primary/10 text-primary" : "text-muted-foreground"
                        }`}>
                          ${dayPrice.price}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{dayPrice.reasoning}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                );
              })}
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {HOURS.filter(h => h >= 6 && h <= 22).map(hour => (
                <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50 min-h-[48px]">
                  <div className="p-1 text-[10px] text-muted-foreground text-right pr-2 pt-1">
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                  {weekDays.map(day => {
                    const dayBookings = getBookingsForDate(day).filter(b => new Date(b.check_in).getHours() === hour);
                    return (
                      <div
                        key={day.toISOString() + hour}
                        className={`border-l border-border/50 p-0.5 cursor-pointer hover:bg-secondary/30 transition-colors ${isDateToday(day) ? "bg-primary/5" : ""}`}
                        onClick={() => onSlotClick?.(day, `${hour}:00`)}
                      >
                        {dayBookings.map(b => (
                          <div key={b.id} className={`${STATUS_COLORS[b.status] || "bg-muted"} text-[9px] px-1 py-0.5 rounded text-primary-foreground truncate mb-0.5`}>
                            {b.guest_name.split(" ")[0]} • {b.resource_name}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Day View */}
      {view === "day" && (() => {
        const dayPrice = getPriceForDate(currentDate);
        return (
          <div className="p-4">
            {/* Day price banner */}
            <div className={`flex items-center justify-between mb-4 px-4 py-2.5 rounded-lg ${
              dayPrice.isOverride ? "bg-warning/10 border border-warning/20" : dayPrice.isAI ? "bg-primary/5 border border-primary/10" : "bg-secondary/50"
            }`}>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Today's Price:</span>
                <span className={`text-lg font-bold ${dayPrice.isOverride ? "text-warning" : "text-foreground"}`}>${dayPrice.price}</span>
                {dayPrice.isOverride && <Badge variant="outline" className="text-[9px] border-warning/40 text-warning">Override</Badge>}
                {dayPrice.isAI && <Badge variant="outline" className="text-[9px] border-primary/40 text-primary">AI</Badge>}
              </div>
              <span className="text-xs text-muted-foreground">{dayPrice.reasoning}</span>
            </div>
            <div className="space-y-1">
              {HOURS.filter(h => h >= 6 && h <= 22).map(hour => {
                const hourBookings = getBookingsForDate(currentDate).filter(b => {
                  const ci = new Date(b.check_in);
                  return ci.getHours() === hour || (ci.getHours() < hour && new Date(b.check_out).getHours() > hour);
                });
                return (
                  <div
                    key={hour}
                    className="grid grid-cols-[60px_1fr] min-h-[52px] border-b border-border/30 hover:bg-secondary/20 transition-colors cursor-pointer"
                    onClick={() => onSlotClick?.(currentDate, `${hour}:00`)}
                  >
                    <div className="text-xs text-muted-foreground text-right pr-3 pt-2">
                      {hour.toString().padStart(2, "0")}:00
                    </div>
                    <div className="p-1 space-y-1">
                      {hourBookings.map(b => (
                        <div key={b.id} className={`${STATUS_COLORS[b.status] || "bg-muted"} px-3 py-2 rounded-lg text-primary-foreground flex items-center justify-between`}>
                          <div>
                            <p className="text-sm font-medium">{b.guest_name}</p>
                            <p className="text-[11px] opacity-80">{b.resource_name}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-[10px] text-primary-foreground border-primary-foreground/30">
                              {b.status}
                            </Badge>
                            <p className="text-[10px] opacity-80 mt-0.5">
                              {format(new Date(b.check_in), "HH:mm")} – {format(new Date(b.check_out), "HH:mm")}
                            </p>
                          </div>
                        </div>
                      ))}
                      {hourBookings.length === 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                          <Clock className="w-3 h-3" /> Available
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div className="flex gap-4 p-4 border-t border-border flex-wrap">
        {Object.entries(STATUS_COLORS).slice(0, 5).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
            <span className="text-xs text-muted-foreground capitalize">{status}</span>
          </div>
        ))}
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/20 border border-primary/40" />
          <span className="text-xs text-muted-foreground">AI Price</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-warning/20 border border-warning/40" />
          <span className="text-xs text-muted-foreground">Override</span>
        </div>
      </div>
    </div>
  );
};

export default SmartCalendarView;
