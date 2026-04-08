import { Calendar, Shield, TrendingUp, Bell, BarChart3, Globe } from "lucide-react";

const features = [
  { icon: Calendar, title: "Unified Calendar", description: "See all your bookings across Airbnb, Booking.com, and VRBO in one beautiful calendar view." },
  { icon: Shield, title: "Double Booking Shield", description: "Real-time conflict detection instantly blocks overlapping reservations before they happen." },
  { icon: TrendingUp, title: "AI Smart Pricing", description: "Automatically adjust rates based on seasons, demand, and local events to maximize revenue." },
  { icon: Bell, title: "Smart Alerts", description: "Get notified about check-ins, pricing opportunities, and potential booking conflicts instantly." },
  { icon: Globe, title: "Multi-Platform Sync", description: "One booking update syncs everywhere. No manual updates, no missed changes." },
  { icon: BarChart3, title: "Revenue Analytics", description: "Track occupancy rates, revenue trends, and pricing performance across all properties." },
];

const FeaturesSection = () => (
  <section id="features" className="py-24 bg-background">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Everything You Need to Host Smarter</h2>
        <p className="text-lg text-muted-foreground">Automate the tedious parts of property management so you can focus on what matters — your guests.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map(({ icon: Icon, title, description }) => (
          <div key={title} className="group p-8 rounded-xl bg-card shadow-card hover:shadow-elevated transition-all duration-300 border border-border/50">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-all duration-300">
              <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-foreground">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
