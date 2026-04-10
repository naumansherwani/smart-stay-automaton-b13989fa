import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { INDUSTRY_CONFIGS, type IndustryType } from "@/lib/industryConfig";
import {
  Globe, Plane, Car, Hospital, GraduationCap, Package, Theater, TrainFront,
} from "lucide-react";

const ICON_MAP: Record<IndustryType, React.ElementType> = {
  hospitality: Globe,
  airlines: Plane,
  car_rental: Car,
  healthcare: Hospital,
  education: GraduationCap,
  logistics: Package,
  events_entertainment: Theater,
  railways: TrainFront,
};

const DESCRIPTIONS: Record<IndustryType, string> = {
  hospitality: "Manage bookings, guest scoring & channel sync for hotels and tours.",
  airlines: "Crew scheduling, gate assignment & load factor optimization.",
  car_rental: "Fleet tracking, utilization analytics & pricing optimization.",
  healthcare: "Appointment slots, patient flow & no-show prediction.",
  education: "Class scheduling, room booking & attendance tracking.",
  logistics: "Route optimization, warehouse slots & delivery tracking.",
  events_entertainment: "Venue calendars, ticket capacity & vendor coordination.",
  railways: "Platform allocation, route scheduling & delay tracking.",
};

const IndustriesSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleClick = (industry: IndustryType) => {
    if (!user) {
      navigate("/signup");
    } else {
      navigate("/onboarding");
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[hsl(222,47%,8%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(174,62%,50%,0.04),transparent_60%)]" />

      <div className="container relative z-10">
        <div className="text-center mb-14 space-y-3">
          <p className="text-[11px] text-[hsl(174,62%,50%)] uppercase tracking-[0.2em] font-semibold">Choose Your Industry</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Built for <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)]">Every Industry</span>
          </h2>
          <p className="text-white/40 max-w-lg mx-auto text-sm">
            Select your industry to get a workspace tailored to your business needs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {Object.values(INDUSTRY_CONFIGS).map((cfg) => {
            const Icon = ICON_MAP[cfg.id];
            return (
              <button
                key={cfg.id}
                onClick={() => handleClick(cfg.id)}
                className="group relative text-left p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm transition-all duration-300 hover:scale-[1.03] hover:bg-white/[0.06] hover:border-white/15 hover:shadow-[0_0_30px_rgba(45,212,191,0.12)] cursor-pointer"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                  style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}
                >
                  <Icon className="w-6 h-6" style={{ color: cfg.color }} />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1.5 group-hover:text-white/95 transition-colors">
                  {cfg.label}
                </h3>
                <p className="text-white/35 text-xs leading-relaxed group-hover:text-white/50 transition-colors">
                  {DESCRIPTIONS[cfg.id]}
                </p>
                {/* Glow border on hover */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: `inset 0 0 0 1px ${cfg.color}40, 0 0 20px ${cfg.color}10` }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default IndustriesSection;
