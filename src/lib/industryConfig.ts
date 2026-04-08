export type IndustryType =
  | "hospitality" | "airlines" | "car_rental" | "healthcare" | "education"
  | "logistics" | "events_entertainment" | "fitness_wellness" | "legal_services"
  | "real_estate" | "coworking" | "marine_maritime" | "government";

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
      { value: "direct", label: "Direct" }, { value: "mindbody", label: "Mindbody" },
      { value: "classpass", label: "ClassPass" },
    ],
    statuses: ["scheduled", "checked-in", "in-progress", "completed", "no-show", "cancelled"],
    widgets: ["class-schedule", "trainer-booking", "member-checkins", "equipment-rotation", "capacity-monitor", "retention-tracker"],
    kpis: [
      { label: "Class Fill Rate", key: "fillRate", format: "percent" },
      { label: "Member Retention", key: "retention", format: "percent" },
      { label: "Rev/Session", key: "revSession", format: "currency" },
      { label: "Sessions/Day", key: "sessionsDay", format: "number" },
    ],
    color: "hsl(142, 60%, 45%)",
  },
  legal_services: {
    id: "legal_services", label: "Legal Services", icon: "⚖️",
    resourceLabel: "Office", resourceLabelPlural: "Offices",
    bookingLabel: "Appointment", bookingLabelPlural: "Appointments",
    clientLabel: "Client", clientLabelPlural: "Clients",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "clio", label: "Clio" },
      { value: "lawmatics", label: "Lawmatics" },
    ],
    statuses: ["scheduled", "in-progress", "completed", "rescheduled", "cancelled"],
    widgets: ["court-dates", "client-meetings", "case-deadlines", "billing-hours", "conflict-checker", "document-tracker"],
    kpis: [
      { label: "Billable Hours", key: "billableHours", format: "number" },
      { label: "Utilization Rate", key: "utilization", format: "percent" },
      { label: "Avg Hourly Rate", key: "hourlyRate", format: "currency" },
      { label: "Cases Active", key: "activeCases", format: "number" },
    ],
    color: "hsl(45, 70%, 45%)",
  },
  real_estate: {
    id: "real_estate", label: "Real Estate", icon: "🏠",
    resourceLabel: "Listing", resourceLabelPlural: "Listings",
    bookingLabel: "Showing", bookingLabelPlural: "Showings",
    clientLabel: "Lead", clientLabelPlural: "Leads",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "zillow", label: "Zillow" },
      { value: "realtor", label: "Realtor.com" }, { value: "mls", label: "MLS" },
    ],
    statuses: ["scheduled", "completed", "interested", "offer-made", "cancelled"],
    widgets: ["showing-calendar", "open-house-scheduler", "agent-calendars", "lead-tracker", "market-analysis", "follow-up-reminders"],
    kpis: [
      { label: "Showings/Week", key: "showingsWeek", format: "number" },
      { label: "Conversion Rate", key: "conversion", format: "percent" },
      { label: "Avg Days on Market", key: "daysOnMarket", format: "number" },
      { label: "Active Listings", key: "activeListings", format: "number" },
    ],
    color: "hsl(15, 65%, 50%)",
  },
  coworking: {
    id: "coworking", label: "Co-working Spaces", icon: "🏢",
    resourceLabel: "Space", resourceLabelPlural: "Spaces",
    bookingLabel: "Booking", bookingLabelPlural: "Bookings",
    clientLabel: "Member", clientLabelPlural: "Members",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "deskhub", label: "DeskHub" },
      { value: "liquidspace", label: "LiquidSpace" },
    ],
    statuses: ["reserved", "checked-in", "completed", "no-show", "cancelled"],
    widgets: ["desk-map", "room-availability", "member-checkins", "meeting-rooms", "usage-analytics", "pricing-tiers"],
    kpis: [
      { label: "Desk Utilization", key: "utilization", format: "percent" },
      { label: "Rev/Desk/Day", key: "revDesk", format: "currency" },
      { label: "Member Retention", key: "retention", format: "percent" },
      { label: "Avg Occupancy", key: "occupancy", format: "percent" },
    ],
    color: "hsl(190, 60%, 45%)",
  },
  marine_maritime: {
    id: "marine_maritime", label: "Marine & Maritime", icon: "🚢",
    resourceLabel: "Berth", resourceLabelPlural: "Berths",
    bookingLabel: "Docking", bookingLabelPlural: "Dockings",
    clientLabel: "Vessel", clientLabelPlural: "Vessels",
    platforms: [
      { value: "direct", label: "Direct" }, { value: "marinetraffic", label: "MarineTraffic" },
      { value: "portcall", label: "PortCall" },
    ],
    statuses: ["scheduled", "approaching", "docked", "departed", "delayed", "cancelled"],
    widgets: ["berth-schedule", "vessel-tracking", "port-slots", "crew-rotation", "cargo-planning", "tide-calendar"],
    kpis: [
      { label: "Berth Utilization", key: "utilization", format: "percent" },
      { label: "Avg Turnaround", key: "turnaround", format: "duration" },
      { label: "Vessels/Day", key: "vesselsDay", format: "number" },
      { label: "Rev/Berth", key: "revBerth", format: "currency" },
    ],
    color: "hsl(210, 70%, 50%)",
  },
  government: {
    id: "government", label: "Government", icon: "🏛️",
    resourceLabel: "Facility", resourceLabelPlural: "Facilities",
    bookingLabel: "Appointment", bookingLabelPlural: "Appointments",
    clientLabel: "Citizen", clientLabelPlural: "Citizens",
    platforms: [
      { value: "direct", label: "Online Portal" }, { value: "phone", label: "Phone" },
      { value: "walkin", label: "Walk-in" },
    ],
    statuses: ["scheduled", "checked-in", "in-progress", "completed", "no-show", "cancelled"],
    widgets: ["citizen-appointments", "facility-booking", "permit-scheduling", "staff-rotation", "queue-management", "service-analytics"],
    kpis: [
      { label: "Facility Usage", key: "utilization", format: "percent" },
      { label: "Avg Wait Time", key: "waitTime", format: "duration" },
      { label: "Satisfaction", key: "satisfaction", format: "percent" },
      { label: "Served/Day", key: "servedDay", format: "number" },
    ],
    color: "hsl(240, 50%, 50%)",
  },
};

export function getIndustryConfig(industry: IndustryType): IndustryConfig {
  return INDUSTRY_CONFIGS[industry] || INDUSTRY_CONFIGS.hospitality;
}
