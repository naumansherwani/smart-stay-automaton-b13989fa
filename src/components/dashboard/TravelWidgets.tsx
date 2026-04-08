import { useState } from "react";
import { 
  Globe, MapPin, Sun, Cloud, Umbrella, Users, Star, 
  Calendar, Clock, DollarSign, TrendingUp, Plane, 
  Map, Camera, Shield, Zap, Languages, Package
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

/* ─── Itinerary Builder ─── */
export function ItineraryBuilder() {
  const days = [
    { day: 1, title: "Arrival & City Tour", activities: ["Airport Transfer", "Walking City Tour", "Welcome Dinner"], status: "completed" },
    { day: 2, title: "Cultural Heritage Day", activities: ["Museum Visit", "Historical Sites", "Local Cooking Class"], status: "in-progress" },
    { day: 3, title: "Adventure & Nature", activities: ["Hiking Trail", "Waterfall Visit", "Sunset Viewpoint"], status: "upcoming" },
    { day: 4, title: "Beach & Leisure", activities: ["Snorkeling Trip", "Beach Club", "Seafood Dinner"], status: "upcoming" },
    { day: 5, title: "Departure", activities: ["Souvenir Shopping", "Airport Transfer"], status: "upcoming" },
  ];

  const statusColors: Record<string, string> = {
    completed: "bg-success/10 text-success border-success/20",
    "in-progress": "bg-primary/10 text-primary border-primary/20",
    upcoming: "bg-secondary text-muted-foreground border-border",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Map className="w-4 h-4 text-primary" />
          AI Itinerary Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {days.map(d => (
          <div key={d.day} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                d.status === "completed" ? "bg-success text-success-foreground" :
                d.status === "in-progress" ? "bg-primary text-primary-foreground" :
                "bg-secondary text-muted-foreground"
              }`}>
                D{d.day}
              </div>
              {d.day < 5 && <div className="w-0.5 h-full bg-border mt-1" />}
            </div>
            <div className="flex-1 pb-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{d.title}</p>
                <Badge variant="outline" className={`text-[10px] ${statusColors[d.status]}`}>
                  {d.status === "in-progress" ? "Today" : d.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {d.activities.map(a => (
                  <span key={a} className="text-[10px] bg-secondary/80 text-muted-foreground px-1.5 py-0.5 rounded">{a}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ─── Guide Scheduler ─── */
export function GuideScheduler() {
  const guides = [
    { name: "Marco R.", languages: ["EN", "ES", "IT"], rating: 4.9, toursToday: 2, available: true, specialties: ["History", "Culture"] },
    { name: "Yuki T.", languages: ["EN", "JP"], rating: 4.8, toursToday: 1, available: true, specialties: ["Adventure", "Nature"] },
    { name: "Sarah K.", languages: ["EN", "FR", "DE"], rating: 4.7, toursToday: 3, available: false, specialties: ["Food", "Wine"] },
    { name: "Ahmed H.", languages: ["EN", "AR"], rating: 4.9, toursToday: 0, available: true, specialties: ["Desert", "Heritage"] },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Guide Scheduler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {guides.map(g => (
          <div key={g.name} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${g.available ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                {g.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground">{g.name}</p>
                  <Star className="w-3 h-3 text-warning fill-warning" />
                  <span className="text-xs text-muted-foreground">{g.rating}</span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Languages className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{g.languages.join(", ")}</span>
                  <span className="text-[10px] text-muted-foreground mx-1">·</span>
                  <span className="text-[10px] text-muted-foreground">{g.specialties.join(", ")}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={g.available ? "secondary" : "outline"} className={`text-[10px] ${g.available ? "bg-success/10 text-success" : ""}`}>
                {g.available ? "Available" : "Busy"}
              </Badge>
              <p className="text-[10px] text-muted-foreground mt-0.5">{g.toursToday} tours today</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ─── Group Capacity Monitor ─── */
export function GroupCapacityMonitor() {
  const tours = [
    { name: "City Walking Tour", booked: 18, max: 20, time: "9:00 AM", guide: "Marco R." },
    { name: "Food & Wine Tour", booked: 12, max: 12, time: "11:00 AM", guide: "Sarah K." },
    { name: "Sunset Cruise", booked: 28, max: 40, time: "5:00 PM", guide: "Yuki T." },
    { name: "Night Market Tour", booked: 8, max: 15, time: "7:00 PM", guide: "Ahmed H." },
    { name: "Temple & Heritage Walk", booked: 15, max: 15, time: "8:00 AM", guide: "Marco R." },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Group Capacity Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tours.map(t => {
          const pct = Math.round((t.booked / t.max) * 100);
          const isFull = t.booked >= t.max;
          return (
            <div key={t.name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{t.time}</span>
                  <span className="text-sm font-medium text-foreground">{t.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${isFull ? "text-destructive" : pct > 80 ? "text-warning" : "text-success"}`}>
                    {t.booked}/{t.max}
                  </span>
                  {isFull && <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">Full</Badge>}
                </div>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ─── Seasonal Demand Heatmap ─── */
export function SeasonalDemandChart() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const demand = [45, 38, 55, 72, 85, 95, 98, 92, 78, 65, 50, 60];
  const prices = ["$80", "$70", "$95", "$120", "$150", "$180", "$195", "$175", "$140", "$110", "$85", "$100"];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Seasonal Demand & AI Pricing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {months.map((m, i) => (
            <div key={m} className="flex items-center gap-2">
              <span className="w-8 text-[11px] text-muted-foreground font-medium">{m}</span>
              <div className="flex-1 h-5 rounded bg-secondary overflow-hidden relative">
                <div
                  className={`h-full rounded transition-all ${
                    demand[i] >= 90 ? "bg-destructive/70" : demand[i] >= 70 ? "bg-warning/70" : demand[i] >= 50 ? "bg-primary/70" : "bg-muted-foreground/30"
                  }`}
                  style={{ width: `${demand[i]}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-foreground">
                  {demand[i]}%
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] w-14 justify-center">{prices[i]}</Badge>
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-destructive/70" /><span className="text-[10px] text-muted-foreground">Peak</span></div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-warning/70" /><span className="text-[10px] text-muted-foreground">High</span></div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-primary/70" /><span className="text-[10px] text-muted-foreground">Medium</span></div>
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-sm bg-muted-foreground/30" /><span className="text-[10px] text-muted-foreground">Low</span></div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Review & Rating Tracker ─── */
export function ReviewTracker() {
  const reviews = [
    { platform: "TripAdvisor", rating: 4.7, count: 342, trend: "+0.2", recent: "Amazing experience! Our guide Marco was fantastic." },
    { platform: "Google", rating: 4.6, count: 218, trend: "+0.1", recent: "Well-organized tour with great itinerary." },
    { platform: "Viator", rating: 4.8, count: 156, trend: "+0.3", recent: "Best food tour I've ever been on!" },
    { platform: "GetYourGuide", rating: 4.5, count: 89, trend: "0.0", recent: "Good value for money. Recommended." },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Star className="w-4 h-4 text-warning" />
          Review & Rating Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reviews.map(r => (
          <div key={r.platform} className="p-2.5 rounded-lg border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{r.platform}</span>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-warning fill-warning" />
                  <span className="text-sm font-bold text-foreground">{r.rating}</span>
                </div>
                <span className={`text-[10px] ${r.trend.startsWith("+") ? "text-success" : "text-muted-foreground"}`}>
                  {r.trend}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground italic">"{r.recent}"</p>
            <p className="text-[10px] text-muted-foreground">{r.count} reviews</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ─── Weather Alerts ─── */
export function WeatherAlerts() {
  const alerts = [
    { day: "Today", icon: Sun, temp: "28°C", condition: "Sunny", impact: "none", tip: "Perfect for outdoor tours" },
    { day: "Tomorrow", icon: Cloud, temp: "24°C", condition: "Partly Cloudy", impact: "low", tip: "All tours can proceed" },
    { day: "Wed", icon: Umbrella, temp: "19°C", condition: "Rain Expected", impact: "high", tip: "AI suggests moving outdoor tours to indoor alternatives" },
    { day: "Thu", icon: Sun, temp: "26°C", condition: "Clear", impact: "none", tip: "Great visibility for sightseeing" },
  ];

  const impactColors: Record<string, string> = {
    none: "text-success", low: "text-warning", high: "text-destructive",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sun className="w-4 h-4 text-warning" />
          Weather & Tour Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {alerts.map(a => {
          const Icon = a.icon;
          return (
            <div key={a.day} className={`flex items-start gap-3 p-2.5 rounded-lg ${a.impact === "high" ? "bg-destructive/5 border border-destructive/10" : "bg-secondary/30"}`}>
              <div className="w-10 text-center">
                <Icon className={`w-5 h-5 mx-auto ${impactColors[a.impact]}`} />
                <p className="text-[10px] text-muted-foreground mt-0.5">{a.day}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{a.temp} — {a.condition}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {a.impact === "high" && <Zap className="w-3 h-3 inline mr-0.5 text-warning" />}
                  {a.tip}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ─── Multi-Currency Revenue ─── */
export function MultiCurrencyRevenue() {
  const currencies = [
    { code: "USD", symbol: "$", revenue: 48500, bookings: 285, flag: "🇺🇸" },
    { code: "EUR", symbol: "€", revenue: 32200, bookings: 198, flag: "🇪🇺" },
    { code: "GBP", symbol: "£", revenue: 18900, bookings: 124, flag: "🇬🇧" },
    { code: "JPY", symbol: "¥", revenue: 2850000, bookings: 87, flag: "🇯🇵" },
    { code: "AUD", symbol: "A$", revenue: 12400, bookings: 65, flag: "🇦🇺" },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Multi-Currency Revenue
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {currencies.map(c => (
            <div key={c.code} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">{c.flag}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{c.code}</p>
                  <p className="text-[10px] text-muted-foreground">{c.bookings} bookings</p>
                </div>
              </div>
              <p className="text-sm font-bold text-foreground">{c.symbol}{c.revenue.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Package Builder ─── */
export function PackageBuilder() {
  const packages = [
    { name: "Weekend Explorer", tours: 3, price: "$299", popularity: 92, includes: ["City Tour", "Food Walk", "Sunset Cruise"] },
    { name: "Cultural Deep Dive", tours: 5, price: "$499", popularity: 78, includes: ["Museum", "Temple", "Cooking", "Heritage", "Art"] },
    { name: "Adventure Package", tours: 4, price: "$449", popularity: 85, includes: ["Hiking", "Kayaking", "Zip-line", "Camping"] },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          AI Tour Packages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {packages.map(p => (
          <div key={p.name} className="p-3 rounded-lg border border-border bg-card hover:bg-secondary/30 transition-colors space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">{p.name}</p>
              <Badge variant="outline" className="text-xs">{p.price}</Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {p.includes.map(i => (
                <span key={i} className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{i}</span>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{p.tours} tours included</span>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-success" />
                <span className="text-[10px] text-success">{p.popularity}% popularity</span>
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full text-xs">
          <Zap className="w-3 h-3 mr-1" /> AI Generate New Package
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── Transport Links ─── */
export function TransportLinks() {
  const transports = [
    { type: "✈️ Flights", arrivals: 12, nextArrival: "10:30 AM", from: "London LHR", travelers: 8 },
    { type: "🚂 Trains", arrivals: 5, nextArrival: "11:15 AM", from: "Tokyo Station", travelers: 3 },
    { type: "🚌 Buses", arrivals: 8, nextArrival: "9:45 AM", from: "City Center Hub", travelers: 15 },
    { type: "🚢 Ferries", arrivals: 2, nextArrival: "2:00 PM", from: "Island Port", travelers: 22 },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plane className="w-4 h-4 text-primary" />
          Transport & Arrival Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {transports.map(t => (
          <div key={t.type} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
            <div>
              <p className="text-sm font-medium text-foreground">{t.type}</p>
              <p className="text-[10px] text-muted-foreground">Next: {t.nextArrival} from {t.from}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-foreground">{t.travelers} travelers</p>
              <p className="text-[10px] text-muted-foreground">{t.arrivals} arrivals today</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
