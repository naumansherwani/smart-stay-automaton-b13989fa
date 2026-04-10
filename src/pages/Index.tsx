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

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <StatsSection />
    <HowItWorksSection />
    <FeaturesSection />
    <TestimonialsSection />
    <ReviewsSection />
    <TrustBadgesSection />
    <PricingSection />
    <FAQSection />
    <CTASection />
    <Footer />
    <CookieConsent />
  </div>
);

export default Index;
