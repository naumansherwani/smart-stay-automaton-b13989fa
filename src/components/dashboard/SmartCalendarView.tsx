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

const STATUS_DOT_COLORS: Record<string, string> = {
  confirmed: "bg-primary",
  pending: "bg-warning",
  cancelled: "bg-destructive",
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
    <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-5 border-b border-border bg-gradient-to-r from-card to-secondary/20">
        <div className="flex items-center gap-3 mb-3 sm:mb-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">{bookings.length} total bookings</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={goToday} className="text-xs font-semibold">
            Today
          </Button>
          <div className="flex items-center border border-border rounded-lg">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-r-none" onClick={() => navigate(-1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-l-none" onClick={() => navigate(1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Tabs value={view} onValueChange={v => setView(v as any)} className="ml-auto sm:ml-0">
            <TabsList className="h-9 bg-secondary/50">
              <TabsTrigger value="month" className="text-xs px-2.5 h-7 gap-1">
                <LayoutGrid className="w-3.5 h-3.5" /><span className="hidden sm:inline">Month</span>
              </TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-2.5 h-7 gap-1">
                <CalendarIcon className="w-3.5 h-3.5" /><span className="hidden sm:inline">Week</span>
              </TabsTrigger>
              <TabsTrigger value="day" className="text-xs px-2.5 h-7 gap-1">
                <List className="w-3.5 h-3.5" /><span className="hidden sm:inline">Day</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Month View — LARGE, READABLE */}
      {view === "month" && (
        <div className="p-3 md:p-5">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="text-center text-xs md:text-sm font-bold text-muted-foreground py-2 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>
          {/* Date cells */}
          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {monthDays.map(day => {
              const dayBookings = getBookingsForDate(day);
              const today = isDateToday(day);
              const inMonth = isSameMonth(day, currentDate);
              const dayPrice = getPriceForDate(day);
              const hasBookings = dayBookings.length > 0;
              return (
                <Tooltip key={day.toISOString()}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => { setCurrentDate(day); setView("day"); }}
                      className={`
                        relative flex flex-col items-center justify-start
                        min-h-[56px] md:min-h-[90px] p-1.5 md:p-2.5 
                        rounded-xl text-center transition-all duration-200
                        hover:bg-primary/5 hover:shadow-md hover:scale-[1.02]
                        ${!inMonth ? "opacity-25" : ""} 
                        ${today ? "ring-2 ring-primary bg-primary/5 shadow-[0_0_15px_hsl(var(--primary)/0.15)]" : ""}
                        ${hasBookings && inMonth ? "bg-secondary/30" : ""}
                      `}
                    >
                      {/* Date number — BIG & CLEAR */}
                      <span className={`
                        text-base md:text-xl font-bold leading-none
                        ${today ? "text-primary" : "text-foreground"}
                      `}>
                        {format(day, "d")}
                      </span>

                      {/* Price tag */}
                      {inMonth && (
                        <span className={`
                          text-[10px] md:text-xs font-semibold mt-1 px-1.5 py-0.5 rounded-md
                          ${dayPrice.isOverride ? "bg-warning/15 text-warning" : dayPrice.isAI ? "bg-primary/10 text-primary" : "text-muted-foreground/70"}
                        `}>
                          ${dayPrice.price}
                        </span>
                      )}

                      {/* Booking dots for mobile, chips for desktop */}
                      {hasBookings && inMonth && (
                        <>
                          {/* Mobile: colored dots */}
                          <div className="flex gap-1 mt-1 md:hidden">
                            {dayBookings.slice(0, 3).map(b => (
                              <div key={b.id} className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[b.status] || "bg-muted-foreground"}`} />
                            ))}
                            {dayBookings.length > 3 && (
                              <span className="text-[9px] text-muted-foreground font-bold">+{dayBookings.length - 3}</span>
                            )}
                          </div>
                          {/* Desktop: name chips */}
                          <div className="hidden md:flex flex-col gap-0.5 mt-1.5 w-full">
                            {dayBookings.slice(0, 2).map(b => (
                              <div key={b.id} className={`${STATUS_COLORS[b.status] || "bg-muted"} text-[11px] px-1.5 py-0.5 rounded-md text-primary-foreground truncate font-medium`}>
                                {b.guest_name.split(" ")[0]}
                              </div>
                            ))}
                            {dayBookings.length > 2 && (
                              <div className="text-[10px] text-muted-foreground font-semibold">+{dayBookings.length - 2} more</div>
                            )}
                          </div>
                        </>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[220px] p-3">
                    <p className="font-bold text-sm">{format(day, "EEE, MMM d")}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="text-sm font-bold">${dayPrice.price}</span>
                      {dayPrice.isOverride && <Badge variant="outline" className="text-[9px] h-4 px-1.5">Override</Badge>}
                      {dayPrice.isAI && <Badge variant="outline" className="text-[9px] h-4 px-1.5">AI</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{dayPrice.reasoning}</p>
                    {dayBookings.length > 0 && (
                      <p className="text-xs mt-1.5 border-t border-border pt-1.5 font-semibold">{dayBookings.length} booking{dayBookings.length > 1 ? "s" : ""}</p>
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
                const today = isDateToday(day);
                return (
                  <div key={day.toISOString()} className={`p-3 text-center border-l border-border ${today ? "bg-primary/5" : ""}`}>
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{format(day, "EEE")}</div>
                    <div className={`text-xl font-bold mt-0.5 ${today ? "text-primary" : "text-foreground"}`}>{format(day, "d")}</div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md cursor-default inline-block mt-1 ${
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
                <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50 min-h-[52px]">
                  <div className="p-1.5 text-xs font-semibold text-muted-foreground text-right pr-3 pt-2">
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                  {weekDays.map(day => {
                    const dayBookings = getBookingsForDate(day).filter(b => new Date(b.check_in).getHours() === hour);
                    return (
                      <div
                        key={day.toISOString() + hour}
                        className={`border-l border-border/50 p-1 cursor-pointer hover:bg-secondary/30 transition-colors ${isDateToday(day) ? "bg-primary/5" : ""}`}
                        onClick={() => onSlotClick?.(day, `${hour}:00`)}
                      >
                        {dayBookings.map(b => (
                          <div key={b.id} className={`${STATUS_COLORS[b.status] || "bg-muted"} text-[11px] px-1.5 py-1 rounded-md text-primary-foreground truncate mb-0.5 font-medium`}>
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
          <div className="p-4 md:p-5">
            {/* Day price banner */}
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 px-4 py-3 rounded-xl ${
              dayPrice.isOverride ? "bg-warning/10 border border-warning/20" : dayPrice.isAI ? "bg-primary/5 border border-primary/10" : "bg-secondary/50 border border-border"
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Today's Price</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${dayPrice.isOverride ? "text-warning" : "text-foreground"}`}>${dayPrice.price}</span>
                    {dayPrice.isOverride && <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">Override</Badge>}
                    {dayPrice.isAI && <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">AI</Badge>}
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground mt-2 sm:mt-0">{dayPrice.reasoning}</span>
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
                    className="grid grid-cols-[50px_1fr] md:grid-cols-[70px_1fr] min-h-[56px] border-b border-border/30 hover:bg-secondary/20 transition-colors cursor-pointer rounded-lg"
                    onClick={() => onSlotClick?.(currentDate, `${hour}:00`)}
                  >
                    <div className="text-xs md:text-sm font-semibold text-muted-foreground text-right pr-3 pt-3">
                      {hour.toString().padStart(2, "0")}:00
                    </div>
                    <div className="p-1.5 space-y-1.5">
                      {hourBookings.map(b => (
                        <div key={b.id} className={`${STATUS_COLORS[b.status] || "bg-muted"} px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-primary-foreground flex items-center justify-between shadow-sm`}>
                          <div>
                            <p className="text-sm md:text-base font-bold">{b.guest_name}</p>
                            <p className="text-xs opacity-80">{b.resource_name}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="text-[10px] md:text-xs text-primary-foreground border-primary-foreground/30">
                              {b.status}
                            </Badge>
                            <p className="text-[10px] md:text-xs opacity-80 mt-0.5">
                              {format(new Date(b.check_in), "HH:mm")} – {format(new Date(b.check_out), "HH:mm")}
                            </p>
                          </div>
                        </div>
                      ))}
                      {hourBookings.length === 0 && (
                        <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground/50 py-2.5">
                          <Clock className="w-3.5 h-3.5" /> Available
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
      <div className="flex gap-3 md:gap-5 p-4 border-t border-border flex-wrap bg-secondary/10">
        {Object.entries(STATUS_COLORS).slice(0, 5).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-xs md:text-sm text-muted-foreground capitalize font-medium">{status}</span>
          </div>
        ))}
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary/20 border-2 border-primary/40" />
          <span className="text-xs md:text-sm text-muted-foreground font-medium">AI Price</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-warning/20 border-2 border-warning/40" />
          <span className="text-xs md:text-sm text-muted-foreground font-medium">Override</span>
        </div>
      </div>
    </div>
  );
};

export default SmartCalendarView;
