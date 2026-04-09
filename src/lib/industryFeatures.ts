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

// AI Calendar + AI Pricing enabled for ALL industries
export function supportsAutoPricing(_industry: IndustryType): boolean {
  return true;
}

export function getIndustryFeatures(industry: IndustryType): IndustryFeatureSet {
  const hasPricing = true; // AI pricing for all industries
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
    case "legal_services":
      return { ...base, courtDates: true };
    case "airlines":
      return { ...base, crewScheduling: true, demandForecast: true };
    case "coworking":
      return { ...base, deskMap: true, memberCheckins: true };
    case "marine_maritime":
      return { ...base, berthSchedule: true };
    case "government":
      return { ...base, citizenQueue: true };
    case "fitness_wellness":
      return { ...base, memberCheckins: true };
    case "real_estate":
      return { ...base, showingCalendar: true };
    case "logistics":
      return base;
    default:
      return base;
  }
}
