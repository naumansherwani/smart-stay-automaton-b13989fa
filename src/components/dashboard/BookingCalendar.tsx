import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Booking } from "@/lib/bookingStore";

const platformColors: Record<string, string> = {
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
    <div className="bg-card rounded-xl border border-border shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">{format(currentMonth, "MMMM yyyy")}</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayBookings = getBookingsForDate(day);
          const isToday = isSameDay(day, new Date());
          const inMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateClick?.(day)}
              className={`relative p-2 min-h-[72px] rounded-lg text-left transition-all hover:bg-secondary/50 ${!inMonth ? "opacity-30" : ""} ${isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
            >
              <span className={`text-xs font-medium ${isToday ? "text-primary" : "text-foreground"}`}>{format(day, "d")}</span>
              <div className="mt-1 space-y-0.5">
                {dayBookings.slice(0, 2).map(b => (
                  <div key={b.id} className={`${platformColors[b.platform]} text-[10px] px-1.5 py-0.5 rounded text-primary-foreground truncate font-medium`}>
                    {b.guestName.split(" ")[0]}
                  </div>
                ))}
                {dayBookings.length > 2 && (
                  <div className="text-[10px] text-muted-foreground">+{dayBookings.length - 2} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 mt-4 pt-4 border-t border-border">
        {Object.entries(platformColors).map(([platform, color]) => (
          <div key={platform} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-sm ${color}`} />
            <span className="text-xs text-muted-foreground capitalize">{platform === "booking" ? "Booking.com" : platform}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingCalendar;
