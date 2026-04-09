import { Shield, Lock, CheckCircle, Globe, Server, Key } from "lucide-react";

const BADGES = [
  { icon: Shield, label: "Data Protection", desc: "Privacy-first architecture", color: "hsl(174,62%,50%)" },
  { icon: Lock, label: "256-bit Encryption", desc: "Bank-level security", color: "hsl(217,91%,60%)" },
  { icon: Key, label: "Row-Level Security", desc: "Data isolation per user", color: "hsl(270,80%,65%)" },
  { icon: CheckCircle, label: "99.9% Uptime", desc: "Always available", color: "hsl(160,60%,45%)" },
  { icon: Globe, label: "Multi-Region", desc: "Global data centers", color: "hsl(38,92%,55%)" },
  { icon: Server, label: "Daily Backups", desc: "Automatic data backups", color: "hsl(0,72%,55%)" },
];

const TrustBadgesSection = () => (
  <section className="py-20 bg-background">
    <div className="container space-y-10">
      <div className="text-center space-y-3">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Security & Reliability</p>
        <h2 className="text-2xl md:text-4xl font-extrabold text-foreground">Your Data, Protected</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">Built with enterprise-grade security practices to keep your business data safe.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {BADGES.map((b) => (
          <div key={b.label} className="group text-center p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all duration-500 space-y-3 hover:-translate-y-1 hover:shadow-lg">
            <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center bg-primary/5 group-hover:bg-primary/10 transition-colors group-hover:scale-110 duration-300" style={{ backgroundColor: `${b.color}10` }}>
              <b.icon className="w-6 h-6" style={{ color: b.color }} />
            </div>
            <p className="font-bold text-foreground text-sm">{b.label}</p>
            <p className="text-[11px] text-muted-foreground">{b.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBadgesSection;
