import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight, CheckCircle, Sparkles, Hotel, Plane, Car, Stethoscope, GraduationCap, Truck, Theater } from "lucide-react";
import { toast } from "sonner";
import { type IndustryType } from "@/lib/industryConfig";

const industryOptions: { value: IndustryType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "hospitality", label: "Hospitality", icon: <Hotel className="w-6 h-6" />, desc: "Hotels, vacation rentals, B&Bs" },
  { value: "airlines", label: "Airlines", icon: <Plane className="w-6 h-6" />, desc: "Flights, seat management, crew" },
  { value: "car_rental", label: "Car Rental", icon: <Car className="w-6 h-6" />, desc: "Fleet management, vehicle bookings" },
  { value: "healthcare", label: "Healthcare", icon: <Stethoscope className="w-6 h-6" />, desc: "Appointments, doctors, patients" },
  { value: "education", label: "Education", icon: <GraduationCap className="w-6 h-6" />, desc: "Timetables, classes, rooms" },
  { value: "logistics", label: "Logistics", icon: <Truck className="w-6 h-6" />, desc: "Deliveries, routes, drivers" },
  { value: "events_entertainment", label: "Events & Entertainment", icon: <Theater className="w-6 h-6" />, desc: "Venues, tickets, performers" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    if (!user || !selectedIndustry) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        company_name: companyName || null,
        industry: selectedIndustry,
      })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to save — please try again.");
      return;
    }
    toast.success("Welcome to HostFlow AI! 🎉");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[hsl(222,47%,11%)] flex flex-col">
      <header className="container flex flex-col items-center justify-center pt-8 pb-2 space-y-1">
        <p className="text-xs font-medium tracking-[0.35em] uppercase text-primary/70">Welcome to</p>
        <h1 className="text-3xl font-extrabold leading-tight">
          <span className="bg-gradient-to-r from-[hsl(174,62%,55%)] via-[hsl(200,80%,65%)] to-[hsl(217,91%,60%)] bg-clip-text text-transparent drop-shadow-[0_0_30px_hsl(174,62%,50%,0.3)]">
            HostFlow AI
          </span>
        </h1>
        <div className="flex items-center gap-3">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-primary/40" />
          <span className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-medium">Premium Experience</span>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-primary/40" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step > s ? "bg-primary text-primary-foreground" : step === s ? "bg-primary/20 text-primary border-2 border-primary" : "bg-[hsl(222,30%,18%)] text-muted-foreground"
                }`}>
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-primary" : "bg-[hsl(222,30%,18%)]"}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <Card className="bg-[hsl(222,40%,14%)] border-[hsl(217,91%,60%)]/20">
              <CardContent className="pt-8 pb-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Welcome to HostFlow AI!</h2>
                  <p className="text-[hsl(213,97%,87%)]/70">Let's set up your workspace in 30 seconds.</p>
                </div>
                <Button onClick={() => setStep(2)} className="bg-gradient-primary px-8">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card className="bg-[hsl(222,40%,14%)] border-[hsl(217,91%,60%)]/20">
              <CardContent className="pt-8 pb-8 space-y-6">
                <div className="text-center">
                  <Building2 className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h2 className="text-xl font-bold text-white">What's your company name?</h2>
                  <p className="text-sm text-[hsl(213,97%,87%)]/70 mt-1">Optional — you can always change it later.</p>
                </div>
                <Input
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="e.g. Grand Hotel, City Clinic..."
                  className="bg-[hsl(222,47%,11%)] border-[hsl(217,91%,60%)]/20 text-white text-center text-lg h-12"
                />
                <div className="flex gap-3 justify-center">
                  <Button variant="ghost" onClick={() => setStep(3)} className="text-[hsl(213,97%,87%)]/70">Skip</Button>
                  <Button onClick={() => setStep(3)} className="bg-gradient-primary px-8">
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="bg-[hsl(222,40%,14%)] border-[hsl(217,91%,60%)]/20">
              <CardContent className="pt-8 pb-8 space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-white">Select your industry</h2>
                  <p className="text-sm text-[hsl(213,97%,87%)]/70 mt-1">We'll customize your AI dashboard for this industry.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {industryOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedIndustry(opt.value)}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        selectedIndustry === opt.value
                          ? "border-primary bg-primary/10 shadow-[0_0_15px_hsl(174,62%,50%,0.2)]"
                          : "border-[hsl(217,91%,60%)]/20 bg-[hsl(222,47%,11%)] hover:border-primary/40"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${selectedIndustry === opt.value ? "bg-primary/20 text-primary" : "bg-[hsl(222,30%,18%)] text-muted-foreground"}`}>
                        {opt.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{opt.label}</p>
                        <p className="text-xs text-[hsl(213,97%,87%)]/50">{opt.desc}</p>
                      </div>
                      {selectedIndustry === opt.value && <CheckCircle className="w-5 h-5 text-primary ml-auto" />}
                    </button>
                  ))}
                </div>
                <Button
                  onClick={handleFinish}
                  disabled={!selectedIndustry || saving}
                  className="w-full bg-gradient-primary"
                >
                  {saving ? "Setting up..." : "Launch Dashboard 🚀"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
