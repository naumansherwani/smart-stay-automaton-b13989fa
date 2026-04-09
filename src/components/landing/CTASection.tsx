import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  const navigate = useNavigate();
  return (
    <section className="py-24 bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/15 via-transparent to-transparent" />
      <div className="absolute top-10 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="container relative z-10 text-center space-y-8 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm text-primary font-medium">Limited Time — 3 Days Free</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
          Ready to Transform Your<br />
          <span className="text-gradient-primary">Scheduling Forever?</span>
        </h2>
        <p className="text-lg text-[hsl(213,97%,87%)]/70 max-w-xl mx-auto">
          Join 10,000+ businesses already using AI to eliminate double-bookings and maximize revenue.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button
            size="lg"
            className="bg-gradient-primary hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)] hover:scale-105 transition-all duration-300 text-lg px-10 py-6 font-bold"
            onClick={() => navigate("/signup")}
          >
            Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6 border-[hsl(213,97%,87%)]/30 text-[hsl(213,97%,87%)] hover:bg-primary/10 transition-all"
            onClick={() => navigate("/contact")}
          >
            Talk to Sales
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
