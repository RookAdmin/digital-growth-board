
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { WorkspaceRoute } from "@/components/WorkspaceRoute";
import { WorkspaceSetupGuard } from "@/components/WorkspaceSetupGuard";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import Projects from "./pages/Projects";
import Leads from "./pages/Leads";
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
import ClientChangePassword from "./pages/ClientChangePassword";
import ClientProjects from "./pages/ClientProjects";
import ClientInvoices from "./pages/ClientInvoices";
import ClientFiles from "./pages/ClientFiles";
import Partners from "./pages/Partners";
import PartnerDetails from "./pages/PartnerDetails";
import PartnerSignup from "./pages/PartnerSignup";
import PartnerDashboard from "./pages/PartnerDashboard";
import PartnerAwards from "./pages/PartnerAwards";
import PartnerAgreements from "./pages/PartnerAgreements";
import PartnerProject from "./pages/PartnerProject";
import PartnerProjects from "./pages/PartnerProjects";
import PartnerLeads from "./pages/PartnerLeads";
import Billing from "./pages/Billing";
import { BackfillClientAuth } from "./pages/BackfillClientAuth";
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
          <WorkspaceProvider>
            <WorkspaceSetupGuard>
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
              path="/partner/projects"
              element={
                <PartnerProtectedRoute>
                  <PartnerProjects />
                </PartnerProtectedRoute>
              }
            />
            <Route
              path="/partner/leads"
              element={
                <PartnerProtectedRoute>
                  <PartnerLeads />
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
            
            {/* Client Portal Routes */}
            <Route
              path="/client/change-password"
              element={
                <ClientProtectedRoute>
                  <ClientChangePassword />
                </ClientProtectedRoute>
              }
            />
            <Route
              path="/client-portal"
              element={
                <ClientProtectedRoute>
                  <ClientPortal />
                </ClientProtectedRoute>
              }
            />
            <Route
              path="/client/projects"
              element={
                <ClientProtectedRoute>
                  <ClientProjects />
                </ClientProtectedRoute>
              }
            />
            <Route
              path="/client/invoices"
              element={
                <ClientProtectedRoute>
                  <ClientInvoices />
                </ClientProtectedRoute>
              }
            />
            <Route
              path="/client/files"
              element={
                <ClientProtectedRoute>
                  <ClientFiles />
                </ClientProtectedRoute>
              }
            />
            
            {/* Protected Admin Routes with Workspace */}
            <Route
              path="/dashboard/:workspaceId"
              element={
                <ProtectedRoute>
                  <WorkspaceRoute>
                    <Dashboard />
                  </WorkspaceRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/:workspaceId"
              element={
                <ProtectedRoute>
                  <WorkspaceRoute>
                    <Clients />
                  </WorkspaceRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/clients/:workspaceId/:id"
              element={
                <ProtectedRoute>
                  <WorkspaceRoute>
                    <ClientDetails />
                  </WorkspaceRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/:workspaceId"
              element={
                <ProtectedRoute>
                  <WorkspaceRoute>
                    <Leads />
                  </WorkspaceRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:workspaceId"
              element={
                <ProtectedRoute>
                  <WorkspaceRoute>
                    <Projects />
                  </WorkspaceRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:workspaceId/:id"
              element={
                <ProtectedRoute>
                  <WorkspaceRoute>
                    <ProjectDetails />
                  </WorkspaceRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/partners/:workspaceId"
              element={
                <ProtectedRoute>
                  <WorkspaceRoute>
                    <Partners />
                  </WorkspaceRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/partners/:workspaceId/:id"
              element={
                <ProtectedRoute>
                  <WorkspaceRoute>
                    <PartnerDetails />
                  </WorkspaceRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/team/:workspaceId"
              element={
                <ProtectedRoute>
                  <WorkspaceRoute>
                    <Team />
                  </WorkspaceRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reporting/:workspaceId"
              element={
                <ProtectedRoute>
                  <WorkspaceRoute>
                    <Reporting />
                  </WorkspaceRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/files/:workspaceId"
              element={
                <ProtectedRoute>
                  <WorkspaceRoute>
                    <Files />
                  </WorkspaceRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/scheduling/:workspaceId"
              element={
                <ProtectedRoute>
                  <WorkspaceRoute>
                    <Scheduling />
                  </WorkspaceRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing/:workspaceId"
              element={
                <ProtectedRoute>
                  <WorkspaceRoute>
                    <Billing />
                  </WorkspaceRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/backfill-client-auth/:workspaceId"
              element={
                <ProtectedRoute>
                  <WorkspaceRoute>
                    <BackfillClientAuth />
                  </WorkspaceRoute>
                </ProtectedRoute>
              }
            />
            {/* Legacy routes - will be handled by ProtectedRoute redirect */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Navigate to="/dashboard" replace />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
              </Routes>
            </WorkspaceSetupGuard>
          </WorkspaceProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
