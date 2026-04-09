export type IndustryType =
  | "hospitality" | "airlines" | "car_rental" | "healthcare" | "education"
  | "logistics" | "events_entertainment" | "fitness_wellness" | "legal_services"
  | "real_estate" | "coworking" | "marine_maritime" | "government"
  | "travel_tourism" | "railways";

export interface IndustryConfig {
  id: IndustryType;
  label: string;
  icon: string;
  resourceLabel: string;
  resourceLabelPlural: string;
  bookingLabel: string;
  bookingLabelPlural: string;
  clientLabel: string;
  clientLabelPlural: string;
  platforms: { value: string; label: string }[];
  statuses: string[];
  widgets: string[];
  kpis: { label: string; key: string; format: "number" | "currency" | "percent" | "duration" }[];
  color: string;
}

export const INDUSTRY_CONFIGS: Record<IndustryType, IndustryConfig> = {
  hospitality: {
    id: "hospitality", label: "Travel, Tourism & Hospitality", icon: "🌍",
    resourceLabel: "Property/Tour", resourceLabelPlural: "Properties & Tours",
    bookingLabel: "Booking", bookingLabelPlural: "Bookings",
    clientLabel: "Guest/Traveler", clientLabelPlural: "Guests & Travelers",
    platforms: [
      { value: "airbnb", label: "Airbnb" }, { value: "booking", label: "Booking.com" },
      { value: "vrbo", label: "VRBO" }, { value: "direct", label: "Direct" },
      { value: "expedia", label: "Expedia" }, { value: "viator", label: "Viator" },
      { value: "getyourguide", label: "GetYourGuide" }, { value: "tripadvisor", label: "TripAdvisor" },
      { value: "klook", label: "Klook" },
    ],
    statuses: ["confirmed", "pending", "cancelled", "checked-in", "checked-out", "no-show", "in-progress", "completed", "waitlisted"],
    widgets: ["occupancy-heatmap", "turnover-tracker", "guest-scoring", "channel-sync", "smart-pricing", "gap-filler", "competitor-radar", "revenue-forecast", "itinerary-builder", "tour-calendar", "guide-scheduler", "group-capacity", "seasonal-demand", "review-tracker", "multi-currency", "weather-alerts", "transport-links", "package-builder"],
    kpis: [
      { label: "Occupancy Rate", key: "occupancy", format: "percent" },
      { label: "RevPAR", key: "revpar", format: "currency" },
      { label: "Booking Rate", key: "bookingRate", format: "percent" },
      { label: "Satisfaction", key: "satisfaction", format: "percent" },
    ],
    color: "hsl(168, 70%, 38%)",
  },
  airlines: {
    id: "airlines", label: "Airlines & Aviation", icon: "✈️",
    resourceLabel: "Aircraft", resourceLabelPlural: "Aircraft",
    bookingLabel: "Flight", bookingLabelPlural: "Flights",
    clientLabel: "Passenger", clientLabelPlural: "Passengers",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "amadeus", label: "Amadeus GDS" },
      { value: "sabre", label: "Sabre" }, { value: "travelport", label: "Travelport" },
    ],
    statuses: ["scheduled", "boarding", "departed", "arrived", "delayed", "cancelled"],
    widgets: ["crew-scheduling", "gate-assignment", "load-factor", "delay-tracker", "route-optimizer", "fuel-forecast", "maintenance-calendar"],
    kpis: [
      { label: "Load Factor", key: "loadFactor", format: "percent" },
      { label: "On-Time Rate", key: "onTime", format: "percent" },
      { label: "Revenue/Seat", key: "revSeat", format: "currency" },
      { label: "Turnaround", key: "turnaround", format: "duration" },
    ],
    color: "hsl(220, 80%, 55%)",
  },
  car_rental: {
    id: "car_rental", label: "Car Rental", icon: "🚗",
    resourceLabel: "Vehicle", resourceLabelPlural: "Vehicles",
    bookingLabel: "Rental", bookingLabelPlural: "Rentals",
    clientLabel: "Renter", clientLabelPlural: "Renters",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "turo", label: "Turo" },
      { value: "getaround", label: "Getaround" }, { value: "enterprise", label: "Enterprise" },
    ],
    statuses: ["reserved", "active", "returned", "overdue", "cancelled", "maintenance"],
    widgets: ["fleet-map", "vehicle-status", "mileage-tracker", "damage-reports", "utilization-chart", "pricing-optimizer"],
    kpis: [
      { label: "Fleet Utilization", key: "utilization", format: "percent" },
      { label: "Rev/Vehicle/Day", key: "revVehicle", format: "currency" },
      { label: "Avg Rental", key: "avgRental", format: "duration" },
      { label: "Damage Rate", key: "damageRate", format: "percent" },
    ],
    color: "hsl(200, 70%, 50%)",
  },
  healthcare: {
    id: "healthcare", label: "Healthcare & Clinics", icon: "🏥",
    resourceLabel: "Room", resourceLabelPlural: "Rooms",
    bookingLabel: "Appointment", bookingLabelPlural: "Appointments",
    clientLabel: "Patient", clientLabelPlural: "Patients",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "zocdoc", label: "ZocDoc" },
      { value: "healthgrades", label: "Healthgrades" }, { value: "epic", label: "Epic" },
    ],
    statuses: ["scheduled", "checked-in", "in-progress", "completed", "no-show", "cancelled"],
    widgets: ["appointment-slots", "patient-flow", "room-utilization", "waitlist", "provider-schedule", "no-show-predictor"],
    kpis: [
      { label: "Room Utilization", key: "utilization", format: "percent" },
      { label: "Avg Wait Time", key: "waitTime", format: "duration" },
      { label: "No-Show Rate", key: "noShowRate", format: "percent" },
      { label: "Patients/Day", key: "patientsDay", format: "number" },
    ],
    color: "hsl(356, 72%, 55%)",
  },
  education: {
    id: "education", label: "Education & Training", icon: "🎓",
    resourceLabel: "Classroom", resourceLabelPlural: "Classrooms",
    bookingLabel: "Class", bookingLabelPlural: "Classes",
    clientLabel: "Student", clientLabelPlural: "Students",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "canvas", label: "Canvas" },
      { value: "blackboard", label: "Blackboard" },
    ],
    statuses: ["scheduled", "in-progress", "completed", "cancelled", "rescheduled"],
    widgets: ["class-schedule", "room-booking", "instructor-availability", "semester-planner", "attendance-tracker", "capacity-monitor"],
    kpis: [
      { label: "Room Utilization", key: "utilization", format: "percent" },
      { label: "Avg Class Size", key: "classSize", format: "number" },
      { label: "Attendance Rate", key: "attendance", format: "percent" },
      { label: "Classes/Day", key: "classesDay", format: "number" },
    ],
    color: "hsl(262, 60%, 55%)",
  },
  logistics: {
    id: "logistics", label: "Logistics & Shipping", icon: "📦",
    resourceLabel: "Bay", resourceLabelPlural: "Bays",
    bookingLabel: "Shipment", bookingLabelPlural: "Shipments",
    clientLabel: "Client", clientLabelPlural: "Clients",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "flexport", label: "Flexport" },
      { value: "freightos", label: "Freightos" },
    ],
    statuses: ["scheduled", "loading", "in-transit", "delivered", "delayed", "cancelled"],
    widgets: ["route-optimizer", "warehouse-slots", "driver-schedules", "delivery-tracking", "capacity-planner", "eta-predictor"],
    kpis: [
      { label: "On-Time Delivery", key: "onTime", format: "percent" },
      { label: "Bay Utilization", key: "utilization", format: "percent" },
      { label: "Avg Transit", key: "avgTransit", format: "duration" },
      { label: "Shipments/Day", key: "shipmentsDay", format: "number" },
    ],
    color: "hsl(30, 70%, 50%)",
  },
  events_entertainment: {
    id: "events_entertainment", label: "Events & Entertainment", icon: "🎭",
    resourceLabel: "Venue", resourceLabelPlural: "Venues",
    bookingLabel: "Event", bookingLabelPlural: "Events",
    clientLabel: "Organizer", clientLabelPlural: "Organizers",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "eventbrite", label: "Eventbrite" },
      { value: "ticketmaster", label: "Ticketmaster" },
    ],
    statuses: ["confirmed", "tentative", "setup", "in-progress", "completed", "cancelled"],
    widgets: ["venue-calendar", "ticket-capacity", "vendor-coordination", "setup-timelines", "revenue-forecast", "attendee-analytics"],
    kpis: [
      { label: "Venue Utilization", key: "utilization", format: "percent" },
      { label: "Avg Ticket Price", key: "avgTicket", format: "currency" },
      { label: "Sell-Through", key: "sellThrough", format: "percent" },
      { label: "Events/Month", key: "eventsMonth", format: "number" },
    ],
    color: "hsl(310, 60%, 50%)",
  },
  fitness_wellness: {
    id: "fitness_wellness", label: "Fitness & Wellness", icon: "💪",
    resourceLabel: "Studio", resourceLabelPlural: "Studios",
    bookingLabel: "Session", bookingLabelPlural: "Sessions",
    clientLabel: "Member", clientLabelPlural: "Members",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "classpass", label: "ClassPass" },
      { value: "mindbody", label: "Mindbody" },
    ],
    statuses: ["scheduled", "checked-in", "in-progress", "completed", "no-show", "cancelled"],
    widgets: ["class-schedule", "trainer-roster", "membership-tracker", "attendance-heatmap", "retention-chart", "peak-hours"],
    kpis: [
      { label: "Class Occupancy", key: "occupancy", format: "percent" },
      { label: "Retention Rate", key: "retention", format: "percent" },
      { label: "Rev/Member", key: "revMember", format: "currency" },
      { label: "Sessions/Day", key: "sessionsDay", format: "number" },
    ],
    color: "hsl(145, 65%, 42%)",
  },
  legal_services: {
    id: "legal_services", label: "Legal Services", icon: "⚖️",
    resourceLabel: "Office", resourceLabelPlural: "Offices",
    bookingLabel: "Consultation", bookingLabelPlural: "Consultations",
    clientLabel: "Client", clientLabelPlural: "Clients",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "avvo", label: "Avvo" },
      { value: "justia", label: "Justia" },
    ],
    statuses: ["scheduled", "in-progress", "completed", "cancelled", "rescheduled"],
    widgets: ["case-tracker", "billing-hours", "deadline-calendar", "document-vault", "court-calendar", "conflict-checker"],
    kpis: [
      { label: "Billable Hours", key: "billableHours", format: "number" },
      { label: "Avg Case Value", key: "avgCaseValue", format: "currency" },
      { label: "Win Rate", key: "winRate", format: "percent" },
      { label: "Cases Active", key: "activeCases", format: "number" },
    ],
    color: "hsl(210, 50%, 45%)",
  },
  real_estate: {
    id: "real_estate", label: "Real Estate", icon: "🏠",
    resourceLabel: "Property", resourceLabelPlural: "Properties",
    bookingLabel: "Showing", bookingLabelPlural: "Showings",
    clientLabel: "Client", clientLabelPlural: "Clients",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "zillow", label: "Zillow" },
      { value: "realtor", label: "Realtor.com" }, { value: "redfin", label: "Redfin" },
    ],
    statuses: ["scheduled", "shown", "offer-made", "under-contract", "closed", "cancelled"],
    widgets: ["listing-tracker", "showing-calendar", "market-analysis", "commission-tracker", "lead-pipeline", "price-history"],
    kpis: [
      { label: "Listings Active", key: "activeListings", format: "number" },
      { label: "Avg Days on Market", key: "daysOnMarket", format: "number" },
      { label: "Closing Rate", key: "closingRate", format: "percent" },
      { label: "Commission YTD", key: "commissionYtd", format: "currency" },
    ],
    color: "hsl(25, 70%, 50%)",
  },
  coworking: {
    id: "coworking", label: "Coworking Spaces", icon: "🏢",
    resourceLabel: "Desk/Room", resourceLabelPlural: "Desks & Rooms",
    bookingLabel: "Reservation", bookingLabelPlural: "Reservations",
    clientLabel: "Member", clientLabelPlural: "Members",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "deskpass", label: "Deskpass" },
      { value: "liquidspace", label: "LiquidSpace" },
    ],
    statuses: ["reserved", "checked-in", "active", "completed", "cancelled"],
    widgets: ["floor-plan", "occupancy-live", "meeting-rooms", "event-calendar", "community-board", "invoice-tracker"],
    kpis: [
      { label: "Desk Occupancy", key: "occupancy", format: "percent" },
      { label: "Rev/Desk", key: "revDesk", format: "currency" },
      { label: "Member Retention", key: "retention", format: "percent" },
      { label: "Active Members", key: "activeMembers", format: "number" },
    ],
    color: "hsl(190, 60%, 45%)",
  },
  marine_maritime: {
    id: "marine_maritime", label: "Marine & Maritime", icon: "🚢",
    resourceLabel: "Vessel", resourceLabelPlural: "Vessels",
    bookingLabel: "Voyage", bookingLabelPlural: "Voyages",
    clientLabel: "Client", clientLabelPlural: "Clients",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "maritime-exchange", label: "Maritime Exchange" },
    ],
    statuses: ["scheduled", "loading", "at-sea", "docked", "completed", "delayed", "cancelled"],
    widgets: ["vessel-tracker", "port-schedule", "cargo-manifest", "crew-roster", "weather-monitor", "compliance-checker"],
    kpis: [
      { label: "Fleet Utilization", key: "utilization", format: "percent" },
      { label: "Avg Voyage Time", key: "avgVoyage", format: "duration" },
      { label: "Rev/Voyage", key: "revVoyage", format: "currency" },
      { label: "Active Voyages", key: "activeVoyages", format: "number" },
    ],
    color: "hsl(205, 70%, 45%)",
  },
  government: {
    id: "government", label: "Government Services", icon: "🏛️",
    resourceLabel: "Facility", resourceLabelPlural: "Facilities",
    bookingLabel: "Appointment", bookingLabelPlural: "Appointments",
    clientLabel: "Citizen", clientLabelPlural: "Citizens",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "portal", label: "Gov Portal" },
    ],
    statuses: ["scheduled", "in-progress", "completed", "cancelled", "pending-review"],
    widgets: ["service-queue", "department-load", "permit-tracker", "citizen-feedback", "compliance-dashboard", "budget-monitor"],
    kpis: [
      { label: "Avg Wait Time", key: "waitTime", format: "duration" },
      { label: "Cases Resolved", key: "resolved", format: "number" },
      { label: "Satisfaction", key: "satisfaction", format: "percent" },
      { label: "Services/Day", key: "servicesDay", format: "number" },
    ],
    color: "hsl(240, 40%, 50%)",
  },
  travel_tourism: {
    id: "travel_tourism", label: "Travel & Tourism", icon: "🗺️",
    resourceLabel: "Tour/Package", resourceLabelPlural: "Tours & Packages",
    bookingLabel: "Booking", bookingLabelPlural: "Bookings",
    clientLabel: "Traveler", clientLabelPlural: "Travelers",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "viator", label: "Viator" },
      { value: "getyourguide", label: "GetYourGuide" }, { value: "klook", label: "Klook" },
    ],
    statuses: ["confirmed", "pending", "in-progress", "completed", "cancelled", "refunded"],
    widgets: ["tour-calendar", "guide-roster", "group-capacity", "seasonal-demand", "review-tracker", "package-builder"],
    kpis: [
      { label: "Booking Rate", key: "bookingRate", format: "percent" },
      { label: "Rev/Tour", key: "revTour", format: "currency" },
      { label: "Avg Group Size", key: "groupSize", format: "number" },
      { label: "Satisfaction", key: "satisfaction", format: "percent" },
    ],
    color: "hsl(170, 60%, 40%)",
  },
  railways: {
    id: "railways", label: "Railways & Train Services", icon: "🚆",
    resourceLabel: "Train", resourceLabelPlural: "Trains",
    bookingLabel: "Journey", bookingLabelPlural: "Journeys",
    clientLabel: "Passenger", clientLabelPlural: "Passengers",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "irctc", label: "IRCTC" },
      { value: "trainline", label: "Trainline" }, { value: "omio", label: "Omio" },
    ],
    statuses: ["scheduled", "boarding", "departed", "arrived", "delayed", "cancelled"],
    widgets: ["platform-allocation", "crew-roster", "route-scheduler", "delay-tracker", "capacity-monitor", "maintenance-calendar"],
    kpis: [
      { label: "On-Time Rate", key: "onTime", format: "percent" },
      { label: "Seat Occupancy", key: "occupancy", format: "percent" },
      { label: "Rev/Journey", key: "revJourney", format: "currency" },
      { label: "Journeys/Day", key: "journeysDay", format: "number" },
    ],
    color: "hsl(200, 70%, 50%)",
  },
};

export function getIndustryConfig(industry: IndustryType): IndustryConfig {
  return INDUSTRY_CONFIGS[industry] || INDUSTRY_CONFIGS.hospitality;
}
