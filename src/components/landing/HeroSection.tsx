import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, ArrowRight, Sparkles, Shield, Zap, Brain, TrendingUp, Globe } from "lucide-react";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="container relative z-10">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
            <Brain className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">AI Calendar + AI Pricing — Every Industry, One Platform</span>
          </div>
          
          {/* Main Tagline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-primary-foreground leading-[1.05] tracking-tight">
            Book Smarter.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-[hsl(190,80%,50%)] to-accent">
              Price Smarter.
            </span><br />
            <span className="text-primary-foreground/90 text-4xl md:text-5xl lg:text-6xl font-bold">
              Grow Faster.
            </span>
          </h1>
          
          {/* Sub-tagline */}
          <p className="text-xl md:text-2xl font-medium text-primary-foreground/80 max-w-3xl mx-auto leading-relaxed">
            The world's first <span className="text-primary font-bold">AI Calendar</span> that schedules, prices, and protects your business — automatically. Zero double-bookings. Maximum revenue.
          </p>
          
          {/* Killer line */}
          <p className="text-base md:text-lg text-primary-foreground/50 max-w-2xl mx-auto italic">
            "One calendar to rule them all — from hotels to hospitals, airlines to law firms."
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:shadow-[0_0_30px_hsl(var(--primary)/0.6),0_0_60px_hsl(var(--primary)/0.3)] hover:scale-105 transition-all duration-300 text-lg px-10 py-6 border border-primary/40 shadow-[0_0_20px_hsl(var(--primary)/0.4)] font-bold" 
              onClick={() => navigate("/signup")}
            >
              Start Free — 3 Days, Full Power <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-300" 
              onClick={() => navigate("/pricing")}
            >
              See Plans & Pricing
            </Button>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-10 pt-8">
            <div className="flex items-center gap-2 text-primary-foreground/60">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">No credit card required</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/60">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">AI double-booking guard</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/60">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">AI dynamic pricing</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/60">
              <Globe className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">13 industries supported</span>
            </div>
          </div>

          {/* Industry marquee */}
          <div className="pt-10 overflow-hidden">
            <p className="text-xs text-primary-foreground/30 uppercase tracking-widest mb-4 font-semibold">Trusted across industries worldwide</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                "🌍 Hospitality", "✈️ Airlines", "🚗 Car Rental", "🏥 Healthcare",
                "🎓 Education", "📦 Logistics", "🎫 Events", "💪 Fitness",
                "⚖️ Legal", "🏠 Real Estate", "🏢 Coworking", "⚓ Maritime", "🏛️ Government"
              ].map(ind => (
                <span key={ind} className="px-3 py-1.5 rounded-full bg-primary-foreground/5 border border-primary-foreground/10 text-xs text-primary-foreground/50 font-medium backdrop-blur-sm">
                  {ind}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
