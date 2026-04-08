import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import type { Booking } from "@/lib/bookingStore";

const platformStyles: Record<string, string> = {
  airbnb: "bg-[hsl(356,100%,64%)]/10 text-[hsl(356,100%,45%)] border-[hsl(356,100%,64%)]/20",
  booking: "bg-[hsl(220,80%,55%)]/10 text-[hsl(220,80%,40%)] border-[hsl(220,80%,55%)]/20",
  vrbo: "bg-[hsl(200,70%,50%)]/10 text-[hsl(200,70%,35%)] border-[hsl(200,70%,50%)]/20",
  direct: "bg-primary/10 text-primary border-primary/20",
};

interface BookingsListProps {
  bookings: Booking[];
}

const BookingsList = ({ bookings }: BookingsListProps) => {
  const sorted = [...bookings].sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-6">
      <h2 className="text-lg font-bold text-foreground mb-5">Upcoming Bookings</h2>
      <div className="space-y-3">
        {sorted.filter(b => b.status !== "cancelled").slice(0, 6).map(booking => (
          <div key={booking.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">{booking.guestName.charAt(0)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{booking.guestName}</p>
                <p className="text-xs text-muted-foreground">{booking.propertyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-muted-foreground">
                  {format(booking.checkIn, "MMM d")} → {format(booking.checkOut, "MMM d")}
                </p>
                <p className="text-sm font-semibold text-foreground">${booking.totalPrice}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] capitalize ${platformStyles[booking.platform]}`}>
                {booking.platform === "booking" ? "Booking.com" : booking.platform}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookingsList;
