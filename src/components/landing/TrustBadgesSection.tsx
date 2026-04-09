import { Shield, Lock, Award, CheckCircle, Globe, Server } from "lucide-react";

const BADGES = [
  { icon: Shield, label: "GDPR Compliant", desc: "Full EU data protection" },
  { icon: Lock, label: "256-bit Encryption", desc: "Bank-level security" },
  { icon: Award, label: "SOC 2 Type II", desc: "Enterprise audit ready" },
  { icon: CheckCircle, label: "99.9% Uptime SLA", desc: "Always available" },
  { icon: Globe, label: "Multi-Region", desc: "Global data centers" },
  { icon: Server, label: "Row-Level Security", desc: "Data isolation per user" },
];

const TrustBadgesSection = () => (
  <section className="py-16 bg-muted/30">
    <div className="container space-y-8">
      <div className="text-center space-y-3">
        <p className="text-primary font-semibold text-sm uppercase tracking-widest">Security & Compliance</p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Enterprise-Grade Protection</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {BADGES.map((b) => (
          <div key={b.label} className="text-center p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all duration-300 space-y-2">
            <b.icon className="w-8 h-8 mx-auto text-primary" />
            <p className="font-semibold text-foreground text-sm">{b.label}</p>
            <p className="text-[10px] text-muted-foreground">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBadgesSection;
