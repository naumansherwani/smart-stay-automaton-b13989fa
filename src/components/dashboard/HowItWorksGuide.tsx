import { BarChart3, Users, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const HowItWorksGuide = () => {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const hidden = localStorage.getItem("hostflow_guide_dismissed");
    if (hidden === "true") setDismissed(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("hostflow_guide_dismissed", "true");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">How your system works</h2>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleDismiss}>
          Dismiss
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-card/80 hover:border-primary/30 transition-colors cursor-pointer group" onClick={() => window.scrollTo({ top: 400, behavior: "smooth" })}>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-foreground text-base">Dashboard</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                View performance, analytics, bookings, and overall activity
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-primary font-medium group-hover:gap-2 transition-all">
                You're here <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 hover:border-primary/30 transition-colors cursor-pointer group" onClick={() => navigate("/ai-crm")}>
          <CardContent className="p-5 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[hsl(217,91%,60%)]/10 text-[hsl(217,91%,60%)] shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="font-semibold text-foreground text-base">AI CRM</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Manage contacts, leads, and customer interactions
              </p>
              <span className="inline-flex items-center gap-1 text-xs text-[hsl(217,91%,60%)] font-medium group-hover:gap-2 transition-all">
                Open AI CRM <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HowItWorksGuide;
