import type { IndustryType } from "@/lib/industryConfig";

export type AdvisorConfig = {
  industry: IndustryType;
  name: string;
  designation: string;
  vibe: string;
  accent: string; // tailwind gradient class fragment
};

export const ADVISORS: Record<IndustryType, AdvisorConfig> = {
  hospitality: {
    industry: "hospitality",
    name: "Aria",
    designation:
      "AI Advisor & Executive Revenue & Operations Director — Travel, Tourism & Hospitality Division",
    vibe: "Warm, welcoming host. Makes every guest feel valued.",
    accent: "from-amber-400/30 via-rose-400/20 to-transparent",
  },
  airlines: {
    industry: "airlines",
    name: "Captain Orion",
    designation:
      "AI Advisor & AI Flight Operations & Compliance Director — Airlines & Aviation Division",
    vibe: "Calm, authoritative. Inspires confidence like a senior pilot.",
    accent: "from-sky-400/30 via-amber-300/15 to-transparent",
  },
  car_rental: {
    industry: "car_rental",
    name: "Rex",
    designation:
      "AI Advisor & AI Fleet Revenue & Operations Director — Car Rental Division",
    vibe: "Confident, road-ready. Direct and gets things done fast.",
    accent: "from-orange-400/30 via-zinc-400/15 to-transparent",
  },
  healthcare: {
    industry: "healthcare",
    name: "Dr. Lyra",
    designation:
      "AI Advisor & AI Clinical Operations & Patient Experience Director — Healthcare & Clinics Division",
    vibe: "Caring, professional. Patient-first approach, precise.",
    accent: "from-emerald-400/30 via-cyan-300/15 to-transparent",
  },
  education: {
    industry: "education",
    name: "Professor Sage",
    designation:
      "Chief Academic Intelligence & Growth Director — Education & Training Division",
    vibe: "Patient, knowledgeable. Explains clearly, never condescending.",
    accent: "from-indigo-400/30 via-violet-300/15 to-transparent",
  },
  logistics: {
    industry: "logistics",
    name: "Atlas",
    designation:
      "Global Supply-Chain Commander & Fleet Sovereign — Logistics & Mobility Infrastructure Division",
    vibe: "Reliable, no-nonsense. Precision and efficiency above all.",
    accent: "from-slate-400/30 via-blue-300/15 to-transparent",
  },
  events_entertainment: {
    industry: "events_entertainment",
    name: "Vega",
    designation:
      "Chief Experience Architect & Global Production Sovereign — Events & Entertainment Division",
    vibe: "Energetic, charismatic. Makes every event feel like a headline show.",
    accent: "from-fuchsia-400/30 via-pink-300/15 to-transparent",
  },
  railways: {
    industry: "railways",
    name: "Conductor Kai",
    designation:
      "Chief Kinetic Officer & Global Rail Sovereign — Railways & Transit Infrastructure Division",
    vibe: "Steady, dependable. Every journey on track, no exceptions.",
    accent: "from-teal-400/30 via-emerald-300/15 to-transparent",
  },
};

export function getAdvisor(industry?: string | null): AdvisorConfig {
  const key = (industry || "hospitality") as IndustryType;
  return ADVISORS[key] || ADVISORS.hospitality;
}