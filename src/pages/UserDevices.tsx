import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Monitor } from 'lucide-react';

export default function UserDevices() {
  const { user } = useAuthStore();
  const [devices, setDevices] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('devices').select('*').eq('user_id', user.id).order('last_login', { ascending: false })
      .then(({ data }) => setDevices(data || []));
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">My Devices</h3>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Browser</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      {d.device_name}
                    </div>
                  </TableCell>
                  <TableCell>{d.browser}</TableCell>
                  <TableCell>{d.os}</TableCell>
                  <TableCell className="font-mono text-xs">{d.ip_address}</TableCell>
                  <TableCell>{new Date(d.last_login).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={d.is_blocked ? 'destructive' : 'default'}>
                      {d.is_blocked ? 'Blocked' : 'Active'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {devices.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No devices registered</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
