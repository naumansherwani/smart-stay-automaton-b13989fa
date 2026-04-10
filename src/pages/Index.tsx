import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import ReviewsSection from "@/components/landing/ReviewsSection";
import TrustBadgesSection from "@/components/landing/TrustBadgesSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import CookieConsent from "@/components/CookieConsent";
import SmartGreetingBanner from "@/components/SmartGreetingBanner";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <div className="pt-[68px] border-b border-white/[0.06]">
      <SmartGreetingBanner compact />
    </div>
    <HeroSection />
    <StatsSection />
    <HowItWorksSection />
    <FeaturesSection />
    <TestimonialsSection />
    <ReviewsSection />
    <TrustBadgesSection />
    <PricingSection />
    <FAQSection />
    <Footer />
    <Footer />
    <CookieConsent />
  </div>
);

export default Index;
