import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CoachesList from './pages/CoachesList';
import CoachProfile from './pages/CoachProfile';
import ResourcesList from './pages/ResourcesList';
import ResourceDetail from './pages/ResourceDetail';
import SessionsList from './pages/SessionsList';
import CreateSession from './pages/CreateSession';
import UserProfileEdit from './pages/UserProfileEdit';
import CreateResource from './pages/CreateResource';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
