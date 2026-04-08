import { Shield, UserCheck, AlertTriangle, Star } from "lucide-react";
import { calculateGuestScore, type Booking } from "@/lib/bookingStore";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface GuestScoreCardProps {
  bookings: Booking[];
}

const GuestScoreCard = ({ bookings }: GuestScoreCardProps) => {
  const activeBookings = bookings.filter(b => b.status !== "cancelled");

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <UserCheck className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Guest Score Predictor</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-5">AI-powered guest reliability scoring</p>

      <div className="space-y-3">
        {activeBookings.map(booking => {
          const { score, label, color, factors } = calculateGuestScore(booking);
          const ringColor = score >= 85 ? "stroke-success" : score >= 70 ? "stroke-primary" : score >= 55 ? "stroke-warning" : "stroke-destructive";

          return (
            <Tooltip key={booking.id}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" className="stroke-muted" strokeWidth="3" />
                      <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" className={ringColor} strokeWidth="3"
                        strokeDasharray={`${score}, 100`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">{score}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{booking.guestName}</p>
                      {booking.repeatGuest && <Star className="w-3 h-3 text-warning fill-warning flex-shrink-0" />}
                      {score < 55 && <AlertTriangle className="w-3 h-3 text-destructive flex-shrink-0" />}
                    </div>
                    <p className={`text-xs font-medium ${color}`}>{label}</p>
                    <p className="text-[10px] text-muted-foreground">{booking.propertyName}</p>
                  </div>
                  <Shield className={`w-4 h-4 flex-shrink-0 ${color}`} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="font-semibold mb-1">Score Factors:</p>
                <ul className="text-xs space-y-0.5">
                  {factors.map((f, i) => <li key={i}>• {f}</li>)}
                </ul>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};

export default GuestScoreCard;
