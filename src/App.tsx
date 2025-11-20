
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import Team from "./pages/Team";
import UnifiedLogin from "./pages/UnifiedLogin";
import Register from "./pages/Register";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Reporting from "./pages/Reporting";
import NotFound from "./pages/NotFound";
import Files from "./pages/Files";
import Scheduling from "./pages/Scheduling";
import ClientPortal from "./pages/ClientPortal";
import Partners from "./pages/Partners";
import PartnerSignup from "./pages/PartnerSignup";
import PartnerDashboard from "./pages/PartnerDashboard";
import PartnerAwards from "./pages/PartnerAwards";
import PartnerAgreements from "./pages/PartnerAgreements";
import PartnerProject from "./pages/PartnerProject";
import ProtectedRoute from "./components/ProtectedRoute";
import ClientProtectedRoute from "./components/ClientProtectedRoute";
import PartnerProtectedRoute from "./components/PartnerProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<UnifiedLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Partner Routes */}
            <Route path="/partner/signup" element={<PartnerSignup />} />
            <Route
              path="/partner/dashboard"
              element={
                <PartnerProtectedRoute>
                  <PartnerDashboard />
                </PartnerProtectedRoute>
              }
            />
            <Route path="/partner-dashboard" element={<Navigate to="/partner/dashboard" replace />} />
            <Route
              path="/partner/awards"
              element={
                <PartnerProtectedRoute>
                  <PartnerAwards />
                </PartnerProtectedRoute>
              }
            />
            <Route
              path="/partner/agreements"
              element={
                <PartnerProtectedRoute>
                  <PartnerAgreements />
                </PartnerProtectedRoute>
              }
            />
            <Route
              path="/partner/projects/:id"
              element={
                <PartnerProtectedRoute>
                  <PartnerProject />
                </PartnerProtectedRoute>
              }
            />
            
            {/* Client Portal Route */}
            <Route
              path="/client-portal"
              element={
                <ClientProtectedRoute>
                  <ClientPortal />
                </ClientProtectedRoute>
              }
            />
            
            {/* Protected Admin Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <Clients />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/:id"
              element={
                <ProtectedRoute>
                  <ClientDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:id"
              element={
                <ProtectedRoute>
                  <ProjectDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/partners"
              element={
                <ProtectedRoute>
                  <Partners />
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  <Team />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reporting"
              element={
                <ProtectedRoute>
                  <Reporting />
                </ProtectedRoute>
              }
            />
            <Route
              path="/files"
              element={
                <ProtectedRoute>
                  <Files />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scheduling"
              element={
                <ProtectedRoute>
                  <Scheduling />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
