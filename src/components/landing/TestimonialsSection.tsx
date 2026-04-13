import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "S. Mitchell",
    role: "Hotel Manager",
    text: "HostFlow AI eliminated our double-booking nightmares. Revenue up 34% in the first month with AI dynamic pricing.",
    rating: 5,
    industry: "Hospitality",
    avatar: "SM",
  },
  {
    name: "Dr. A. Khan",
    role: "Operations Director, Medical Clinic",
    text: "Patient scheduling used to take 3 hours daily. Now AI handles everything. Zero missed appointments since we switched.",
    rating: 5,
    industry: "Healthcare",
    avatar: "AK",
  },
  {
    name: "J. Rodriguez",
    role: "Fleet Director, Car Rental Agency",
    text: "We manage 500+ vehicles across 12 locations. HostFlow's AI prevents conflicts and maximizes utilization effortlessly.",
    rating: 5,
    industry: "Car Rental",
    avatar: "JR",
  },
  {
    name: "E. Chen",
    role: "Events Coordinator",
    text: "From venue booking to ticket pricing, one platform does it all. The AI pricing alone pays for itself 10x over.",
    rating: 5,
    industry: "Events",
    avatar: "EC",
  },
  {
    name: "Prof. D. Okafor",
    role: "Academic Director, University",
    text: "Scheduling 200+ classes across 50 rooms with no conflicts? HostFlow AI makes the impossible look easy.",
    rating: 5,
    industry: "Education",
    avatar: "DO",
  },
  {
    name: "M. Lopez",
    role: "Operations Lead, Logistics Company",
    text: "Route optimization and delivery scheduling in one dashboard. Our on-time delivery rate went from 87% to 99%.",
    rating: 5,
    industry: "Logistics",
    avatar: "ML",
  },
  {
    name: "Capt. R. Müller",
    role: "Operations Director, Regional Airline",
    text: "Crew scheduling and gate management used to be chaos. HostFlow AI resolved 98% of conflicts automatically.",
    rating: 5,
    industry: "Airlines",
    avatar: "RM",
  },
  {
    name: "G. Freddy",
    role: "Station Manager, Railway Network",
    text: "Managing 50+ daily trains with AI scheduling — platform conflicts dropped to zero. Dynamic pricing boosted revenue 28%.",
    rating: 5,
    industry: "Railways",
    avatar: "GF",
  },
];

const AVATAR_COLORS = [
  "from-[hsl(174,62%,50%)] to-[hsl(190,80%,55%)]",
  "from-[hsl(0,72%,55%)] to-[hsl(25,95%,55%)]",
  "from-[hsl(217,91%,60%)] to-[hsl(190,80%,55%)]",
  "from-[hsl(300,80%,65%)] to-[hsl(270,80%,65%)]",
  "from-[hsl(270,80%,65%)] to-[hsl(217,91%,60%)]",
  "from-[hsl(38,92%,55%)] to-[hsl(25,95%,55%)]",
  "from-[hsl(217,91%,60%)] to-[hsl(174,62%,50%)]",
  "from-[hsl(38,92%,55%)] to-[hsl(174,62%,50%)]",
];

const TestimonialsSection = () => (
  <section className="py-24 relative overflow-hidden">
    <div className="absolute inset-0 bg-[hsl(222,47%,8%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(270,80%,60%,0.05),transparent_60%)]" />
    
    <div className="container relative z-10 space-y-14">
      <div className="text-center space-y-4">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">What Our Users Say</p>
        <h2 className="text-3xl md:text-5xl font-extrabold text-white">
          Trusted by <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)]">Growing Businesses</span>
        </h2>
        <p className="text-white/40 max-w-xl mx-auto text-lg">Real results from businesses across 8 industries.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {TESTIMONIALS.map((t, i) => (
          <Card key={t.name} className="bg-white/[0.03] border-white/[0.06] hover:border-white/15 backdrop-blur-sm transition-all duration-500 group hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_rgba(45,212,191,0.1)]">
            <CardContent className="p-7 space-y-5">
              <div className="flex items-center gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[hsl(38,92%,55%)] text-[hsl(38,92%,55%)]" />
                ))}
              </div>
              
              <p className="text-sm text-white/70 leading-relaxed">"{t.text}"</p>
              
              <div className="flex items-center gap-3 pt-2">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i]} flex items-center justify-center text-white text-xs font-bold`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-white/40">{t.role}</p>
                </div>
                <span className="ml-auto px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08] text-[10px] font-medium text-white/50">
                  {t.industry}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-[11px] text-white/20 italic">
        * Names abbreviated for privacy. Results may vary by business.
      </p>
    </div>
  </section>
);

export default TestimonialsSection;
