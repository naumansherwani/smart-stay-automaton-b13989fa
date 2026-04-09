import { Card, CardContent } from "@/components/ui/card";
import {
  Brain, CalendarSync, TrendingUp, Shield, Users, BarChart3,
  Plane, Car, Stethoscope, GraduationCap, Truck,
  Theater, Dumbbell, Scale, Building2, Ship, Landmark, Globe, House
} from "lucide-react";

const FEATURES = [
  { icon: Brain, title: "AI Demand Forecasting", desc: "Predict demand using ML models trained on your industry data, weather, events & trends." },
  { icon: CalendarSync, title: "Smart Conflict Resolution", desc: "AI auto-detects and resolves scheduling conflicts before they cost you money." },
  { icon: TrendingUp, title: "Dynamic Pricing Engine", desc: "Real-time price optimization based on demand, competition, seasonality & capacity." },
  { icon: Shield, title: "Double-Booking Prevention", desc: "Cross-platform sync ensures zero scheduling conflicts across all channels." },
  { icon: Users, title: "Guest/Client Scoring", desc: "AI-powered risk assessment and VIP detection for every booking." },
  { icon: BarChart3, title: "Revenue Optimization", desc: "Gap-filling, turnover analysis, and profit-per-unit calculations in real time." },
];

const INDUSTRIES = [
  { icon: Globe, name: "Travel, Tourism & Hospitality", desc: "Hotels, vacation rentals, B&Bs, tour operators", color: "#0d9488", glow: "rgba(13,148,136,0.4)" },
  { icon: Plane, name: "Airlines", desc: "Crew scheduling, gate management, fleet rotation", color: "#3b82f6", glow: "rgba(59,130,246,0.4)" },
  { icon: Car, name: "Car Rental", desc: "Fleet availability, maintenance scheduling", color: "#0ea5e9", glow: "rgba(14,165,233,0.4)" },
  { icon: Stethoscope, name: "Healthcare", desc: "Appointment scheduling, OR rooms, equipment", color: "#ef4444", glow: "rgba(239,68,68,0.4)" },
  { icon: GraduationCap, name: "Education", desc: "Class scheduling, room allocation, tutoring", color: "#8b5cf6", glow: "rgba(139,92,246,0.4)" },
  { icon: Truck, name: "Logistics", desc: "Delivery slots, warehouse scheduling, fleet", color: "#f97316", glow: "rgba(249,115,22,0.4)" },
  { icon: Theater, name: "Events & Entertainment", desc: "Venue booking, performer scheduling", color: "#d946ef", glow: "rgba(217,70,239,0.4)" },
  { icon: Dumbbell, name: "Fitness & Wellness", desc: "Class schedules, trainer booking, equipment", color: "#22c55e", glow: "rgba(34,197,94,0.4)" },
  { icon: Scale, name: "Legal Services", desc: "Court dates, meeting rooms, consultations", color: "#eab308", glow: "rgba(234,179,8,0.4)" },
  { icon: House, name: "Real Estate", desc: "Property viewings, agent scheduling", color: "#f97316", glow: "rgba(249,115,22,0.4)" },
  { icon: Building2, name: "Coworking", desc: "Desk & room booking, memberships", color: "#06b6d4", glow: "rgba(6,182,212,0.4)" },
  { icon: Ship, name: "Maritime", desc: "Berth allocation, crew rotation", color: "#3b82f6", glow: "rgba(59,130,246,0.4)" },
  { icon: Landmark, name: "Government", desc: "Facility booking, appointment scheduling", color: "#6366f1", glow: "rgba(99,102,241,0.4)" },
];

const FeaturesSection = () => (
  <section id="features" className="py-20 bg-background">
    <div className="container space-y-20">
      <div className="text-center space-y-4">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">Advanced AI Features No One Else Offers</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Built with cutting-edge AI that learns your patterns and optimizes everything automatically.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES.map((f) => (
          <Card key={f.title} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardContent className="p-6 space-y-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div id="industries" className="space-y-8 pt-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gradient-primary">Built for 13 Industries</h2>
          <p className="text-xl md:text-2xl font-bold max-w-2xl mx-auto">
            <span className="bg-gradient-to-r from-[hsl(174,62%,50%)] via-[hsl(213,97%,75%)] to-[hsl(270,80%,70%)] bg-clip-text text-transparent drop-shadow-[0_0_20px_hsl(174,62%,50%,0.5)] animate-fade-in">
              One AI. Every industry. No limits.
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {INDUSTRIES.map((ind) => (
            <Card
              key={ind.name}
              className="group hover:-translate-y-1 transition-all duration-300 cursor-default border"
              style={{
                borderColor: `${ind.color}30`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${ind.color}80`;
                e.currentTarget.style.boxShadow = `0 0 20px ${ind.glow}, 0 0 40px ${ind.glow}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = `${ind.color}30`;
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${ind.color}15` }}
                >
                  <ind.icon className="w-5 h-5" style={{ color: ind.color }} />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{ind.name}</h4>
                  <p className="text-xs text-muted-foreground">{ind.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default FeaturesSection;
