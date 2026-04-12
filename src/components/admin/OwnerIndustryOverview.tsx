import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Hotel, Plane, Car, Stethoscope, GraduationCap, Truck, Theater } from "lucide-react";

const INDUSTRY_ICONS: Record<string, any> = {
  hospitality: Hotel, airlines: Plane, car_rental: Car,
  healthcare: Stethoscope, education: GraduationCap,
  logistics: Truck, events_entertainment: Theater,
};

const INDUSTRY_COLORS: Record<string, string> = {
  hospitality: "#0d9488", airlines: "#3b82f6", car_rental: "#0ea5e9",
  healthcare: "#ef4444", education: "#8b5cf6",
  logistics: "#f97316", events_entertainment: "#d946ef",
};

interface OwnerIndustryOverviewProps {
  industries: Record<string, number>;
  showSecret: boolean;
}

const OwnerIndustryOverview = ({ industries, showSecret }: OwnerIndustryOverviewProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-sm">
        <Brain className="w-4 h-4 text-primary" />
        7-in-1 Industry Overview
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {Object.entries(INDUSTRY_ICONS).map(([key, Icon]) => (
          <div
            key={key}
            className="p-3 rounded-xl border border-border hover:border-primary/30 transition-all text-center space-y-1.5 cursor-default"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto"
              style={{ backgroundColor: `${INDUSTRY_COLORS[key]}20` }}
            >
              <Icon className="w-4 h-4" style={{ color: INDUSTRY_COLORS[key] }} />
            </div>
            <p className="text-[10px] font-semibold text-foreground capitalize">{key.replace(/_/g, " ")}</p>
            <p className="text-lg font-bold" style={{ color: INDUSTRY_COLORS[key] }}>
              {showSecret ? (industries[key] || 0) : "•"}
            </p>
            <p className="text-[9px] text-muted-foreground">resources</p>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default OwnerIndustryOverview;
