import { Link } from "react-router-dom";
import { XCircle, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export default function CheckoutCancelled() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-28 pb-20">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400/20 to-rose-400/20 border border-amber-400/40">
            <XCircle className="w-10 h-10 text-amber-400" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Checkout cancelled
          </h1>
          <p className="text-lg text-muted-foreground">
            No charge was made. Your account is safe and unchanged.
          </p>

          <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 text-left space-y-3">
            <div className="text-sm font-semibold text-foreground">
              Need a hand deciding?
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 pl-6 list-disc">
              <li>Your 7-day free trial is still available — no card required.</li>
              <li>Compare plans on our pricing page.</li>
              <li>Have a question? Our team replies within 1 business day.</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Button asChild className="bg-gradient-to-r from-[hsl(174,62%,50%)] to-[hsl(217,91%,60%)] text-white">
              <Link to="/pricing"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Pricing</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contact"><MessageCircle className="w-4 h-4 mr-2" /> Talk to us</Link>
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground/60 pt-4">
            Secure checkout powered by Stripe · Billing handled by Polar
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}