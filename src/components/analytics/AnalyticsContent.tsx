import { getRevenueHeatmap, getBookingVelocity, type Booking, type Property } from "@/lib/bookingStore";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as ReTooltip, AreaChart, Area, CartesianGrid } from "recharts";
import { Activity, Flame, TrendingUp, TrendingDown, ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AnalyticsPageProps {
  bookings: Booking[];
  properties: Property[];
}

const AnalyticsContent = ({ bookings, properties }: AnalyticsPageProps) => {
  const navigate = useNavigate();
  const heatmap = getRevenueHeatmap(bookings);
  const velocity = getBookingVelocity(bookings);

  const weeklyData = [];
  for (let i = 0; i < heatmap.length; i += 7) {
    const week = heatmap.slice(i, i + 7);
    weeklyData.push({
      label: week[0].date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: week.reduce((s, d) => s + d.revenue, 0),
      occupancy: Math.round((week.reduce((s, d) => s + d.occupiedProperties, 0) / (week.length * 3)) * 100),
    });
  }

  const totalRevenue = heatmap.reduce((s, d) => s + d.revenue, 0);
  const avgOccupancy = Math.round((heatmap.reduce((s, d) => s + d.occupiedProperties, 0) / (heatmap.length * properties.length)) * 100);
  const peakDay = heatmap.reduce((max, d) => d.revenue > max.revenue ? d : max, heatmap[0]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Logo size="lg" showName />
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Revenue Analytics</h1>
          <p className="text-muted-foreground">Deep insights into your rental performance</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: "90-Day Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: Activity, sub: "All properties" },
            { label: "Avg Occupancy", value: `${avgOccupancy}%`, icon: Flame, sub: "Across all listings" },
            { label: "Peak Revenue Day", value: `$${peakDay.revenue}`, icon: TrendingUp, sub: peakDay.date.toLocaleDateString() },
            { label: "Booking Velocity", value: `${velocity[0].bookingsCount}/week`, icon: TrendingUp, sub: `${velocity[0].trend > 0 ? "+" : ""}${velocity[0].trend}% vs last week` },
          ].map(({ label, value, icon: Icon, sub }) => (
            <div key={label} className="bg-card rounded-xl border border-border shadow-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{label}</span>
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-1">Weekly Revenue Trend</h3>
            <p className="text-xs text-muted-foreground mb-4">Revenue aggregated by week</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(168, 70%, 38%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(168, 70%, 38%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} tickFormatter={v => `$${v}`} />
                  <ReTooltip formatter={(v: number) => [`$${v}`, "Revenue"]} contentStyle={{ borderRadius: 12, border: "1px solid hsl(214, 20%, 90%)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(168, 70%, 38%)" fill="url(#revenueGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <h3 className="text-lg font-bold text-foreground mb-1">Occupancy Rate by Week</h3>
            <p className="text-xs text-muted-foreground mb-4">Percentage of properties occupied</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220, 10%, 46%)" }} tickFormatter={v => `${v}%`} />
                  <ReTooltip formatter={(v: number) => [`${v}%`, "Occupancy"]} contentStyle={{ borderRadius: 12, border: "1px solid hsl(214, 20%, 90%)", fontSize: 12 }} />
                  <Bar dataKey="occupancy" fill="hsl(36, 90%, 55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-1">Booking Velocity Tracker</h3>
          <p className="text-xs text-muted-foreground mb-4">How fast bookings are coming in compared to previous periods</p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {velocity.map(v => (
              <div key={v.period} className="p-4 rounded-lg bg-secondary/30">
                <p className="text-sm font-semibold text-foreground">{v.period}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Bookings</span>
                    <span className="text-xs font-bold text-foreground">{v.bookingsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Revenue</span>
                    <span className="text-xs font-bold text-foreground">${v.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Avg Lead</span>
                    <span className="text-xs font-bold text-foreground">{v.avgLeadTime}d</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {v.trend > 0 ? <TrendingUp className="w-3 h-3 text-success" /> : <TrendingDown className="w-3 h-3 text-destructive" />}
                    <span className={`text-xs font-bold ${v.trend > 0 ? "text-success" : "text-destructive"}`}>
                      {v.trend > 0 ? "+" : ""}{v.trend}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-bold text-foreground mb-1">Revenue Heatmap</h3>
          <p className="text-xs text-muted-foreground mb-4">Daily revenue intensity — darker = more revenue</p>
          <div className="flex flex-wrap gap-1">
            {heatmap.slice(0, 90).map((day, i) => {
              const maxRev = Math.max(...heatmap.map(d => d.revenue), 1);
              const intensity = day.revenue / maxRev;
              const opacity = day.revenue === 0 ? 0.05 : 0.15 + intensity * 0.85;
              return (
                <div
                  key={i}
                  className="w-3 h-3 rounded-sm cursor-pointer transition-transform hover:scale-150"
                  style={{ backgroundColor: `hsla(168, 70%, 38%, ${opacity})` }}
                  title={`${day.date.toLocaleDateString()}: $${day.revenue} (${day.occupiedProperties}/${day.totalProperties} occupied)`}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] text-muted-foreground">Less</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map(op => (
              <div key={op} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `hsla(168, 70%, 38%, ${op})` }} />
            ))}
            <span className="text-[10px] text-muted-foreground">More</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsContent;
