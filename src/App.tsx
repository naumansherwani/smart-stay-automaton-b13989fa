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
import { backendFetch, syncManifest } from "@/lib/backend";

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
              <Route path="/crm" element={<ProtectedRoute><CRM /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
