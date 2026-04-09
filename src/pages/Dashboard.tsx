import { useState, useEffect } from "react";
import { LogOut, BarChart3, Shield, Sparkles, Bell, HelpCircle, Zap, Brain, TrendingUp, Calendar, Settings as SettingsIcon, Users, ClipboardList, DollarSign, Plane, Car, GraduationCap, Truck, Theater, Stethoscope, UserCircle } from "lucide-react";
import Logo from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useProfile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIndustryConfig, type IndustryType } from "@/lib/industryConfig";
import { getIndustryFeatures, supportsAutoPricing } from "@/lib/industryFeatures";
import IndustrySwitcher from "@/components/dashboard/IndustrySwitcher";
import IndustryIcon from "@/components/dashboard/IndustryIcon";
import IndustryKPIs from "@/components/dashboard/IndustryKPIs";
import IndustryWidgets from "@/components/dashboard/IndustryWidgets";
import SmartCalendarView from "@/components/dashboard/SmartCalendarView";
import BookingManager from "@/components/dashboard/BookingManager";
import ResourceManager from "@/components/dashboard/ResourceManager";
import ScheduleSettingsPanel from "@/components/dashboard/ScheduleSettingsPanel";
import AIAutoSchedule from "@/components/dashboard/AIAutoSchedule";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import DoubleBookingGuard from "@/components/dashboard/DoubleBookingGuard";
import AutoPricingPanel from "@/components/dashboard/AutoPricingPanel";
import FlightManager from "@/components/dashboard/FlightManager";
import VehicleManager from "@/components/dashboard/VehicleManager";
import TimetableManager from "@/components/dashboard/TimetableManager";
import LogisticsManager from "@/components/dashboard/LogisticsManager";
import EventsManager from "@/components/dashboard/EventsManager";
import HealthcareManager from "@/components/dashboard/HealthcareManager";
import { supabase } from "@/integrations/supabase/client";

const isAirlines = (industry: IndustryType) => industry === "airlines";
const isCarRental = (industry: IndustryType) => industry === "car_rental";
const isEducation = (industry: IndustryType) => industry === "education";
const isLogistics = (industry: IndustryType) => industry === "logistics";
const isEvents = (industry: IndustryType) => industry === "events_entertainment";
const isHealthcare = (industry: IndustryType) => industry === "healthcare";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { trialDaysLeft, isTrialing } = useSubscription();
  const { profile, updateIndustry } = useProfile();
  
  const [currentIndustry, setCurrentIndustry] = useState<IndustryType>(
    (profile?.industry as IndustryType) || "hospitality"
  );
  const [calendarBookings, setCalendarBookings] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  const config = getIndustryConfig(currentIndustry);
  const features = getIndustryFeatures(currentIndustry);
  const hasPricing = supportsAutoPricing(currentIndustry);

  const handleIndustryChange = (industry: IndustryType) => {
    setCurrentIndustry(industry);
    updateIndustry(industry);
  };

  useEffect(() => {
    if (!user) return;
    const fetchBookings = async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id, guest_name, resource_id, check_in, check_out, status, platform")
        .eq("user_id", user.id);
      if (data) {
        const { data: resources } = await supabase
          .from("resources")
          .select("id, name")
          .eq("user_id", user.id);
        const resourceMap = new Map(resources?.map(r => [r.id, r.name]) || []);
        setCalendarBookings(data.map(b => ({
          ...b,
          resource_name: resourceMap.get(b.resource_id) || "Unknown",
        })));
      }
    };
    fetchBookings();
    const channel = supabase
      .channel("dashboard-bookings")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `user_id=eq.${user.id}` }, () => fetchBookings())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (data) setAlerts(data);
    };
    fetchAlerts();
  }, [user]);

  const unreadAlerts = alerts.filter(a => !a.read).length;

  const markAlertRead = async (id: string) => {
    await supabase.from("alerts").update({ read: true }).eq("id", id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  // Build visible tabs based on industry
  const tabCount = 8;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="cursor-pointer" onClick={() => navigate("/")}>
              <Logo size="lg" showName />
            </div>
            <div className="hidden md:block h-8 w-px bg-border" />
            <div className="hidden sm:block">
              <IndustrySwitcher current={currentIndustry} onChange={handleIndustryChange} />
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            {isTrialing && trialDaysLeft > 0 && (
              <Badge variant="outline" className="border-primary text-primary animate-pulse hidden sm:flex">
                {trialDaysLeft}d trial
              </Badge>
            )}
            <LanguageSwitcher />
            <ThemeToggle />
            <NotificationsDropdown />
            <Button variant="outline" size="sm" className="hidden md:flex" onClick={() => navigate("/analytics")}>
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </Button>
            <Button size="sm" className="bg-gradient-primary" onClick={() => navigate("/pricing")}>
              <Sparkles className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Upgrade</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
              <SettingsIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <UserCircle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => { signOut(); navigate("/"); }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 md:py-8 space-y-6 md:space-y-8">
        <div className="sm:hidden">
          <IndustrySwitcher current={currentIndustry} onChange={handleIndustryChange} />
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary/10 via-accent/5 to-transparent rounded-2xl p-4 md:p-6 border border-primary/20">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <IndustryIcon industry={currentIndustry} size={36} />
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-foreground">
                  {config.label} Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  AI-powered scheduling for your {config.resourceLabelPlural.toLowerCase()}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20 px-3 py-1">
              <Shield className="w-4 h-4 mr-1" /> AI Protected
            </Badge>
          </div>
        </div>

        <IndustryKPIs config={config} />

        <Tabs defaultValue={isAirlines(currentIndustry) ? "flights" : isCarRental(currentIndustry) ? "fleet" : isEducation(currentIndustry) ? "timetable" : isLogistics(currentIndustry) ? "logistics" : isEvents(currentIndustry) ? "events" : isHealthcare(currentIndustry) ? "healthcare" : "calendar"} className="space-y-6">
          <TabsList className="flex flex-wrap w-full lg:w-auto gap-1 h-auto p-1">
            {isAirlines(currentIndustry) ? (
              <>
                <TabsTrigger value="flights" className="gap-1.5 text-xs md:text-sm">
                  <Plane className="w-3.5 h-3.5" /> Flights
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-1.5 text-xs md:text-sm">
                  <Calendar className="w-3.5 h-3.5" /> Schedule
                </TabsTrigger>
                <TabsTrigger value="bookings" className="gap-1.5 text-xs md:text-sm">
                  <ClipboardList className="w-3.5 h-3.5" /> Bookings
                </TabsTrigger>
                <TabsTrigger value="pricing" className="gap-1.5 text-xs md:text-sm">
                  <DollarSign className="w-3.5 h-3.5" /> Pricing
                </TabsTrigger>
                <TabsTrigger value="ai-tools" className="gap-1.5 text-xs md:text-sm">
                  <Sparkles className="w-3.5 h-3.5" /> AI Tools
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-1.5 text-xs md:text-sm">
                  <SettingsIcon className="w-3.5 h-3.5" /> Settings
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-1.5 text-xs md:text-sm">
                  <Bell className="w-3.5 h-3.5" /> Alerts
                  {unreadAlerts > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">
                      {unreadAlerts}
                    </Badge>
                  )}
                </TabsTrigger>
              </>
            ) : isCarRental(currentIndustry) ? (
              <>
                <TabsTrigger value="fleet" className="gap-1.5 text-xs md:text-sm">
                  <Car className="w-3.5 h-3.5" /> Fleet
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-1.5 text-xs md:text-sm">
                  <Calendar className="w-3.5 h-3.5" /> Availability
                </TabsTrigger>
                <TabsTrigger value="bookings" className="gap-1.5 text-xs md:text-sm">
                  <ClipboardList className="w-3.5 h-3.5" /> Bookings
                </TabsTrigger>
                <TabsTrigger value="pricing" className="gap-1.5 text-xs md:text-sm">
                  <DollarSign className="w-3.5 h-3.5" /> Pricing
                </TabsTrigger>
                <TabsTrigger value="ai-tools" className="gap-1.5 text-xs md:text-sm">
                  <Sparkles className="w-3.5 h-3.5" /> AI Tools
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-1.5 text-xs md:text-sm">
                  <SettingsIcon className="w-3.5 h-3.5" /> Settings
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-1.5 text-xs md:text-sm">
                  <Bell className="w-3.5 h-3.5" /> Alerts
                  {unreadAlerts > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">
                      {unreadAlerts}
                    </Badge>
                  )}
                </TabsTrigger>
              </>
            ) : isEducation(currentIndustry) ? (
              <>
                <TabsTrigger value="timetable" className="gap-1.5 text-xs md:text-sm">
                  <GraduationCap className="w-3.5 h-3.5" /> Timetable
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-1.5 text-xs md:text-sm">
                  <Calendar className="w-3.5 h-3.5" /> Calendar
                </TabsTrigger>
                <TabsTrigger value="bookings" className="gap-1.5 text-xs md:text-sm">
                  <ClipboardList className="w-3.5 h-3.5" /> Classes
                </TabsTrigger>
                <TabsTrigger value="ai-tools" className="gap-1.5 text-xs md:text-sm">
                  <Sparkles className="w-3.5 h-3.5" /> AI Tools
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-1.5 text-xs md:text-sm">
                  <SettingsIcon className="w-3.5 h-3.5" /> Settings
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-1.5 text-xs md:text-sm">
                  <Bell className="w-3.5 h-3.5" /> Alerts
                  {unreadAlerts > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">
                      {unreadAlerts}
                    </Badge>
                  )}
                </TabsTrigger>
              </>
            ) : isLogistics(currentIndustry) ? (
              <>
                <TabsTrigger value="logistics" className="gap-1.5 text-xs md:text-sm">
                  <Truck className="w-3.5 h-3.5" /> Logistics
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-1.5 text-xs md:text-sm">
                  <Calendar className="w-3.5 h-3.5" /> Calendar
                </TabsTrigger>
                <TabsTrigger value="bookings" className="gap-1.5 text-xs md:text-sm">
                  <ClipboardList className="w-3.5 h-3.5" /> Bookings
                </TabsTrigger>
                <TabsTrigger value="ai-tools" className="gap-1.5 text-xs md:text-sm">
                  <Sparkles className="w-3.5 h-3.5" /> AI Tools
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-1.5 text-xs md:text-sm">
                  <SettingsIcon className="w-3.5 h-3.5" /> Settings
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-1.5 text-xs md:text-sm">
                  <Bell className="w-3.5 h-3.5" /> Alerts
                  {unreadAlerts > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">
                      {unreadAlerts}
                    </Badge>
                  )}
                </TabsTrigger>
              </>
            ) : isEvents(currentIndustry) ? (
              <>
                <TabsTrigger value="events" className="gap-1.5 text-xs md:text-sm">
                  <Theater className="w-3.5 h-3.5" /> Events
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-1.5 text-xs md:text-sm">
                  <Calendar className="w-3.5 h-3.5" /> Calendar
                </TabsTrigger>
                <TabsTrigger value="bookings" className="gap-1.5 text-xs md:text-sm">
                  <ClipboardList className="w-3.5 h-3.5" /> Bookings
                </TabsTrigger>
                <TabsTrigger value="ai-tools" className="gap-1.5 text-xs md:text-sm">
                  <Sparkles className="w-3.5 h-3.5" /> AI Tools
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-1.5 text-xs md:text-sm">
                  <SettingsIcon className="w-3.5 h-3.5" /> Settings
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-1.5 text-xs md:text-sm">
                  <Bell className="w-3.5 h-3.5" /> Alerts
                  {unreadAlerts > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">
                      {unreadAlerts}
                    </Badge>
                  )}
                </TabsTrigger>
              </>
            ) : isHealthcare(currentIndustry) ? (
              <>
                <TabsTrigger value="healthcare" className="gap-1.5 text-xs md:text-sm">
                  <Stethoscope className="w-3.5 h-3.5" /> Healthcare
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-1.5 text-xs md:text-sm">
                  <Calendar className="w-3.5 h-3.5" /> Calendar
                </TabsTrigger>
                <TabsTrigger value="bookings" className="gap-1.5 text-xs md:text-sm">
                  <ClipboardList className="w-3.5 h-3.5" /> Bookings
                </TabsTrigger>
                <TabsTrigger value="ai-tools" className="gap-1.5 text-xs md:text-sm">
                  <Sparkles className="w-3.5 h-3.5" /> AI Tools
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-1.5 text-xs md:text-sm">
                  <SettingsIcon className="w-3.5 h-3.5" /> Settings
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-1.5 text-xs md:text-sm">
                  <Bell className="w-3.5 h-3.5" /> Alerts
                  {unreadAlerts > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">
                      {unreadAlerts}
                    </Badge>
                  )}
                </TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="calendar" className="gap-1.5 text-xs md:text-sm">
                  <Calendar className="w-3.5 h-3.5" /> Calendar
                </TabsTrigger>
                <TabsTrigger value="bookings" className="gap-1.5 text-xs md:text-sm">
                  <ClipboardList className="w-3.5 h-3.5" /> {config.bookingLabelPlural}
                </TabsTrigger>
                <TabsTrigger value="resources" className="gap-1.5 text-xs md:text-sm">
                  <Users className="w-3.5 h-3.5" /> {config.resourceLabelPlural}
                </TabsTrigger>
                <TabsTrigger value="ai-schedule" className="gap-1.5 text-xs md:text-sm">
                  <Brain className="w-3.5 h-3.5" /> AI Schedule
                </TabsTrigger>
                <TabsTrigger value="settings" className="gap-1.5 text-xs md:text-sm">
                  <SettingsIcon className="w-3.5 h-3.5" /> Settings
                </TabsTrigger>
                <TabsTrigger value="ai-tools" className="gap-1.5 text-xs md:text-sm">
                  <Sparkles className="w-3.5 h-3.5" /> AI Tools
                </TabsTrigger>
                <TabsTrigger value="pricing" className="gap-1.5 text-xs md:text-sm">
                  <DollarSign className="w-3.5 h-3.5" /> Pricing
                </TabsTrigger>
                <TabsTrigger value="alerts" className="gap-1.5 text-xs md:text-sm">
                  <Bell className="w-3.5 h-3.5" /> Alerts
                  {unreadAlerts > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">
                      {unreadAlerts}
                    </Badge>
                  )}
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Airlines Flights Tab */}
          {isAirlines(currentIndustry) && (
            <TabsContent value="flights">
              <FlightManager config={config} />
            </TabsContent>
          )}

          {/* Car Rental Fleet Tab */}
          {isCarRental(currentIndustry) && (
            <TabsContent value="fleet">
              <VehicleManager config={config} />
            </TabsContent>
          )}

          {/* Education Timetable Tab */}
          {isEducation(currentIndustry) && (
            <TabsContent value="timetable">
              <TimetableManager config={config} />
            </TabsContent>
          )}

          {/* Logistics Tab */}
          {isLogistics(currentIndustry) && (
            <TabsContent value="logistics">
              <LogisticsManager config={config} />
            </TabsContent>
          )}

          {/* Events Tab */}
          {isEvents(currentIndustry) && (
            <TabsContent value="events">
              <EventsManager config={config} />
            </TabsContent>
          )}

          {/* Healthcare Tab */}
          {isHealthcare(currentIndustry) && (
            <TabsContent value="healthcare">
              <HealthcareManager config={config} />
            </TabsContent>
          )}

          <TabsContent value="calendar" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <SmartCalendarView bookings={calendarBookings} config={config} industry={currentIndustry} />
              </div>
              <div className="space-y-4">
                <DoubleBookingGuard config={config} />
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-primary" />
                      Quick Start
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isAirlines(currentIndustry) ? (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                          <p className="text-xs text-muted-foreground">Add flights in the Flights tab</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                          <p className="text-xs text-muted-foreground">Book passenger seats with AI pricing</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                          <p className="text-xs text-muted-foreground">Monitor load factors & revenue in Pricing</p>
                        </div>
                      </>
                    ) : isCarRental(currentIndustry) ? (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                          <p className="text-xs text-muted-foreground">Add vehicles to your fleet</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                          <p className="text-xs text-muted-foreground">Create rental bookings with AI guard</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                          <p className="text-xs text-muted-foreground">Monitor utilization & AI pricing</p>
                        </div>
                      </>
                    ) : isEducation(currentIndustry) ? (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                          <p className="text-xs text-muted-foreground">Add rooms & labs in the Timetable tab</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                          <p className="text-xs text-muted-foreground">Schedule classes with teachers & rooms</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                          <p className="text-xs text-muted-foreground">AI prevents teacher & room conflicts</p>
                        </div>
                      </>
                    ) : isLogistics(currentIndustry) ? (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                          <p className="text-xs text-muted-foreground">Add vehicles & drivers in the Logistics tab</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                          <p className="text-xs text-muted-foreground">Create delivery bookings with time windows</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                          <p className="text-xs text-muted-foreground">AI optimizes routes & prevents conflicts</p>
                        </div>
                      </>
                    ) : isEvents(currentIndustry) ? (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                          <p className="text-xs text-muted-foreground">Create events with venues & capacity in Events tab</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                          <p className="text-xs text-muted-foreground">AI dynamically prices tickets based on demand</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                          <p className="text-xs text-muted-foreground">Track bookings, revenue & capacity in real-time</p>
                        </div>
                      </>
                    ) : isHealthcare(currentIndustry) ? (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                          <p className="text-xs text-muted-foreground">Add doctors & set working hours in Healthcare tab</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                          <p className="text-xs text-muted-foreground">Book appointments — AI prevents double-booking</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                          <p className="text-xs text-muted-foreground">AI predicts no-shows & fills schedule gaps</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
                          <p className="text-xs text-muted-foreground">Add {config.resourceLabelPlural.toLowerCase()} in the Resources tab</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
                          <p className="text-xs text-muted-foreground">Configure schedule in Settings</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
                          <p className="text-xs text-muted-foreground">Use AI Schedule to auto-generate your calendar</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bookings">
            <BookingManager config={config} />
          </TabsContent>

          {!isAirlines(currentIndustry) && !isCarRental(currentIndustry) && !isEducation(currentIndustry) && !isLogistics(currentIndustry) && !isEvents(currentIndustry) && !isHealthcare(currentIndustry) && (
            <TabsContent value="resources">
              <ResourceManager config={config} industry={currentIndustry} />
            </TabsContent>
          )}

          {!isAirlines(currentIndustry) && !isCarRental(currentIndustry) && !isEducation(currentIndustry) && !isLogistics(currentIndustry) && !isEvents(currentIndustry) && !isHealthcare(currentIndustry) && (
            <TabsContent value="ai-schedule">
              <AIAutoSchedule config={config} />
            </TabsContent>
          )}

          <TabsContent value="settings">
            <ScheduleSettingsPanel config={config} />
          </TabsContent>

          <TabsContent value="ai-tools" className="space-y-6">
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl p-4 border border-primary/10 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">AI-Powered Tools</strong> — Automate, predict, and optimize your {config.label.toLowerCase()} operations.
              </p>
            </div>
            <IndustryWidgets config={config} features={features} />
          </TabsContent>

          <TabsContent value="pricing">
            <AutoPricingPanel config={config} industry={currentIndustry} />
          </TabsContent>

          <TabsContent value="alerts">
            <AlertsPanel alerts={alerts.map(a => ({ ...a, timestamp: new Date(a.created_at) }))} onMarkRead={markAlertRead} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
