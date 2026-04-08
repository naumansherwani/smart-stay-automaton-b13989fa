import { TrendingUp, TrendingDown, Minus, Radar } from "lucide-react";
import { getCompetitorPrices, type Property } from "@/lib/bookingStore";

interface CompetitorRadarProps {
  properties: Property[];
}

const CompetitorRadar = ({ properties }: CompetitorRadarProps) => {
  const selectedProperty = properties[0];
  const competitors = getCompetitorPrices(selectedProperty);

  const trendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="w-3 h-3 text-success" />;
    if (trend === "down") return <TrendingDown className="w-3 h-3 text-destructive" />;
    return <Minus className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <Radar className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Competitor Radar</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-5">How your pricing compares to nearby listings</p>

      <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Your Property</p>
            <p className="text-sm font-bold text-foreground">{selectedProperty.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Your Rate</p>
            <p className="text-lg font-bold text-primary">${selectedProperty.basePrice}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {competitors.map((comp) => {
          const diff = selectedProperty.basePrice - comp.avgNightly;
          const pctDiff = Math.round((diff / comp.avgNightly) * 100);
          return (
            <div key={comp.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">{comp.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground">⭐ {comp.rating}</span>
                  <span className="text-xs text-muted-foreground">{comp.occupancy}% occ.</span>
                  {trendIcon(comp.trend)}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">${comp.avgNightly}</p>
                <p className={`text-xs font-medium ${diff > 0 ? "text-warning" : diff < 0 ? "text-success" : "text-muted-foreground"}`}>
                  {diff > 0 ? `You're ${pctDiff}% higher` : diff < 0 ? `You're ${Math.abs(pctDiff)}% lower` : "Same rate"}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompetitorRadar;
