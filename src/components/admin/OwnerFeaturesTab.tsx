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
    "Fleet Intelligence & Health Monitoring",
    "AI Disruption Monitor & Resolve",
    "AI Email Composer for Passenger Apologies",
    "Compensation Calculator (delay-based tiers)",
    "Refund/Voucher Toggle with Simulated Payout",
    "Sentiment Score Auto-Update",
    "Voice Commands (ElevenLabs) for Fleet",
    "AI Maintenance Prediction",
    "AI Double Booking Guard (Auto-Reassign Gate/Aircraft, Auto-Reschedule + AI Email)",
    "AI Ticket Generator — Boarding Pass with QR Code (Dashboard)",
    "AI Ticket Email — Auto-sends ticket to passenger on booking confirm",
    "🤖 AI Smart Pricing (Lovable AI) — Season + Demand + Route-aware",
    "🔔 Auto Price Alerts — AI notifies when price should increase/decrease",
    "Breadcrumbs Navigation",
    "Global Search (Flight/Passenger)",
    "Real-time Live Sync Indicator",
    "Revenue & Auto-Pricing Charts",
    "Passenger Satisfaction Gauges",
    "Custom AI Training (Premium)",
  ]},
  { industry: "Travel, Tourism & Hospitality", icon: Hotel, color: "#0d9488", features: [
    "Smart Booking Calendar",
    "Gap Night Filler",
    "Guest Score Card / Traveler Score Card",
    "AI Double Booking Guard (Auto-Reassign Room/Tour, Auto-Reschedule + AI Email)",
    "🤖 AI Smart Pricing (Lovable AI) — Season + Demand + Competitor-aware",
    "🔔 Auto Price Alerts — AI notifies when price should increase/decrease (>15% change)",
    "Auto Pricing Panel with Manual Override",
    "Smart Pricing Card — 7-day AI suggestions",
    "Competitor Radar with AI Price Comparison",
    "Custom AI Training (Premium)",
    "── Sub-type: Hotel & Property ──",
    "👑 Owner — Full access (CRM, AI Pricing, Billing, Settings, Analytics)",
    "📋 Manager — Full access minus billing/payment settings",
    "🏢 Floor Manager — Full operational (Bookings, Rooms, Staff, Calendar, CRM)",
    "🖥️ Front Desk — Full operational (Bookings, Check-in/out, Guests, Housekeeping mgmt)",
    "🧹 Housekeeping — No direct access (Front Desk assigns tasks)",
    "── Sub-type: Travel & Tours ──",
    "👑 Owner/Tour Operator — Full access (Tours, Pricing, CRM, Billing, Analytics)",
    "📋 Manager — Full access minus billing/payment settings",
    "✈️ Travel Agent — Bookings, Customers, Itineraries, CRM contacts",
    "🗺️ Tour Guide — Assigned tours only, schedule, traveler info",
    "🚐 Transport Coordinator — No direct access (Manager assigns)",
  ]},
  { industry: "Car Rental", icon: Car, color: "#0ea5e9", features: [
    "Vehicle Manager",
    "Fleet Tracking Widgets",
    "AI Double Booking Guard (Auto-Reassign Vehicle, Auto-Reschedule + AI Email)",
    "🤖 AI Smart Pricing (Lovable AI) — Season + Demand + Fleet-aware",
    "Custom AI Training (Premium)",
  ]},
  { industry: "Healthcare", icon: Stethoscope, color: "#ef4444", features: [
    "Healthcare Manager",
    "Patient Booking Widgets",
    "AI Double Booking Guard (Auto-Reassign Doctor/Room, Auto-Reschedule + AI Email)",
    "Custom AI Training (Premium)",
  ]},
  { industry: "Education", icon: GraduationCap, color: "#8b5cf6", features: [
    "Timetable Manager",
    "Education Widgets",
    "AI Double Booking Guard (Auto-Reassign Classroom/Lab, Auto-Reschedule + AI Email)",
    "Custom AI Training (Premium)",
  ]},
  { industry: "Logistics", icon: Truck, color: "#f97316", features: [
    "Logistics Manager",
    "Shipment Tracking Widgets",
    "AI Double Booking Guard (Auto-Reassign Vehicle/Driver, Auto-Reschedule + AI Email)",
    "Custom AI Training (Premium)",
  ]},
  { industry: "Events", icon: Theater, color: "#d946ef", features: [
    "Events Manager",
    "Venue & Ticket Widgets",
    "AI Double Booking Guard (Auto-Reassign Venue/Hall, Auto-Reschedule + AI Email)",
    "🤖 AI Smart Pricing (Lovable AI) — Event Demand + Capacity-aware",
    "AI Ticket Generator — Event Ticket with QR Code (Dashboard)",
    "AI Ticket Email — Auto-sends ticket to attendee on booking confirm",
    "Custom AI Training (Premium)",
  ]},
  { industry: "Railway", icon: Train, color: "#f59e0b", features: [
    "Train & Coach Manager",
    "Route & Schedule Manager",
    "🤖 AI Smart Pricing (Lovable AI) — Route + Demand + Peak Hour-aware",
    "Booking & Passenger Management",
    "Railway Notifications System",
    "AI Double Booking Guard (Auto-Reassign Coach/Platform, Auto-Reschedule + AI Email)",
    "AI Ticket Generator — Train Ticket with QR Code (Dashboard)",
    "AI Ticket Email — Auto-sends ticket to passenger on booking confirm",
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
