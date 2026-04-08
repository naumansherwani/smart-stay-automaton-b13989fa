import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Multi-Industry Scheduling</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-primary-foreground leading-tight">
            One Calendar.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">Every Industry.</span>
          </h1>
          
          <p className="text-xl text-primary-foreground/70 max-w-2xl mx-auto">
            The only AI scheduling platform built for hospitality, airlines, car rentals, healthcare, logistics, and 8 more industries. Smarter than any calendar you've used.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8" onClick={() => navigate("/signup")}>
              Start 3-Day Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/pricing")}>
              View Pricing
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-8 pt-8">
            <div className="flex items-center gap-2 text-primary-foreground/60">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm">No credit card required</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/60">
              <Zap className="w-5 h-5 text-accent" />
              <span className="text-sm">AI-powered automation</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/60">
              <Calendar className="w-5 h-5 text-success" />
              <span className="text-sm">13 industries supported</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
