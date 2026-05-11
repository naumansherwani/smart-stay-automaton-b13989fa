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
  /** Optional grouping label for the Quick Actions sidebar. Items
   *  without a category fall under "Quick Actions". */
  category?: string;
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
  /** Health-cockpit features (Dr. Lyra) */
  ekgPulse?: boolean;
  trustScore?: { label: string; value: string; sub?: string };
  sherlockShieldGlow?: boolean;
  minimizedOrb?: "mint-breath" | "lime-breath";
  /** Bottom SLA timeline */
  resolutionPulse?: boolean;
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
      // Revenue Management
      { id: "revenue", category: "Revenue Management", label: "Revenue Optimization", icon: "TrendingUp", prompt: "Run a full revenue optimization review for the next 30 days and recommend the top 3 actions." },
      { id: "pricing", category: "Revenue Management", label: "Pricing Recommendations", icon: "DollarSign", prompt: "Recommend nightly rate adjustments for the next 14 days based on demand, comp set and seasonality." },
      { id: "forecast", category: "Revenue Management", label: "Forecasting", icon: "LineChart", prompt: "Give me a 30-day forecast for occupancy, ADR and RevPAR with key risks." },
      // Distribution Channels
      { id: "ota_mix", category: "Distribution Channels", label: "OTA Channel Mix Review", icon: "Globe", prompt: "Review my OTA channel mix (Booking, Airbnb, Expedia, direct) and recommend rebalancing to lift net ADR after commissions." },
      // Guest Experience
      { id: "review_response", category: "Guest Experience", label: "Review Response", icon: "Star", prompt: "Help me respond to my latest guest reviews professionally and on-brand." },
      { id: "upsell", category: "Guest Experience", label: "Upsell Opportunities", icon: "Gift", prompt: "Identify the top upsell opportunities for current and upcoming reservations." },
      // Operations
      { id: "conflicts", category: "Operations", label: "Booking Conflict Resolution", icon: "AlertTriangle", prompt: "Find and resolve any double-bookings or scheduling conflicts in my calendar." },
      // Marketing & CRM
      { id: "returning_guest", category: "Marketing & CRM", label: "Returning Guest Campaign", icon: "Heart", prompt: "Segment past guests who haven't returned in 9+ months and draft a personalised win-back campaign with offer ideas." },
      // Communication
      { id: "guest_comm", category: "Communication", label: "Guest Communication", icon: "MessageSquare", prompt: "Draft a personalised pre-arrival message for guests checking in tomorrow." },
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
    shortTitle: "Flight Operations Director",
    toolBadgeStyle: "uppercase-code",
    resolutionPulse: true,
    placeholder: "Awaiting flight parameters, Commander.",
    starterPrompts: [
      "Improve load factor on underperforming routes",
      "Reduce delay-related costs",
      "Optimize ancillary revenue",
      "Analyze route profitability",
      "Draft disruption communication",
      "Review compliance risks",
      "Improve on-time performance",
      "Optimize aircraft utilization",
    ],
    toolPanels: [
      // Route Profitability
      { id: "route_profit", category: "Route Profitability", label: "Route Profitability", icon: "TrendingUp", prompt: "Analyze route profitability for the past 30 days and rank top/bottom 5 routes." },
      { id: "ancillary", category: "Route Profitability", label: "Ancillary Revenue", icon: "Gift", prompt: "Recommend ancillary revenue optimizations (bags, seats, upgrades) for the next 30 days." },
      // Scheduling
      { id: "schedule_opt", category: "Scheduling", label: "Schedule Optimization", icon: "CalendarClock", prompt: "Recommend schedule changes to improve connections and aircraft utilization." },
      { id: "disruption", category: "Scheduling", label: "Disruption Recovery", icon: "AlertTriangle", prompt: "Draft a disruption recovery plan for currently delayed/cancelled flights." },
      // Compliance
      { id: "compliance", category: "Compliance", label: "Compliance Monitoring", icon: "ShieldCheck", prompt: "Run a compliance check across crew duty hours, MEL items and certifications." },
      // Fleet Utilization
      { id: "fleet_util", category: "Fleet Utilization", label: "Fleet Utilization", icon: "Plane", prompt: "Show current fleet utilization by tail number and flag underutilized aircraft." },
      { id: "fuel", category: "Fleet Utilization", label: "Fuel Efficiency", icon: "Fuel", prompt: "Identify the top fuel-saving opportunities across the active network." },
      // Passenger Experience
      { id: "delay_cost", category: "Passenger Experience", label: "Delay Cost Analysis", icon: "Timer", prompt: "Break down delay-related costs by root cause for the last 14 days." },
      // Communication
      { id: "passenger_disruption_notice", category: "Communication", label: "Passenger Disruption Notice", icon: "MessageSquare", prompt: "Draft a clear, on-brand passenger notification for currently delayed or cancelled flights with rebooking guidance." },
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
    channels: [
      { id: "iata", label: "IATA", icon: "Plane" },
      { id: "faa", label: "FAA", icon: "ShieldCheck" },
      { id: "easa", label: "EASA", icon: "Shield" },
      { id: "amadeus", label: "Amadeus", icon: "Globe" },
      { id: "sabre", label: "Sabre", icon: "Ticket" },
      { id: "flightradar", label: "FlightRadar", icon: "Radar" },
      { id: "weather", label: "Weather", icon: "CloudSun" },
      { id: "email", label: "Email", icon: "Mail" },
    ],
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
    vibe: "Confident, direct, fast-moving, commercially aggressive, and operationally precise.",
    accent: "from-[#060606]/80 via-[#32ff00]/15 to-[#a1a1aa]/10",
    auraHsl: "105 100% 50%",
    mono: true,
    shortTitle: "Fleet Revenue Director",
    toolBadgeStyle: "uppercase-code",
    resolutionPulse: true,
    minimizedOrb: "lime-breath",
    placeholder: "Fleet telemetry online. What should we optimize today?",
    starterPrompts: [
      "Identify idle vehicles reducing revenue.",
      "Optimize fleet pricing by location.",
      "Reduce fuel and maintenance costs.",
      "Improve utilization across the fleet.",
      "Predict maintenance risks.",
      "Analyze customer demand trends.",
      "Draft a rental upsell campaign.",
      "Recover underperforming assets.",
    ],
    toolPanels: [
      // Fleet Utilization
      { id: "fleet_util", category: "Fleet Utilization", label: "Fleet Utilization Analysis", icon: "Gauge", prompt: "Analyze current fleet utilization by vehicle and flag idle or underused assets across all locations." },
      { id: "idle_recovery", category: "Fleet Utilization", label: "Idle Asset Recovery", icon: "Zap", prompt: "Identify idle vehicles and generate a recovery plan to monetize them within 48 hours." },
      // Dynamic Pricing
      { id: "pricing_opt", category: "Dynamic Pricing", label: "Dynamic Pricing Optimization", icon: "DollarSign", prompt: "Recommend dynamic pricing adjustments by location and demand to maximize fleet revenue." },
      // Maintenance
      { id: "maintenance_pred", category: "Maintenance", label: "Maintenance Prediction", icon: "Wrench", prompt: "Predict maintenance risks across the fleet and flag vehicles needing immediate attention." },
      { id: "damage_risk", category: "Maintenance", label: "Damage Risk Analysis", icon: "Shield", prompt: "Run a damage risk analysis and surface vehicles with historically high damage or insurance claims." },
      // Demand Forecasting
      { id: "demand_forecast", category: "Demand Forecasting", label: "Demand Forecasting", icon: "LineChart", prompt: "Forecast customer demand by location and vehicle class for the next 14 days." },
      // Customer Experience
      { id: "upsell_campaign", category: "Customer Experience", label: "Upsell Campaign Generator", icon: "Gift", prompt: "Generate a rental upsell campaign targeting current and upcoming bookings." },
      // Communication
      { id: "customer_comm", category: "Communication", label: "Customer Communication", icon: "MessageSquare", prompt: "Draft customer-facing communications for delay notifications, pickup reminders and return confirmations." },
    ],
    metricBadges: [
      { id: "fleet_util", label: "Fleet Utilization", endpoint: "/metrics/car_rental/fleet_utilization", unit: "%" },
      { id: "idle_vehicles", label: "Idle Vehicles", endpoint: "/metrics/car_rental/idle_vehicles" },
      { id: "rev_per_vehicle", label: "Rev/Vehicle", endpoint: "/metrics/car_rental/revenue_per_vehicle" },
      { id: "adr", label: "ADR", endpoint: "/metrics/car_rental/average_daily_rate" },
      { id: "maint_risk", label: "Maint Risk", endpoint: "/metrics/car_rental/maintenance_risk" },
      { id: "fuel_eff", label: "Fuel Eff", endpoint: "/metrics/car_rental/fuel_efficiency" },
      { id: "damage_rate", label: "Damage %", endpoint: "/metrics/car_rental/damage_rate", unit: "%" },
      { id: "booking_conv", label: "Booking Conv", endpoint: "/metrics/car_rental/booking_conversion", unit: "%" },
    ],
    channels: [
      { id: "gps", label: "GPS", icon: "Navigation" },
      { id: "telematics", label: "Telematics", icon: "Activity" },
      { id: "pricing", label: "Pricing", icon: "DollarSign" },
      { id: "maintenance", label: "Maintenance", icon: "Wrench" },
      { id: "whatsapp", label: "WhatsApp", icon: "MessageCircle" },
      { id: "email", label: "Email", icon: "Mail" },
      { id: "payments", label: "Payments", icon: "CreditCard" },
    ],
  },
  healthcare: {
    industry: "healthcare",
    name: "Dr. Lyra",
    designation:
      "Clinical Operations & Patient Experience Director — Healthcare & Clinics",
    vibe: "Caring, professional. Patient-first approach, precise.",
    accent: "from-[#a7f3d0]/30 via-[#ffffff]/20 to-[#cbd5e1]/15",
    auraHsl: "158 70% 60%",
    shortTitle: "Clinical Operations Director",
    placeholder: "System Vitals: Stable. How can I assist with patient care today?",
    ekgPulse: true,
    trustScore: { label: "Lyra Trust Score", value: "99.9%", sub: "1,000+ Cases Resolved" },
    sherlockShieldGlow: true,
    minimizedOrb: "mint-breath",
    resolutionPulse: true,
    starterPrompts: [
      "Analyze this patient's risk profile.",
      "Predict potential complications in the next 48 hours.",
      "Verify insurance authorization.",
      "Check for drug interaction risks.",
      "Generate a treatment plan.",
      "Optimize clinic revenue opportunities.",
      "Draft patient follow-up instructions.",
      "Review missed appointment patterns.",
    ],
    toolPanels: [
      // Patient Care
      { id: "predictive_pathology", category: "Patient Care", label: "Predictive Pathology", icon: "Activity", prompt: "Run a predictive pathology analysis for this patient based on latest vitals, labs and history." },
      { id: "biowearable_sync", category: "Patient Care", label: "Bio-Wearable Sync", icon: "Heart", prompt: "Sync the latest bio-wearable data (heart rate, glucose, SpO2, sleep) and flag anomalies." },
      { id: "triage", category: "Patient Care", label: "Autonomous Triage", icon: "AlertTriangle", prompt: "Initiate an urgent-care triage protocol — stream vitals and notify the relevant specialist." },
      // Clinical Operations
      { id: "appointment_opt", category: "Clinical Operations", label: "Appointment Optimization", icon: "CalendarClock", prompt: "Optimize today's schedule to reduce wait time and no-shows." },
      // Risk & Compliance
      { id: "drug_interaction", category: "Risk & Compliance", label: "Drug Interaction Shield", icon: "Pill", prompt: "Audit the current medication list for interactions, contraindications and dosing risks." },
      // Insurance & Billing
      { id: "insurance_sniper", category: "Insurance & Billing", label: "Insurance Sniper", icon: "ShieldCheck", prompt: "Verify insurance authorization for the proposed treatment and surface any denial paths or financing options." },
      { id: "claims", category: "Insurance & Billing", label: "Claims Acceleration", icon: "FileText", prompt: "Accelerate pending claims and flag any rejection risks for the next 7 days." },
      // Pharmacy
      { id: "prescription_fulfilment", category: "Pharmacy", label: "Prescription Fulfilment Check", icon: "Pill", prompt: "Audit today's prescriptions for fulfilment status, stock-outs and patient pickup risks; flag follow-ups needed." },
      // Communication
      { id: "patient_comm", category: "Communication", label: "Patient Communication", icon: "MessageSquare", prompt: "Draft personalised follow-up instructions for today's discharged patients." },
    ],
    metricBadges: [
      { id: "risk_score", label: "Risk Score", endpoint: "/metrics/healthcare/patient_risk_score" },
      { id: "appt_util", label: "Appt Utilization", endpoint: "/metrics/healthcare/appointment_utilization", unit: "%" },
      { id: "claim_approval", label: "Claim Approval", endpoint: "/metrics/healthcare/claim_approval_rate", unit: "%" },
      { id: "no_show", label: "No-Show", endpoint: "/metrics/healthcare/no_show_rate", unit: "%" },
      { id: "wait_time", label: "Avg Wait", endpoint: "/metrics/healthcare/average_wait_time", unit: "min" },
      { id: "rev_per_patient", label: "Rev/Patient", endpoint: "/metrics/healthcare/revenue_per_patient" },
      { id: "satisfaction", label: "Satisfaction", endpoint: "/metrics/healthcare/satisfaction_score" },
      { id: "bed_occupancy", label: "Bed Occupancy", endpoint: "/metrics/healthcare/bed_occupancy", unit: "%" },
    ],
    channels: [
      { id: "ehr", label: "EHR", icon: "FileText" },
      { id: "insurance", label: "Insurance", icon: "ShieldCheck" },
      { id: "lab", label: "Lab", icon: "FlaskConical" },
      { id: "pharmacy", label: "Pharmacy", icon: "Pill" },
      { id: "wearables", label: "Wearables", icon: "Watch" },
      { id: "whatsapp", label: "WhatsApp", icon: "MessageCircle" },
      { id: "email", label: "Email", icon: "Mail" },
    ],
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
    starterPrompts: [
      "Analyze this term's student performance and flag who needs help.",
      "Show my enrollment funnel and where prospects are dropping off.",
      "Identify students at high dropout risk this month.",
      "Review teacher workload distribution and flag overload.",
      "Plan the next two weeks of assignments balanced across subjects.",
      "Draft this week's parent update covering progress and attendance.",
      "Suggest optimal batch sizes and schedules for next intake.",
      "Surface top and bottom performing instructors by outcomes.",
    ],
    toolPanels: [
      // Academics
      { id: "edu_performance", category: "Academics", label: "Student Performance Review", icon: "LineChart", prompt: "Analyze this term's grades and flag students needing intervention with concrete next steps." },
      { id: "edu_curriculum_gap", category: "Academics", label: "Curriculum Gap Analysis", icon: "FileText", prompt: "Review my curriculum coverage and highlight gaps before final exams, by subject and class." },
      { id: "edu_assignment_plan", category: "Academics", label: "Assignment & Assessment Planner", icon: "CalendarClock", prompt: "Plan the next 2 weeks of assignments balanced across subjects and class workload." },
      // Enrollment & Growth
      { id: "edu_funnel", category: "Enrollment & Growth", label: "Lead → Enrollment Funnel", icon: "TrendingUp", prompt: "Show my enrollment funnel from inquiry to enrolled and where prospects are dropping off." },
      { id: "edu_batch", category: "Enrollment & Growth", label: "Batch Capacity Optimization", icon: "Database", prompt: "Suggest optimal batch sizes, timings and instructor pairings for the next intake." },
      { id: "edu_reenroll", category: "Enrollment & Growth", label: "Re-enrollment Outreach", icon: "MessageSquare", prompt: "Draft re-enrollment messages for students who haven't registered for next term, segmented by risk." },
      // Attendance & Retention
      { id: "edu_dropout", category: "Attendance & Retention", label: "Dropout Risk Scan", icon: "AlertTriangle", prompt: "Identify students at high dropout risk and recommend personalised retention actions." },
      { id: "edu_attendance", category: "Attendance & Retention", label: "Attendance Pattern Analysis", icon: "Activity", prompt: "Analyze attendance patterns over the last month and flag chronic absentees with suggested follow-ups." },
      // Faculty & Operations
      { id: "edu_teacher_load", category: "Faculty & Operations", label: "Teacher Workload Review", icon: "User", prompt: "Review teacher workload distribution and flag overload, underload and rebalancing opportunities." },
      { id: "edu_instructor_perf", category: "Faculty & Operations", label: "Instructor Performance", icon: "Star", prompt: "Surface top and bottom performing instructors by student outcomes, retention and feedback." },
      // Communication
      { id: "edu_parent_comm", category: "Communication", label: "Parent Communication", icon: "Mail", prompt: "Draft this week's parent update covering progress, attendance and upcoming events." },
      { id: "edu_student_comm", category: "Communication", label: "Student Announcement", icon: "MessageCircle", prompt: "Draft a clear announcement for the upcoming exam schedule change, friendly and concise." },
    ],
    metricBadges: [
      { id: "active_students", label: "Active Students", endpoint: "/metrics/education/active_students", unit: "" },
      { id: "attendance_rate", label: "Attendance", endpoint: "/metrics/education/attendance_rate", unit: "%" },
      { id: "dropout_risk", label: "Dropout Risk", endpoint: "/metrics/education/dropout_risk", unit: "%" },
      { id: "enrollment_pipeline", label: "Enrollment Pipeline", endpoint: "/metrics/education/enrollment_pipeline", unit: "" },
    ],
    channels: [
      { id: "email", label: "Email", icon: "Mail" },
      { id: "whatsapp", label: "WhatsApp", icon: "MessageCircle" },
      { id: "sms", label: "SMS", icon: "MessageSquare" },
      { id: "parent_portal", label: "Parent Portal", icon: "ShieldCheck" },
    ],
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
      // Route Optimization
      { id: "route_opt", category: "Route Optimization", label: "🗺️ Route Optimization", icon: "Map", prompt: "Optimize today's delivery routes to minimize miles, fuel and SLA risk. Compare alternate routes, factor live traffic and weather, and surface SLA risk per stop." },
      // Fleet Operations
      { id: "fleet_util", category: "Fleet Operations", label: "🚚 Fleet Utilization Analysis", icon: "Truck", prompt: "Analyze current fleet utilization and flag underused, idle or overloaded vehicles across all depots." },
      { id: "driver", category: "Fleet Operations", label: "🧑‍✈️ Driver Productivity Analysis", icon: "User", prompt: "Analyze driver productivity and safety scores; rank top and bottom performers and flag retraining candidates." },
      // Fuel & Cost Control
      { id: "fuel", category: "Fuel & Cost Control", label: "⛽ Fuel Efficiency Insights", icon: "Fuel", prompt: "Show the top fuel-saving opportunities across the fleet for the last 30 days, by route, driver and vehicle." },
      // Delivery Performance
      { id: "delivery_perf", category: "Delivery Performance", label: "📦 Delivery Performance Analysis", icon: "PackageCheck", prompt: "Break down on-time delivery performance by route, driver and customer; surface at-risk shipments today." },
      { id: "bottlenecks", category: "Delivery Performance", label: "⚠️ Supply Chain Bottleneck Detection", icon: "AlertTriangle", prompt: "Detect current bottlenecks across pickup, line-haul, warehouse and last-mile, and recommend the top 3 unblocking actions." },
      // Warehouse
      { id: "warehouse", category: "Warehouse", label: "🏭 Warehouse Throughput Review", icon: "Warehouse", prompt: "Review warehouse throughput, dock utilization and dwell time; recommend the top 3 actions to lift throughput this week." },
      // Communication
      { id: "customer_comm", category: "Communication", label: "💬 Customer Delay Communication", icon: "MessageSquare", prompt: "Draft customer-facing delay notifications for at-risk shipments today, with revised ETAs and remediation options." },
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
      { id: "weather", label: "Weather", icon: "CloudSun" },
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
    starterPrompts: [
      "Plan the run of show for our next headline event.",
      "Recommend dynamic ticket pricing for the upcoming show.",
      "Identify under-performing audience segments and retarget them.",
      "Draft sponsor outreach for our next tour stop.",
      "Forecast ticket sell-through for the next 14 days.",
      "Audit artist riders and production needs for tomorrow's show.",
      "Show no-show patterns by event and segment.",
      "Draft an attendee announcement for schedule changes.",
    ],
    toolPanels: [
      // Event Planning
      { id: "vega_runbook", category: "Event Planning", label: "Show Runbook Builder", icon: "CalendarClock", prompt: "Build a detailed run of show for our next event including cues, transitions and crew assignments." },
      { id: "vega_venue_capacity", category: "Event Planning", label: "Venue Capacity Planning", icon: "Building2", prompt: "Plan venue capacity, layout and zone allocation for our upcoming show based on ticket types sold." },
      { id: "vega_talent_sched", category: "Event Planning", label: "Talent & Crew Scheduling", icon: "Users", prompt: "Schedule talent, crew and rehearsals for the next 7 days and flag conflicts." },
      // Ticket Revenue
      { id: "vega_dynamic_pricing", category: "Ticket Revenue", label: "Dynamic Ticket Pricing", icon: "DollarSign", prompt: "Recommend dynamic ticket pricing for the upcoming show based on demand curve and comparable events." },
      { id: "vega_presale", category: "Ticket Revenue", label: "Presale Strategy", icon: "Ticket", prompt: "Design a presale waves strategy with pricing tiers, holds and fan-club access." },
      // Audience Growth
      { id: "vega_segments", category: "Audience Growth", label: "Audience Segment Targeting", icon: "Target", prompt: "Identify high-value audience segments and recommend targeted acquisition campaigns." },
      { id: "vega_retargeting", category: "Audience Growth", label: "Retargeting Campaign", icon: "TrendingUp", prompt: "Draft a retargeting campaign for past attendees who haven't bought tickets for the next show." },
      // Production Operations
      { id: "vega_riders", category: "Production Operations", label: "Artist Rider Check", icon: "FileText", prompt: "Audit artist riders for tomorrow's show and flag any unmet hospitality or technical requirements." },
      { id: "vega_run_of_show", category: "Production Operations", label: "Production Status Review", icon: "Activity", prompt: "Review production status — lighting, sound, staging — and surface readiness risks for the next event." },
      // Sponsorship
      { id: "vega_sponsor_outreach", category: "Sponsorship", label: "Sponsor Outreach", icon: "Mail", prompt: "Draft sponsor outreach emails for our next tour with audience demographics and activation options." },
      { id: "vega_activation_roi", category: "Sponsorship", label: "Sponsor Activation ROI", icon: "LineChart", prompt: "Measure ROI of recent sponsor activations and recommend optimizations for renewals." },
      // Communication
      { id: "vega_attendee_announce", category: "Communication", label: "Attendee Announcement", icon: "MessageSquare", prompt: "Draft an attendee announcement for schedule changes, venue updates or special guests." },
    ],
    metricBadges: [
      { id: "tickets_sold_pct", label: "Tickets Sold %", endpoint: "/metrics/events_entertainment/tickets_sold_pct", unit: "%" },
      { id: "avg_ticket_price", label: "Avg Ticket", endpoint: "/metrics/events_entertainment/avg_ticket_price" },
      { id: "sponsor_revenue", label: "Sponsor Rev", endpoint: "/metrics/events_entertainment/sponsor_revenue" },
      { id: "no_show", label: "No-Show %", endpoint: "/metrics/events_entertainment/no_show_rate", unit: "%" },
    ],
    channels: [
      { id: "eventbrite", label: "Eventbrite", icon: "Ticket" },
      { id: "ticketmaster", label: "Ticketmaster", icon: "Ticket" },
      { id: "email", label: "Email", icon: "Mail" },
      { id: "whatsapp", label: "WhatsApp", icon: "MessageCircle" },
    ],
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
    starterPrompts: [
      "Review on-time performance across the network.",
      "Optimize today's timetable for peak demand.",
      "Forecast load factor for the next 14 days.",
      "Flag rolling stock needing predictive maintenance.",
      "Identify stations with high passenger complaints.",
      "Draft a delay notification for affected passengers.",
      "Plan crew rotations for the upcoming week.",
      "Show capacity utilization by route and time band.",
    ],
    toolPanels: [
      // Network Performance
      { id: "kai_otp", category: "Network Performance", label: "On-Time Performance Review", icon: "Timer", prompt: "Review on-time performance across the network for the last 30 days and rank routes by punctuality." },
      { id: "kai_route_health", category: "Network Performance", label: "Route Health Scan", icon: "Activity", prompt: "Scan route health — delays, cancellations, incidents — and flag routes needing intervention." },
      // Scheduling
      { id: "kai_timetable", category: "Scheduling", label: "Timetable Optimization", icon: "CalendarClock", prompt: "Optimize the timetable for peak demand windows and recommend service additions or trims." },
      { id: "kai_crew_rotation", category: "Scheduling", label: "Crew Rotation Planner", icon: "Users", prompt: "Plan crew rotations for the upcoming week and flag duty-hour or rest-rule risks." },
      // Capacity Management
      { id: "kai_load_factor", category: "Capacity Management", label: "Load Factor Forecast", icon: "TrendingUp", prompt: "Forecast load factor for the next 14 days by route and time band, with seat-release recommendations." },
      { id: "kai_peak_demand", category: "Capacity Management", label: "Peak Demand Sizing", icon: "LineChart", prompt: "Size capacity for peak demand events (holidays, sport, festivals) and recommend extra services." },
      // Maintenance
      { id: "kai_rolling_stock", category: "Maintenance", label: "Rolling Stock Audit", icon: "Wrench", prompt: "Audit rolling stock condition and flag units approaching maintenance windows." },
      { id: "kai_predictive_maint", category: "Maintenance", label: "Predictive Maintenance", icon: "ShieldCheck", prompt: "Run predictive maintenance analysis and surface failure risks for the next 30 days." },
      // Passenger Experience
      { id: "kai_complaints", category: "Passenger Experience", label: "Complaint Pattern Analysis", icon: "AlertTriangle", prompt: "Analyze complaint patterns by station and route; rank issues by frequency and severity." },
      { id: "kai_station_throughput", category: "Passenger Experience", label: "Station Throughput Review", icon: "Building2", prompt: "Review station throughput and crowding patterns; recommend gating and signage improvements." },
      // Communication
      { id: "kai_delay_notice", category: "Communication", label: "Passenger Delay Notice", icon: "MessageSquare", prompt: "Draft a clear passenger delay notification with rebooking guidance and refund eligibility." },
      { id: "kai_station_announce", category: "Communication", label: "Station Announcement", icon: "Megaphone", prompt: "Draft a station announcement for service disruptions, platform changes or weather alerts." },
    ],
    metricBadges: [
      { id: "punctuality", label: "Punctuality %", endpoint: "/metrics/railways/punctuality", unit: "%" },
      { id: "load_factor", label: "Load Factor %", endpoint: "/metrics/railways/load_factor", unit: "%" },
      { id: "avg_delay", label: "Avg Delay", endpoint: "/metrics/railways/avg_delay", unit: "min" },
      { id: "cancellation_rate", label: "Cancel %", endpoint: "/metrics/railways/cancellation_rate", unit: "%" },
    ],
    channels: [
      { id: "sms", label: "SMS", icon: "MessageCircle" },
      { id: "email", label: "Email", icon: "Mail" },
      { id: "station_displays", label: "Station Displays", icon: "Monitor" },
      { id: "whatsapp", label: "WhatsApp", icon: "MessageCircle" },
    ],
    radar: {
      endpoint: "/metrics/railways/radar",
      title: "Live Network Map",
    },
  },
};

export function getAdvisor(industry?: string | null): AdvisorConfig {
  const key = (industry || "hospitality") as IndustryType;
  return ADVISORS[key] || ADVISORS.hospitality;
}
