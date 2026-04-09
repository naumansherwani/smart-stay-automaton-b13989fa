import { UserPlus, ListPlus, Rocket } from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    step: "01",
    title: "Sign Up in 30 Seconds",
    desc: "Create your account, pick your industry, and start your 3-day free trial — no credit card needed.",
    color: "hsl(174,62%,50%)",
    glow: "rgba(45,212,191,0.15)",
  },
  {
    icon: ListPlus,
    step: "02",
    title: "Add Your Resources",
    desc: "Set up your rooms, vehicles, staff, or equipment. AI auto-configures scheduling rules for your industry.",
    color: "hsl(217,91%,60%)",
    glow: "rgba(59,130,246,0.15)",
  },
  {
    icon: Rocket,
    step: "03",
    title: "Let AI Do The Rest",
    desc: "AI handles bookings, prevents conflicts, optimizes pricing, and grows your revenue — on autopilot.",
    color: "hsl(270,80%,65%)",
    glow: "rgba(139,92,246,0.15)",
  },
];

const HowItWorksSection = () => (
  <section className="py-24 bg-background relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(174,62%,50%,0.03),transparent_70%)]" />
    
    <div className="container relative z-10 space-y-16">
      <div className="text-center space-y-4">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">How It Works</p>
        <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">
          Up & Running in <span className="text-gradient-primary">3 Minutes</span>
        </h2>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">No setup fees. No tech skills needed. Just results.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {STEPS.map((s, i) => (
          <div key={s.step} className="relative group">
            {/* Connector line */}
            {i < 2 && (
              <div className="hidden md:block absolute top-16 left-[calc(100%+0.5rem)] w-[calc(100%-5rem)] h-px bg-gradient-to-r from-border to-transparent z-0" />
            )}
            
            <div className="relative bg-card border border-border rounded-2xl p-8 text-center space-y-5 hover:border-primary/30 transition-all duration-500 group-hover:shadow-[0_20px_60px_-15px] group-hover:shadow-primary/10 group-hover:-translate-y-1">
              {/* Step number */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold tracking-widest" style={{ backgroundColor: s.glow, color: s.color }}>
                STEP {s.step}
              </div>

              {/* Icon */}
              <div 
                className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ backgroundColor: s.glow }}
              >
                <s.icon className="w-8 h-8" style={{ color: s.color }} />
              </div>

              <h3 className="text-xl font-bold text-foreground">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
