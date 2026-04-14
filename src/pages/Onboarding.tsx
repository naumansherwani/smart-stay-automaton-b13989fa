import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { Button } from "@/components/ui/button";
import { CheckCircle, Sparkles, Loader2, Hotel, Plane, Car, Stethoscope, GraduationCap, Truck, Theater, TrainFront, Building2, Globe } from "lucide-react";
import { toast } from "sonner";
import { type IndustryType } from "@/lib/industryConfig";
import { INDUSTRY_CONFIGS } from "@/lib/industryConfig";
import type { BusinessSubtype } from "@/hooks/useProfile";

const industryOptions: { value: IndustryType; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  { value: "hospitality", label: "Travel, Tourism & Hospitality", icon: <Hotel className="w-7 h-7" />, desc: "Hotels, vacation rentals, B&Bs, tours, travel agencies", color: "hsl(174,62%,50%)" },
  { value: "airlines", label: "Airlines & Aviation", icon: <Plane className="w-7 h-7" />, desc: "Flights, seat management, crew scheduling", color: "hsl(217,91%,60%)" },
  { value: "car_rental", label: "Car Rental", icon: <Car className="w-7 h-7" />, desc: "Fleet management, vehicle bookings", color: "hsl(190,80%,55%)" },
  { value: "healthcare", label: "Healthcare & Clinics", icon: <Stethoscope className="w-7 h-7" />, desc: "Appointments, doctors, patients", color: "hsl(0,72%,55%)" },
  { value: "education", label: "Education & Training", icon: <GraduationCap className="w-7 h-7" />, desc: "Timetables, classes, rooms", color: "hsl(270,80%,65%)" },
  { value: "logistics", label: "Logistics & Shipping", icon: <Truck className="w-7 h-7" />, desc: "Deliveries, routes, warehouses", color: "hsl(25,95%,55%)" },
  { value: "events_entertainment", label: "Events & Entertainment", icon: <Theater className="w-7 h-7" />, desc: "Venues, tickets, performers", color: "hsl(300,80%,65%)" },
  { value: "railways", label: "Railways & Trains", icon: <TrainFront className="w-7 h-7" />, desc: "Train scheduling, platforms, crews", color: "hsl(200,70%,50%)" },
];

const subtypeOptions: { value: BusinessSubtype; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  {
    value: "hotel_property",
    label: "Hotel & Property",
    icon: <Building2 className="w-8 h-8" />,
    desc: "Hotels, resorts, vacation rentals, B&Bs, serviced apartments",
    color: "hsl(174,62%,50%)",
  },
  {
    value: "travel_tours",
    label: "Travel & Tours",
    icon: <Globe className="w-8 h-8" />,
    desc: "Travel agencies, tour operators, adventure tours, day trips, packages",
    color: "hsl(217,91%,60%)",
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createWorkspace } = useWorkspaces();
  const preselected = sessionStorage.getItem("preselected_industry") as IndustryType | null;
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(preselected);
  const [selectedSubtype, setSelectedSubtype] = useState<BusinessSubtype>(null);
  const [step, setStep] = useState<"industry" | "subtype" | "setup">("industry");
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [setupProgress, setSetupProgress] = useState(0);
  const [autoTriggered, setAutoTriggered] = useState(false);

  // Auto-continue if industry was pre-selected from landing page
  useEffect(() => {
    if (preselected && user && !autoTriggered && !isSettingUp && step === "industry") {
      setAutoTriggered(true);
      if (preselected === "hospitality") {
        setStep("subtype");
      } else {
        handleFinalSetup(preselected);
      }
    }
  }, [preselected, user, autoTriggered, isSettingUp, step]);

  const handleIndustryContinue = () => {
    if (!selectedIndustry) return;
    if (selectedIndustry === "hospitality") {
      setStep("subtype");
    } else {
      handleFinalSetup(selectedIndustry);
    }
  };

  const handleSubtypeContinue = () => {
    if (!selectedSubtype) return;
    handleFinalSetup("hospitality", selectedSubtype);
  };

  const handleFinalSetup = async (industry: IndustryType, subtype?: BusinessSubtype) => {
    if (!user) return;
    setStep("setup");
    setIsSettingUp(true);

    const interval = setInterval(() => {
      setSetupProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);

    const updates: any = { industry };
    if (subtype) updates.business_subtype = subtype;

    await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);

    const subtypeLabel = subtype === "travel_tours" ? "Travel & Tours" : subtype === "hotel_property" ? "Hotel & Property" : "";
    const industryLabel = INDUSTRY_CONFIGS[industry]?.label || industry;
    const workspaceName = subtypeLabel ? `${subtypeLabel}` : industryLabel;
    await createWorkspace(workspaceName, industry);

    sessionStorage.removeItem("preselected_industry");

    await new Promise(resolve => setTimeout(resolve, 1800));
    clearInterval(interval);
    setSetupProgress(100);

    await new Promise(resolve => setTimeout(resolve, 400));
    toast.success("Your personalized dashboard is ready! 🎉");
    navigate("/dashboard");
  };

  // Setup loading screen
  if (isSettingUp) {
    const subtypeLabel = selectedSubtype === "travel_tours" ? "Travel & Tours" : selectedSubtype === "hotel_property" ? "Hotel & Property" : selectedIndustry?.replace(/_/g, " ");
    return (
      <div className="min-h-screen bg-[hsl(222,47%,8%)] flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-[400px] h-[400px] bg-[hsl(174,62%,50%)]/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-[hsl(217,91%,60%)]/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "0.5s" }} />
        </div>
        <div className="relative z-10 text-center space-y-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Setting up your {subtypeLabel} system...</h2>
            <p className="text-white/50 text-sm">Customizing AI dashboards, CRM & workspace for you</p>
          </div>
          <div className="w-72 mx-auto">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(setupProgress, 100)}%` }}
              />
            </div>
            <p className="text-white/30 text-xs mt-2">{Math.min(Math.round(setupProgress), 100)}%</p>
          </div>
        </div>
      </div>
    );
  }

  // Sub-type selector for hospitality
  if (step === "subtype") {
    return (
      <div className="min-h-screen bg-[hsl(222,47%,8%)] flex flex-col relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[hsl(174,62%,50%)]/6 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[hsl(217,91%,60%)]/6 rounded-full blur-[120px]" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
          <div className="w-full max-w-xl space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <button
                onClick={() => { setStep("industry"); setSelectedSubtype(null); }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/70 hover:bg-white/10 transition-colors"
              >
                ← Back to Industries
              </button>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white">
                What's Your Business Type?
              </h1>
              <p className="text-white/50 max-w-md mx-auto">
                We'll customize your dashboard, team roles, AI tools and labels based on your specific business.
              </p>
            </div>

            {/* Sub-type cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subtypeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedSubtype(opt.value)}
                  className={`group relative flex flex-col items-center gap-4 p-8 rounded-2xl border text-center transition-all duration-300 ${
                    selectedSubtype === opt.value
                      ? "border-primary bg-primary/10 shadow-[0_0_30px_hsl(174,62%,50%,0.25)] scale-[1.02]"
                      : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  {selectedSubtype === opt.value && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="w-6 h-6 text-primary" />
                    </div>
                  )}
                  <div
                    className={`p-4 rounded-2xl transition-all duration-300 ${
                      selectedSubtype === opt.value
                        ? "bg-primary/20"
                        : "bg-white/[0.05] group-hover:bg-white/[0.1]"
                    }`}
                    style={{ color: opt.color }}
                  >
                    {opt.icon}
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-white text-lg">{opt.label}</p>
                    <p className="text-sm text-white/40 leading-relaxed">{opt.desc}</p>
                  </div>

                  {/* Role preview */}
                  <div className="w-full pt-3 border-t border-white/[0.06] space-y-1.5">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Team Roles</p>
                    {opt.value === "hotel_property" ? (
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {["Owner", "Manager", "Floor Mgr", "Front Desk"].map(r => (
                          <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(174,62%,50%)]/10 text-[hsl(174,62%,50%)] border border-[hsl(174,62%,50%)]/20">{r}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 justify-center">
                        {["Owner", "Manager", "Travel Agent", "Tour Guide"].map(r => (
                          <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(217,91%,60%)]/10 text-[hsl(217,91%,60%)] border border-[hsl(217,91%,60%)]/20">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Continue */}
            <div className="flex justify-center pt-2">
              <Button
                onClick={handleSubtypeContinue}
                disabled={!selectedSubtype}
                size="lg"
                className="px-12 py-6 text-lg font-bold bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white shadow-[0_0_30px_rgba(45,212,191,0.3)] hover:shadow-[0_0_50px_rgba(45,212,191,0.5)] transition-all duration-500 disabled:opacity-40 disabled:shadow-none rounded-xl"
              >
                Continue
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Industry selector (step 1)
  return (
    <div className="min-h-screen bg-[hsl(222,47%,8%)] flex flex-col relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[hsl(174,62%,50%)]/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[hsl(217,91%,60%)]/6 rounded-full blur-[120px]" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-3xl space-y-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/70">
              <Sparkles className="w-4 h-4 text-primary" /> Personalize Your Experience
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">
              Select Your Industry
            </h1>
            <p className="text-white/50 max-w-md mx-auto">
              We'll customize your entire system based on your business — AI tools, labels, dashboards, and workflows.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {industryOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelectedIndustry(opt.value)}
                className={`group relative flex flex-col items-center gap-3 p-5 rounded-xl border text-center transition-all duration-300 ${
                  selectedIndustry === opt.value
                    ? "border-primary bg-primary/10 shadow-[0_0_25px_hsl(174,62%,50%,0.2)] scale-[1.02]"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                }`}
              >
                {selectedIndustry === opt.value && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    selectedIndustry === opt.value
                      ? "bg-primary/20"
                      : "bg-white/[0.05] group-hover:bg-white/[0.1]"
                  }`}
                  style={{ color: opt.color }}
                >
                  {opt.icon}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{opt.label}</p>
                  <p className="text-[11px] text-white/40 mt-0.5 leading-tight">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <Button
              onClick={handleIndustryContinue}
              disabled={!selectedIndustry}
              size="lg"
              className="px-12 py-6 text-lg font-bold bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white shadow-[0_0_30px_rgba(45,212,191,0.3)] hover:shadow-[0_0_50px_rgba(45,212,191,0.5)] transition-all duration-500 disabled:opacity-40 disabled:shadow-none rounded-xl"
            >
              Continue
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
