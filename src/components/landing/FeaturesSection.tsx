import { Calendar, Shield, TrendingUp, Bell, BarChart3, Globe, UserCheck, Zap, Radar, DollarSign, Flame, Activity } from "lucide-react";

const features = [
  { icon: Calendar, title: "Unified Calendar", description: "See all your bookings across Airbnb, Booking.com, and VRBO in one beautiful calendar view." },
  { icon: Shield, title: "Double Booking Shield", description: "Real-time conflict detection instantly blocks overlapping reservations before they happen." },
  { icon: TrendingUp, title: "AI Smart Pricing", description: "Automatically adjust rates based on seasons, demand, and local events to maximize revenue." },
  { icon: UserCheck, title: "Guest Score Predictor", description: "AI-powered guest reliability scoring analyzes booking patterns to flag risky reservations early." },
  { icon: Zap, title: "Gap Night Filler", description: "Auto-detects 1-3 night gaps between bookings and suggests discounted rates to fill lost revenue." },
  { icon: Radar, title: "Competitor Price Radar", description: "See how your pricing compares to nearby listings in real-time and stay competitive." },
  { icon: DollarSign, title: "Turnover Profit Calculator", description: "Instant net profit per booking after cleaning costs, platform fees, and commissions." },
  { icon: Flame, title: "Revenue Heatmap", description: "GitHub-style heatmap showing daily revenue intensity — spot patterns at a glance." },
  { icon: Activity, title: "Booking Velocity Tracker", description: "Monitor how fast bookings come in vs. historical pace to predict slow periods early." },
  { icon: Bell, title: "Smart Alerts", description: "Get notified about check-ins, low guest scores, gap opportunities, and pricing changes." },
  { icon: Globe, title: "Multi-Platform Sync", description: "One booking update syncs everywhere. No manual updates, no missed changes." },
  { icon: BarChart3, title: "Revenue Analytics", description: "Track occupancy rates, revenue trends, and pricing performance with interactive charts." },
];

const FeaturesSection = () => (
  <section id="features" className="py-24 bg-background">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">12 Powerful Features</span>
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Everything You Need to Host Smarter</h2>
        <p className="text-lg text-muted-foreground">Tools that no other rental management platform offers — from AI guest scoring to gap-night filling.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="group p-6 rounded-xl bg-card shadow-card hover:shadow-elevated transition-all duration-300 border border-border/50">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-gradient-primary transition-all duration-300">
              <Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-2 text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
