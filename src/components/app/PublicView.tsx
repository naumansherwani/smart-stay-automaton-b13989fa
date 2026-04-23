import { Button } from "@/components/ui/button";
import { Globe, BarChart3, Users, Calendar, Brain, Shield, Rocket, Plane, Car, Stethoscope, GraduationCap, Truck, Theater, TrainFront, Crown, Wallet, Settings, LogOut, Mail, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Logo from "@/components/Logo";
import AnimatedTopBorder from "@/components/AnimatedTopBorder";
import ThemeToggle from "@/components/ThemeToggle";
import type { IndustryType } from "@/lib/industryConfig";
import { getUserAvatarUrl, getUserDisplayName, getUserInitials } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@supabase/supabase-js";

interface PublicViewProps {
  onReturn: () => void;
  onIndustrySelect?: (industry: IndustryType) => void;
  currentIndustry?: IndustryType;
  isAdmin?: boolean;
  user?: User | null;
  profile?: any;
}

const NAV_LINKS = ["About", "Features", "Pricing", "Contact"];

const INDUSTRIES: { icon: React.ElementType; name: string; desc: string; color: string; id: IndustryType }[] = [
  { icon: Globe, name: "Hospitality", desc: "Hotels, vacation rentals, tours", color: "#0d9488", id: "hospitality" },
  { icon: Plane, name: "Airlines", desc: "Crew, gates, fleet", color: "#3b82f6", id: "airlines" },
  { icon: Car, name: "Car Rental", desc: "Fleet & maintenance", color: "#0ea5e9", id: "car_rental" },
  { icon: Stethoscope, name: "Healthcare", desc: "Appointments & rooms", color: "#ef4444", id: "healthcare" },
  { icon: GraduationCap, name: "Education", desc: "Classes & timetables", color: "#8b5cf6", id: "education" },
  { icon: Truck, name: "Logistics", desc: "Delivery & warehouse", color: "#f97316", id: "logistics" },
  { icon: Theater, name: "Events", desc: "Venues & performers", color: "#d946ef", id: "events_entertainment" },
  { icon: TrainFront, name: "Railways", desc: "Trains & platforms", color: "#0284c7", id: "railways" },
];

const getIndustryIcon = (id?: IndustryType) => {
  const ind = INDUSTRIES.find(i => i.id === id);
  return ind ? { Icon: ind.icon, name: ind.name, color: ind.color } : { Icon: Globe, name: "Hospitality", color: "#0d9488" };
};

const FEATURES = [
  { icon: Brain, title: "AI-Powered Automation", desc: "Automate bookings, scheduling, and customer management with intelligent AI systems.", gradient: "from-[#6366F1] to-[#8B5CF6]" },
  { icon: BarChart3, title: "Predictive Analytics", desc: "Revenue forecasting, demand prediction, and real-time business insights.", gradient: "from-[#06B6D4] to-[#3B82F6]" },
  { icon: Users, title: "Smart CRM", desc: "Lead scoring, customer behavior analysis, and automated follow-ups.", gradient: "from-[#f97316] to-[#ef4444]" },
  { icon: Calendar, title: "Smart Scheduling", desc: "Conflict-free scheduling with AI optimization across all resources.", gradient: "from-[#10B981] to-[#06B6D4]" },
  { icon: Shield, title: "Enterprise Security", desc: "Bank-grade encryption, RLS policies, and complete data isolation.", gradient: "from-[#8B5CF6] to-[#ec4899]" },
  { icon: Rocket, title: "Multi-Industry", desc: "8 dedicated industry workspaces, each with tailored workflows.", gradient: "from-[#f97316] to-[#facc15]" },
];

const FOOTER_COLUMNS = [
  { heading: "Product", links: [
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "AI Tools", href: "/dashboard" },
    { label: "CRM", href: "/crm" },
    { label: "Automations", href: "/dashboard" },
  ]},
  { heading: "Platform", links: [
    { label: "How it works", href: "/#how-it-works" },
    { label: "Use cases", href: "/#industries" },
    { label: "Integrations", href: "/dashboard" },
    { label: "System overview", href: "/analytics" },
  ]},
  { heading: "Company", links: [
    { label: "About Us", href: "/about" },
    { label: "Mission", href: "/about" },
    { label: "Vision", href: "/about" },
    { label: "Careers", href: "/contact" },
  ]},
  { heading: "Support", links: [
    { label: "Help Center", href: "/contact" },
    { label: "Contact Support", href: "/contact" },
    { label: "FAQs", href: "/#faq" },
  ]},
  { heading: "Legal", links: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Security", href: "/privacy" },
  ]},
  { heading: "Explore", links: [
    { label: "Blog", href: "/about" },
    { label: "Updates", href: "/about" },
    { label: "Partnerships", href: "/contact" },
  ]},
];

export default function PublicView({ onReturn, onIndustrySelect, currentIndustry, isAdmin, user, profile }: PublicViewProps) {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const displayName = getUserDisplayName(user ?? null, profile?.display_name);
  const avatarUrl = getUserAvatarUrl(user ?? null, profile?.avatar_url);
  const initials = getUserInitials(displayName, user?.email);
  const activeIndustry = getIndustryIcon(currentIndustry);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatedTopBorder />

      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
         <div className="container flex h-16 items-center relative">
             {/* LEFT: Logo + Tagline stacked */}
             <div className="flex items-center gap-2.5">
               <Logo size="md" showName showTagline={isAdmin} />
             </div>

           {/* CENTER: Active Industry Badge */}
           {isAdmin && (
             <div className="absolute left-1/2 -translate-x-1/2">
               <button
                 onClick={onReturn}
                 className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/50 hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer"
                 title={`Go to ${activeIndustry.name} Dashboard`}
               >
                 <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${activeIndustry.color}15` }}>
                   <activeIndustry.Icon className="w-4 h-4" style={{ color: activeIndustry.color }} />
                 </div>
                 <span className="text-sm font-medium text-foreground hidden sm:inline">{activeIndustry.name}</span>
                 <span className="relative flex h-2 w-2">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                 </span>
               </button>
             </div>
           )}

          {isAdmin ? (
            /* RIGHT: Email badge + Theme + Profile Dropdown */
            <div className="flex items-center gap-2 ml-auto">
              {/* Email Badge */}
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full"
                onClick={() => navigate("/messages")}
                aria-label="Messages"
              >
                <Mail className="w-4 h-4" />
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                  3
                </span>
              </Button>

              <ThemeToggle />

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-full hover:bg-muted/50 transition-colors outline-none">
                    <Avatar className="h-8 w-8 border-2 border-primary/30">
                      <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-semibold text-foreground hidden md:inline">{displayName}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:inline" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2.5 border-b border-border/50">
                    <p className="text-sm font-semibold text-foreground">{displayName}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Crown className="w-3 h-3 text-amber-500" /> Platform Owner
                    </p>
                  </div>
                  <DropdownMenuItem onClick={() => navigate("/earnings")} className="gap-2.5 py-2.5 cursor-pointer">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    <span>Earnings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="gap-2.5 py-2.5 cursor-pointer">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => { signOut(); navigate("/"); }}
                    className="gap-2.5 py-2.5 cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            /* Non-admin header */
            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-8">
                {NAV_LINKS.map(l => (
                  <a key={l} href={`#${l.toLowerCase()}`} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">{l}</a>
                ))}
              </nav>
              <Button variant="outline" size="sm" onClick={onReturn} className="gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                {activeIndustry.name}
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="container text-center max-w-3xl mx-auto space-y-6">
          {isAdmin ? (
            <>
               <button
                 type="button"
                 onClick={() => window.open("/founder", "_blank", "noopener,noreferrer")}
                 className="group inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/10 border border-amber-500/30 text-amber-500 text-sm font-semibold shadow-lg shadow-amber-500/10 hover:shadow-amber-500/30 hover:border-amber-400/60 hover:scale-[1.03] transition-all duration-300 cursor-pointer"
                 title="Open Owner Command Center in a new tab"
               >
                 <span className="relative flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow">
                   <Crown className="w-3 h-3 text-white" />
                   <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ring-1 ring-background" />
                 </span>
                 <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">Owner</span>
                 Command Center
               </button>
               <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight whitespace-nowrap">
                 <span className="bg-gradient-to-r from-[#f97316] via-[#ef4444] to-[#ec4899] bg-clip-text text-transparent">You're Powering</span> <span className="bg-gradient-to-r from-primary to-[hsl(213,97%,87%)] bg-clip-text text-transparent">The Future</span>
               </h1>
               <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                 One platform. <strong>8 industries</strong>. Millions of decisions automated. You're not just running a business — you're orchestrating an <strong>AI Empire</strong>.
               </p>
            </>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
                <Globe className="w-4 h-4" /> AI-Powered Business Platform
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Run Your Business with <span className="text-primary">Intelligent Automation</span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                HostFlow AI is an all-in-one platform that combines smart scheduling, predictive analytics, and AI-powered CRM to help businesses across 8 industries operate efficiently and grow revenue.
              </p>
            </>
          )}
        </div>
      </section>

      {/* Industry Chooser */}
      {onIndustrySelect && (
        <section className="py-12 bg-muted/20">
          <div className="container space-y-6">
             <div className="text-center space-y-2">
               <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground"><span className="bg-gradient-to-r from-[#f97316] to-[#ef4444] bg-clip-text text-transparent">Operate Your</span> <span className="bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">AI Empire</span></h2>
               <p className="text-sm text-muted-foreground max-w-lg mx-auto">
                 {isAdmin ? "Each industry runs on its own AI brain — select one to take full control." : "Select an industry to get started"}
               </p>
             </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
              {INDUSTRIES.map((ind) => {
                const isActive = currentIndustry === ind.id;
                return (
                  <Card
                    key={ind.id}
                    onClick={() => onIndustrySelect(ind.id)}
                    className={`group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden relative ${
                      isActive ? "ring-2 ring-primary shadow-lg" : "border-border/50 hover:border-primary/30"
                    }`}
                    style={isActive ? { borderColor: ind.color, boxShadow: `0 4px 20px -4px ${ind.color}40` } : {}}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = `${ind.color}50`;
                        e.currentTarget.style.boxShadow = `0 4px 20px -4px ${ind.color}25`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = "";
                        e.currentTarget.style.boxShadow = "";
                      }
                    }}
                  >
                    {isActive && (
                      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: ind.color }} />
                    )}
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                        style={{ backgroundColor: `${ind.color}15` }}
                      >
                        <ind.icon className="w-5 h-5" style={{ color: ind.color }} />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground leading-tight">{ind.name}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{ind.desc}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section id="features" className="py-20 bg-muted/30 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6366F1]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#06B6D4]/5 rounded-full blur-3xl" />
        </div>
        <div className="container relative">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
            <span className="bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] bg-clip-text text-transparent">Built to Dominate</span> at Scale
          </h2>
          <p className="text-center text-muted-foreground text-sm max-w-lg mx-auto mb-12">Every tool you need to automate, analyze, and accelerate — engineered for the top 1%.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="group relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 space-y-3 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-lg`}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-lg text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - only for non-admin */}
      {!isAdmin && (
        <section className="py-20">
          <div className="container text-center max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold">Ready to Transform Your Operations?</h2>
            <p className="text-muted-foreground">Join thousands of businesses using HostFlow AI to automate operations and maximize revenue.</p>
            <Button size="lg" className="gap-2"><Rocket className="w-4 h-4" /> Start Free Trial</Button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/20 pt-16 pb-8">
        <div className="container">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
            {FOOTER_COLUMNS.map(col => (
              <div key={col.heading}>
                <h4 className="text-sm font-bold mb-4 text-foreground">{col.heading}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link.label}>
                      <a href={link.href} className="text-xs text-muted-foreground hover:text-primary transition-colors">{link.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border/30 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">© 2026 HostFlow AI Technologies. All rights reserved.</p>
            <p className="text-xs text-muted-foreground">AI-Powered · Multi-Industry · Built for Growth</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
