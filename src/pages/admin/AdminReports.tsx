import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Download, BarChart3 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

const COLORS = ['hsl(174, 45%, 45%)', 'hsl(205, 55%, 23%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)'];

export default function AdminReports() {
  const [loginData, setLoginData] = useState<any[]>([]);
  const [osData, setOsData] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: sessions } = await supabase.from('sessions').select('login_time').order('login_time', { ascending: true }).limit(200);
      if (sessions) {
        const grouped: Record<string, number> = {};
        sessions.forEach((s) => {
          const day = new Date(s.login_time).toLocaleDateString();
          grouped[day] = (grouped[day] || 0) + 1;
        });
        setLoginData(Object.entries(grouped).map(([date, count]) => ({ date, logins: count })));
      }

      const { data: devices } = await supabase.from('devices').select('os');
      if (devices) {
        const grouped: Record<string, number> = {};
        devices.forEach((d) => { grouped[d.os || 'Unknown'] = (grouped[d.os || 'Unknown'] || 0) + 1; });
        setOsData(Object.entries(grouped).map(([name, value]) => ({ name, value })));
      }
    };
    fetch();
  }, []);

  const exportCSV = async () => {
    const { data } = await supabase.from('sessions').select('*').order('login_time', { ascending: false });
    if (!data) return;
    const csv = ['User ID,Login Time,Logout Time,Status',
      ...data.map(s => `${s.user_id},${s.login_time},${s.logout_time || ''},${s.status}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'session_report.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" /> Reports & Analytics
          </h3>
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
            <h4 className="text-sm font-semibold text-card-foreground mb-4">Daily Login Trends</h4>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={loginData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="logins" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <h4 className="text-sm font-semibold text-card-foreground mb-4">OS Distribution</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={osData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {osData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
