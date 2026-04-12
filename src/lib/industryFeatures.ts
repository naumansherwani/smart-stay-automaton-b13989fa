import type { IndustryType } from "./industryConfig";

// Which features each industry gets
export interface IndustryFeatureSet {
  autoPricing: boolean;
  gapFiller: boolean;
  competitorRadar: boolean;
  guestScoring: boolean;
  demandForecast: boolean;
  smartPricing: boolean;
  fleetMap: boolean;
  patientFlow: boolean;
  courtDates: boolean;
  classSchedule: boolean;
  crewScheduling: boolean;
  ticketCapacity: boolean;
  deskMap: boolean;
  berthSchedule: boolean;
  citizenQueue: boolean;
  showingCalendar: boolean;
  memberCheckins: boolean;
  // Dashboard tabs to show
  tabs: DashboardTab[];
}

export type DashboardTab =
  | "calendar"
  | "bookings"
  | "resources"
  | "ai-schedule"
  | "settings"
  | "ai-tools"
  | "alerts"
  | "pricing";

const BASE_TABS: DashboardTab[] = ["calendar", "bookings", "resources", "ai-schedule", "settings", "alerts"];

// Industries that support AI Pricing
const PRICING_INDUSTRIES: Set<IndustryType> = new Set([
  "hospitality", "airlines", "car_rental", "events_entertainment", "railways",
]);

export function supportsAutoPricing(industry: IndustryType): boolean {
  return PRICING_INDUSTRIES.has(industry);
}

export function getIndustryFeatures(industry: IndustryType): IndustryFeatureSet {
  const hasPricing = supportsAutoPricing(industry);
  const tabs: DashboardTab[] = [
    ...BASE_TABS,
    "ai-tools",
    ...(hasPricing ? ["pricing" as DashboardTab] : []),
  ];

  const base: IndustryFeatureSet = {
    autoPricing: hasPricing,
    gapFiller: false,
    competitorRadar: false,
    guestScoring: false,
    demandForecast: hasPricing,
    smartPricing: hasPricing,
    fleetMap: false,
    patientFlow: false,
    courtDates: false,
    classSchedule: false,
    crewScheduling: false,
    ticketCapacity: false,
    deskMap: false,
    berthSchedule: false,
    citizenQueue: false,
    showingCalendar: false,
    memberCheckins: false,
    tabs,
  };

  switch (industry) {
    case "hospitality":
      return { ...base, gapFiller: true, competitorRadar: true, guestScoring: true };
    case "car_rental":
      return { ...base, fleetMap: true };
    case "events_entertainment":
      return { ...base, ticketCapacity: true };
    case "healthcare":
      return { ...base, patientFlow: true };
    case "education":
      return { ...base, classSchedule: true };
    case "airlines":
      return { ...base, crewScheduling: true, demandForecast: true };
    case "logistics":
      return base;
    case "railways":
      return { ...base, crewScheduling: true, demandForecast: true };
    default:
      return base;
  }
}
