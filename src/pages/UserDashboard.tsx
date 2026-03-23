import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { Wifi, Monitor, History, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function UserDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ devices: 0, sessions: 0, activeSessions: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [devicesRes, sessionsRes, activeRes] = await Promise.all([
        supabase.from('devices').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
      ]);
      setStats({
        devices: devicesRes.count || 0,
        sessions: sessionsRes.count || 0,
        activeSessions: activeRes.count || 0,
      });
    };
    fetchStats();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Access Granted Banner */}
        <div className="gradient-primary rounded-xl p-6 text-primary-foreground animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">WiFi Access Granted</h2>
              <p className="text-primary-foreground/70">You are connected to SecureLab WiFi Network</p>
            </div>
            <Badge className="ml-auto bg-primary-foreground/20 text-primary-foreground border-0">
              <Wifi className="h-3 w-3 mr-1" /> Connected
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Active Sessions" value={stats.activeSessions} icon={Wifi} />
          <StatCard title="Registered Devices" value={stats.devices} icon={Monitor} />
          <StatCard title="Total Logins" value={stats.sessions} icon={History} />
        </div>
      </div>
    </DashboardLayout>
  );
}
