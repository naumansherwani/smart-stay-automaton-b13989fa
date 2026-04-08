import { Home, DollarSign, CalendarCheck, TrendingUp } from "lucide-react";
import type { Booking, Property } from "@/lib/bookingStore";

interface StatsCardsProps {
  bookings: Booking[];
  properties: Property[];
}

const StatsCards = ({ bookings, properties }: StatsCardsProps) => {
  const activeBookings = bookings.filter(b => b.status !== "cancelled");
  const totalRevenue = activeBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const avgRate = activeBookings.length > 0 ? Math.round(activeBookings.reduce((sum, b) => sum + b.nightlyRate, 0) / activeBookings.length) : 0;

  const stats = [
    { label: "Properties", value: properties.length.toString(), icon: Home, change: "" },
    { label: "Active Bookings", value: activeBookings.length.toString(), icon: CalendarCheck, change: "+2 this week" },
    { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, change: "+12% vs last month" },
    { label: "Avg Nightly Rate", value: `$${avgRate}`, icon: TrendingUp, change: "Optimized by AI" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(({ label, value, icon: Icon, change }) => (
        <div key={label} className="bg-card rounded-xl border border-border shadow-card p-5 hover:shadow-elevated transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground font-medium">{label}</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {change && <p className="text-xs text-muted-foreground mt-1">{change}</p>}
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
