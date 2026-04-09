import { useEffect, useState, useRef, useCallback } from "react";
import { Users, Calendar, TrendingUp, Shield, Globe, Zap } from "lucide-react";

const STATS = [
  { icon: Users, value: 10000, suffix: "+", label: "Active Businesses", color: "hsl(174,62%,50%)" },
  { icon: Calendar, value: 2.5, suffix: "M+", label: "Bookings Managed", color: "hsl(217,91%,60%)" },
  { icon: TrendingUp, value: 34, suffix: "%", label: "Avg Revenue Increase", color: "hsl(160,60%,45%)" },
  { icon: Shield, value: 99.9, suffix: "%", label: "Uptime Guarantee", color: "hsl(270,80%,65%)" },
  { icon: Globe, value: 50, suffix: "+", label: "Countries Served", color: "hsl(38,92%,55%)" },
  { icon: Zap, value: 0, suffix: "Zero", label: "Double Bookings", color: "hsl(0,72%,55%)" },
];

function AnimatedCounter({ target, suffix, duration = 2000 }: { target: number; suffix: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const startAnimation = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    
    if (suffix === "Zero") { setCount(0); return; }
    
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(target * eased);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };
    requestAnimationFrame(animate);
  }, [target, suffix, duration]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    // Use IntersectionObserver
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startAnimation();
          obs.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "100px" }
    );
    obs.observe(el);
    
    // Fallback: if element is already visible on load, start immediately
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      startAnimation();
      obs.disconnect();
    }
    
    return () => obs.disconnect();
  }, [startAnimation]);

  const display = suffix === "Zero" ? "Zero" :
    suffix === "M+" ? `${count.toFixed(1)}${suffix}` :
    suffix === "%" ? `${count.toFixed(1)}${suffix}` :
    `${Math.floor(count).toLocaleString()}${suffix}`;

  return <div ref={ref} className="text-3xl md:text-4xl font-extrabold tracking-tight">{display}</div>;
}

const StatsSection = () => (
  <section className="py-20 relative overflow-hidden">
    <div className="absolute inset-0 bg-[hsl(222,47%,8%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(174,62%,50%,0.05),transparent_70%)]" />
    
    <div className="container relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
        {STATS.map((s) => (
          <div key={s.label} className="text-center space-y-3 group">
            <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center bg-white/[0.04] border border-white/[0.06] group-hover:border-white/15 transition-all duration-300 group-hover:scale-110">
              <s.icon className="w-6 h-6" style={{ color: s.color }} />
            </div>
            <div style={{ color: s.color }}>
              <AnimatedCounter target={s.value} suffix={s.suffix} />
            </div>
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;
