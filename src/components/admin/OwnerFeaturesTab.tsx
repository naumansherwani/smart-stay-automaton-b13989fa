import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Plane, Car, Stethoscope, GraduationCap, Truck, Theater, Hotel, Train } from "lucide-react";

interface OwnerFeaturesTabProps {
  featureUsage: any[];
  workspaces: any[];
  showSecret: boolean;
}

const PLATFORM_FEATURES = [
  { industry: "Airlines", icon: Plane, color: "#3b82f6", features: [
    "── Dashboard (Operations) ──",
    "Fleet Intelligence & Health Monitoring",
    "AI Disruption Monitor & Resolve",
    "Flight Manager — Flights, routes, schedules",
    "Airline Ops Dashboard — Real-time flight status & crew",
    "AI Double Booking Guard (Auto-Reassign Gate/Aircraft, Auto-Reschedule + AI Email)",
    "🤖 AI Smart Pricing (Lovable AI) — Season + Demand + Route-aware",
    "🔔 Auto Price Alerts — AI notifies when price should increase/decrease",
    "AI Ticket Generator — Boarding Pass with QR Code",
    "AI Ticket Email — Auto-sends ticket to passenger on booking confirm",
    "Revenue & Auto-Pricing Charts",
    "── CRM (Premium Only) ──",
    "Passenger CRM — Contacts, Complaints, Route Deals",
    "AI Insights — Delay compensation, rebooking AI, loyalty scoring",
    "CRM Tools: Smart Tasks, Daily Planner, Google Sync, AI Scheduling, AI Pricing, Capacity, Route Optimizer",
    "AI Email Composer for Passenger Apologies",
    "Sentiment Score, Competitor Intelligence",
    "Custom AI Training (Premium)",
  ]},
  { industry: "Travel, Tourism & Hospitality", icon: Hotel, color: "#0d9488", features: [
    "── Dashboard (Operations) ──",
    "Smart Booking Calendar",
    "Gap Night Filler",
    "Guest Score Card / Traveler Score Card",
    "AI Double Booking Guard (Auto-Reassign Room/Tour, Auto-Reschedule + AI Email)",
    "🤖 AI Smart Pricing (Lovable AI) — Season + Demand + Competitor-aware",
    "🔔 Auto Price Alerts — AI notifies when price should increase/decrease",
    "Auto Pricing Panel with Manual Override",
    "Smart Pricing Card — 7-day AI suggestions",
    "Competitor Radar with AI Price Comparison",
    "── CRM (Premium Only) ──",
    "Guest/Traveler CRM — Contacts, Requests, Booking Deals",
    "AI Insights — Guest scoring, review sentiment, upsell, churn prediction",
    "CRM Tools: Smart Tasks, Daily Planner, Google Sync, AI Calendar, AI Pricing, Manual Booking, Resource Mgr",
    "Custom AI Training (Premium)",
    "── Sub-type: Hotel & Property ──",
    "👑 Owner — Full access | 📋 Manager — Full minus billing",
    "🏢 Floor Manager — Operations | 🖥️ Front Desk — Check-in/out | 🧹 Housekeeping",
    "── Sub-type: Travel & Tours ──",
    "👑 Tour Operator — Full access | 📋 Manager — Full minus billing",
    "✈️ Travel Agent — Bookings/CRM | 🗺️ Tour Guide — Assigned tours | 🚐 Transport Coord",
  ]},
  { industry: "Car Rental", icon: Car, color: "#0ea5e9", features: [
    "── Dashboard (Operations) ──",
    "Vehicle Manager — Fleet tracking & management",
    "Fleet Tracking Widgets",
    "AI Double Booking Guard (Auto-Reassign Vehicle, Auto-Reschedule + AI Email)",
    "🤖 AI Smart Pricing (Lovable AI) — Season + Demand + Fleet-aware",
    "🔔 Auto Price Alerts — AI notifies when price should increase/decrease",
    "── CRM (Premium Only) ──",
    "Renter CRM — Contacts, Claims, Fleet Deals",
    "AI Insights — Damage assessment, fleet pricing, utilization forecast",
    "CRM Tools: Smart Tasks, Daily Planner, Google Sync, AI Pricing, Fleet Mgr, Manual Booking, Capacity",
    "Custom AI Training (Premium)",
  ]},
  { industry: "Healthcare", icon: Stethoscope, color: "#ef4444", features: [
    "── Dashboard (Operations) ──",
    "Healthcare Manager — Appointments, patients, staff",
    "Patient Booking Widgets",
    "AI Double Booking Guard (Auto-Reassign Doctor/Room, Auto-Reschedule + AI Email)",
    "⛔ NO AI Pricing (not applicable)",
    "── CRM (Premium Only) ──",
    "Patient CRM — Contacts, Cases, Treatment Plans",
    "AI Insights — No-show prediction, appointment optimization, satisfaction",
    "CRM Tools: Smart Tasks, Daily Planner, Google Sync, AI Scheduling, Manual Booking, Resource Mgr",
    "Custom AI Training (Premium)",
  ]},
  { industry: "Education", icon: GraduationCap, color: "#8b5cf6", features: [
    "── Dashboard (Operations) ──",
    "Timetable Manager — Class schedules",
    "Education Widgets",
    "AI Double Booking Guard (Auto-Reassign Classroom/Lab, Auto-Reschedule + AI Email)",
    "⛔ NO AI Pricing (not applicable)",
    "── CRM (Premium Only) ──",
    "Student CRM — Contacts, Support Requests, Enrollments",
    "AI Insights — Dropout prediction, engagement scoring, course recommendations",
    "CRM Tools: Smart Tasks, Daily Planner, Google Sync, AI Scheduling, Manual Booking, Capacity, Resource Mgr",
    "Custom AI Training (Premium)",
  ]},
  { industry: "Logistics", icon: Truck, color: "#f97316", features: [
    "── Dashboard (Operations) ──",
    "Logistics Manager — Shipments, warehouses, routes",
    "Shipment Tracking Widgets",
    "AI Double Booking Guard (Auto-Reassign Vehicle/Driver, Auto-Reschedule + AI Email)",
    "⛔ NO AI Pricing (not applicable)",
    "── CRM (Premium Only) ──",
    "Client CRM — Contacts, Shipment Issues, Contracts",
    "AI Insights — ETA prediction, route optimization, capacity forecast, SLA monitoring",
    "CRM Tools: Smart Tasks, Daily Planner, Google Sync, Route Optimizer, Capacity, Fleet Mgr, AI Scheduling",
    "Custom AI Training (Premium)",
  ]},
  { industry: "Events", icon: Theater, color: "#d946ef", features: [
    "── Dashboard (Operations) ──",
    "Events Manager — Events, venues, tickets",
    "Venue & Ticket Widgets",
    "AI Double Booking Guard (Auto-Reassign Venue/Hall, Auto-Reschedule + AI Email)",
    "🤖 AI Smart Pricing (Lovable AI) — Event Demand + Capacity-aware",
    "🔔 Auto Price Alerts — AI notifies when price should increase/decrease",
    "AI Ticket Generator — Event Ticket with QR Code",
    "AI Ticket Email — Auto-sends ticket to attendee on booking confirm",
    "── CRM (Premium Only) ──",
    "Organizer CRM — Contacts, Event Issues, Sponsorships",
    "AI Insights — Attendee prediction, vendor matching, pricing optimization",
    "CRM Tools: Smart Tasks, Daily Planner, Google Sync, AI Calendar, AI Pricing, Manual Booking, Capacity",
    "Custom AI Training (Premium)",
  ]},
  { industry: "Railway", icon: Train, color: "#f59e0b", features: [
    "── Dashboard (Operations) ──",
    "Train & Coach Manager — Manage trains, coaches, seats",
    "Route & Schedule Manager — Create routes with stops, manage schedules",
    "Booking & Passenger Management — Seat selection, booking references",
    "🤖 AI Smart Pricing (Lovable AI) — Route + Demand + Peak Hour-aware",
    "🔔 Auto Price Alerts — AI notifies when price should increase/decrease",
    "Railway Pricing Overrides — Manual price control per route/class",
    "Railway Notifications System — Delays, cancellations, updates",
    "AI Double Booking Guard (Auto-Reassign Coach/Platform, Auto-Reschedule + AI Email)",
    "AI Ticket Generator — Train Ticket with QR Code",
    "AI Ticket Email — Auto-sends ticket to passenger on booking confirm",
    "Railway Stats Cards — KPIs overview",
    "── CRM (Premium Only) ──",
    "Passenger CRM — Contacts, Service Issues, Route Deals",
    "AI Insights — Delay compensation, demand forecasting, route optimization",
    "CRM Tools: Smart Tasks, Daily Planner, Google Sync, AI Scheduling, AI Pricing, Route Optimizer, Capacity",
    "Custom AI Training (Premium)",
  ]},
];

const OwnerFeaturesTab = ({ featureUsage, workspaces, showSecret }: OwnerFeaturesTabProps) => (
  <div className="space-y-4">
    {/* Platform Features Map */}
    <Card>
      <CardHeader><CardTitle className="text-sm">Platform Features Map (All Industries)</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLATFORM_FEATURES.map((ind) => (
            <div key={ind.industry} className="p-3 rounded-xl border border-border space-y-2">
              <div className="flex items-center gap-2">
                <ind.icon className="w-4 h-4" style={{ color: ind.color }} />
                <span className="text-xs font-bold text-foreground">{ind.industry}</span>
                <Badge variant="outline" className="text-[9px] ml-auto">{ind.features.length}</Badge>
              </div>
              <div className="space-y-1">
                {ind.features.map((f) => (
                  <div key={f} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-[hsl(160,60%,45%)]" />
                    <span className="text-[10px] text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Feature Usage */}
    <Card>
      <CardHeader><CardTitle className="text-sm">Feature Usage Tracking</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 font-medium">Feature</th>
                <th className="pb-2 font-medium">Usage Count</th>
                <th className="pb-2 font-medium">Last Used</th>
              </tr>
            </thead>
            <tbody>
              {featureUsage.map((f) => (
                <tr key={f.id} className="border-b border-border/50">
                  <td className="py-2 text-foreground capitalize">{f.feature_key?.replace(/_/g, " ")}</td>
                  <td className="py-2 font-medium text-primary">{showSecret ? f.usage_count : "•••"}</td>
                  <td className="py-2 text-muted-foreground text-xs">
                    {f.last_used_at ? new Date(f.last_used_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
              {featureUsage.length === 0 && (
                <tr><td colSpan={3} className="py-6 text-center text-muted-foreground">No feature usage data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    {/* Workspaces */}
    <Card>
      <CardHeader><CardTitle className="text-sm">All Workspaces</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Industry</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((w) => (
                <tr key={w.id} className="border-b border-border/50">
                  <td className="py-2 text-foreground">{showSecret ? w.name : "•••"}</td>
                  <td className="py-2">
                    <Badge variant="outline" className="text-xs capitalize">{w.industry?.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="py-2">
                    <Badge variant={w.is_active ? "default" : "secondary"} className="text-xs">
                      {w.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="py-2 text-muted-foreground text-xs">
                    {new Date(w.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {workspaces.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No workspaces yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default OwnerFeaturesTab;
