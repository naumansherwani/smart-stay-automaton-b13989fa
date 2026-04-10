import { useState, useEffect, useRef } from "react";
import { LogOut, BarChart3, Shield, Sparkles, Bell, HelpCircle, Zap, Brain, TrendingUp, Calendar, Settings as SettingsIcon, Users, ClipboardList, DollarSign, Plane, Car, GraduationCap, Truck, Theater, Stethoscope, TrainFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaces } from "@/hooks/useWorkspaces";
import { INDUSTRY_CONFIGS, type IndustryType as IndustryTypeImport } from "@/lib/industryConfig";
import { toast as sonnerToast } from "sonner";

import { useProfile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIndustryConfig, type IndustryType } from "@/lib/industryConfig";
import { getIndustryFeatures, supportsAutoPricing } from "@/lib/industryFeatures";
import IndustrySwitcher from "@/components/dashboard/IndustrySwitcher";
import WorkspaceSwitcher from "@/components/dashboard/WorkspaceSwitcher";
import HowItWorksGuide from "@/components/dashboard/HowItWorksGuide";
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
import { getUserAvatarUrl, getUserDisplayName, getUserInitials } from "@/lib/utils";
import SmartGreetingBanner from "@/components/SmartGreetingBanner";
import UpgradeNudge from "@/components/conversion/UpgradeNudge";
import AppLayout from "@/components/app/AppLayout";

const isAirlines = (industry: IndustryType) => industry === "airlines";
const isCarRental = (industry: IndustryType) => industry === "car_rental";
const isEducation = (industry: IndustryType) => industry === "education";
const isLogistics = (industry: IndustryType) => industry === "logistics";
const isEvents = (industry: IndustryType) => industry === "events_entertainment";
const isHealthcare = (industry: IndustryType) => industry === "healthcare";
const isRailways = (industry: IndustryType) => industry === "railways";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
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
  const displayName = getUserDisplayName(user, profile?.display_name);

  const markAlertRead = async (id: string) => {
    await supabase.from("alerts").update({ read: true }).eq("id", id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  return (
    <AppLayout>
      <div className="container py-6 md:py-8 space-y-6 md:space-y-8">
        <div className="flex items-center gap-3 flex-wrap">
          <IndustrySwitcher current={currentIndustry} onChange={handleIndustryChange} />
          <WorkspaceSwitcher />
        </div>

        <SmartGreetingBanner userName={displayName} />

        <UpgradeNudge variant="card" feature="AI Automation" message="Automation saves time and increases revenue — unlock all features with Pro" />

        <HowItWorksGuide />

        <IndustryKPIs config={config} />

        <Tabs defaultValue={isRailways(currentIndustry) ? "railway" : isAirlines(currentIndustry) ? "flights" : isCarRental(currentIndustry) ? "fleet" : isEducation(currentIndustry) ? "timetable" : isLogistics(currentIndustry) ? "logistics" : isEvents(currentIndustry) ? "events" : isHealthcare(currentIndustry) ? "healthcare" : "calendar"} className="space-y-6">
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
            ) : isRailways(currentIndustry) ? (
              <>
                <TabsTrigger value="railway" className="gap-1.5 text-xs md:text-sm">
                  <TrainFront className="w-3.5 h-3.5" /> Railway
                </TabsTrigger>
                <TabsTrigger value="calendar" className="gap-1.5 text-xs md:text-sm">
                  <Calendar className="w-3.5 h-3.5" /> Schedule
                </TabsTrigger>
                <TabsTrigger value="bookings" className="gap-1.5 text-xs md:text-sm">
                  <ClipboardList className="w-3.5 h-3.5" /> Bookings
                </TabsTrigger>
                <TabsTrigger value="pricing" className="gap-1.5 text-xs md:text-sm">
                  <DollarSign className="w-3.5 h-3.5" /> AI Pricing
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

          {isAirlines(currentIndustry) && (
            <TabsContent value="flights">
              <FlightManager config={config} />
            </TabsContent>
          )}

          {isCarRental(currentIndustry) && (
            <TabsContent value="fleet">
              <VehicleManager config={config} />
            </TabsContent>
          )}

          {isEducation(currentIndustry) && (
            <TabsContent value="timetable">
              <TimetableManager config={config} />
            </TabsContent>
          )}

          {isLogistics(currentIndustry) && (
            <TabsContent value="logistics">
              <LogisticsManager config={config} />
            </TabsContent>
          )}

          {isEvents(currentIndustry) && (
            <TabsContent value="events">
              <EventsManager config={config} />
            </TabsContent>
          )}

          {isHealthcare(currentIndustry) && (
            <TabsContent value="healthcare">
              <HealthcareManager config={config} />
            </TabsContent>
          )}

          {isRailways(currentIndustry) && (
            <TabsContent value="railway" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "🚆 Railway Command Center", desc: "Full train scheduling, routes, coaches, seats, and booking management", href: "/railway", color: "from-[hsl(200,70%,50%)] to-[hsl(220,80%,55%)]" },
                ].map(item => (
                  <Card key={item.title} className="group border-border/50 hover:border-primary/30 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1" onClick={() => navigate(item.href)}>
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4`}>
                        <TrainFront className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-lg text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                      <Button className="mt-4 gap-2" size="sm">
                        Open Command Center <Sparkles className="w-3.5 h-3.5" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
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

          {!isAirlines(currentIndustry) && !isCarRental(currentIndustry) && !isEducation(currentIndustry) && !isLogistics(currentIndustry) && !isEvents(currentIndustry) && !isHealthcare(currentIndustry) && !isRailways(currentIndustry) && (
            <TabsContent value="resources">
              <ResourceManager config={config} industry={currentIndustry} />
            </TabsContent>
          )}

          {!isAirlines(currentIndustry) && !isCarRental(currentIndustry) && !isEducation(currentIndustry) && !isLogistics(currentIndustry) && !isEvents(currentIndustry) && !isHealthcare(currentIndustry) && !isRailways(currentIndustry) && (
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
      </div>
    </AppLayout>
  );
};

export default Dashboard;
