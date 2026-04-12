import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Brain, Shield, Zap, TrendingUp, Globe, Play, Star } from "lucide-react";
import { useEffect, useState } from "react";

const ROTATING_WORDS = ["Hotels", "Airlines", "Clinics", "Schools", "Fleets", "Events", "Railways"];

const HeroSection = () => {
  const navigate = useNavigate();
  const [wordIndex, setWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-28 pb-28 md:pt-36 md:pb-36 overflow-hidden">
      {/* Premium dark background */}
      <div className="absolute inset-0 bg-[hsl(222,47%,8%)]" />
      
      {/* Animated gradient mesh */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[hsl(174,62%,50%)]/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[hsl(217,91%,60%)]/8 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[hsl(270,80%,60%)]/5 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="container relative z-10">
        <div className={`max-w-5xl mx-auto text-center space-y-10 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          
          {/* Top badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(45,212,191,0.1)]">
            <div className="w-2 h-2 rounded-full bg-[hsl(160,60%,45%)] animate-pulse shadow-[0_0_8px_hsl(160,60%,45%)]" />
            <span className="text-sm font-medium text-white/80">AI-Powered Business Scheduling Platform</span>
            <span className="px-2 py-0.5 rounded-full bg-[hsl(174,62%,50%)]/15 text-[hsl(174,62%,50%)] text-xs font-bold">NEW</span>
          </div>

          {/* Main headline */}
          <div className="space-y-5">
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold leading-[1.05] tracking-tight">
              <span className="text-white">Grow Smarter.</span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(174,62%,50%)] via-[hsl(190,80%,55%)] to-[hsl(217,91%,60%)]">
                AI Runs Your
              </span>
              {" "}
              <span 
                key={wordIndex}
                className="inline-block bg-clip-text text-transparent bg-gradient-to-r from-[hsl(38,92%,60%)] to-[hsl(25,95%,55%)] animate-fade-in min-w-[180px] md:min-w-[240px]"
              >
                {ROTATING_WORDS[wordIndex]}
              </span>
            </h1>
          </div>

          {/* Sub-headline */}
          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-xl md:text-2xl font-semibold leading-relaxed tracking-wide">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(174,62%,50%)] via-[hsl(190,80%,55%)] to-[hsl(217,91%,60%)] drop-shadow-[0_0_20px_rgba(45,212,191,0.35)]">The World's First Industry-Sovereign AI OS.</span>
              <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(280,100%,70%)] via-[hsl(320,90%,65%)] to-[hsl(350,95%,65%)] drop-shadow-[0_0_15px_rgba(168,85,247,0.3)] text-lg md:text-xl">Don't Just Manage Data</span>
              <span className="text-white/30">—</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] drop-shadow-[0_0_15px_rgba(45,212,191,0.4)]">Command Your Business</span>
            </p>
            <p className="text-base max-w-2xl mx-auto leading-relaxed font-medium">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(38,92%,65%)] via-[hsl(174,62%,50%)] to-[hsl(270,80%,65%)] drop-shadow-[0_0_12px_rgba(45,212,191,0.2)]">Predict Revenue, Automate Operations, and lead with voice-activated intelligence.</span>
              <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(217,91%,65%)] via-[hsl(0,72%,60%)] via-[hsl(270,80%,65%)] to-[hsl(174,62%,55%)] drop-shadow-[0_0_12px_rgba(96,165,250,0.2)]">Dedicated AI workspaces for Airlines, Healthcare, Logistics, and beyond.</span>
            </p>
          </div>

          {/* Glassmorphism Feature Badges */}
          <div className="flex flex-wrap items-stretch justify-center gap-5 pt-2 max-w-4xl mx-auto">
            {[
              { emoji: "✨", title: "Agentic AI", desc: "Autonomous workflows that work for you" },
              { emoji: "🎙️", title: "Advanced AI CRM", desc: "Voice-powered ElevenLabs integration for hands-free CRM" },
              { emoji: "📊", title: "Predictive", desc: "99% accuracy in revenue & churn forecasting" },
            ].map((b) => (
              <div
                key={b.title}
                className="flex-1 min-w-[180px] max-w-[260px] px-6 py-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl hover:bg-white/[0.07] hover:border-white/[0.14] transition-all duration-500 group"
              >
                <div className="text-3xl mb-2.5">{b.emoji}</div>
                <p className="text-base font-bold text-white/90 mb-1.5 group-hover:text-white transition-colors">{b.title}</p>
                <p className="text-sm text-white/40 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              size="lg"
              className="relative group bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] hover:from-[hsl(174,62%,55%)] hover:to-[hsl(217,91%,65%)] text-white text-lg px-10 py-7 font-bold rounded-xl shadow-[0_0_40px_rgba(45,212,191,0.3)] hover:shadow-[0_0_60px_rgba(45,212,191,0.5)] transition-all duration-500 hover:scale-[1.03] border-0"
              onClick={() => navigate("/signup")}
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              className="text-lg px-8 py-7 bg-white/5 border border-white/15 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/25 backdrop-blur-sm rounded-xl transition-all duration-300 font-medium"
              onClick={() => navigate("/pricing")}
            >
              <Globe className="mr-2 w-5 h-5" /> View Pricing
            </Button>
          </div>
          <p className="text-sm text-white/40 font-medium pt-1">Start free — 7-day trial, no credit card required</p>

          {/* Social proof bar */}
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 pt-4">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[hsl(222,47%,8%)] bg-gradient-to-br from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)]" style={{ opacity: 1 - i * 0.1 }} />
                ))}
              </div>
              <span className="text-sm text-white/50 ml-2">
                <strong className="text-white/80">10,000+</strong> businesses
              </span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-4 h-4 fill-[hsl(38,92%,55%)] text-[hsl(38,92%,55%)]" />
              ))}
              <span className="text-sm text-white/50 ml-1.5"><strong className="text-white/80">4.9/5</strong> rating</span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden md:block" />
            <div className="flex items-center gap-1.5 text-sm text-white/50">
              <Shield className="w-4 h-4 text-[hsl(160,60%,45%)]" />
              <span>No credit card required</span>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
