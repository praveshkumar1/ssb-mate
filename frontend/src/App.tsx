import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Navbar from '@/components/layout/Navbar';
import Login from "./pages/Login";
import Register from "./pages/Register";
import CoachesList from './pages/CoachesList';
import CoachProfile from './pages/CoachProfile';
import ResourcesList from './pages/ResourcesList';
import ResourceDetail from './pages/ResourceDetail';
import SessionsList from './pages/SessionsList';
import CreateSession from './pages/CreateSession';
import DashboardSessions from './pages/DashboardSessions';
import UserProfileEdit from './pages/UserProfileEdit';
import CreateResource from './pages/CreateResource';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import ManageSessions from './pages/ManageSessions';
import MentorOnboarding from './pages/MentorOnboarding';
import MenteeOnboarding from './pages/MenteeOnboarding';
import AuthSuccess from './pages/AuthSuccess';
import ChooseRole from './pages/ChooseRole';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/coaches" element={<CoachesList />} />
          <Route path="/coaches/:id" element={<CoachProfile />} />
          <Route path="/resources" element={<ResourcesList />} />
          <Route path="/resources/:id" element={<ResourceDetail />} />
          <Route path="/resources/create" element={<ProtectedRoute><CreateResource /></ProtectedRoute>} />
          <Route path="/sessions" element={<SessionsList />} />
          <Route path="/sessions/create" element={<ProtectedRoute><CreateSession /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><UserProfileEdit /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/sessions" element={<ProtectedRoute><DashboardSessions /></ProtectedRoute>} />
          <Route path="/dashboard/manage-sessions" element={<ProtectedRoute><ManageSessions /></ProtectedRoute>} />
          <Route path="/onboard/mentor" element={<ProtectedRoute><MentorOnboarding /></ProtectedRoute>} />
          <Route path="/onboard/mentee" element={<ProtectedRoute><MenteeOnboarding /></ProtectedRoute>} />
          <Route path="/choose-role" element={<ProtectedRoute><ChooseRole /></ProtectedRoute>} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
