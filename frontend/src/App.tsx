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
import DashboardSessions from './pages/DashboardSessions';
import UserProfileEdit from './pages/UserProfileEdit';
import CreateResource from './pages/CreateResource';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import ManageSessions from './pages/ManageSessions';
import ManageAvailability from './pages/ManageAvailability';
import MentorOnboarding from './pages/MentorOnboarding';
import MenteeOnboarding from './pages/MenteeOnboarding';
import AuthSuccess from './pages/AuthSuccess';
import ChooseRole from './pages/ChooseRole';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import BlogEditor from './pages/BlogEditor';
import Discussions from './pages/Discussions';
import AdminCreateDiscussion from './pages/AdminCreateDiscussion';
import React from 'react';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

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
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/coaches" element={<CoachesList />} />
          <Route path="/coaches/:id" element={<CoachProfile />} />
          <Route path="/resources" element={<ResourcesList />} />
          <Route path="/resources/:id" element={<ResourceDetail />} />
          <Route path="/resources/create" element={<ProtectedRoute><CreateResource /></ProtectedRoute>} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:id" element={<BlogDetail />} />
          <Route path="/dashboard/blog/new" element={<ProtectedRoute><BlogEditor /></ProtectedRoute>} />
          <Route path="/sessions" element={<SessionsList />} />
          <Route path="/discussions" element={<Discussions />} />
          <Route path="/profile/edit" element={<ProtectedRoute><UserProfileEdit /></ProtectedRoute>} />
          <Route path="/admin/discussions/new" element={<ProtectedRoute><AdminCreateDiscussion /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/sessions" element={<ProtectedRoute><DashboardSessions /></ProtectedRoute>} />
          <Route path="/dashboard/manage-sessions" element={<ProtectedRoute><ManageSessions /></ProtectedRoute>} />
          <Route path="/dashboard/availability" element={<ProtectedRoute><ManageAvailability /></ProtectedRoute>} />
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
