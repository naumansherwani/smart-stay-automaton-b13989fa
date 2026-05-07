import { Card, CardContent } from "@/components/ui/card";
import {
  Globe, Plane, Car, Stethoscope, GraduationCap, Truck,
  Theater, TrainFront,
} from "lucide-react";
import type { IndustryType } from "@/lib/industryConfig";

const INDUSTRIES: { icon: React.ElementType; name: string; desc: string; color: string; id: IndustryType }[] = [
  { icon: Globe, name: "Travel, Tourism & Hospitality", desc: "Hotels, vacation rentals, tours", color: "#0d9488", id: "hospitality" },
  { icon: Plane, name: "Airlines", desc: "Crew, gates, fleet", color: "#3b82f6", id: "airlines" },
  { icon: Car, name: "Car Rental", desc: "Fleet & maintenance", color: "#0ea5e9", id: "car_rental" },
  { icon: Stethoscope, name: "Healthcare", desc: "Appointments & rooms", color: "#ef4444", id: "healthcare" },
  { icon: GraduationCap, name: "Education", desc: "Classes & timetables", color: "#8b5cf6", id: "education" },
  { icon: Truck, name: "Logistics", desc: "Delivery & warehouse", color: "#f97316", id: "logistics" },
  { icon: Theater, name: "Events", desc: "Venues & performers", color: "#d946ef", id: "events_entertainment" },
  { icon: TrainFront, name: "Railways", desc: "Trains & platforms", color: "#0284c7", id: "railways" },
];

interface IndustryChooserProps {
  currentIndustry: IndustryType;
  onSelect: (industry: IndustryType) => void;
}

export default function IndustryChooser({ currentIndustry, onSelect }: IndustryChooserProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-extrabold text-foreground">Choose Your Industry</h2>
        <p className="text-sm text-muted-foreground">Select an industry to manage its dashboard</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {INDUSTRIES.map((ind) => {
          const isActive = currentIndustry === ind.id;
          return (
            <Card
              key={ind.id}
              onClick={() => onSelect(ind.id)}
              className={`group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden relative ${
                isActive ? "ring-2 ring-primary shadow-lg" : "border-border/50 hover:border-primary/30"
              }`}
              style={isActive ? { borderColor: ind.color, boxShadow: `0 4px 20px -4px ${ind.color}40` } : {}}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = `${ind.color}50`;
                  e.currentTarget.style.boxShadow = `0 4px 20px -4px ${ind.color}25`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.boxShadow = "";
                }
              }}
            >
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: ind.color }} />
              )}
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                  style={{ backgroundColor: `${ind.color}15` }}
                >
                  <ind.icon className="w-5 h-5" style={{ color: ind.color }} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground leading-tight">{ind.name}</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{ind.desc}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
