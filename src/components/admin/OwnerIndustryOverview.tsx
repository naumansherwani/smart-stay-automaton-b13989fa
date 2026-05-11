import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Hotel, Plane, Car, Stethoscope, GraduationCap, Truck, Theater, TrainFront, Crown } from "lucide-react";
import { ADVISORS } from "@/components/advisor/advisorConfig";
import type { IndustryType } from "@/lib/industryConfig";

const INDUSTRY_ICONS: Record<string, any> = {
  hospitality: Hotel, airlines: Plane, car_rental: Car,
  healthcare: Stethoscope, education: GraduationCap,
  logistics: Truck, events_entertainment: Theater, railways: TrainFront,
};

const INDUSTRY_COLORS: Record<string, string> = {
  hospitality: "#0d9488", airlines: "#3b82f6", car_rental: "#0ea5e9",
  healthcare: "#ef4444", education: "#8b5cf6",
  logistics: "#f97316", events_entertainment: "#d946ef", railways: "#0284c7",
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
        8-in-1 Industry Overview
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(INDUSTRY_ICONS).map(([key, Icon]) => {
          const advisor = ADVISORS[key as IndustryType];
          const isHospitality = key === "hospitality";
          return (
          <div
            key={key}
            className={`relative p-3 rounded-xl border transition-all text-center space-y-1.5 cursor-default ${
              isHospitality
                ? "border-[#f5d4a1]/50 bg-gradient-to-br from-[#f5d4a1]/10 via-[#f4c2d7]/10 to-transparent hover:border-[#f5d4a1]"
                : "border-border hover:border-primary/30"
            }`}
          >
            {advisor?.sovereignBadge && (
              <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold bg-gradient-to-r from-[#f5d4a1] to-[#f4c2d7] text-amber-900">
                <Crown className="w-2 h-2" />
              </span>
            )}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mx-auto"
              style={{ backgroundColor: `${INDUSTRY_COLORS[key]}20` }}
            >
              <Icon className="w-4 h-4" style={{ color: INDUSTRY_COLORS[key] }} />
            </div>
            <p className="text-[10px] font-semibold text-foreground capitalize">{key === "hospitality" ? "Travel, Tourism & Hospitality" : key.replace(/_/g, " ")}</p>
            {advisor && (
              <p className="text-[9px] text-muted-foreground line-clamp-1">
                {advisor.name}{advisor.shortTitle ? ` · ${advisor.shortTitle}` : ""}
              </p>
            )}
            <p className="text-lg font-bold" style={{ color: INDUSTRY_COLORS[key] }}>
              {showSecret ? (industries[key] || 0) : "•"}
            </p>
            <p className="text-[9px] text-muted-foreground">resources</p>
          </div>
          );
        })}
      </div>
    </CardContent>
  </Card>
);

export default OwnerIndustryOverview;
