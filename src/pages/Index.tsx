import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import IndustriesSection from "@/components/landing/IndustriesSection";
import WhyDifferentSection from "@/components/landing/WhyDifferentSection";
import StatsSection from "@/components/landing/StatsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import VoiceAISection from "@/components/landing/VoiceAISection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import ReviewsSection from "@/components/landing/ReviewsSection";
import TrustBadgesSection from "@/components/landing/TrustBadgesSection";
import PricingSection from "@/components/landing/PricingSection";
import FAQSection from "@/components/landing/FAQSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import CookieConsent from "@/components/CookieConsent";
import SmartGreetingBanner from "@/components/SmartGreetingBanner";
import AnimatedTopBorder from "@/components/AnimatedTopBorder";
import { PaymentsResumingBanner } from "@/components/PaymentsResumingBanner";
import FounderHQBadge from "@/components/founder/FounderHQBadge";
const Index = () => (
  <div className="min-h-screen">
    <AnimatedTopBorder />
    <PaymentsResumingBanner />
    <Navbar />
    <div className="pt-[68px] border-b border-white/[0.06]">
      <SmartGreetingBanner compact />
    </div>
    <HeroSection />
    <VoiceAISection />
    <WhyDifferentSection />
    <IndustriesSection />
    <PricingSection />
    <StatsSection />
    <HowItWorksSection />
    <FeaturesSection />
    <TestimonialsSection />
    <ReviewsSection />
    <TrustBadgesSection />
    <FAQSection />
    <Footer />
    <CookieConsent />
    <FounderHQBadge />
  </div>
);

export default Index;
