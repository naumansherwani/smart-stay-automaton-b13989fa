import { Card, CardContent } from "@/components/ui/card";
import {
  Brain, Shield, TrendingUp, Users, BarChart3,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  { icon: Brain, title: "AI Demand Forecasting", desc: "ML models predict demand from weather, events & trends — available for Hospitality, Airlines, Car Rental, Events & Railways.", color: "hsl(270,80%,65%)", glow: "rgba(139,92,246,0.1)" },
  { icon: Shield, title: "Zero Double-Bookings", desc: "AI prevents scheduling conflicts across all 8 industries — auto-reassigns resources and notifies clients instantly.", color: "hsl(0,72%,55%)", glow: "rgba(239,68,68,0.1)" },
  { icon: TrendingUp, title: "Dynamic Pricing Engine", desc: "Real-time price optimization based on demand, competition & capacity — for Hospitality, Airlines, Car Rental, Events & Railways.", color: "hsl(160,60%,45%)", glow: "rgba(16,185,129,0.1)" },
  { icon: Users, title: "Client Scoring & VIP Detection", desc: "AI scores every client — identify VIPs, repeat customers, and risk signals automatically. Available for all industries.", color: "hsl(217,91%,60%)", glow: "rgba(59,130,246,0.1)" },
  { icon: BarChart3, title: "Revenue & Scheduling Optimizer", desc: "Turnover analysis and profit tracking for all industries. Gap-filling available for Hospitality.", color: "hsl(38,92%,55%)", glow: "rgba(245,158,11,0.1)" },
  { icon: Sparkles, title: "AI-Powered Automation", desc: "Automate repetitive tasks — AI handles scheduling, reminders & follow-ups across all 8 industries.", color: "hsl(174,62%,50%)", glow: "rgba(45,212,191,0.1)" },
];

const FeaturesSection = () => (
  <section id="features" className="py-24 bg-background relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(217,91%,60%,0.03),transparent_60%)]" />
    
    <div className="container relative z-10">
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
            <Sparkles className="w-4 h-4" /> AI-Powered Features
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">
            AI That <span className="text-gradient-primary">Thinks Ahead</span> So You Don't Have To
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
    </div>
  </section>
);

export default FeaturesSection;
