import { DollarSign, ArrowDown, ArrowUp } from "lucide-react";
import { calculateTurnoverProfit, type Booking, type Property } from "@/lib/bookingStore";

interface TurnoverProfitProps {
  bookings: Booking[];
  properties: Property[];
}

const TurnoverProfit = ({ bookings, properties }: TurnoverProfitProps) => {
  const activeBookings = bookings.filter(b => b.status !== "cancelled").slice(0, 5);

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <DollarSign className="w-5 h-5 text-success" />
        <h2 className="text-lg font-bold text-foreground">Turnover Profit Calculator</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-5">Net profit after cleaning & platform fees per booking</p>

      <div className="space-y-3">
        {activeBookings.map(booking => {
          const property = properties.find(p => p.name === booking.propertyName);
          if (!property) return null;
          const profit = calculateTurnoverProfit(booking, property);

          return (
            <div key={booking.id} className="p-4 rounded-lg bg-secondary/30">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{booking.guestName}</p>
                  <p className="text-xs text-muted-foreground">{booking.propertyName} · {profit.nights} nights</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-success">${profit.netProfit}</p>
                  <p className="text-[10px] text-muted-foreground">{profit.margin}% margin</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded bg-background">
                  <p className="text-[10px] text-muted-foreground">Revenue</p>
                  <p className="text-xs font-bold text-foreground flex items-center justify-center gap-0.5">
                    <ArrowUp className="w-2.5 h-2.5 text-success" />${profit.grossRevenue}
                  </p>
                </div>
                <div className="text-center p-2 rounded bg-background">
                  <p className="text-[10px] text-muted-foreground">Cleaning</p>
                  <p className="text-xs font-bold text-foreground flex items-center justify-center gap-0.5">
                    <ArrowDown className="w-2.5 h-2.5 text-destructive" />${profit.cleaningCost}
                  </p>
                </div>
                <div className="text-center p-2 rounded bg-background">
                  <p className="text-[10px] text-muted-foreground">Platform Fee</p>
                  <p className="text-xs font-bold text-foreground flex items-center justify-center gap-0.5">
                    <ArrowDown className="w-2.5 h-2.5 text-destructive" />${profit.platformFee}
                  </p>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground capitalize">{booking.platform} fee: {booking.platform === "booking" ? "15%" : booking.platform === "vrbo" ? "5%" : booking.platform === "airbnb" ? "3%" : "0%"}</span>
                <span className="text-xs font-semibold text-primary">${profit.profitPerNight}/night net</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TurnoverProfit;
