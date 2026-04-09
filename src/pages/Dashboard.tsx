import { useState } from "react";
import { LogOut, BarChart3, Shield, Sparkles, Plus, Bell, HelpCircle, Zap, Brain, TrendingUp, Calendar } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useBookingStore } from "@/lib/bookingStore";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIndustryConfig, type IndustryType } from "@/lib/industryConfig";
import IndustrySwitcher from "@/components/dashboard/IndustrySwitcher";
import IndustryIcon from "@/components/dashboard/IndustryIcon";
import IndustryKPIs from "@/components/dashboard/IndustryKPIs";
import IndustryWidgets from "@/components/dashboard/IndustryWidgets";
import ScheduleTimeline from "@/components/dashboard/ScheduleTimeline";
import BookingCalendar from "@/components/dashboard/BookingCalendar";
import BookingsList from "@/components/dashboard/BookingsList";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import AddBookingDialog from "@/components/dashboard/AddBookingDialog";
import DoubleBookingGuard from "@/components/dashboard/DoubleBookingGuard";
// Travel, Tourism & Hospitality
import { ItineraryBuilder, GuideScheduler, GroupCapacityMonitor, SeasonalDemandChart, ReviewTracker, WeatherAlerts, MultiCurrencyRevenue, PackageBuilder, TransportLinks } from "@/components/dashboard/TravelWidgets";
// Airlines
import { CrewScheduler, GateAssignment, FlightLoadFactor, DelayTracker } from "@/components/dashboard/AirlineWidgets";
// Car Rental
import { FleetStatusBoard, DamageReports, UtilizationChart } from "@/components/dashboard/CarRentalWidgets";
// Healthcare
import { PatientFlowBoard, NoShowPredictor, WaitlistManager } from "@/components/dashboard/HealthcareWidgets";
// Education
import { ClassScheduleBoard, AttendanceTracker, InstructorAvailability } from "@/components/dashboard/EducationWidgets";
// Logistics
import { DeliveryTrackingBoard, WarehouseCapacity, DriverSchedule } from "@/components/dashboard/LogisticsWidgets";
// Events
import { VenueCalendar, VendorCoordination } from "@/components/dashboard/EventsWidgets";
// Fitness
import { ClassScheduleFitness, MemberRetention, TrainerBooking } from "@/components/dashboard/FitnessWidgets";
// Legal
import { CourtDateTracker, BillableHoursTracker, CaseDeadlines } from "@/components/dashboard/LegalWidgets";
// Real Estate
import { ShowingCalendar, LeadTracker, MarketAnalysis } from "@/components/dashboard/RealEstateWidgets";
// Coworking
import { DeskMap, MeetingRoomAvailability, MemberCheckins } from "@/components/dashboard/CoworkingWidgets";
// Maritime
import { BerthSchedule, CrewRotation, TideCalendar } from "@/components/dashboard/MaritimeWidgets";
// Government
import { CitizenAppointments, QueueManagement, ServiceSatisfaction } from "@/components/dashboard/GovernmentWidgets";

function IndustrySpecificWidgets({ industry }: { industry: IndustryType }) {
  switch (industry) {
    case "hospitality":
      return (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6"><ItineraryBuilder /><GroupCapacityMonitor /><SeasonalDemandChart /></div>
            <div className="space-y-6"><WeatherAlerts /><GuideScheduler /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><PackageBuilder /><MultiCurrencyRevenue /><TransportLinks /></div>
          <ReviewTracker />
        </>
      );
    case "airlines":
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6"><GateAssignment /><FlightLoadFactor /></div>
          <div className="space-y-6"><CrewScheduler /><DelayTracker /></div>
        </div>
      );
    case "car_rental":
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6"><FleetStatusBoard /><UtilizationChart /></div>
          <div className="space-y-6"><DamageReports /></div>
        </div>
      );
    case "healthcare":
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6"><PatientFlowBoard /><WaitlistManager /></div>
          <div className="space-y-6"><NoShowPredictor /></div>
        </div>
      );
    case "education":
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6"><ClassScheduleBoard /><AttendanceTracker /></div>
          <div className="space-y-6"><InstructorAvailability /></div>
        </div>
      );
    case "logistics":
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6"><DeliveryTrackingBoard /><WarehouseCapacity /></div>
          <div className="space-y-6"><DriverSchedule /></div>
        </div>
      );
    case "events_entertainment":
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VenueCalendar /><VendorCoordination />
        </div>
      );
    case "fitness_wellness":
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6"><ClassScheduleFitness /><MemberRetention /></div>
          <div className="space-y-6"><TrainerBooking /></div>
        </div>
      );
    case "legal_services":
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6"><CourtDateTracker /><BillableHoursTracker /></div>
          <div className="space-y-6"><CaseDeadlines /></div>
        </div>
      );
    case "real_estate":
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6"><ShowingCalendar /><MarketAnalysis /></div>
          <div className="space-y-6"><LeadTracker /></div>
        </div>
      );
    case "coworking":
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6"><DeskMap /><MeetingRoomAvailability /></div>
          <div className="space-y-6"><MemberCheckins /></div>
        </div>
      );
    case "marine_maritime":
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6"><BerthSchedule /><TideCalendar /></div>
          <div className="space-y-6"><CrewRotation /></div>
        </div>
      );
    case "government":
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6"><CitizenAppointments /><QueueManagement /></div>
          <div className="space-y-6"><ServiceSatisfaction /></div>
        </div>
      );
    default:
      return null;
  }
}

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

  const unreadAlerts = alerts.filter(a => !a.read).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            <div className="cursor-pointer" onClick={() => navigate("/")}>
              <Logo size="lg" showName />
            </div>
            <div className="hidden md:block h-8 w-px bg-border" />
            <IndustrySwitcher current={currentIndustry} onChange={handleIndustryChange} />
          </div>
          <div className="flex items-center gap-2">
            {isTrialing && trialDaysLeft > 0 && (
              <Badge variant="outline" className="border-primary text-primary animate-pulse">
                {trialDaysLeft}d trial left
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="relative" onClick={() => {}}>
              <Bell className="w-4 h-4" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                  {unreadAlerts}
                </span>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/analytics")}>
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </Button>
            <Button size="sm" className="bg-gradient-primary" onClick={() => navigate("/pricing")}>
              <Sparkles className="w-4 h-4 mr-2" /> Upgrade
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate("/"); }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-transparent rounded-2xl p-6 border border-primary/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <IndustryIcon industry={currentIndustry} size={40} />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {config.label} Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage your {config.resourceLabelPlural.toLowerCase()} with AI-powered tools
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20 px-3 py-1">
              <Shield className="w-4 h-4 mr-1" /> AI Protected
            </Badge>
          </div>

          {/* Quick Actions - Beginner Friendly */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <AddBookingDialog properties={properties} onAdd={addBooking} config={config} />
            <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => navigate("/analytics")}>
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="text-xs">View Analytics</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1" onClick={() => navigate("/pricing")}>
              <Zap className="w-5 h-5 text-accent" />
              <span className="text-xs">Upgrade Plan</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs">Help Guide</span>
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <IndustryKPIs config={config} />

        {/* Main Dashboard Tabs - Easy Navigation */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <Calendar className="w-4 h-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="ai-tools" className="gap-2">
              <Brain className="w-4 h-4" /> AI Tools
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Schedule
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <Bell className="w-4 h-4" /> Alerts
              {unreadAlerts > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {unreadAlerts}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview - Beginner Friendly */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <BookingCalendar bookings={bookings} />
                <BookingsList bookings={bookings} />
              </div>
              <div className="space-y-6">
                <DoubleBookingGuard config={config} />
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-primary" />
                      Getting Started
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</div>
                      <p className="text-sm text-muted-foreground">Add your {config.resourceLabelPlural.toLowerCase()} to start managing them</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</div>
                      <p className="text-sm text-muted-foreground">Create {config.bookingLabelPlural.toLowerCase()} and the AI will optimize scheduling</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</div>
                      <p className="text-sm text-muted-foreground">Use AI Tools tab for advanced features like pricing & forecasting</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: AI Tools - Advanced Features */}
          <TabsContent value="ai-tools" className="space-y-6">
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/10 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">AI-Powered Tools</strong> — These features use artificial intelligence to automate, predict, and optimize your {config.label.toLowerCase()} operations.
              </p>
            </div>
            <IndustryWidgets config={config} />
            <IndustrySpecificWidgets industry={currentIndustry} />
          </TabsContent>

          {/* Tab 3: Schedule */}
          <TabsContent value="schedule" className="space-y-6">
            <ScheduleTimeline config={config} />
            <BookingCalendar bookings={bookings} />
          </TabsContent>

          {/* Tab 4: Alerts */}
          <TabsContent value="alerts" className="space-y-6">
            <AlertsPanel alerts={alerts} onMarkRead={markAlertRead} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
