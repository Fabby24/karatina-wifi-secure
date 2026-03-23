import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';

import Login from './pages/Login';
import EventAccess from './pages/EventAccess';
import UserDashboard from './pages/UserDashboard';
import UserDevices from './pages/UserDevices';
import UserHistory from './pages/UserHistory';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDevices from './pages/admin/AdminDevices';
import AdminEvents from './pages/admin/AdminEvents';
import AdminSessions from './pages/admin/AdminSessions';
import AdminReports from './pages/admin/AdminReports';
import AuthGuard from './components/AuthGuard';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function AuthListener() {
  const { setUser, setLoading, fetchUserRole } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchUserRole(session.user.id);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthListener />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/event-access" element={<EventAccess />} />
          
          {/* User routes */}
          <Route path="/dashboard" element={<AuthGuard><UserDashboard /></AuthGuard>} />
          <Route path="/dashboard/devices" element={<AuthGuard><UserDevices /></AuthGuard>} />
          <Route path="/dashboard/history" element={<AuthGuard><UserHistory /></AuthGuard>} />
          
          {/* Admin routes */}
          <Route path="/admin" element={<AuthGuard requiredRole="admin"><AdminOverview /></AuthGuard>} />
          <Route path="/admin/users" element={<AuthGuard requiredRole="admin"><AdminUsers /></AuthGuard>} />
          <Route path="/admin/devices" element={<AuthGuard requiredRole="admin"><AdminDevices /></AuthGuard>} />
          <Route path="/admin/events" element={<AuthGuard requiredRole="admin"><AdminEvents /></AuthGuard>} />
          <Route path="/admin/sessions" element={<AuthGuard requiredRole="admin"><AdminSessions /></AuthGuard>} />
          <Route path="/admin/reports" element={<AuthGuard requiredRole="admin"><AdminReports /></AuthGuard>} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
