import { Card, CardContent } from "@/components/ui/card";
import {
  Brain, Shield, TrendingUp, Users, BarChart3,
  Plane, Car, Stethoscope, GraduationCap, Truck,
  Theater, Globe, Sparkles, Zap, MessageSquare, Crown, TrainFront
} from "lucide-react";

const FEATURES = [
  { icon: Brain, title: "AI Demand Forecasting", desc: "ML models predict demand from weather, events & trends to optimize your schedule.", color: "hsl(270,80%,65%)", glow: "rgba(139,92,246,0.1)" },
  { icon: Shield, title: "Zero Double-Bookings", desc: "Cross-platform sync ensures no scheduling conflicts — ever. AI prevents them before they happen.", color: "hsl(0,72%,55%)", glow: "rgba(239,68,68,0.1)" },
  { icon: TrendingUp, title: "Dynamic Pricing Engine", desc: "Real-time price optimization based on demand, competition, seasonality & capacity.", color: "hsl(160,60%,45%)", glow: "rgba(16,185,129,0.1)" },
  { icon: Users, title: "Client Scoring & VIP Detection", desc: "AI scores every client — identify VIPs, repeat customers, and risk signals automatically.", color: "hsl(217,91%,60%)", glow: "rgba(59,130,246,0.1)" },
  { icon: BarChart3, title: "Revenue Optimizer", desc: "Gap-filling, turnover analysis, and profit-per-unit calculations — all in real time.", color: "hsl(38,92%,55%)", glow: "rgba(245,158,11,0.1)" },
  { icon: MessageSquare, title: "Built-in Marketplace & Chat", desc: "List services, connect with businesses, and close deals — all within the platform.", color: "hsl(174,62%,50%)", glow: "rgba(45,212,191,0.1)" },
];

const INDUSTRIES = [
  { icon: Globe, name: "Travel, Tourism & Hospitality", desc: "Hotels, vacation rentals, B&Bs, tour operators", color: "#0d9488" },
  { icon: Plane, name: "Airlines", desc: "Crew scheduling, gate management, fleet rotation", color: "#3b82f6" },
  { icon: Car, name: "Car Rental", desc: "Fleet availability, maintenance scheduling", color: "#0ea5e9" },
  { icon: Stethoscope, name: "Healthcare", desc: "Appointments, OR rooms, equipment booking", color: "#ef4444" },
  { icon: GraduationCap, name: "Education", desc: "Class scheduling, room allocation, tutoring", color: "#8b5cf6" },
  { icon: Truck, name: "Logistics", desc: "Delivery slots, warehouse scheduling, fleet", color: "#f97316" },
  { icon: Theater, name: "Events & Entertainment", desc: "Venue booking, performer scheduling", color: "#d946ef" },
];

const FeaturesSection = () => (
  <section id="features" className="py-24 bg-background relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(217,91%,60%,0.03),transparent_60%)]" />
    
    <div className="container relative z-10 space-y-24">
      {/* Features */}
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
            <Sparkles className="w-4 h-4" /> AI-Powered Features
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">
            Features That <span className="text-gradient-primary">No One Else</span> Offers
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Cutting-edge AI that learns your patterns and optimizes everything automatically.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {FEATURES.map((f) => (
            <Card key={f.title} className="group border-border/50 hover:border-primary/20 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:shadow-[0_20px_60px_-15px] hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-7 space-y-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ backgroundColor: f.glow }}
                >
                  <f.icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Industries */}
      <div id="industries" className="space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-semibold">
            <Zap className="w-4 h-4" /> Multi-Industry
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">
            One Platform. <span className="text-gradient-primary">7 Industries.</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Purpose-built AI for each industry — not a one-size-fits-all calendar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {INDUSTRIES.map((ind) => (
            <Card
              key={ind.name}
              className="group border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 cursor-default overflow-hidden relative"
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
    </div>
  </section>
);

export default FeaturesSection;
