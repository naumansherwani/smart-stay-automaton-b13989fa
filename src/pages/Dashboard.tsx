import { useState } from "react";
import { Calendar, LogOut, BarChart3, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useBookingStore } from "@/lib/bookingStore";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";
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
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <IndustryIcon industry={currentIndustry} size={24} />
              {config.label} Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage your {config.resourceLabelPlural.toLowerCase()}, {config.bookingLabelPlural.toLowerCase()}, and {config.clientLabelPlural.toLowerCase()} with AI.
            </p>
          </div>
          <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
            <Shield className="w-3 h-3 mr-1" /> Protected
          </Badge>
        </div>

        <IndustryKPIs config={config} />
        <ScheduleTimeline config={config} />
        <IndustryWidgets config={config} />
        <IndustrySpecificWidgets industry={currentIndustry} />

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
