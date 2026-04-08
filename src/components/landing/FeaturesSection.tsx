import { Card, CardContent } from "@/components/ui/card";
import {
  Brain, CalendarSync, TrendingUp, Shield, Users, BarChart3,
  Plane, Car, Hotel, Stethoscope, GraduationCap, Truck,
  Theater, Dumbbell, Scale, Building, Ship, Landmark
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
  { icon: Hotel, name: "Travel, Tourism & Hospitality", desc: "Hotels, vacation rentals, B&Bs, tour operators" },
  { icon: Plane, name: "Airlines", desc: "Crew scheduling, gate management, fleet rotation" },
  { icon: Car, name: "Car Rental", desc: "Fleet availability, maintenance scheduling" },
  { icon: Stethoscope, name: "Healthcare", desc: "Appointment scheduling, OR rooms, equipment" },
  { icon: GraduationCap, name: "Education", desc: "Class scheduling, room allocation, tutoring" },
  { icon: Truck, name: "Logistics", desc: "Delivery slots, warehouse scheduling, fleet" },
  { icon: Theater, name: "Events", desc: "Venue booking, performer scheduling" },
  { icon: Dumbbell, name: "Fitness", desc: "Class schedules, trainer booking, equipment" },
  { icon: Scale, name: "Legal", desc: "Court dates, meeting rooms, consultations" },
  { icon: Building, name: "Real Estate", desc: "Property viewings, agent scheduling" },
  { icon: Ship, name: "Maritime", desc: "Berth allocation, crew rotation" },
  { icon: Landmark, name: "Government", desc: "Facility booking, appointment scheduling" },
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
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">Built for 13 Industries</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">One platform, tailored dashboards. Switch industries or manage multiple verticals from a single account.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {INDUSTRIES.map((ind) => (
            <Card key={ind.name} className="hover:border-primary/50 transition-colors cursor-default">
              <CardContent className="p-4 flex items-start gap-3">
                <ind.icon className="w-8 h-8 text-primary shrink-0 mt-0.5" />
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
