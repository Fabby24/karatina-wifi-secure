import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Key, Plus, Trash2, Copy, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'EVT-';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function AdminEvents() {
  const { user } = useAuthStore();
  const [codes, setCodes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [form, setForm] = useState({ event_name: '', expires_hours: '12', usage_limit: '50' });

  const fetchCodes = async () => {
    const { data } = await supabase.from('event_codes').select('*').order('created_at', { ascending: false });
    setCodes(data || []);
  };

  useEffect(() => { fetchCodes(); }, []);

  const createCode = async () => {
    if (!form.event_name.trim()) { toast.error('Event name is required'); return; }
    const code = generateCode();
    const expiresAt = new Date(Date.now() + parseInt(form.expires_hours) * 60 * 60 * 1000).toISOString();

    await supabase.from('event_codes').insert({
      code,
      event_name: form.event_name.trim(),
      expires_at: expiresAt,
      usage_limit: parseInt(form.usage_limit),
      created_by: user?.id,
    });

    toast.success(`Event code created: ${code}`);
    setOpen(false);
    setForm({ event_name: '', expires_hours: '12', usage_limit: '50' });
    fetchCodes();
  };

  const deleteCode = async (id: string) => {
    await supabase.from('event_codes').delete().eq('id', id);
    toast.success('Event code deleted');
    fetchCodes();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const isExpired = (date: string) => new Date(date) < new Date();

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Event Code Management</h3>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Generate Code</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Event Access Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Event Name</Label>
                  <Input value={form.event_name} onChange={(e) => setForm({ ...form, event_name: e.target.value })} placeholder="e.g. Tech Conference 2024" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Expires in (hours)</Label>
                    <Input type="number" min="1" max="72" value={form.expires_hours} onChange={(e) => setForm({ ...form, expires_hours: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Users</Label>
                    <Input type="number" min="1" max="1000" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} />
                  </div>
                </div>
                <Button onClick={createCode} className="w-full"><Key className="h-4 w-4 mr-2" /> Generate</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* QR Code Dialog */}
        <Dialog open={!!qrCode} onOpenChange={() => setQrCode(null)}>
          <DialogContent className="max-w-xs text-center">
            <DialogHeader><DialogTitle>Event QR Code</DialogTitle></DialogHeader>
            <div className="flex justify-center py-4">
              {qrCode && <QRCodeSVG value={`${window.location.origin}/event-access?code=${qrCode}`} size={200} />}
            </div>
            <p className="font-mono text-sm font-bold text-foreground">{qrCode}</p>
          </DialogContent>
        </Dialog>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold text-sm">{c.code}</TableCell>
                  <TableCell>{c.event_name}</TableCell>
                  <TableCell>{c.current_usage}/{c.usage_limit}</TableCell>
                  <TableCell>{new Date(c.expires_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={isExpired(c.expires_at) ? 'secondary' : c.current_usage >= c.usage_limit ? 'destructive' : 'default'}>
                      {isExpired(c.expires_at) ? 'Expired' : c.current_usage >= c.usage_limit ? 'Full' : 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => copyCode(c.code)}><Copy className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => setQrCode(c.code)}><QrCode className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteCode(c.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {codes.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No event codes yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
