import type { IndustryType } from "./industryConfig";

export interface CrmIndustryConfig {
  contactLabel: string;
  contactLabelPlural: string;
  ticketLabel: string;
  ticketLabelPlural: string;
  dealLabel: string;
  dealLabelPlural: string;
  ticketCategories: string[];
  lifecycleStages: { value: string; label: string; color: string }[];
  sources: string[];
  priorityLabels: Record<string, string>;
  aiFeatures: string[];
}

const DEFAULT_PRIORITIES: Record<string, string> = {
  low: "Low", medium: "Medium", high: "High", critical: "Critical",
};

export const CRM_INDUSTRY_CONFIGS: Record<IndustryType, CrmIndustryConfig> = {
  hospitality: {
    contactLabel: "Guest", contactLabelPlural: "Guests",
    ticketLabel: "Request", ticketLabelPlural: "Requests",
    dealLabel: "Booking Deal", dealLabelPlural: "Booking Deals",
    ticketCategories: ["room-issue", "amenity-request", "complaint", "billing", "housekeeping", "check-in", "check-out", "maintenance", "food-service", "concierge", "general"],
    lifecycleStages: [
      { value: "lead", label: "Inquiry", color: "bg-blue-500" },
      { value: "prospect", label: "Booked", color: "bg-yellow-500" },
      { value: "customer", label: "Stayed", color: "bg-green-500" },
      { value: "churned", label: "Lost", color: "bg-red-500" },
    ],
    sources: ["airbnb", "booking.com", "vrbo", "expedia", "direct", "referral", "google", "tripadvisor"],
    priorityLabels: { ...DEFAULT_PRIORITIES, critical: "Urgent Guest Issue" },
    aiFeatures: ["guest-scoring", "review-sentiment", "upsell-suggestions", "churn-prediction", "auto-response"],
  },
  airlines: {
    contactLabel: "Passenger", contactLabelPlural: "Passengers",
    ticketLabel: "Complaint", ticketLabelPlural: "Complaints",
    dealLabel: "Route Deal", dealLabelPlural: "Route Deals",
    ticketCategories: ["flight-delay", "baggage-lost", "refund", "rebooking", "seat-upgrade", "special-assistance", "meal-complaint", "crew-complaint", "compensation", "general"],
    lifecycleStages: [
      { value: "lead", label: "Prospect", color: "bg-blue-500" },
      { value: "prospect", label: "Frequent Flyer", color: "bg-yellow-500" },
      { value: "customer", label: "Loyal Member", color: "bg-green-500" },
      { value: "churned", label: "Inactive", color: "bg-red-500" },
    ],
    sources: ["amadeus", "sabre", "direct", "travel-agent", "corporate", "loyalty-program"],
    priorityLabels: { ...DEFAULT_PRIORITIES, critical: "Flight Safety" },
    aiFeatures: ["delay-compensation", "rebooking-ai", "loyalty-scoring", "route-demand", "crew-optimization"],
  },
  car_rental: {
    contactLabel: "Renter", contactLabelPlural: "Renters",
    ticketLabel: "Claim", ticketLabelPlural: "Claims",
    dealLabel: "Fleet Deal", dealLabelPlural: "Fleet Deals",
    ticketCategories: ["vehicle-damage", "breakdown", "overcharge", "insurance-claim", "late-return", "vehicle-swap", "cleanliness", "general"],
    lifecycleStages: [
      { value: "lead", label: "Inquiry", color: "bg-blue-500" },
      { value: "prospect", label: "First Rental", color: "bg-yellow-500" },
      { value: "customer", label: "Repeat Renter", color: "bg-green-500" },
      { value: "churned", label: "Lost", color: "bg-red-500" },
    ],
    sources: ["turo", "getaround", "direct", "corporate", "airport-counter", "online"],
    priorityLabels: { ...DEFAULT_PRIORITIES, critical: "Vehicle Emergency" },
    aiFeatures: ["damage-assessment", "fleet-pricing", "utilization-forecast", "churn-prediction", "upsell-insurance"],
  },
  healthcare: {
    contactLabel: "Patient", contactLabelPlural: "Patients",
    ticketLabel: "Case", ticketLabelPlural: "Cases",
    dealLabel: "Treatment Plan", dealLabelPlural: "Treatment Plans",
    ticketCategories: ["appointment-issue", "billing-dispute", "prescription", "follow-up", "referral-request", "insurance", "medical-records", "wait-time", "general"],
    lifecycleStages: [
      { value: "lead", label: "New Patient", color: "bg-blue-500" },
      { value: "prospect", label: "Active Patient", color: "bg-yellow-500" },
      { value: "customer", label: "Regular Patient", color: "bg-green-500" },
      { value: "churned", label: "Inactive", color: "bg-red-500" },
    ],
    sources: ["zocdoc", "healthgrades", "direct", "referral", "insurance-network", "walk-in"],
    priorityLabels: { ...DEFAULT_PRIORITIES, critical: "Medical Urgent" },
    aiFeatures: ["no-show-prediction", "appointment-optimization", "patient-satisfaction", "follow-up-reminders", "wait-time-reduction"],
  },
  education: {
    contactLabel: "Student", contactLabelPlural: "Students",
    ticketLabel: "Support Request", ticketLabelPlural: "Support Requests",
    dealLabel: "Enrollment", dealLabelPlural: "Enrollments",
    ticketCategories: ["enrollment-issue", "schedule-conflict", "grade-dispute", "facility-issue", "technical-support", "financial-aid", "accessibility", "general"],
    lifecycleStages: [
      { value: "lead", label: "Applicant", color: "bg-blue-500" },
      { value: "prospect", label: "Enrolled", color: "bg-yellow-500" },
      { value: "customer", label: "Active Student", color: "bg-green-500" },
      { value: "churned", label: "Withdrawn", color: "bg-red-500" },
    ],
    sources: ["website", "campus-visit", "referral", "social-media", "education-fair", "direct"],
    priorityLabels: { ...DEFAULT_PRIORITIES, critical: "Student Safety" },
    aiFeatures: ["dropout-prediction", "engagement-scoring", "course-recommendation", "attendance-alerts", "performance-tracking"],
  },
  logistics: {
    contactLabel: "Client", contactLabelPlural: "Clients",
    ticketLabel: "Shipment Issue", ticketLabelPlural: "Shipment Issues",
    dealLabel: "Contract", dealLabelPlural: "Contracts",
    ticketCategories: ["delayed-shipment", "damaged-goods", "lost-package", "customs-issue", "billing-error", "routing-error", "capacity-issue", "general"],
    lifecycleStages: [
      { value: "lead", label: "Prospect", color: "bg-blue-500" },
      { value: "prospect", label: "First Shipment", color: "bg-yellow-500" },
      { value: "customer", label: "Regular Client", color: "bg-green-500" },
      { value: "churned", label: "Lost", color: "bg-red-500" },
    ],
    sources: ["flexport", "freightos", "direct", "broker", "referral", "rfp"],
    priorityLabels: { ...DEFAULT_PRIORITIES, critical: "Shipment Emergency" },
    aiFeatures: ["eta-prediction", "route-optimization", "capacity-forecast", "claim-automation", "sla-monitoring"],
  },
  events_entertainment: {
    contactLabel: "Organizer", contactLabelPlural: "Organizers",
    ticketLabel: "Event Issue", ticketLabelPlural: "Event Issues",
    dealLabel: "Sponsorship", dealLabelPlural: "Sponsorships",
    ticketCategories: ["venue-issue", "vendor-problem", "ticket-refund", "safety-concern", "technical-issue", "scheduling-conflict", "capacity-issue", "general"],
    lifecycleStages: [
      { value: "lead", label: "Inquiry", color: "bg-blue-500" },
      { value: "prospect", label: "Booked", color: "bg-yellow-500" },
      { value: "customer", label: "Repeat Client", color: "bg-green-500" },
      { value: "churned", label: "Lost", color: "bg-red-500" },
    ],
    sources: ["eventbrite", "ticketmaster", "direct", "agency", "referral", "social-media"],
    priorityLabels: { ...DEFAULT_PRIORITIES, critical: "Event Day Emergency" },
    aiFeatures: ["attendee-prediction", "vendor-matching", "pricing-optimization", "sentiment-analysis", "capacity-alerts"],
  },
  railways: {
    contactLabel: "Passenger", contactLabelPlural: "Passengers",
    ticketLabel: "Service Issue", ticketLabelPlural: "Service Issues",
    dealLabel: "Route Deal", dealLabelPlural: "Route Deals",
    ticketCategories: ["train-delay", "refund-request", "seat-issue", "cleanliness", "safety-concern", "food-complaint", "lost-property", "accessibility", "general"],
    lifecycleStages: [
      { value: "lead", label: "First-time", color: "bg-blue-500" },
      { value: "prospect", label: "Occasional", color: "bg-yellow-500" },
      { value: "customer", label: "Commuter", color: "bg-green-500" },
      { value: "churned", label: "Inactive", color: "bg-red-500" },
    ],
    sources: ["irctc", "trainline", "omio", "direct", "counter", "mobile-app"],
    priorityLabels: { ...DEFAULT_PRIORITIES, critical: "Safety Critical" },
    aiFeatures: ["delay-compensation", "demand-forecasting", "route-optimization", "satisfaction-scoring", "capacity-management"],
  },
  fitness_wellness: {
    contactLabel: "Member", contactLabelPlural: "Members",
    ticketLabel: "Issue", ticketLabelPlural: "Issues",
    dealLabel: "Membership Deal", dealLabelPlural: "Membership Deals",
    ticketCategories: ["equipment-issue", "class-cancellation", "billing", "trainer-complaint", "facility-issue", "membership-change", "injury-report", "locker-issue", "general"],
    lifecycleStages: [
      { value: "lead", label: "Trial", color: "bg-blue-500" },
      { value: "prospect", label: "New Member", color: "bg-yellow-500" },
      { value: "customer", label: "Active Member", color: "bg-green-500" },
      { value: "churned", label: "Cancelled", color: "bg-red-500" },
    ],
    sources: ["classpass", "mindbody", "direct", "referral", "corporate", "social-media", "walk-in"],
    priorityLabels: { ...DEFAULT_PRIORITIES, critical: "Safety/Injury" },
    aiFeatures: ["churn-prediction", "class-recommendation", "attendance-patterns", "upsell-personal-training", "peak-time-forecast"],
  },
  legal_services: {
    contactLabel: "Client", contactLabelPlural: "Clients",
    ticketLabel: "Case Issue", ticketLabelPlural: "Case Issues",
    dealLabel: "Case", dealLabelPlural: "Cases",
    ticketCategories: ["billing-dispute", "case-update-request", "document-request", "scheduling", "confidentiality-concern", "complaint", "retainer-issue", "general"],
    lifecycleStages: [
      { value: "lead", label: "Consultation", color: "bg-blue-500" },
      { value: "prospect", label: "Retained", color: "bg-yellow-500" },
      { value: "customer", label: "Active Client", color: "bg-green-500" },
      { value: "churned", label: "Case Closed", color: "bg-red-500" },
    ],
    sources: ["avvo", "justia", "referral", "direct", "bar-association", "website", "court-appointed"],
    priorityLabels: { ...DEFAULT_PRIORITIES, critical: "Court Deadline" },
    aiFeatures: ["case-outcome-prediction", "document-analysis", "billing-optimization", "conflict-check", "deadline-monitoring"],
  },
  real_estate: {
    contactLabel: "Client", contactLabelPlural: "Clients",
    ticketLabel: "Issue", ticketLabelPlural: "Issues",
    dealLabel: "Property Deal", dealLabelPlural: "Property Deals",
    ticketCategories: ["maintenance-request", "tenant-complaint", "lease-issue", "showing-request", "inspection-issue", "closing-delay", "document-issue", "general"],
    lifecycleStages: [
      { value: "lead", label: "Prospect", color: "bg-blue-500" },
      { value: "prospect", label: "Showing", color: "bg-yellow-500" },
      { value: "customer", label: "Under Contract", color: "bg-green-500" },
      { value: "churned", label: "Lost", color: "bg-red-500" },
    ],
    sources: ["zillow", "realtor.com", "redfin", "direct", "referral", "open-house", "cold-call", "mls"],
    priorityLabels: { ...DEFAULT_PRIORITIES, critical: "Closing Emergency" },
    aiFeatures: ["price-prediction", "lead-scoring", "market-analysis", "showing-optimization", "churn-prediction"],
  },
  coworking: {
    contactLabel: "Member", contactLabelPlural: "Members",
    ticketLabel: "Support Ticket", ticketLabelPlural: "Support Tickets",
    dealLabel: "Space Deal", dealLabelPlural: "Space Deals",
    ticketCategories: ["wifi-issue", "noise-complaint", "booking-conflict", "amenity-request", "billing", "access-issue", "maintenance", "event-request", "general"],
    lifecycleStages: [
      { value: "lead", label: "Tour Booked", color: "bg-blue-500" },
      { value: "prospect", label: "Day Pass", color: "bg-yellow-500" },
      { value: "customer", label: "Member", color: "bg-green-500" },
      { value: "churned", label: "Ex-Member", color: "bg-red-500" },
    ],
    sources: ["wework", "deskpass", "direct", "referral", "corporate", "website", "walk-in"],
    priorityLabels: { ...DEFAULT_PRIORITIES, critical: "Access Emergency" },
    aiFeatures: ["occupancy-prediction", "churn-prediction", "upsell-private-office", "community-matching", "peak-analysis"],
  },
  marine_maritime: {
    contactLabel: "Client", contactLabelPlural: "Clients",
    ticketLabel: "Incident", ticketLabelPlural: "Incidents",
    dealLabel: "Voyage Deal", dealLabelPlural: "Voyage Deals",
    ticketCategories: ["port-delay", "cargo-damage", "documentation-issue", "customs-hold", "crew-issue", "safety-violation", "environmental-report", "equipment-failure", "general"],
    lifecycleStages: [
      { value: "lead", label: "Inquiry", color: "bg-blue-500" },
      { value: "prospect", label: "First Voyage", color: "bg-yellow-500" },
      { value: "customer", label: "Regular Shipper", color: "bg-green-500" },
      { value: "churned", label: "Inactive", color: "bg-red-500" },
    ],
    sources: ["maritime-exchange", "broker", "direct", "port-authority", "forwarding-agent", "corporate"],
    priorityLabels: { ...DEFAULT_PRIORITIES, critical: "Maritime Emergency" },
    aiFeatures: ["route-optimization", "weather-risk", "port-congestion-prediction", "fuel-optimization", "compliance-check"],
  },
  government: {
    contactLabel: "Citizen", contactLabelPlural: "Citizens",
    ticketLabel: "Service Request", ticketLabelPlural: "Service Requests",
    dealLabel: "Project", dealLabelPlural: "Projects",
    ticketCategories: ["permit-issue", "license-renewal", "complaint", "infrastructure", "public-safety", "waste-management", "zoning", "tax-issue", "general"],
    lifecycleStages: [
      { value: "lead", label: "New Request", color: "bg-blue-500" },
      { value: "prospect", label: "Under Review", color: "bg-yellow-500" },
      { value: "customer", label: "Resolved", color: "bg-green-500" },
      { value: "churned", label: "Escalated", color: "bg-red-500" },
    ],
    sources: ["311-hotline", "website", "in-person", "email", "mobile-app", "social-media", "mail"],
    priorityLabels: { ...DEFAULT_PRIORITIES, critical: "Public Safety" },
    aiFeatures: ["response-time-prediction", "workload-balancing", "sentiment-analysis", "resource-allocation", "compliance-tracking"],
  },
  travel_tourism: {
    contactLabel: "Traveler", contactLabelPlural: "Travelers",
    ticketLabel: "Issue", ticketLabelPlural: "Issues",
    dealLabel: "Package Deal", dealLabelPlural: "Package Deals",
    ticketCategories: ["itinerary-change", "refund-request", "hotel-issue", "transport-issue", "visa-problem", "insurance-claim", "guide-complaint", "general"],
    lifecycleStages: [
      { value: "lead", label: "Inquiry", color: "bg-blue-500" },
      { value: "prospect", label: "Quoted", color: "bg-yellow-500" },
      { value: "customer", label: "Booked", color: "bg-green-500" },
      { value: "churned", label: "Cancelled", color: "bg-red-500" },
    ],
    sources: ["tripadvisor", "viator", "getyourguide", "direct", "travel-agent", "referral", "google"],
    priorityLabels: { ...DEFAULT_PRIORITIES, critical: "Travel Emergency" },
    aiFeatures: ["package-recommendation", "pricing-optimization", "sentiment-analysis", "demand-forecasting", "upsell-activities"],
  },
};

export function getCrmConfig(industry: IndustryType): CrmIndustryConfig {
  return CRM_INDUSTRY_CONFIGS[industry] || CRM_INDUSTRY_CONFIGS.hospitality;
}
