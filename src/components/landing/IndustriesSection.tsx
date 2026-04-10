import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import {
  Globe, Plane, Car, Stethoscope, GraduationCap, Truck,
  Theater, TrainFront, Zap,
} from "lucide-react";
import type { IndustryType } from "@/lib/industryConfig";

const INDUSTRIES: { icon: React.ElementType; name: string; desc: string; color: string; id: IndustryType }[] = [
  { icon: Globe, name: "Travel, Tourism & Hospitality", desc: "Hotels, vacation rentals, B&Bs, tour operators", color: "#0d9488", id: "hospitality" },
  { icon: Plane, name: "Airlines", desc: "Crew scheduling, gate management, fleet rotation", color: "#3b82f6", id: "airlines" },
  { icon: Car, name: "Car Rental", desc: "Fleet availability, maintenance scheduling", color: "#0ea5e9", id: "car_rental" },
  { icon: Stethoscope, name: "Healthcare", desc: "Appointments, OR rooms, equipment booking", color: "#ef4444", id: "healthcare" },
  { icon: GraduationCap, name: "Education", desc: "Class scheduling, room allocation, tutoring", color: "#8b5cf6", id: "education" },
  { icon: Truck, name: "Logistics", desc: "Delivery slots, warehouse scheduling, fleet", color: "#f97316", id: "logistics" },
  { icon: Theater, name: "Events & Entertainment", desc: "Venue booking, performer scheduling", color: "#d946ef", id: "events_entertainment" },
  { icon: TrainFront, name: "Railways", desc: "Train scheduling, platform allocation, crew rotation", color: "#0284c7", id: "railways" },
];

const IndustriesSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClick = () => {
    if (!user) {
      navigate("/signup");
    } else {
      navigate("/onboarding");
    }
  };

  return (
    <section id="industries" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(217,91%,60%,0.03),transparent_60%)]" />

      <div className="container relative z-10 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold">
            <Zap className="w-4 h-4" /> Multi-Industry
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">
            One Platform. <span className="text-gradient-primary">8 Industries.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            One AI. Every industry. No limits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {INDUSTRIES.map((ind) => (
            <Card
              key={ind.name}
              onClick={handleClick}
              className="group border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:scale-[1.03] cursor-pointer overflow-hidden relative"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${ind.color}40`;
                e.currentTarget.style.boxShadow = `0 20px 60px -15px ${ind.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <CardContent className="p-5 flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${ind.color}12` }}
                >
                  <ind.icon className="w-5 h-5" style={{ color: ind.color }} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm leading-tight">{ind.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{ind.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default IndustriesSection;
