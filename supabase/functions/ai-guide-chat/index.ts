import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DASHBOARD_FEATURES: Record<string, string[]> = {
  hospitality: [
    "Smart Calendar — AI-powered drag-and-drop booking calendar with auto-optimization",
    "Booking Manager — Create, edit, reschedule and manage all bookings",
    "Resource Manager — Manage properties, rooms, tour packages and assets",
    "AI Auto-Schedule — Let AI automatically fill gaps and optimize scheduling",
    "Auto Pricing — Dynamic pricing based on demand, season and competition",
    "Double Booking Guard — AI-powered real-time conflict detection. Automatically detects overlapping bookings, tries auto-reassignment to a different resource, auto-reschedules to next available slot (up to 7 days), or auto-declines with explanation. Sends AI confirmation/reschedule emails to customers automatically. All conflicts logged in booking_conflicts table.",
    "Occupancy Heatmap, Revenue Forecast, Guest Scoring, Gap Filler widgets",
    "Smart Pricing Card — AI suggests optimal prices per night",
    "Alerts Panel — Real-time notifications for bookings and issues",
    "Industry KPIs — Occupancy Rate, RevPAR, Booking Rate, Satisfaction",
  ],
  airlines: [
    "Flight Manager — Manage flights, routes, and schedules",
    "Airline Operations Dashboard — Real-time flight status and crew management",
    "AI Auto-Schedule — Optimize flight schedules automatically",
    "Double Booking Guard — AI-powered real-time conflict detection for flights and gates. Automatically detects overlapping flight schedules, tries auto-reassignment to a different gate/aircraft, auto-reschedules to next available slot, or auto-declines. Sends AI confirmation emails to passengers automatically.",
    "Crew Scheduling, Gate Assignment, Load Factor, Delay Tracker widgets",
    "Route Optimizer, Fuel Forecast, Maintenance Calendar tools",
    "AI Ticket Generator — Auto-generates downloadable boarding pass with QR code when booking is confirmed. Includes passenger name, flight details, times, and booking reference.",
    "AI Ticket Email — Automatically emails the ticket/boarding pass to the passenger when booking is confirmed (Pro & Premium only).",
    "Industry KPIs — Load Factor, On-Time Rate, Revenue/Seat, Turnaround",
  ],
  car_rental: [
    "Vehicle Manager — Track and manage entire vehicle fleet",
    "Smart Calendar — Booking calendar with fleet availability",
    "Auto Pricing — Dynamic pricing based on demand and vehicle type",
    "Double Booking Guard — AI-powered real-time conflict detection for vehicle reservations. Automatically detects overlapping vehicle bookings, tries auto-reassignment to a different vehicle, auto-reschedules to next available slot, or auto-declines. Sends AI confirmation emails to renters automatically.",
    "Fleet Utilization, Maintenance Tracker, Insurance Manager widgets",
    "Industry KPIs — Fleet Utilization, Revenue/Vehicle, Booking Rate",
  ],
  education: [
    "Timetable Manager — Create and manage class schedules",
    "Resource Manager — Manage classrooms, labs, and equipment",
    "AI Auto-Schedule — Auto-generate optimal timetables",
    "Double Booking Guard — AI-powered real-time conflict detection for classrooms and labs. Automatically detects overlapping class schedules, tries auto-reassignment to a different room, auto-reschedules to next available slot, or auto-declines. Sends AI confirmation emails to students/staff automatically.",
    "Student Enrollment, Attendance Tracker, Grade Analytics widgets",
    "Industry KPIs — Enrollment Rate, Attendance, Pass Rate",
  ],
  logistics: [
    "Logistics Manager — Manage shipments, warehouses, and routes",
    "Route Optimizer — AI-optimized delivery routes",
    "Fleet Manager — Track vehicles and drivers",
    "Double Booking Guard — AI-powered real-time conflict detection for vehicles and drivers. Automatically detects overlapping dispatch schedules, tries auto-reassignment to a different vehicle/driver, auto-reschedules to next available slot, or auto-declines. Sends AI confirmation emails to clients automatically.",
    "Shipment Tracker, Warehouse Capacity, Delivery Analytics widgets",
    "Industry KPIs — On-Time Delivery, Fleet Utilization, Cost/Shipment",
  ],
  events_entertainment: [
    "Events Manager — Create and manage events, venues, tickets",
    "Smart Calendar — Event scheduling with venue availability",
    "Capacity Planner — Manage venue capacity and seating",
    "Double Booking Guard — AI-powered real-time conflict detection for venues. Automatically detects overlapping venue bookings, tries auto-reassignment to a different venue/hall, auto-reschedules to next available slot, or auto-declines. Sends AI confirmation emails to organizers automatically.",
    "Ticket Sales, Vendor Management, Event Analytics widgets",
    "AI Ticket Generator — Auto-generates downloadable event ticket with QR code when booking is confirmed. Includes attendee name, venue, event times, and booking reference.",
    "AI Ticket Email — Automatically emails the event ticket to the attendee when booking is confirmed (Pro & Premium only).",
    "Industry KPIs — Ticket Sales, Venue Utilization, Revenue/Event",
  ],
  healthcare: [
    "Healthcare Manager — Manage appointments, patients, and staff",
    "AI Scheduling — Smart appointment scheduling",
    "Resource Manager — Manage rooms, equipment, and staff",
    "Double Booking Guard — AI-powered real-time conflict detection for appointments. Automatically detects overlapping patient appointments, tries auto-reassignment to a different doctor/room, auto-reschedules to next available slot, or auto-declines. Sends AI confirmation emails to patients automatically.",
    "Patient Flow, Wait Time Tracker, Staff Scheduling widgets",
    "Industry KPIs — Patient Satisfaction, Wait Time, Appointment Rate",
  ],
  railways: [
    "Train Manager — Manage trains, coaches, and routes",
    "Schedule Manager — Create and optimize train schedules",
    "Booking System — Passenger booking with seat selection",
    "Double Booking Guard — AI-powered real-time conflict detection for train schedules. Automatically detects overlapping train/coach schedules, tries auto-reassignment to a different coach/platform, auto-reschedules to next available slot, or auto-declines. Sends AI confirmation emails to passengers automatically.",
    "Route Stops, Pricing Overrides, Coach Management tools",
    "AI Ticket Generator — Auto-generates downloadable train ticket with QR code when booking is confirmed. Includes passenger name, train/coach details, route, and booking reference.",
    "AI Ticket Email — Automatically emails the train ticket to the passenger when booking is confirmed (Pro & Premium only).",
    "Industry KPIs — Occupancy Rate, On-Time Performance, Revenue/Train",
  ],
};

const PREMIUM_FEATURES = [
  "Custom AI Training — Train AI on your specific business patterns, terminology and workflows. Available for ALL 8 industries. Premium plan only.",
];

const PLAN_FEATURES = {
  basic: {
    name: "Basic",
    price: "$25/month",
    features: [
      "Includes 1 industry (workspace)",
      "Up to 100 CRM contacts",
      "Up to 50 bookings/month",
      "AI Calendar — limited",
      "AI Pricing — limited",
      "Calendar sync",
      "Double-booking protection",
      "Email notifications",
      "Basic analytics",
    ],
  },
  pro: {
    name: "Pro",
    price: "$55/month",
    features: [
      "Includes 1 industry (workspace)",
      "Unlimited contacts (CRM)",
      "Unlimited bookings",
      "All Basic features included",
      "AI scheduling",
      "AI follow-ups (automation)",
      "Client/lead scoring",
      "AI Ticket Generator (Airlines, Railways, Events)",
      "Advanced analytics",
      "Competitor insights",
      "Gap-filling engine",
      "Full AI Calendar",
      "Full AI Pricing",
      "Double-booking guard",
      "Ticket email confirmation",
      "Priority support",
    ],
  },
  premium: {
    name: "Premium",
    price: "$110/month",
    features: [
      "Includes 1 industry (workspace)",
      "Unlimited contacts (CRM)",
      "Unlimited bookings",
      "All Pro features included",
      "Advanced AI CRM (full suite)",
      "AI lead scoring & churn prediction",
      "AI automation & smart workflows",
      "AI Voice Assistant",
      "AI Ticket Generator + Email (Airlines, Railways, Events)",
      "Custom AI Training (all industries)",
      "Double-booking guard",
      "Smart tasks & AI planner",
      "Deal pipeline & revenue analytics",
      "Google Workspace integration",
      "AI demand forecasting (Hospitality, Airlines, Car Rental, Events, Railways)",
      "AI conflict resolution",
      "Revenue optimization",
      "Route optimization (Logistics, Airlines, Railways)",
      "Dedicated account manager",
    ],
  },
};

const CRM_FEATURES = [
  "Contacts — Manage all your contacts with AI scoring, lifecycle stages, tags and churn prediction",
  "Tickets — Customer support tickets with AI categorization, sentiment analysis and SLA tracking",
  "Deals — Sales pipeline with drag-and-drop stages, probability tracking and revenue forecasting",
  "Activities — Track all interactions: calls, emails, meetings with timeline view",
  "Analytics — Revenue charts, performance trends, conversion funnels",
  "AI Insights — AI-powered analysis of your data with actionable recommendations",
  "Email AI — AI-powered email composer that drafts professional emails for you",
  "Revenue Forecast — Predictive revenue modeling based on your pipeline",
  "Competitor Intelligence — Track competitors and market positioning",
  "Sentiment Dashboard — Monitor customer sentiment across interactions",
  "Smart Meeting Scheduler — AI suggests optimal meeting times",
  "Performance — Team performance tracking with productivity scores",
  "Security — Activity monitoring, security alerts, audit trail",
  "Industry Connect — Network with others in your industry",
  "Work Timer — Pomodoro-style work/break timer with productivity tracking",
  "Break Games — Fun mini-games during breaks to recharge",
  "Voice Assistant — AI voice assistant for hands-free CRM navigation",
  "Quick Actions — One-click shortcuts for common CRM tasks",
];

const TEAM_CONNECT_INFO: Record<string, string> = {
  hospitality: `
## Team Connect — Hospitality 🏨
HostFlow AI mein aap apni poori hotel/property team ko connect kar sakte hain. Har role ko specific access milta hai:

### Roles & Access:
1. **Owner** — Full access: CRM, AI Pricing, Billing, Settings, Analytics, Competitor Radar, Gap Night Filler, Guest Score — sab kuch
2. **Manager** — Full access minus billing/payment settings. Bookings, CRM, AI tools, analytics sab use kar sakta hai
3. **Floor Manager** — Full operational access: Bookings, Rooms, Staff management, Calendar, Guest Score, CRM tools
4. **Front Desk** — Full operational access: Bookings, Check-in/out, Guest profiles, Calendar + Housekeeping tasks manage karna

### Housekeeping Staff:
- Housekeeping ko direct app access NAHI milta
- Front Desk unki tasks create aur assign karta hai system mein
- Room status updates Front Desk handle karta hai

### Kaise Connect Karein:
1. **Owner/Manager** account create kare aur industry select kare (Hospitality)
2. Settings → Team Management → "Invite Team Member" click kare
3. Invite link ya email se team members ko add kare
4. Har member ko appropriate role assign kare (Manager, Floor Manager, Front Desk)
5. Team member invite accept kare → automatically same workspace mein connect ho jayega
6. Sab ka data shared hota hai — bookings, guests, calendar ek hi system mein

### Important:
- Sirf Owner billing settings change kar sakta hai
- Manager aur Floor Manager operations manage kar sakte hain
- Front Desk sirf bookings aur guest management dekh sakta hai
- Housekeeping ka kaam Front Desk assign karta hai
`,
  airlines: `
## Team Connect — Airlines ✈️
Coming soon: Airline Admin, Operations Manager, Crew Member, Gate Agent roles.
`,
  car_rental: `
## Team Connect — Car Rental 🚗
Coming soon: Fleet Owner, Branch Manager, Rental Agent roles.
`,
  healthcare: `
## Team Connect — Healthcare 🏥
Coming soon: Clinic Admin, Doctor, Receptionist, Nurse roles.
`,
  education: `
## Team Connect — Education 🎓
Coming soon: Institute Admin, Teacher, Student roles.
`,
  logistics: `
## Team Connect — Logistics 🚚
Coming soon: Company Owner, Dispatcher, Driver, Warehouse Staff roles.
`,
  events_entertainment: `
## Team Connect — Events 🎭
Coming soon: Event Organizer, Venue Manager, Event Staff roles.
`,
  railways: `
## Team Connect — Railways 🚆
Coming soon: Railway Admin, Station Master, Train Crew, Booking Agent roles.
`,
};

const SETTINGS_FEATURES = [
  "Profile — Update your display name, company, phone and personal details",
  "Language — Switch between 13+ languages (English, Urdu, Hindi, Arabic, German, etc.)",
  "Notifications — Control email, push, and marketing notification preferences",
  "Theme — Switch between Dark, Light and System themes",
  "Industry — View and change your industry type (Hospitality, Airlines, etc.)",
  "Workspaces — Create and switch between multiple workspaces for different businesses",
  "Subscription — View your current plan, upgrade to Premium for full features",
];

function buildSystemPrompt(context: string, industry: string): string {
  const dashboardFeatures = DASHBOARD_FEATURES[industry] || DASHBOARD_FEATURES["hospitality"];

  const planInfo = `
## Pricing Plans:
### Basic ($25/month):
${PLAN_FEATURES.basic.features.map((f) => `- ${f}`).join("\n")}

### Pro ($55/month) — Most Popular:
${PLAN_FEATURES.pro.features.map((f) => `- ${f}`).join("\n")}

### Premium ($110/month) — Advanced AI CRM Hub:
${PLAN_FEATURES.premium.features.map((f) => `- ${f}`).join("\n")}

All plans include a 7-day free trial — no credit card required.
AI Ticket Generator is ONLY for Airlines, Railways, Events industries.
AI Pricing/Demand Forecasting is ONLY for Hospitality, Airlines, Car Rental, Events, Railways.
Competitor Radar & Gap Filler are ONLY for Hospitality.
Route Optimization is ONLY for Logistics, Airlines, Railways.
`;

  const teamInfo = TEAM_CONNECT_INFO[industry] || TEAM_CONNECT_INFO["hospitality"];

  let featureList = "";
  if (context === "dashboard") {
    featureList = `
## Dashboard Features (${industry}):
${dashboardFeatures.map((f) => `- ${f}`).join("\n")}

## Premium-Only Features:
${PREMIUM_FEATURES.map((f) => `- ${f}`).join("\n")}

${teamInfo}

${planInfo}

IMPORTANT: Only explain Dashboard features. When asked about team/connect, explain team roles and invite process.`;
  } else if (context === "crm") {
    featureList = `
## AI CRM Features:
${CRM_FEATURES.map((f) => `- ${f}`).join("\n")}

${teamInfo}

${planInfo}

IMPORTANT: Only explain CRM features. When asked about team/connect, explain team roles and how they connect to CRM.`;
  } else if (context === "settings") {
    featureList = `
## Settings Features:
${SETTINGS_FEATURES.map((f) => `- ${f}`).join("\n")}
- Team Management — Invite team members, assign roles, manage access levels

${teamInfo}

${planInfo}

IMPORTANT: Only explain Settings features. When asked about team, explain team management and invite process.`;
  } else {
    featureList = planInfo + "\n" + teamInfo;
  }

  return `You are the HostFlow AI Guide — a friendly, knowledgeable assistant that helps users understand the features of HostFlow AI platform.

Your role:
- Explain features in simple, easy-to-understand language
- Give step-by-step guidance when asked "how to" do something
- Be concise but thorough — a normal person should easily understand
- Use the user's language (if they write in Urdu/Hindi, reply in that language)
- Be warm, encouraging, and professional
- Use emojis sparingly to keep it friendly
- If asked about a feature not in your current page context, politely guide them to the right page

Current page: ${context.toUpperCase()}
User's industry: ${industry}

${featureList}

RULES:
1. NEVER mix features from different pages
2. Always relate explanations to the user's industry (${industry})
3. Keep responses short (2-4 paragraphs max)
4. If unsure, suggest the user explore or ask a more specific question
5. You are NOT a general-purpose AI — only answer about HostFlow AI features`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context, industry } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = buildSystemPrompt(context || "dashboard", industry || "hospitality");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-guide-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
