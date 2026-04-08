import { Button } from "@/components/ui/button";
import { Calendar, Shield, TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-hero min-h-[90vh] flex items-center">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-[150px]" />
      </div>

      <div className="container relative z-10 py-20 lg:py-32">
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 mb-8">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Smart Automation for Rental Hosts</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6" style={{ color: "hsl(0, 0%, 100%)" }}>
            Never Miss a Booking.
            <br />
            <span className="text-gradient-primary">Never Double Book.</span>
          </h1>

          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto" style={{ color: "hsl(215, 15%, 65%)" }}>
            Sync your Airbnb, Booking.com & VRBO calendars in one place. 
            AI-powered pricing maximizes your revenue automatically.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="bg-gradient-primary text-lg px-8 py-6 hover:opacity-90 transition-opacity" onClick={() => navigate("/dashboard")}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-muted-foreground/30 hover:bg-secondary/10" style={{ color: "hsl(0, 0%, 90%)" }} onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
              See How It Works
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { icon: Shield, label: "Double Booking Prevention" },
              { icon: Calendar, label: "Multi-Platform Sync" },
              { icon: TrendingUp, label: "AI Smart Pricing" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 justify-center" style={{ color: "hsl(215, 15%, 65%)" }}>
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
