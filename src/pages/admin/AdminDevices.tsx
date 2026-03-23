import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/DashboardLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShieldBan, ShieldCheck, Monitor } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDevices() {
  const [devices, setDevices] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  const fetchDevices = async () => {
    const { data } = await supabase.from('devices').select('*').order('last_login', { ascending: false });
    setDevices(data || []);
  };

  useEffect(() => { fetchDevices(); }, []);

  const toggleBlock = async (id: string, blocked: boolean) => {
    await supabase.from('devices').update({ is_blocked: !blocked }).eq('id', id);
    toast.success(blocked ? 'Device unblocked' : 'Device blocked');
    fetchDevices();
  };

  const filtered = devices.filter(d =>
    d.device_name.toLowerCase().includes(search.toLowerCase()) ||
    d.ip_address.includes(search)
  );

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-foreground">Device Monitoring</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search devices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device</TableHead>
                <TableHead>Browser</TableHead>
                <TableHead>OS</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
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
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => toggleBlock(d.id, d.is_blocked)}>
                      {d.is_blocked ? <ShieldCheck className="h-4 w-4 text-success" /> : <ShieldBan className="h-4 w-4 text-destructive" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
