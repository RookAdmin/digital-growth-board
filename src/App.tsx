
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import DashboardPage from "./pages/Dashboard";
import ClientsPage from "./pages/Clients";
import ProjectsPage from "./pages/Projects";
import SchedulingPage from "./pages/Scheduling";
import FilesPage from "./pages/Files";
import ClientPortalPage from "./pages/ClientPortal";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import TeamPage from "./pages/Team";
import ReportingPage from "./pages/Reporting";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/client-portal" element={<ClientPortalPage />} />
          
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard/leads" element={<DashboardPage />} />
            <Route path="/dashboard/clients" element={<ClientsPage />} />
            <Route path="/dashboard/projects" element={<ProjectsPage />} />
            <Route path="/dashboard/scheduling" element={<SchedulingPage />} />
            <Route path="/dashboard/files" element={<FilesPage />} />
            <Route path="/dashboard/team" element={<TeamPage />} />
            <Route path="/dashboard/reporting" element={<ReportingPage />} />
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
