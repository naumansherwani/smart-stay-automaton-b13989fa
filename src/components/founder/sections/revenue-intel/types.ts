import type { IntelligenceReport } from "@/lib/api";

export type Report = IntelligenceReport;

export const INDUSTRY_ADVISOR: Record<string, string> = {
  hospitality: "Aria",
  airlines: "Orion",
  car_rental: "Rex",
  healthcare: "Lyra",
  education: "Sage",
  logistics: "Atlas",
  events_entertainment: "Vega",
  railways: "Kai",
};

export const ADVISOR_ORDER: { advisor: string; industry: string; label: string }[] = [
  { advisor: "Aria", industry: "hospitality", label: "Hospitality" },
  { advisor: "Orion", industry: "airlines", label: "Airlines" },
  { advisor: "Rex", industry: "car_rental", label: "Car Rental" },
  { advisor: "Lyra", industry: "healthcare", label: "Healthcare" },
  { advisor: "Sage", industry: "education", label: "Education" },
  { advisor: "Atlas", industry: "logistics", label: "Logistics" },
  { advisor: "Vega", industry: "events_entertainment", label: "Events" },
  { advisor: "Kai", industry: "railways", label: "Railways" },
];