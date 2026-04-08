import { Clock, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { findGapNights, type Booking, type Property } from "@/lib/bookingStore";
import { format } from "date-fns";

interface GapNightFillerProps {
  bookings: Booking[];
  properties: Property[];
}

const GapNightFiller = ({ bookings, properties }: GapNightFillerProps) => {
  const allGaps = properties.flatMap(p => findGapNights(bookings, p.name));

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="w-5 h-5 text-warning" />
        <h2 className="text-lg font-bold text-foreground">Gap Night Filler</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-5">Auto-detect & fill short gaps between bookings</p>

      {allGaps.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No gap nights detected — great job!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allGaps.map((gap, i) => {
            const prop = properties.find(p => p.name === gap.propertyName);
            const discountedRate = prop ? Math.round(prop.basePrice * (1 - gap.suggestedDiscount / 100)) : 0;

            return (
              <div key={i} className="p-4 rounded-lg border border-warning/20 bg-warning/5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">{gap.propertyName}</p>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-warning/20 text-warning">
                    {gap.gapNights} night{gap.gapNights > 1 ? "s" : ""} gap
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <span>{gap.beforeBooking.guestName}</span>
                  <span className="text-foreground font-medium">{format(gap.gapStart, "MMM d")}</span>
                  <ArrowRight className="w-3 h-3" />
                  <span className="text-foreground font-medium">{format(gap.gapEnd, "MMM d")}</span>
                  <span>{gap.afterBooking.guestName}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">Suggested: </span>
                    <span className="text-sm font-bold text-success">${discountedRate}/night</span>
                    <span className="text-xs text-muted-foreground ml-1">(-{gap.suggestedDiscount}%)</span>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-warning/30 hover:bg-warning/10">
                    Auto-fill Gap
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GapNightFiller;
