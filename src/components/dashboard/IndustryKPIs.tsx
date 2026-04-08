import { TrendingUp, Clock, DollarSign, Users, BarChart3, Activity } from "lucide-react";
import type { IndustryConfig } from "@/lib/industryConfig";
import type { IndustryConfig } from "@/lib/industryConfig";

interface IndustryKPIsProps {
  config: IndustryConfig;
}

const iconMap: Record<string, React.ElementType> = {
  percent: BarChart3,
  currency: DollarSign,
  number: Users,
  duration: Clock,
};

function generateDemoValue(format: string): string {
  switch (format) {
    case "percent": return `${Math.floor(Math.random() * 30 + 65)}%`;
    case "currency": return `$${Math.floor(Math.random() * 200 + 50)}`;
    case "number": return `${Math.floor(Math.random() * 50 + 5)}`;
    case "duration": return `${Math.floor(Math.random() * 4 + 1)}h ${Math.floor(Math.random() * 59)}m`;
    default: return "—";
  }
}

const IndustryKPIs = ({ config }: IndustryKPIsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {config.kpis.map(kpi => {
        const Icon = iconMap[kpi.format] || Activity;
        const value = generateDemoValue(kpi.format);
        const trend = Math.floor(Math.random() * 20 - 5);
        
        return (
          <div key={kpi.key} className="bg-card rounded-xl border border-border shadow-card p-5 hover:shadow-elevated transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground font-medium">{kpi.label}</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className={`text-xs mt-1 ${trend >= 0 ? "text-success" : "text-destructive"}`}>
              <TrendingUp className={`w-3 h-3 inline mr-1 ${trend < 0 ? "rotate-180" : ""}`} />
              {trend >= 0 ? "+" : ""}{trend}% vs last period
            </p>
          </div>
        );
      })}
    </div>
  );
};

export default IndustryKPIs;
