import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { Users, Wifi, Monitor, Key, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

export default function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, activeSessions: 0, devices: 0, eventCodes: 0 });
  const [loginData, setLoginData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [usersRes, sessionsRes, devicesRes, codesRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('devices').select('*', { count: 'exact', head: true }),
        supabase.from('event_codes').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        users: usersRes.count || 0,
        activeSessions: sessionsRes.count || 0,
        devices: devicesRes.count || 0,
        eventCodes: codesRes.count || 0,
      });

      // Fetch recent sessions for chart
      const { data: sessions } = await supabase
        .from('sessions')
        .select('login_time')
        .order('login_time', { ascending: false })
        .limit(100);

      if (sessions) {
        const grouped: Record<string, number> = {};
        sessions.forEach((s) => {
          const day = new Date(s.login_time).toLocaleDateString('en-US', { weekday: 'short' });
          grouped[day] = (grouped[day] || 0) + 1;
        });
        setLoginData(Object.entries(grouped).map(([name, logins]) => ({ name, logins })).slice(0, 7));
      }
    };
    fetchAll();

    // Realtime subscription for sessions
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sessions' }, (payload) => {
        toast.info('New login session detected', { description: 'A user just connected to the network.' });
        fetchAll();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'devices' }, (payload) => {
        toast.info('New device connected', { description: `Device registered on the network.` });
        fetchAll();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats.users} icon={Users} />
          <StatCard title="Active Sessions" value={stats.activeSessions} icon={Wifi} />
          <StatCard title="Connected Devices" value={stats.devices} icon={Monitor} />
          <StatCard title="Event Codes" value={stats.eventCodes} icon={Key} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" /> Login Trends
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={loginData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--card-foreground))',
                  }}
                />
                <Bar dataKey="logins" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h3 className="text-sm font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Monitor className="h-4 w-4 text-accent" /> Device Connections
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={loginData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--card-foreground))',
                  }}
                />
                <Line type="monotone" dataKey="logins" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
