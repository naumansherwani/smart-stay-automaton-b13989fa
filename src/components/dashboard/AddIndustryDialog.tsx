import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Loader2, Sparkles, Crown, Flame, Hotel, Plane, Car, Stethoscope, GraduationCap, Truck, Theater, TrainFront, Lock } from "lucide-react";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { type IndustryType } from "@/lib/industryConfig";
import { INDUSTRY_CONFIGS } from "@/lib/industryConfig";

// Plan configuration
const PLAN_CONFIG = {
  basic: {
    label: "Basic",
    price: 25,
    maxIndustries: 2,
    icon: <Sparkles className="w-5 h-5" />,
    discounts: [0, 10], // 1st=0%, 2nd=10%
    priceId: "price_1TK6mV4yrCh8Ql75FqqZJ6M9",
    productId: "prod_UIiCCNXhcZdhQU",
  },
  pro: {
    label: "Pro",
    price: 55,
    maxIndustries: 3,
    icon: <Crown className="w-5 h-5" />,
    discounts: [0, 10, 15], // 1st=0%, 2nd=10%, 3rd=15%
    priceId: "price_1TK6ms4yrCh8Ql757Y9c5Rnk",
    productId: "prod_UIiDaFEfKRWg02",
  },
  premium: {
    label: "Premium",
    price: 110,
    maxIndustries: 4,
    icon: <Flame className="w-5 h-5" />,
    discounts: [0, 12, 15, 20], // 1st=0%, 2nd=12%, 3rd=15%, 4th=20%
    priceId: "price_1TK6oO4yrCh8Ql751jCdSVcs",
    productId: "prod_UIiElL4g0051N0",
  },
};

const industryOptions: { value: IndustryType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "hospitality", label: "Travel, Tourism & Hospitality", icon: <Hotel className="w-6 h-6" />, color: "hsl(174,62%,50%)" },
  { value: "airlines", label: "Airlines & Aviation", icon: <Plane className="w-6 h-6" />, color: "hsl(217,91%,60%)" },
  { value: "car_rental", label: "Car Rental", icon: <Car className="w-6 h-6" />, color: "hsl(190,80%,55%)" },
  { value: "healthcare", label: "Healthcare & Clinics", icon: <Stethoscope className="w-6 h-6" />, color: "hsl(0,72%,55%)" },
  { value: "education", label: "Education & Training", icon: <GraduationCap className="w-6 h-6" />, color: "hsl(270,80%,65%)" },
  { value: "logistics", label: "Logistics & Shipping", icon: <Truck className="w-6 h-6" />, color: "hsl(25,95%,55%)" },
  { value: "events_entertainment", label: "Events & Entertainment", icon: <Theater className="w-6 h-6" />, color: "hsl(300,80%,65%)" },
  { value: "railways", label: "Railways & Trains", icon: <TrainFront className="w-6 h-6" />, color: "hsl(200,70%,50%)" },
];

type PlanKey = keyof typeof PLAN_CONFIG;

interface AddIndustryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddIndustryDialog({ open, onOpenChange }: AddIndustryDialogProps) {
  const { workspaces, createWorkspace } = useWorkspaces();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey | null>(null);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentIndustryCount = workspaces.length;

  // Filter out industries already used
  const usedIndustries = workspaces.map(w => w.industry);
  const availableIndustries = industryOptions.filter(i => !usedIndustries.includes(i.value));

  const getDiscountInfo = (plan: PlanKey) => {
    const config = PLAN_CONFIG[plan];
    const industryNumber = currentIndustryCount + 1; // This will be the Nth industry
    const discountIndex = industryNumber - 1;

    if (discountIndex >= config.maxIndustries) {
      return { blocked: true, discountPct: 0, basePrice: config.price, discountAmount: 0, finalPrice: 0 };
    }

    const discountPct = config.discounts[discountIndex] || 0;
    const basePrice = config.price;
    const discountAmount = Math.round((basePrice * discountPct) / 100 * 100) / 100;
    const finalPrice = Math.round((basePrice - discountAmount) * 100) / 100;

    return { blocked: false, discountPct, basePrice, discountAmount, finalPrice };
  };

  const handlePlanSelect = (plan: PlanKey) => {
    const info = getDiscountInfo(plan);
    if (info.blocked) return;
    setSelectedPlan(plan);
    setStep(2);
  };

  const handleIndustrySelect = (industry: IndustryType) => {
    setSelectedIndustry(industry);
  };

  const handleContinue = async () => {
    if (!selectedPlan || !selectedIndustry || !user) return;

    const info = getDiscountInfo(selectedPlan);
    if (info.blocked) return;

    setIsProcessing(true);

    try {
      const workspaceLabel = INDUSTRY_CONFIGS[selectedIndustry]?.label || selectedIndustry;
      const workspace = await createWorkspace(workspaceLabel, selectedIndustry);

      if (!workspace) {
        throw new Error("Failed to create workspace. Please try again.");
      }

      toast.success(`${workspaceLabel} workspace created! 🎉`);
      onOpenChange(false);
      resetDialog();
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to process. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDialog = () => {
    setStep(1);
    setSelectedPlan(null);
    setSelectedIndustry(null);
    setIsProcessing(false);
  };

  const handleClose = (open: boolean) => {
    if (!open) resetDialog();
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {step === 1 && "Select a Plan"}
            {step === 2 && "Choose an Industry"}
            {step === 3 && "Confirm & Pay"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Plan Selection */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You currently have {currentIndustryCount} workspace{currentIndustryCount !== 1 ? "s" : ""}. Select a plan for your new industry.
            </p>
            <div className="grid gap-3">
              {(Object.entries(PLAN_CONFIG) as [PlanKey, typeof PLAN_CONFIG[PlanKey]][]).map(([key, plan]) => {
                const info = getDiscountInfo(key);
                return (
                  <button
                    key={key}
                    onClick={() => handlePlanSelect(key)}
                    disabled={info.blocked}
                    className={`relative flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                      info.blocked
                        ? "border-border/50 opacity-50 cursor-not-allowed bg-muted/30"
                        : "border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        {plan.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{plan.label}</span>
                          {info.discountPct > 0 && !info.blocked && (
                            <Badge variant="secondary" className="text-xs bg-success/10 text-success border-success/20">
                              {info.discountPct}% OFF
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Max {plan.maxIndustries} industries
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {info.blocked ? (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Lock className="w-4 h-4" />
                          <span className="text-xs">Limit reached</span>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-lg">${info.finalPrice}</div>
                          {info.discountPct > 0 && (
                            <div className="text-xs text-muted-foreground line-through">${info.basePrice}</div>
                          )}
                          <div className="text-xs text-muted-foreground">/month</div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Limit message */}
            {Object.entries(PLAN_CONFIG).every(([key]) => getDiscountInfo(key as PlanKey).blocked) && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-center">
                <p className="text-sm font-medium text-warning">
                  You've reached your plan limit. Upgrade to add more industries.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Industry Selection */}
        {step === 2 && selectedPlan && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose the industry for your new workspace.
            </p>

            {availableIndustries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                All industries are already in use.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {availableIndustries.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleIndustrySelect(opt.value)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      selectedIndustry === opt.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/30 hover:bg-muted/50"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-muted" style={{ color: opt.color }}>
                      {opt.icon}
                    </div>
                    <span className="text-sm font-medium">{opt.label}</span>
                    {selectedIndustry === opt.value && (
                      <Check className="w-4 h-4 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => { setStep(1); setSelectedIndustry(null); }} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!selectedIndustry}
                className="flex-1 bg-gradient-primary"
              >
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && selectedPlan && selectedIndustry && (
          <div className="space-y-5">
            {(() => {
              const info = getDiscountInfo(selectedPlan);
              const planConfig = PLAN_CONFIG[selectedPlan];
              const industryLabel = INDUSTRY_CONFIGS[selectedIndustry]?.label || selectedIndustry;

              return (
                <>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Plan</span>
                      <span className="font-semibold">{planConfig.label}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Industry</span>
                      <span className="font-semibold">{industryLabel}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Industry #</span>
                      <span className="font-semibold">{currentIndustryCount + 1} of {planConfig.maxIndustries}</span>
                    </div>

                    <div className="border-t border-border pt-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Base Price</span>
                        <span className="font-medium">${info.basePrice.toFixed(2)}</span>
                      </div>
                      {info.discountPct > 0 && (
                        <div className="flex justify-between items-center text-success">
                          <span className="text-sm">Discount ({info.discountPct}%)</span>
                          <span className="font-medium">-${info.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="border-t border-border pt-2 flex justify-between items-center">
                        <span className="font-bold text-lg">You Pay</span>
                        <span className="font-bold text-xl text-primary">${info.finalPrice.toFixed(2)}/mo</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={isProcessing}>
                      Back
                    </Button>
                    <Button
                      onClick={handleContinue}
                      disabled={isProcessing}
                      className="flex-1 bg-gradient-primary font-bold"
                    >
                      {isProcessing ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                      ) : (
                        "Continue"
                      )}
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
