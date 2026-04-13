import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, Shield, Clock } from "lucide-react";

const CTASection = () => {
  const navigate = useNavigate();
  return (
    <section className="py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-[hsl(222,47%,8%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(174,62%,50%,0.08),transparent_60%)]" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[hsl(174,62%,50%)]/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[hsl(217,91%,60%)]/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1.5s" }} />

      <div className="container relative z-10 text-center space-y-10 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm">
          <Clock className="w-4 h-4 text-[hsl(38,92%,55%)]" />
          <span className="text-sm text-white/70 font-medium">Limited Time — 7 Days Full Access Free</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight">
          Ready to Transform
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)]">
            Your Business?
          </span>
        </h2>

        <p className="text-lg text-white/40 max-w-xl mx-auto leading-relaxed">
          Join 10,000+ businesses already using AI to eliminate double-bookings, optimize pricing, and grow revenue on autopilot.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <Button
            size="lg"
            className="group bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white text-lg px-10 py-7 font-bold rounded-xl shadow-[0_0_40px_rgba(45,212,191,0.3)] hover:shadow-[0_0_60px_rgba(45,212,191,0.5)] hover:scale-[1.03] transition-all duration-500 border-0"
            onClick={() => navigate("/signup")}
          >
            Start Free Trial <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            size="lg"
            className="text-lg px-8 py-7 bg-white/5 border border-white/15 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 font-medium"
            onClick={() => navigate("/contact")}
          >
            Talk to Sales
          </Button>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-sm text-white/40">
          <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-[hsl(160,60%,45%)]" /> No credit card</span>
          <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-[hsl(174,62%,50%)]" /> Full AI access</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[hsl(38,92%,55%)]" /> Cancel anytime</span>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
