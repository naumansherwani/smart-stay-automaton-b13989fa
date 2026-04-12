import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, Zap, BarChart3, Users, Calendar, Brain, Shield, Rocket } from "lucide-react";
import Logo from "@/components/Logo";
import AnimatedTopBorder from "@/components/AnimatedTopBorder";

interface PublicViewProps {
  onReturn: () => void;
}

const NAV_LINKS = ["About", "Features", "Pricing", "Contact"];

const FEATURES = [
  { icon: Brain, title: "AI-Powered Automation", desc: "Automate bookings, scheduling, and customer management with intelligent AI systems." },
  { icon: BarChart3, title: "Predictive Analytics", desc: "Revenue forecasting, demand prediction, and real-time business insights." },
  { icon: Users, title: "Smart CRM", desc: "Lead scoring, customer behavior analysis, and automated follow-ups." },
  { icon: Calendar, title: "Smart Scheduling", desc: "Conflict-free scheduling with AI optimization across all resources." },
  { icon: Shield, title: "Enterprise Security", desc: "Bank-grade encryption, RLS policies, and complete data isolation." },
  { icon: Rocket, title: "Multi-Industry", desc: "8 dedicated industry workspaces, each with tailored workflows." },
];

const FOOTER_COLUMNS = [
  { heading: "Industries", links: ["Hospitality", "Airlines", "Car Rental", "Healthcare", "Education", "Logistics", "Events", "Railways"] },
  { heading: "Product", links: ["Features", "Pricing", "AI Tools", "CRM", "Automations"] },
  { heading: "Platform", links: ["How it works", "Use cases", "Integrations", "System overview"] },
  { heading: "Company", links: ["About Us", "Mission", "Vision", "Careers"] },
  { heading: "Support", links: ["Help Center", "Contact Support", "FAQs"] },
  { heading: "Legal", links: ["Privacy Policy", "Terms of Service", "Security"] },
  { heading: "Explore", links: ["Blog", "Updates", "Partnerships"] },
];

export default function PublicView({ onReturn }: PublicViewProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatedTopBorder />
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Logo size="lg" showName />
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(l => (
              <a key={l} href={`#${l.toLowerCase()}`} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{l}</a>
            ))}
          </nav>
          <Button variant="outline" size="sm" onClick={onReturn} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 md:py-32">
        <div className="container text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Globe className="w-4 h-4" /> AI-Powered Business Platform
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Run Your Business with <span className="text-primary">Intelligent Automation</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            HostFlow AI is an all-in-one platform that combines smart scheduling, predictive analytics, and AI-powered CRM to help businesses across 8 industries operate efficiently and grow revenue.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button size="lg" className="gap-2"><Zap className="w-4 h-4" /> Get Started</Button>
            <Button size="lg" variant="outline">Learn More</Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Scale</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-xl border border-border/50 bg-card p-6 space-y-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container text-center max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Ready to Transform Your Operations?</h2>
          <p className="text-muted-foreground">Join thousands of businesses using HostFlow AI to automate operations and maximize revenue.</p>
          <Button size="lg" className="gap-2"><Rocket className="w-4 h-4" /> Start Free Trial</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20 pt-16 pb-8">
        <div className="container">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-8 mb-12">
            {FOOTER_COLUMNS.map(col => (
              <div key={col.heading}>
                <h4 className="text-sm font-bold mb-4 text-foreground">{col.heading}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border/30 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">© 2026 HostFlow AI. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">AI-Powered · Multi-Industry · Built for Growth</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
