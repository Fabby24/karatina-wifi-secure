import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Wifi, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function EventAccess() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [granted, setGranted] = useState(false);
  const [eventName, setEventName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Please enter an access code');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_codes')
        .select('*')
        .eq('code', code.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Invalid access code');
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        toast.error('This access code has expired');
        return;
      }

      if (data.current_usage >= data.usage_limit) {
        toast.error('This access code has reached its usage limit');
        return;
      }

      // Increment usage
      await supabase
        .from('event_codes')
        .update({ current_usage: data.current_usage + 1 })
        .eq('id', data.id);

      setEventName(data.event_name);
      setGranted(true);
      toast.success('Event WiFi Access Granted!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to validate code');
    } finally {
      setLoading(false);
    }
  };

  if (granted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-6 animate-slide-up">
          <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">WiFi Access Granted</h2>
            <p className="text-muted-foreground mt-1">Event: {eventName}</p>
          </div>
          <div className="gradient-primary rounded-xl p-6 text-primary-foreground max-w-sm mx-auto">
            <Wifi className="h-8 w-8 mx-auto mb-2" />
            <p className="font-semibold">Connected to SecureLab Event WiFi</p>
            <p className="text-sm text-primary-foreground/70 mt-1">Enjoy your browsing!</p>
          </div>
          <Link to="/" className="text-sm text-accent hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to main login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <img src={logo} alt="SecureLab" className="h-14 w-14 mx-auto mb-4 rounded-xl" />
          <h2 className="text-2xl font-bold text-foreground">Event WiFi Access</h2>
          <p className="text-muted-foreground mt-1">Enter your event access code</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Access Code</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. EVENT-2024-XYZ"
                className="pl-10 uppercase tracking-wider font-mono"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wifi className="h-4 w-4 mr-2" />}
            Validate & Connect
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-accent inline-flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Back to main login
          </Link>
        </div>
      </div>
    </div>
  );
}
