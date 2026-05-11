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
};

export const ADVISORS: Record<IndustryType, AdvisorConfig> = {
  hospitality: {
    industry: "hospitality",
    name: "Aria",
    designation:
      "AI Advisor & Executive Revenue & Operations Director — Travel, Tourism & Hospitality Division",
    vibe: "Warm, welcoming host. Makes every guest feel valued.",
    accent: "from-amber-400/30 via-rose-400/20 to-transparent",
    auraHsl: "32 95% 60%",
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
      "AI Advisor & AI Flight Operations & Compliance Director — Airlines & Aviation Division",
    vibe: "Calm, authoritative. Inspires confidence like a senior pilot.",
    accent: "from-sky-400/30 via-amber-300/15 to-transparent",
    auraHsl: "204 89% 60%",
    placeholder: "Ready for pre-flight briefing, Sir.",
    starterPrompts: [],
    toolPanels: [],
    metricBadges: [],
    channels: [],
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
      "Global Supply-Chain Commander & Fleet Sovereign — Logistics & Mobility Infrastructure Division",
    vibe: "Reliable, no-nonsense. Precision and efficiency above all.",
    accent: "from-slate-400/30 via-blue-300/15 to-transparent",
    auraHsl: "215 25% 55%",
    placeholder: "Awaiting your orders, Commander.",
    starterPrompts: [],
    toolPanels: [],
    metricBadges: [],
    channels: [],
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
