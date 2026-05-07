export type IndustryType =
  | "hospitality" | "airlines" | "car_rental" | "healthcare" | "education"
  | "logistics" | "events_entertainment" | "railways";

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
    color: "hsl(180, 65%, 45%)",
  },
};

export function getIndustryConfig(industry: IndustryType): IndustryConfig {
  return INDUSTRY_CONFIGS[industry] || INDUSTRY_CONFIGS.hospitality;
}
