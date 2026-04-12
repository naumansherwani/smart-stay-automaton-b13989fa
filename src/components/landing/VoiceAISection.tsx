import { useState, useEffect } from "react";
import { Mic, MicOff, Waves, Sparkles, MessageSquare, Phone, Brain, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const VOICE_COMMANDS = [
  { cmd: "\"Show me today's top deals\"", response: "Found 12 deals worth $48,500 — 3 closing this week." },
  { cmd: "\"Schedule a follow-up with Sarah\"", response: "Done. Meeting booked for tomorrow at 2 PM." },
  { cmd: "\"What's my revenue this month?\"", response: "$127,400 — up 23% from last month. On track for target." },
  { cmd: "\"Send a proposal to Acme Corp\"", response: "AI-generated proposal sent. Estimated close probability: 87%." },
  { cmd: "\"Who needs follow-up today?\"", response: "5 contacts flagged — 2 VIPs, 1 at-risk, 2 new leads." },
];

const WAVEFORM_BARS = 24;

const VoiceAISection = () => {
  const navigate = useNavigate();
  const [activeCmd, setActiveCmd] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const [waveAmplitudes, setWaveAmplitudes] = useState<number[]>(Array(WAVEFORM_BARS).fill(0.15));

  useEffect(() => {
    const cycle = setInterval(() => {
      setShowResponse(false);
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        setShowResponse(true);
      }, 2200);
      setTimeout(() => {
        setActiveCmd((i) => (i + 1) % VOICE_COMMANDS.length);
      }, 5000);
    }, 5500);

    setIsListening(true);
    setTimeout(() => { setIsListening(false); setShowResponse(true); }, 2200);

    return () => clearInterval(cycle);
  }, []);

  useEffect(() => {
    if (!isListening) {
      setWaveAmplitudes(Array(WAVEFORM_BARS).fill(0.15));
      return;
    }
    const waveInterval = setInterval(() => {
      setWaveAmplitudes(
        Array(WAVEFORM_BARS).fill(0).map((_, i) => {
          const center = WAVEFORM_BARS / 2;
          const dist = Math.abs(i - center) / center;
          return 0.2 + (1 - dist) * 0.6 * (0.4 + Math.random() * 0.6);
        })
      );
    }, 80);
    return () => clearInterval(waveInterval);
  }, [isListening]);

  const current = VOICE_COMMANDS[activeCmd];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[hsl(222,47%,8%)]" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[hsl(270,80%,60%)]/8 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-[hsl(174,62%,50%)]/6 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[hsl(270,80%,60%)]/10 border border-[hsl(270,80%,60%)]/20 text-[hsl(270,80%,65%)] text-sm font-semibold">
              <Volume2 className="w-4 h-4" /> ElevenLabs Voice Integration
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white">
              Talk to Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(270,80%,65%)] via-[hsl(320,90%,65%)] to-[hsl(174,62%,50%)]">Advanced AI CRM</span>
            </h2>
            <p className="text-lg text-white/50 max-w-2xl mx-auto">
              Just speak. Our AI understands context, takes action, and responds instantly — powered by ElevenLabs voice technology.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: Interactive Voice Demo */}
            <div className="relative">
              <div className="rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-8 space-y-6 relative overflow-hidden">
                {/* Glow effect */}
                <div className={`absolute inset-0 rounded-3xl transition-opacity duration-700 ${isListening ? "opacity-100" : "opacity-0"}`}
                  style={{ boxShadow: "inset 0 0 60px rgba(139,92,246,0.08), 0 0 80px rgba(139,92,246,0.05)" }}
                />
                
                {/* Header bar */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isListening ? "bg-[hsl(270,80%,60%)]/20 shadow-[0_0_20px_rgba(139,92,246,0.3)]" : "bg-white/5"}`}>
                      {isListening ? <Mic className="w-5 h-5 text-[hsl(270,80%,65%)] animate-pulse" /> : <MicOff className="w-5 h-5 text-white/30" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white/90">Advanced AI CRM Voice</p>
                      <p className={`text-xs transition-colors duration-300 ${isListening ? "text-[hsl(270,80%,65%)]" : "text-white/40"}`}>
                        {isListening ? "● Listening..." : "Ready for commands"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isListening ? "bg-[hsl(270,80%,65%)] shadow-[0_0_8px_hsl(270,80%,65%)]" : "bg-white/20"}`} />
                    <span className="text-xs text-white/30">ElevenLabs</span>
                  </div>
                </div>

                {/* Waveform Visualizer */}
                <div className="flex items-center justify-center gap-[3px] h-16 relative z-10">
                  {waveAmplitudes.map((amp, i) => (
                    <div
                      key={i}
                      className="w-[3px] rounded-full transition-all duration-100"
                      style={{
                        height: `${amp * 100}%`,
                        backgroundColor: isListening
                          ? `hsl(${270 + (i / WAVEFORM_BARS) * 90}, 80%, ${55 + amp * 15}%)`
                          : "rgba(255,255,255,0.1)",
                        boxShadow: isListening ? `0 0 ${amp * 8}px hsl(270,80%,60%,${amp * 0.5})` : "none",
                      }}
                    />
                  ))}
                </div>

                {/* Command Display */}
                <div className="space-y-3 relative z-10">
                  <div className={`rounded-2xl bg-white/[0.04] border border-white/[0.06] px-5 py-4 transition-all duration-500 ${isListening ? "border-[hsl(270,80%,60%)]/20" : ""}`}>
                    <p className="text-xs text-white/30 mb-1.5 flex items-center gap-1.5">
                      <Mic className="w-3 h-3" /> You said:
                    </p>
                    <p className="text-base text-white/90 font-medium">{current.cmd}</p>
                  </div>

                  <div className={`rounded-2xl bg-[hsl(174,62%,50%)]/[0.04] border border-[hsl(174,62%,50%)]/[0.08] px-5 py-4 transition-all duration-500 ${showResponse ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
                    <p className="text-xs text-[hsl(174,62%,50%)]/60 mb-1.5 flex items-center gap-1.5">
                      <Brain className="w-3 h-3" /> AI Response:
                    </p>
                    <p className="text-base text-[hsl(174,62%,55%)] font-medium">{current.response}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Feature Cards */}
            <div className="space-y-5">
              {[
                { icon: Mic, title: "Voice Commands", desc: "Manage deals, contacts, and tasks with natural voice. No typing needed — just speak and let AI handle the rest.", gradient: "from-[hsl(270,80%,60%)] to-[hsl(320,90%,65%)]" },
                { icon: Waves, title: "Real-Time AI Responses", desc: "ElevenLabs processes your voice instantly with lifelike AI responses. It's like having a personal assistant that never sleeps.", gradient: "from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)]" },
                { icon: MessageSquare, title: "Smart Context Memory", desc: "AI remembers your conversation context. Say 'follow up on that' and it knows exactly what you mean.", gradient: "from-[hsl(38,92%,55%)] to-[hsl(25,95%,55%)]" },
                { icon: Phone, title: "Hands-Free CRM", desc: "Drive, walk, or multitask — run your entire business with just your voice. Perfect for field sales teams.", gradient: "from-[hsl(160,60%,45%)] to-[hsl(174,62%,50%)]" },
              ].map((f) => (
                <div key={f.title} className="group flex gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500">
                  <div className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white/90 mb-1 group-hover:text-white transition-colors">{f.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}

              <Button
                size="lg"
                className="w-full mt-4 bg-gradient-to-r from-[hsl(270,80%,60%)] to-[hsl(174,62%,50%)] hover:from-[hsl(270,80%,65%)] hover:to-[hsl(174,62%,55%)] text-white font-bold rounded-xl py-6 shadow-[0_0_30px_rgba(139,92,246,0.25)] hover:shadow-[0_0_50px_rgba(139,92,246,0.4)] transition-all duration-500 hover:scale-[1.02] border-0"
                onClick={() => navigate("/signup")}
              >
                <Sparkles className="mr-2 w-5 h-5" /> Try Voice AI CRM Free
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VoiceAISection;
