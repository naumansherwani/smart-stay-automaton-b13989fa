import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Booking } from "@/lib/bookingStore";

const platformColors: Record<string, string> = {
  airbnb: "bg-[hsl(356,100%,64%)]",
  booking: "bg-[hsl(220,80%,55%)]",
  vrbo: "bg-[hsl(200,70%,50%)]",
  direct: "bg-primary",
};

const platformDotColors: Record<string, string> = {
  airbnb: "bg-[hsl(356,100%,64%)]",
  booking: "bg-[hsl(220,80%,55%)]",
  vrbo: "bg-[hsl(200,70%,50%)]",
  direct: "bg-primary",
};

interface BookingCalendarProps {
  bookings: Booking[];
  onDateClick?: (date: Date) => void;
}

const BookingCalendar = ({ bookings, onDateClick }: BookingCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getBookingsForDate = (date: Date) =>
    bookings.filter(b => b.status !== "cancelled" && date >= b.checkIn && date < b.checkOut);

  const prevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));

  return (
    <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
      {/* Premium Header */}
      <div className="flex items-center justify-between p-4 md:p-5 border-b border-border bg-gradient-to-r from-card to-secondary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-bold text-foreground">{format(currentMonth, "MMMM yyyy")}</h2>
            <p className="text-xs text-muted-foreground">{bookings.length} bookings</p>
          </div>
        </div>
        <div className="flex items-center border border-border rounded-lg">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-r-none" onClick={prevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-l-none" onClick={nextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-3 md:p-5">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="text-center text-xs md:text-sm font-bold text-muted-foreground py-2 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {days.map((day) => {
            const dayBookings = getBookingsForDate(day);
            const isToday = isSameDay(day, new Date());
            const inMonth = isSameMonth(day, currentMonth);
            const hasBookings = dayBookings.length > 0;

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateClick?.(day)}
                className={`
                  relative flex flex-col items-center justify-start
                  min-h-[56px] md:min-h-[88px] p-1.5 md:p-2.5 
                  rounded-xl text-center transition-all duration-200
                  hover:bg-primary/5 hover:shadow-md hover:scale-[1.02]
                  ${!inMonth ? "opacity-25" : ""} 
                  ${isToday ? "ring-2 ring-primary bg-primary/5 shadow-[0_0_15px_hsl(var(--primary)/0.15)]" : ""}
                  ${hasBookings && inMonth ? "bg-secondary/30" : ""}
                `}
              >
                {/* Date number — BIG */}
                <span className={`
                  text-base md:text-xl font-bold leading-none
                  ${isToday ? "text-primary" : "text-foreground"}
                `}>
                  {format(day, "d")}
                </span>

                {/* Booking indicators */}
                {hasBookings && inMonth && (
                  <>
                    {/* Mobile: colored dots */}
                    <div className="flex gap-1 mt-1.5 md:hidden">
                      {dayBookings.slice(0, 3).map(b => (
                        <div key={b.id} className={`w-2 h-2 rounded-full ${platformDotColors[b.platform] || "bg-primary"}`} />
                      ))}
                      {dayBookings.length > 3 && (
                        <span className="text-[9px] text-muted-foreground font-bold">+{dayBookings.length - 3}</span>
                      )}
                    </div>
                    {/* Desktop: name chips */}
                    <div className="hidden md:flex flex-col gap-0.5 mt-1.5 w-full">
                      {dayBookings.slice(0, 2).map(b => (
                        <div key={b.id} className={`${platformColors[b.platform] || "bg-primary"} text-[11px] px-1.5 py-0.5 rounded-md text-primary-foreground truncate font-medium`}>
                          {b.guestName.split(" ")[0]}
                        </div>
                      ))}
                      {dayBookings.length > 2 && (
                        <div className="text-[10px] text-muted-foreground font-semibold">+{dayBookings.length - 2} more</div>
                      )}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 md:gap-5 p-4 border-t border-border flex-wrap bg-secondary/10">
        {Object.entries(platformColors).map(([platform, color]) => (
          <div key={platform} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-full ${color}`} />
            <span className="text-xs md:text-sm text-muted-foreground capitalize font-medium">
              {platform === "booking" ? "Booking.com" : platform}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingCalendar;
