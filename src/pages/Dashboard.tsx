import { useState } from "react";
import { Calendar, LogOut, BarChart3, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useBookingStore } from "@/lib/bookingStore";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";
import { getIndustryConfig, type IndustryType } from "@/lib/industryConfig";
import IndustrySwitcher from "@/components/dashboard/IndustrySwitcher";
import IndustryKPIs from "@/components/dashboard/IndustryKPIs";
import IndustryWidgets from "@/components/dashboard/IndustryWidgets";
import ScheduleTimeline from "@/components/dashboard/ScheduleTimeline";
import BookingCalendar from "@/components/dashboard/BookingCalendar";
import BookingsList from "@/components/dashboard/BookingsList";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import AddBookingDialog from "@/components/dashboard/AddBookingDialog";
import DoubleBookingGuard from "@/components/dashboard/DoubleBookingGuard";
import {
  ItineraryBuilder, GuideScheduler, GroupCapacityMonitor,
  SeasonalDemandChart, ReviewTracker, WeatherAlerts,
  MultiCurrencyRevenue, PackageBuilder, TransportLinks,
} from "@/components/dashboard/TravelWidgets";

const Dashboard = () => {
  const navigate = useNavigate();
  const { bookings, properties, alerts, addBooking, markAlertRead } = useBookingStore();
  const { signOut } = useAuth();
  const { trialDaysLeft, isTrialing } = useSubscription();
  const { profile, updateIndustry } = useProfile();
  
  const [currentIndustry, setCurrentIndustry] = useState<IndustryType>(
    (profile?.industry as IndustryType) || "hospitality"
  );

  const config = getIndustryConfig(currentIndustry);

  const handleIndustryChange = (industry: IndustryType) => {
    setCurrentIndustry(industry);
    updateIndustry(industry);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">CalendarAI</span>
            </div>
            <IndustrySwitcher current={currentIndustry} onChange={handleIndustryChange} />
          </div>
          <div className="flex items-center gap-2">
            {isTrialing && trialDaysLeft > 0 && (
              <Badge variant="outline" className="border-primary text-primary">{trialDaysLeft}d trial left</Badge>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate("/analytics")}>
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </Button>
            <AddBookingDialog properties={properties} onAdd={addBooking} config={config} />
            <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")}>Upgrade</Button>
            <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate("/"); }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {config.icon} {config.label} Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your {config.resourceLabelPlural.toLowerCase()}, {config.bookingLabelPlural.toLowerCase()}, and {config.clientLabelPlural.toLowerCase()} with AI.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
              <Shield className="w-3 h-3 mr-1" /> Protected
            </Badge>
          </div>
        </div>

        <IndustryKPIs config={config} />
        
        <ScheduleTimeline config={config} />

        <IndustryWidgets config={config} />

        {currentIndustry === "travel_tourism" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <ItineraryBuilder />
                <GroupCapacityMonitor />
                <SeasonalDemandChart />
              </div>
              <div className="space-y-6">
                <WeatherAlerts />
                <GuideScheduler />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <PackageBuilder />
              <MultiCurrencyRevenue />
              <TransportLinks />
            </div>
            <ReviewTracker />
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <BookingCalendar bookings={bookings} />
            <BookingsList bookings={bookings} />
          </div>
          <div className="space-y-8">
            <DoubleBookingGuard config={config} />
            <AlertsPanel alerts={alerts} onMarkRead={markAlertRead} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
