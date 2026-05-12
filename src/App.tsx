import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import Index from "./pages/Index";
import { backendFetch, syncManifest, notifyChangelog } from "@/lib/backend";
import { connectBrainStream } from "@/lib/brain-sync";
import AiLimitModal from "@/components/AiLimitModal";
import SurfaceGuard from "@/components/SurfaceGuard";
import { FloatingAdvisorChatProvider } from "@/components/advisor/FloatingAdvisorChat";

const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CRM = lazy(() => import("./pages/CRM"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Earnings = lazy(() => import("./pages/Earnings"));
const Messages = lazy(() => import("./pages/Messages"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const AIAdvisor = lazy(() => import("./pages/AIAdvisor"));
const RevenueIntelligence = lazy(() => import("./pages/RevenueIntelligence"));
const ResolutionHubPage = lazy(() => import("./pages/ResolutionHubPage"));
const Automations = lazy(() => import("./pages/Automations"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Billing = lazy(() => import("./pages/Billing"));
const Support = lazy(() => import("./pages/Support"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Pricing = lazy(() => import("./pages/Pricing"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const OwnerConsole = lazy(() => import("./pages/OwnerConsole"));
const EnterpriseConsole = lazy(() => import("./pages/EnterpriseConsole"));
const FounderOS = lazy(() => import("./pages/FounderOS"));
const RailwayDashboard = lazy(() => import("./pages/RailwayDashboard"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const CheckoutSuccess = lazy(() => import("./pages/CheckoutSuccess"));
const CheckoutCancelled = lazy(() => import("./pages/CheckoutCancelled"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

/**
 * Invisible bridge: handshake with the Brain on boot, then sync the manifest
 * on every route change / auth change. Renders nothing.
 */
const BrainBridge = () => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    backendFetch("/v1/health")
      .then((r) => r.json())
      .then((res) => {
        if (res?.ok === true) console.log("Brain connected ✓", res?.data ?? res);
      })
      .catch(() => {});
  }, []);

  // Real-time SSE stream from the Replit Brain. Silent background channel.
  useEffect(() => {
    connectBrainStream();
  }, []);

  // One-shot changelog ping: tell Replit what the frontend just shipped.
  // Fires once per browser session (sessionStorage flag).
  useEffect(() => {
    try {
      const KEY = "hf-changelog-2026-05-06-full-handoff-v1";
      if (sessionStorage.getItem(KEY)) return;
      sessionStorage.setItem(KEY, "1");
      notifyChangelog({
        event: "frontend_full_handoff",
        summary:
          "Complete HostFlow AI experience-layer handoff to Replit Brain. Lists every industry, every per-industry AI feature, the full Owner/Founder dashboard surface, and every change Lovable has shipped on the frontend + Cloud edge layer. Source of truth for Replit so frontend and Brain stay in sync.",
        details: {
          handoff_version: "2026-05-06-full",
          ownership_model: {
            frontend: "Lovable (Experience Layer / dumb UI)",
            brain: "Replit (business logic, AI orchestration, billing, scheduling intelligence)",
            ai_provider_policy: "replit_primary; lovable_ai_gateway still active in existing edge functions until Replit migrates them",
          },
          domain: {
            primary: "hostflowai.net",
            owner_email: "naumansherwani@hostflowai.net",
            public_contact_email: "connectai@hostflowai.net",
            removed_public_emails: ["contact@hostflowai.net", "support@hostflowai.net", "any public support@ address"],
          },
          industries: {
            count: 8,
            list: [
              "tourism_hospitality (with sub-types: hotel_property, travel_tours)",
              "airlines",
              "car_rental",
              "healthcare",
              "education",
              "logistics",
              "events_entertainment",
              "railways",
            ],
            ai_assistant_names_per_industry: {
              tourism_hospitality: "HostFlow AI",
              airlines: "SkyFlow AI",
              car_rental: "DriveFlow AI",
              healthcare: "MediFlow AI",
              education: "EduFlow AI",
              logistics: "CargoFlow AI",
              events_entertainment: "EventFlow AI",
              railways: "RailFlow AI",
            },
            features_per_industry: {
              tourism_hospitality: [
                "AI Calendar / Smart Scheduling",
                "Double Booking Guard (auto-reschedule + email)",
                "AI Smart Pricing (season + demand + competitor)",
                "Auto Price Alerts (>15% change → owner notification, 48h expiry)",
                "AI Demand Forecasting",
                "Competitor Radar (hospitality only)",
                "Gap Night Filler (hospitality only)",
                "Guest Score Card (hospitality only)",
                "AI Voice Assistant (ElevenLabs)",
                "CRM (Premium only)",
                "Custom AI Training (Premium only)",
                "Analytics & Reports",
              ],
              airlines: [
                "AI Calendar / Crew Scheduling",
                "Double Booking Guard",
                "AI Smart Pricing + Demand Forecast",
                "Auto Price Alerts",
                "Route Optimization",
                "AI Ticket Generator (Dashboard)",
                "AI Ticket Email auto-send on booking confirm (Pro & Premium)",
                "AI Voice Assistant",
                "CRM (Premium only)",
                "Custom AI Training (Premium only)",
                "Analytics & Reports",
              ],
              car_rental: [
                "AI Calendar / Fleet Scheduling",
                "Double Booking Guard",
                "AI Smart Pricing + Demand Forecast",
                "Auto Price Alerts",
                "Fleet Map (car rental only)",
                "AI Voice Assistant",
                "CRM (Premium only)",
                "Custom AI Training (Premium only)",
                "Analytics & Reports",
              ],
              healthcare: [
                "AI Calendar / Appointment Scheduling",
                "Double Booking Guard",
                "Patient Flow (healthcare only)",
                "Doctor & Patient management (healthcare_doctors / healthcare_patients / healthcare_appointments)",
                "AI Voice Assistant",
                "CRM (Premium only)",
                "Custom AI Training (Premium only)",
                "Analytics & Reports",
                "NO pricing / demand / price-alerts features",
              ],
              education: [
                "AI Calendar / Class Scheduling",
                "Double Booking Guard",
                "Class Schedule (education only)",
                "AI Voice Assistant",
                "CRM (Premium only)",
                "Custom AI Training (Premium only)",
                "Analytics & Reports",
                "NO pricing / demand / price-alerts features",
              ],
              logistics: [
                "AI Calendar / Dispatch Scheduling",
                "Double Booking Guard",
                "Route Optimization",
                "AI Voice Assistant",
                "CRM (Premium only)",
                "Custom AI Training (Premium only)",
                "Analytics & Reports",
                "NO pricing / demand / price-alerts features",
              ],
              events_entertainment: [
                "AI Calendar / Event Scheduling",
                "Double Booking Guard",
                "AI Smart Pricing + Demand Forecast",
                "Auto Price Alerts",
                "Ticket Capacity (events only)",
                "AI Ticket Generator (Dashboard)",
                "AI Ticket Email auto-send on booking confirm (Pro & Premium)",
                "AI Voice Assistant",
                "CRM (Premium only)",
                "Custom AI Training (Premium only)",
                "Analytics & Reports",
              ],
              railways: [
                "AI Calendar / Train Scheduling",
                "Double Booking Guard",
                "AI Smart Pricing + Demand Forecast",
                "Auto Price Alerts",
                "Crew Scheduling",
                "Route Optimization",
                "AI Ticket Generator (Dashboard)",
                "AI Ticket Email auto-send on booking confirm (Pro & Premium)",
                "AI Voice Assistant",
                "CRM (Premium only)",
                "Custom AI Training (Premium only)",
                "Analytics & Reports",
                "Dedicated tables: railway_trains, railway_coaches, railway_seats, railway_stations, railway_routes, railway_route_stops, railway_schedules, railway_bookings, railway_booking_passengers, railway_notifications, railway_pricing_overrides",
              ],
            },
            shared_features_all_industries: [
              "AI Calendar / Scheduling",
              "Double Booking Guard",
              "AI Voice Assistant (ElevenLabs)",
              "CRM (Premium only)",
              "Email notifications",
              "Client / Lead Scoring",
              "Custom AI Training (Premium only)",
              "Analytics & Reports",
            ],
            removed_never_built: ["White-label branding", "Multi-team management"],
          },
          plans_and_pricing: {
            trial: "7-day free trial",
            base_currency: "GBP",
            tiers: { Basic: "£25/mo", Pro: "£52/mo", Premium: "£108/mo" },
            currency_switcher: ["GBP", "USD", "EUR", "CHF", "KWD", "PKR"],
            payment_provider_policy: "Polar.sh (Stripe & Lemon Squeezy permanently forbidden)",
            crm_access: "Premium only (Basic/Pro see upgrade gate). Trial users get CRM during trial.",
          },
          owner_founder_dashboard: {
            owner_console_route: "/owner",
            founder_os_route: "/founder",
            enterprise_console_routes: ["/owner-crm", "/admin/enterprise", "/enterprise-console"],
            owner_console_tabs: [
              "OwnerStatsCards (top KPIs)",
              "OwnerIndustryOverview",
              "OwnerUsersTab",
              "OwnerSubscriptionsTab",
              "OwnerLeadsTab",
              "OwnerSalesFunnelTab",
              "OwnerMrrCommandCenter",
              "OwnerGrowthCommandCenter",
              "OwnerRetentionTab",
              "OwnerWinBackTab",
              "OwnerLaunchDiscountTab",
              "OwnerOnboardingTab",
              "OwnerFeaturesTab",
              "OwnerCrmTab",
              "OwnerConflictPolicyTab (Double-Booking policy)",
              "OwnerVoiceAssistantTab (ElevenLabs)",
            ],
            founder_os_sections: [
              "Founder Header + HQ Badge",
              "Founder Sidebar",
              "Founder Notifications",
              "Emails section (owner mailbox + ComposeModal)",
              "FounderProfile",
              "Settings",
              "Theme",
            ],
            enterprise_crm_modules: [
              "EntDashboard",
              "EntLeads + EntLeadDetailSheet",
              "EntCompanies",
              "EntPipeline",
              "EntTasks",
              "EntNotes",
              "EntAnalytics",
            ],
          },
          frontend_changes_lovable_shipped: [
            "Domain: hostflowai.net is the only domain in the UI.",
            "Removed all public support@ email addresses from the website (footer, contact pages, policy pages, CTAs, settings).",
            "Removed 'Book Demo' CTA from Enterprise card on PricingSection and from EnterpriseContactDialog flow on the landing/pricing page.",
            "Owner email: naumansherwani@hostflowai.net (password unchanged; bound to user_id).",
            "Auth: Email + Google + Apple. No anonymous signups. Email verification required.",
            "BrainBridge in src/App.tsx: handshake on boot (/v1/health), syncManifest on every route/auth change (/v1/sync-manifest), one-shot changelog ping (/v1/changelog) per session — this payload.",
            "src/lib/backend.ts: single source of truth for Replit Brain URL + backendFetch + syncManifest + notifyChangelog helpers.",
          ],
          backend_edge_changes_lovable_shipped: [
            "supabase/migrations/20260506001333_owner_email_to_net.sql — VIP/owner DB trigger now accepts both .live and .net to prevent lockout during email flip.",
            "supabase/functions/_shared/ai-tier.ts — domain refs updated to .net.",
            "supabase/functions/ai-guide-chat/index.ts — domain refs updated.",
            "supabase/functions/contact-form/index.ts — sends to naumankhansherwani@gmail.com & naumansherwani@hostflowai.net; no public support@.",
            "supabase/functions/founder-adviser/index.ts — domain + owner email refs updated.",
            "supabase/functions/send-transactional-email/index.ts — from/reply-to addresses updated to .net.",
            "supabase/functions/resend-send/index.ts — Resend-only sender (Zoho fully removed May 2026).",
            "All other edge functions untouched until Replit migrates them.",
          ],
          notification_routing: {
            owner_login_email: "naumansherwani@hostflowai.net",
            owner_notifications_inbox: "naumankhansherwani@gmail.com",
            note: "All system / lead / churn / billing alerts mirrored to the Gmail inbox.",
          },
          deferred_or_paused: {
            ai_bank_rapid_pay: "Paused 15 days from 2026-05-05. Do NOT prompt Replit about it.",
          },
          replit_action_items: [
            "Acknowledge this manifest and store as the canonical industry/feature/AI-name map.",
            "Mirror owner identity in Brain to naumansherwani@hostflowai.net.",
            "Plan migration of remaining Lovable AI Gateway edge functions to Replit-owned endpoints.",
            "Confirm receipt to the frontend by setting ui_flags.handoff_ack = true on /v1/sync-manifest response.",
          ],
        },
      });
    } catch {
      /* never break UI */
    }
  }, []);

  useEffect(() => {
    syncManifest({ page: location.pathname, user_id: user?.id ?? null });
  }, [location.pathname, user?.id]);

  return null;
};

const App = () => {
  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <BrainBridge />
          <AiLimitModal />
          <SurfaceGuard />
          <FloatingAdvisorChatProvider>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/terms-and-conditions" element={<Terms />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/checkout-success" element={<CheckoutSuccess />} />
              <Route path="/checkout-cancelled" element={<CheckoutCancelled />} />
              <Route path="/checkout-canceled" element={<CheckoutCancelled />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/ai-crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
              <Route path="/crm" element={<CrmRedirect />} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/advisor" element={<ProtectedRoute><AIAdvisor /></ProtectedRoute>} />
              <Route path="/revenue-intel" element={<ProtectedRoute><RevenueIntelligence /></ProtectedRoute>} />
              <Route path="/resolution-hub" element={<ProtectedRoute><ResolutionHubPage /></ProtectedRoute>} />
              <Route path="/automations" element={<ProtectedRoute><Automations /></ProtectedRoute>} />
              <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
              <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
              <Route path="/earnings" element={<ProtectedRoute><Earnings /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/reviews" element={<ProtectedRoute><Reviews /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/owner" element={<ProtectedRoute><OwnerConsole /></ProtectedRoute>} />
              <Route path="/owner-crm" element={<AdminRoute><EnterpriseConsole /></AdminRoute>} />
              <Route path="/admin/enterprise" element={<AdminRoute><EnterpriseConsole /></AdminRoute>} />
              <Route path="/enterprise-console" element={<AdminRoute><EnterpriseConsole /></AdminRoute>} />
              <Route path="/founder" element={<AdminRoute><FounderOS /></AdminRoute>} />
              <Route path="/owner/email" element={<AdminRoute><FounderOS /></AdminRoute>} />
              <Route path="/owner/executive" element={<AdminRoute><FounderOS /></AdminRoute>} />
              <Route path="/railway" element={<ProtectedRoute><RailwayDashboard /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </FloatingAdvisorChatProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
