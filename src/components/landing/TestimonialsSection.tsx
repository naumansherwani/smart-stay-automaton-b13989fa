import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Sarah Mitchell",
    role: "Hotel Manager, Grand Vista Resort",
    text: "HostFlow AI eliminated our double-booking nightmares. Revenue up 34% in the first month with AI dynamic pricing.",
    rating: 5,
    industry: "Hospitality",
  },
  {
    name: "Dr. Ahmed Khan",
    role: "Chief of Operations, MedCare Clinic",
    text: "Patient scheduling used to take 3 hours daily. Now AI handles everything. Zero missed appointments since we switched.",
    rating: 5,
    industry: "Healthcare",
  },
  {
    name: "James Rodriguez",
    role: "Fleet Director, AutoRent Global",
    text: "We manage 500+ vehicles across 12 locations. HostFlow's AI prevents conflicts and maximizes utilization effortlessly.",
    rating: 5,
    industry: "Car Rental",
  },
  {
    name: "Emily Chen",
    role: "Events Coordinator, StarLight Events",
    text: "From venue booking to ticket pricing, one platform does it all. The AI pricing alone pays for itself 10x over.",
    rating: 5,
    industry: "Events",
  },
  {
    name: "Prof. David Okafor",
    role: "Academic Director, TechEd University",
    text: "Scheduling 200+ classes across 50 rooms with no conflicts? HostFlow AI makes the impossible look easy.",
    rating: 5,
    industry: "Education",
  },
  {
    name: "Maria Lopez",
    role: "Operations Lead, SwiftShip Logistics",
    text: "Route optimization and delivery scheduling in one dashboard. Our on-time delivery rate went from 87% to 99%.",
    rating: 5,
    industry: "Logistics",
  },
];

const TestimonialsSection = () => (
  <section className="py-20 bg-[hsl(222,47%,11%)]">
    <div className="container space-y-12">
      <div className="text-center space-y-4">
        <p className="text-primary font-semibold text-sm uppercase tracking-widest">Testimonials</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          Loved by <span className="text-gradient-primary">10,000+</span> Businesses Worldwide
        </h2>
        <p className="text-[hsl(213,97%,87%)]/60 max-w-2xl mx-auto">
          From hotels to hospitals, our AI scheduling transforms every industry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <Card key={t.name} className="bg-[hsl(222,40%,14%)] border-[hsl(217,91%,60%)]/10 hover:border-primary/30 transition-all duration-300 group">
            <CardContent className="p-6 space-y-4">
              <Quote className="w-8 h-8 text-primary/30 group-hover:text-primary/60 transition-colors" />
              <p className="text-sm text-[hsl(213,97%,87%)]/80 leading-relaxed italic">"{t.text}"</p>
              <div className="flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <div className="pt-2 border-t border-[hsl(217,91%,60%)]/10">
                <p className="font-semibold text-white text-sm">{t.name}</p>
                <p className="text-xs text-[hsl(213,97%,87%)]/50">{t.role}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                  {t.industry}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
