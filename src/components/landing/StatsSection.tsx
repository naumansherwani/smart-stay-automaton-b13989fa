import { useEffect, useState, useRef } from "react";
import { Users, Calendar, TrendingUp, Shield, Globe, Zap } from "lucide-react";

const STATS = [
  { icon: Users, value: 10000, suffix: "+", label: "Active Businesses", color: "text-primary" },
  { icon: Calendar, value: 2.5, suffix: "M+", label: "Bookings Managed", color: "text-[hsl(217,91%,60%)]" },
  { icon: TrendingUp, value: 34, suffix: "%", label: "Avg Revenue Increase", color: "text-[hsl(160,60%,45%)]" },
  { icon: Shield, value: 99.9, suffix: "%", label: "Uptime Guarantee", color: "text-[hsl(270,80%,70%)]" },
  { icon: Globe, value: 50, suffix: "+", label: "Countries Served", color: "text-[hsl(38,92%,60%)]" },
  { icon: Zap, value: 0, suffix: "Zero", label: "Double Bookings", color: "text-[hsl(0,72%,55%)]" },
];

function AnimatedCounter({ target, suffix, duration = 2000 }: { target: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    if (suffix === "Zero") { setCount(0); return; }
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(current);
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, target, suffix, duration]);

  const display = suffix === "Zero" ? "Zero" :
    suffix === "M+" ? `${count.toFixed(1)}${suffix}` :
    suffix === "%" ? `${count.toFixed(1)}${suffix}` :
    `${Math.floor(count).toLocaleString()}${suffix}`;

  return <div ref={ref} className="text-3xl md:text-4xl font-extrabold">{display}</div>;
}

const StatsSection = () => (
  <section className="py-16 bg-background border-y border-border">
    <div className="container">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
        {STATS.map((s) => (
          <div key={s.label} className="text-center space-y-2">
            <s.icon className={`w-7 h-7 mx-auto ${s.color}`} />
            <div className={s.color}>
              <AnimatedCounter target={s.value} suffix={s.suffix} />
            </div>
            <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;
