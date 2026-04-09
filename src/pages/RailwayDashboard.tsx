import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrainFront, Route, Calendar, LayoutGrid, Ticket, DollarSign, Bell, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import RailwayTrainsTab from "@/components/railway/RailwayTrainsTab";
import RailwayRoutesTab from "@/components/railway/RailwayRoutesTab";
import RailwayScheduleTab from "@/components/railway/RailwayScheduleTab";
import RailwayCoachesTab from "@/components/railway/RailwayCoachesTab";
import RailwayBookingsTab from "@/components/railway/RailwayBookingsTab";
import RailwayPricingTab from "@/components/railway/RailwayPricingTab";
import RailwayNotificationsTab from "@/components/railway/RailwayNotificationsTab";
import RailwayStatsCards from "@/components/railway/RailwayStatsCards";

const TABS = [
  { id: "trains", label: "Trains", icon: TrainFront },
  { id: "routes", label: "Routes", icon: Route },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "coaches", label: "Coaches & Seats", icon: LayoutGrid },
  { id: "bookings", label: "Bookings", icon: Ticket },
  { id: "pricing", label: "AI Pricing", icon: DollarSign },
  { id: "notifications", label: "Alerts", icon: Bell },
];

const RailwayDashboard = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("trains");

  if (loading) return <div className="min-h-screen flex items-center justify-center"><TrainFront className="w-8 h-8 animate-pulse text-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(200,70%,50%)] to-[hsl(220,80%,55%)] flex items-center justify-center">
                <TrainFront className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Railway Command Center</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Train Scheduling & Booking</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                AI Active
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        <RailwayStatsCards />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card/80 border border-border/50 p-1 h-auto flex-wrap gap-1">
            {TABS.map(tab => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-2 px-4 py-2.5 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="trains"><RailwayTrainsTab /></TabsContent>
          <TabsContent value="routes"><RailwayRoutesTab /></TabsContent>
          <TabsContent value="schedule"><RailwayScheduleTab /></TabsContent>
          <TabsContent value="coaches"><RailwayCoachesTab /></TabsContent>
          <TabsContent value="bookings"><RailwayBookingsTab /></TabsContent>
          <TabsContent value="pricing"><RailwayPricingTab /></TabsContent>
          <TabsContent value="notifications"><RailwayNotificationsTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RailwayDashboard;
