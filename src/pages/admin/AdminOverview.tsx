import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { Users, Wifi, Monitor, Key, TrendingUp, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { toast } from 'sonner';

export default function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, activeSessions: 0, devices: 0, eventCodes: 0, threatsBlocked: 0 });
  const [loginData, setLoginData] = useState<any[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const [usersRes, sessionsRes, devicesRes, codesRes, threatsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('devices').select('*', { count: 'exact', head: true }),
        supabase.from('event_codes').select('*', { count: 'exact', head: true }),
        supabase.from('devices').select('*', { count: 'exact', head: true }).eq('is_blocked', true).gt('threat_score', 70),
      ]);
      setStats({
        users: usersRes.count || 0,
        activeSessions: sessionsRes.count || 0,
        devices: devicesRes.count || 0,
        eventCodes: codesRes.count || 0,
        threatsBlocked: threatsRes.count || 0,
      });

      // Fetch recent flagged devices for security alerts
      const { data: flaggedDevices } = await supabase
        .from('devices')
        .select('device_name, threat_score, threat_reason, last_login, ip_address')
        .gt('threat_score', 30)
        .order('last_login', { ascending: false })
        .limit(5);
      setSecurityAlerts(flaggedDevices || []);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Total Users" value={stats.users} icon={Users} />
          <StatCard title="Active Sessions" value={stats.activeSessions} icon={Wifi} />
          <StatCard title="Connected Devices" value={stats.devices} icon={Monitor} />
          <StatCard title="Event Codes" value={stats.eventCodes} icon={Key} />
          <StatCard title="Threats Blocked" value={stats.threatsBlocked} icon={ShieldAlert} />
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
              <ShieldAlert className="h-4 w-4 text-destructive" /> Security Alerts
            </h3>
            {securityAlerts.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                No security alerts. All clear! ✅
              </div>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {securityAlerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <ShieldAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{alert.device_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{alert.threat_reason || 'Flagged by AI'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono text-muted-foreground">{alert.ip_address}</span>
                        <span className="text-xs text-destructive font-semibold">Score: {alert.threat_score}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
