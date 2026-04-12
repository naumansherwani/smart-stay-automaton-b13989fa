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

  const handleClick = (industry: IndustryType) => {
    sessionStorage.setItem("preselected_industry", industry);
    if (!user) {
      navigate("/signup");
    } else {
      navigate("/onboarding");
    }
  };

  return (
    <section id="industries" className="py-16 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(217,91%,60%,0.03),transparent_60%)]" />

      <div className="container relative z-10 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold">
            <Zap className="w-4 h-4" /> Multi-Industry
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(174,62%,50%)] via-[hsl(217,91%,60%)] to-[hsl(270,80%,65%)] animate-pulse" style={{ animationDuration: '3s' }}>8</span> Independent Worlds.{" "}
            <span className="text-gradient-primary">One Unified AI.</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium tracking-wide">
            Zero Data Overlap<span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(174,62%,50%)] mx-2 align-middle shadow-[0_0_8px_hsl(174,62%,50%)]" />Fully Isolated<span className="inline-block w-1.5 h-1.5 rounded-full bg-[hsl(270,80%,65%)] mx-2 align-middle shadow-[0_0_8px_hsl(270,80%,65%)]" />Enterprise Ready
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {INDUSTRIES.map((ind) => (
            <Card
              key={ind.name}
              onClick={() => handleClick(ind.id)}
              className="group border-white/[0.06] bg-white/[0.02] backdrop-blur-sm transition-all duration-400 ease-out hover:-translate-y-1.5 hover:scale-[1.04] cursor-pointer overflow-hidden relative"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${ind.color}50`;
                e.currentTarget.style.boxShadow = `0 8px 40px -8px ${ind.color}30, 0 0 0 1px ${ind.color}20, inset 0 1px 0 0 ${ind.color}15`;
                e.currentTarget.style.background = `linear-gradient(135deg, ${ind.color}08, transparent)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
                e.currentTarget.style.background = "";
              }}
            >
              {/* Top glow line on hover */}
              <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `linear-gradient(90deg, transparent, ${ind.color}60, transparent)` }} />
              <CardContent className="p-5 flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                  style={{ backgroundColor: `${ind.color}12` }}
                >
                  <ind.icon className="w-5 h-5" style={{ color: ind.color }} />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm leading-tight group-hover:text-white transition-colors duration-300">{ind.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1 group-hover:text-white/50 transition-colors duration-300">{ind.desc}</p>
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
