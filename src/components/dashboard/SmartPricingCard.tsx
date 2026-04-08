import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { calculateSmartPrice, type Property } from "@/lib/bookingStore";

interface SmartPricingCardProps {
  properties: Property[];
}

const SmartPricingCard = ({ properties }: SmartPricingCardProps) => {
  const today = new Date();
  const nextDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-6">
      <h2 className="text-lg font-bold text-foreground mb-1">AI Smart Pricing</h2>
      <p className="text-sm text-muted-foreground mb-5">Suggested rates for the next 7 days</p>

      <div className="space-y-4">
        {properties.slice(0, 2).map(property => (
          <div key={property.id}>
            <h3 className="text-sm font-semibold text-foreground mb-3">{property.name}</h3>
            <div className="space-y-2">
              {nextDays.map(date => {
                const suggestion = calculateSmartPrice(property.basePrice, date);
                const diff = suggestion.suggestedPrice - suggestion.basePrice;
                const pct = Math.round((diff / suggestion.basePrice) * 100);

                return (
                  <div key={date.toISOString()} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground">
                        {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{suggestion.reasoning}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground line-through">${suggestion.basePrice}</span>
                      <span className="text-sm font-bold text-foreground">${suggestion.suggestedPrice}</span>
                      <span className={`flex items-center text-xs font-medium ${diff > 0 ? "text-success" : diff < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {diff > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : diff < 0 ? <TrendingDown className="w-3 h-3 mr-0.5" /> : <Minus className="w-3 h-3 mr-0.5" />}
                        {pct > 0 ? "+" : ""}{pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SmartPricingCard;
