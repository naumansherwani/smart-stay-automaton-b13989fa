import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-card border border-border rounded-2xl p-4 md:p-6 shadow-elevated flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Shield className="w-8 h-8 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-foreground font-medium">We value your privacy</p>
          <p className="text-xs text-muted-foreground mt-1">
            We use essential cookies for authentication and analytics to improve your experience. No data is sold to third parties. 
            Read our <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={decline}>Decline</Button>
          <Button size="sm" className="bg-gradient-primary" onClick={accept}>Accept All</Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
