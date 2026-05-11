import type { IndustryType } from "@/lib/industryConfig";

/**
 * Per-industry advisor configuration.
 *
 * IMPORTANT: Industry isolation rule — each industry has its OWN config.
 * No industry-mixing. Hospitality is fully populated below. Other industries
 * use the same engine but currently have empty extras; they will be filled
 * out industry-by-industry per owner direction.
 */

export type ToolPanel = {
  id: string;
  label: string;
  icon: string; // lucide icon name
  prompt: string; // prefilled into the input draft
};

export type MetricBadge = {
  id: string;
  label: string; // e.g. "Occupancy"
  /** Replit GET path returning { value: string|number, delta?: number, unit?: string } */
  endpoint: string;
  /** Display unit shown after the value, e.g. "%", "USD" */
  unit?: string;
};

export type ChannelChip = {
  id: string;
  label: string;
  /** Static asset URL or remote logo */
  iconUrl?: string;
  /** lucide fallback icon name */
  icon?: string;
};

export type AdvisorConfig = {
  industry: IndustryType;
  name: string;
  designation: string;
  vibe: string;
  /** Tailwind gradient fragment for header accent + minimized pill */
  accent: string;
  /** CSS variable color used for the animated aura ring (HSL string) */
  auraHsl: string;
  /** Placeholder shown in the input box */
  placeholder: string;
  /** Starter prompts shown in the empty state */
  starterPrompts: string[];
  /** Industry-specific tool buttons rendered above the input */
  toolPanels: ToolPanel[];
  /** Live metric badges fetched from Replit and shown under the header */
  metricBadges: MetricBadge[];
  /** Channel chips shown under the header (e.g. Booking.com, Airbnb) */
  channels: ChannelChip[];
  /** Use monospaced typography for an operational/cockpit feel */
  mono?: boolean;
  /** Short title appended to the header (e.g. "Revenue Director") */
  shortTitle?: string;
  /** Render a gold "Sovereign" crown chip next to the advisor name */
  sovereignBadge?: boolean;
  /** Tool event label rendering style. Default = icon + sentence. */
  toolBadgeStyle?: "uppercase-code";
  /** Optional radar micro-map (airlines/railways/logistics) */
  radar?: {
    endpoint: string; // Replit GET → { dots:[{id,x,y,status,label?}], weather?:[{x,y,kind}] }
    title?: string;
  };
};

export const ADVISORS: Record<IndustryType, AdvisorConfig> = {
  hospitality: {
    industry: "hospitality",
    name: "Aria",
    designation:
      "AI Advisor & Executive Revenue & Operations Director — Travel, Tourism & Hospitality Division",
    vibe: "Warm, welcoming host. Makes every guest feel valued.",
    accent: "from-[#f5d4a1]/35 via-[#f4c2d7]/25 to-[#fce7d4]/10",
    auraHsl: "32 75% 68%",
    shortTitle: "Revenue Director",
    sovereignBadge: true,
    toolBadgeStyle: "uppercase-code",
    placeholder: "How can I enhance your revenue today, Sir?",
    starterPrompts: [
      "What's my occupancy trend for the next 14 days?",
      "Suggest pricing adjustments to maximise RevPAR this weekend.",
      "Draft a polite follow-up for guests who haven't checked in yet.",
      "Are there any booking conflicts I should know about?",
    ],
    toolPanels: [
      { id: "revenue", label: "Revenue Optimization", icon: "TrendingUp", prompt: "Run a full revenue optimization review for the next 30 days and recommend the top 3 actions." },
      { id: "pricing", label: "Pricing Recommendations", icon: "DollarSign", prompt: "Recommend nightly rate adjustments for the next 14 days based on demand, comp set and seasonality." },
      { id: "guest_comm", label: "Guest Communication", icon: "MessageSquare", prompt: "Draft a personalised pre-arrival message for guests checking in tomorrow." },
      { id: "review_response", label: "Review Response", icon: "Star", prompt: "Help me respond to my latest guest reviews professionally and on-brand." },
      { id: "conflicts", label: "Booking Conflict Resolution", icon: "AlertTriangle", prompt: "Find and resolve any double-bookings or scheduling conflicts in my calendar." },
      { id: "forecast", label: "Forecasting", icon: "LineChart", prompt: "Give me a 30-day forecast for occupancy, ADR and RevPAR with key risks." },
      { id: "upsell", label: "Upsell Opportunities", icon: "Gift", prompt: "Identify the top upsell opportunities for current and upcoming reservations." },
    ],
    metricBadges: [
      { id: "occupancy", label: "Occupancy", endpoint: "/metrics/hospitality/occupancy", unit: "%" },
      { id: "adr", label: "ADR", endpoint: "/metrics/hospitality/adr", unit: "" },
      { id: "revpar", label: "RevPAR", endpoint: "/metrics/hospitality/revpar", unit: "" },
    ],
    channels: [
      { id: "booking", label: "Booking.com", iconUrl: "https://cf.bstatic.com/static/img/favicon.ico" },
      { id: "airbnb", label: "Airbnb", iconUrl: "https://a0.muscache.com/airbnb/static/icons/apple-touch-icon-180x180.png" },
    ],
  },
  airlines: {
    industry: "airlines",
    name: "Captain Orion",
    designation:
      "Flight Operations Director — Airlines & Aviation Division",
    vibe: "Calm, authoritative. Inspires confidence like a senior pilot.",
    accent: "from-[#0a1628]/80 via-[#0ea5e9]/15 to-[#84cc16]/10",
    auraHsl: "190 95% 55%",
    mono: true,
    placeholder: "Awaiting flight parameters, Commander.",
    starterPrompts: [
      "Improve load factor on underperforming routes",
      "Reduce delay-related costs",
      "Optimize ancillary revenue",
      "Analyze route profitability",
      "Draft disruption communication",
    ],
    toolPanels: [
      { id: "route_profit", label: "Route Profitability", icon: "TrendingUp", prompt: "Analyze route profitability for the past 30 days and rank top/bottom 5 routes." },
      { id: "schedule_opt", label: "Schedule Optimization", icon: "CalendarClock", prompt: "Recommend schedule changes to improve connections and aircraft utilization." },
      { id: "fleet_util", label: "Fleet Utilization", icon: "Plane", prompt: "Show current fleet utilization by tail number and flag underutilized aircraft." },
      { id: "delay_cost", label: "Delay Cost Analysis", icon: "Timer", prompt: "Break down delay-related costs by root cause for the last 14 days." },
      { id: "compliance", label: "Compliance Monitoring", icon: "ShieldCheck", prompt: "Run a compliance check across crew duty hours, MEL items and certifications." },
      { id: "disruption", label: "Disruption Recovery", icon: "AlertTriangle", prompt: "Draft a disruption recovery plan for currently delayed/cancelled flights." },
      { id: "fuel", label: "Fuel Efficiency", icon: "Fuel", prompt: "Identify the top fuel-saving opportunities across the active network." },
      { id: "ancillary", label: "Ancillary Revenue", icon: "Gift", prompt: "Recommend ancillary revenue optimizations (bags, seats, upgrades) for the next 30 days." },
    ],
    metricBadges: [
      { id: "load_factor", label: "Load Factor", endpoint: "/metrics/airlines/load_factor", unit: "%" },
      { id: "yield", label: "Yield", endpoint: "/metrics/airlines/yield", unit: "" },
      { id: "rask", label: "RASK", endpoint: "/metrics/airlines/rask", unit: "" },
      { id: "cask", label: "CASK", endpoint: "/metrics/airlines/cask", unit: "" },
      { id: "otp", label: "OTP", endpoint: "/metrics/airlines/otp", unit: "%" },
      { id: "delay_min", label: "Delay Min", endpoint: "/metrics/airlines/delay_minutes", unit: "" },
      { id: "cancel_rate", label: "Cancel %", endpoint: "/metrics/airlines/cancellation_rate", unit: "%" },
      { id: "ancillary_rev", label: "Ancillary", endpoint: "/metrics/airlines/ancillary_revenue", unit: "" },
    ],
    channels: [],
    radar: {
      endpoint: "/metrics/airlines/radar",
      title: "Live Network Radar",
    },
  },
  car_rental: {
    industry: "car_rental",
    name: "Rex",
    designation:
      "AI Advisor & AI Fleet Revenue & Operations Director — Car Rental Division",
    vibe: "Confident, road-ready. Direct and gets things done fast.",
    accent: "from-orange-400/30 via-zinc-400/15 to-transparent",
    auraHsl: "20 91% 55%",
    placeholder: "What's the next move for the fleet, Boss?",
    starterPrompts: [],
    toolPanels: [],
    metricBadges: [],
    channels: [],
  },
  healthcare: {
    industry: "healthcare",
    name: "Dr. Lyra",
    designation:
      "AI Advisor & AI Clinical Operations & Patient Experience Director — Healthcare & Clinics Division",
    vibe: "Caring, professional. Patient-first approach, precise.",
    accent: "from-emerald-400/30 via-cyan-300/15 to-transparent",
    auraHsl: "158 64% 52%",
    placeholder: "How may I support your clinic today, Doctor?",
    starterPrompts: [],
    toolPanels: [],
    metricBadges: [],
    channels: [],
  },
  education: {
    industry: "education",
    name: "Professor Sage",
    designation:
      "Chief Academic Intelligence & Growth Director — Education & Training Division",
    vibe: "Patient, knowledgeable. Explains clearly, never condescending.",
    accent: "from-indigo-400/30 via-violet-300/15 to-transparent",
    auraHsl: "239 84% 67%",
    placeholder: "What shall we work on today, Professor?",
    starterPrompts: [],
    toolPanels: [],
    metricBadges: [],
    channels: [],
  },
  logistics: {
    industry: "logistics",
    name: "Atlas",
    designation:
      "Global Supply Chain Commander & Fleet Sovereign — Logistics & Mobility Division",
    vibe: "Reliable, no-nonsense, operationally precise, calm under pressure.",
    accent: "from-slate-500/30 via-orange-400/15 to-sky-400/10",
    auraHsl: "24 95% 55%",
    placeholder: "Route status: Ready for optimization.",
    starterPrompts: [
      "Optimize my delivery routes.",
      "Reduce fuel costs across the fleet.",
      "Improve on-time delivery performance.",
      "Analyze fleet utilization.",
      "Identify bottlenecks in my supply chain.",
      "Reduce empty miles.",
      "Improve warehouse throughput.",
      "Draft a customer delay notification.",
    ],
    toolPanels: [
      { id: "route_opt", label: "Route Optimization", icon: "Map", prompt: "Optimize today's delivery routes to minimize miles, fuel and SLA risk." },
      { id: "fleet_util", label: "Fleet Utilization Analysis", icon: "Truck", prompt: "Analyze current fleet utilization and flag underused or overloaded vehicles." },
      { id: "fuel", label: "Fuel Efficiency Insights", icon: "Fuel", prompt: "Show the top fuel-saving opportunities across the fleet for the last 30 days." },
      { id: "delivery_perf", label: "Delivery Performance Analysis", icon: "PackageCheck", prompt: "Break down on-time delivery performance by route, driver and customer." },
      { id: "bottlenecks", label: "Supply Chain Bottleneck Detection", icon: "AlertTriangle", prompt: "Detect current bottlenecks across pickup, line-haul, warehouse and last-mile." },
      { id: "warehouse", label: "Warehouse Throughput Review", icon: "Warehouse", prompt: "Review warehouse throughput and recommend the top 3 actions to lift it." },
      { id: "driver", label: "Driver Productivity Analysis", icon: "User", prompt: "Analyze driver productivity and safety scores; rank top and bottom performers." },
      { id: "customer_comm", label: "Customer Delay Communication", icon: "MessageSquare", prompt: "Draft customer-facing delay notifications for at-risk shipments today." },
    ],
    metricBadges: [
      { id: "otd", label: "On-Time Delivery", endpoint: "/metrics/logistics/on_time_delivery", unit: "%" },
      { id: "fleet_util", label: "Fleet Utilization", endpoint: "/metrics/logistics/fleet_utilization", unit: "%" },
      { id: "fuel_per_mile", label: "Fuel / Mile", endpoint: "/metrics/logistics/fuel_cost_per_mile", unit: "" },
      { id: "empty_miles", label: "Empty Miles", endpoint: "/metrics/logistics/empty_miles", unit: "%" },
      { id: "delivery_cost", label: "Delivery Cost", endpoint: "/metrics/logistics/delivery_cost", unit: "" },
      { id: "avg_delay", label: "Avg Delay", endpoint: "/metrics/logistics/average_delay", unit: "min" },
      { id: "in_transit", label: "In Transit", endpoint: "/metrics/logistics/orders_in_transit", unit: "" },
      { id: "wh_throughput", label: "WH Throughput", endpoint: "/metrics/logistics/warehouse_throughput", unit: "" },
    ],
    channels: [
      { id: "gps", label: "GPS", icon: "Navigation" },
      { id: "telematics", label: "Telematics", icon: "Activity" },
      { id: "tms", label: "TMS", icon: "Truck" },
      { id: "wms", label: "WMS", icon: "Warehouse" },
      { id: "erp", label: "ERP", icon: "Database" },
      { id: "whatsapp", label: "WhatsApp", icon: "MessageCircle" },
      { id: "email", label: "Email", icon: "Mail" },
    ],
    radar: {
      endpoint: "/metrics/logistics/radar",
      title: "Live Fleet Map",
    },
  },
  events_entertainment: {
    industry: "events_entertainment",
    name: "Vega",
    designation:
      "Chief Experience Architect & Global Production Sovereign — Events & Entertainment Division",
    vibe: "Energetic, charismatic. Makes every event feel like a headline show.",
    accent: "from-fuchsia-400/30 via-pink-300/15 to-transparent",
    auraHsl: "292 84% 61%",
    placeholder: "Let's make this show legendary — what's first?",
    starterPrompts: [],
    toolPanels: [],
    metricBadges: [],
    channels: [],
  },
  railways: {
    industry: "railways",
    name: "Conductor Kai",
    designation:
      "Chief Kinetic Officer & Global Rail Sovereign — Railways & Transit Infrastructure Division",
    vibe: "Steady, dependable. Every journey on track, no exceptions.",
    accent: "from-teal-400/30 via-emerald-300/15 to-transparent",
    auraHsl: "172 66% 50%",
    placeholder: "All aboard — what's the next stop?",
    starterPrompts: [],
    toolPanels: [],
    metricBadges: [],
    channels: [],
  },
};

export function getAdvisor(industry?: string | null): AdvisorConfig {
  const key = (industry || "hospitality") as IndustryType;
  return ADVISORS[key] || ADVISORS.hospitality;
}
