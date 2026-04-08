import { Calendar, LogOut, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useBookingStore } from "@/lib/bookingStore";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import StatsCards from "@/components/dashboard/StatsCards";
import BookingCalendar from "@/components/dashboard/BookingCalendar";
import BookingsList from "@/components/dashboard/BookingsList";
import SmartPricingCard from "@/components/dashboard/SmartPricingCard";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import AddBookingDialog from "@/components/dashboard/AddBookingDialog";
import GuestScoreCard from "@/components/dashboard/GuestScoreCard";
import GapNightFiller from "@/components/dashboard/GapNightFiller";
import CompetitorRadar from "@/components/dashboard/CompetitorRadar";
import TurnoverProfit from "@/components/dashboard/TurnoverProfit";

const Dashboard = () => {
  const navigate = useNavigate();
  const { bookings, properties, alerts, addBooking, markAlertRead } = useBookingStore();
  const { signOut } = useAuth();
  const { subscription, trialDaysLeft, isTrialing } = useSubscription();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">CalendarAI</span>
          </div>
          {isTrialing && trialDaysLeft > 0 && (
            <Badge variant="outline" className="border-primary text-primary">{trialDaysLeft}d trial left</Badge>
          )}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/analytics")}>
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </Button>
            <AddBookingDialog properties={properties} onAdd={addBooking} />
            <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")}>Upgrade</Button>
            <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate("/"); }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back 👋</h1>
          <p className="text-muted-foreground">Here's what's happening across your properties.</p>
        </div>

        <StatsCards bookings={bookings} properties={properties} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <BookingCalendar bookings={bookings} />
            <BookingsList bookings={bookings} />
            <TurnoverProfit bookings={bookings} properties={properties} />
          </div>
          <div className="space-y-8">
            <AlertsPanel alerts={alerts} onMarkRead={markAlertRead} />
            <GapNightFiller bookings={bookings} properties={properties} />
            <GuestScoreCard bookings={bookings} />
            <CompetitorRadar properties={properties} />
            <SmartPricingCard properties={properties} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
