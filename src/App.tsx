
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SecurityProvider } from "@/components/SecurityProvider";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import Team from "./pages/Team";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Signup from "./pages/Signup";
import Reporting from "./pages/Reporting";
import NotFound from "./pages/NotFound";
import Files from "./pages/Files";
import Scheduling from "./pages/Scheduling";
import ClientPortal from "./pages/ClientPortal";
import Partners from "./pages/Partners";
import PartnerSignup from "./pages/PartnerSignup";
import PartnerLogin from "./pages/PartnerLogin";
import PartnerDashboard from "./pages/PartnerDashboard";
import PartnerProject from "./pages/PartnerProject";
import ProtectedRoute from "./components/ProtectedRoute";
import ClientProtectedRoute from "./components/ClientProtectedRoute";
import PartnerProtectedRoute from "./components/PartnerProtectedRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false, // Don't retry mutations for security
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SecurityProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Partner Routes */}
              <Route path="/partner/signup" element={<PartnerSignup />} />
              <Route path="/partner/login" element={<PartnerLogin />} />
              <Route
                path="/partner/dashboard"
                element={
                  <PartnerProtectedRoute>
                    <PartnerDashboard />
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
                path="/projects"
                element={
                  <ProtectedRoute>
                    <Projects />
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
        </SecurityProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
