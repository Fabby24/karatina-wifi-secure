import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Wifi, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { callGateway } from '@/lib/gateway';

export default function EventAccess() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auto-fill code from URL query param (QR scan support)
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      setCode(urlCode.toUpperCase());
      // Auto-submit after a brief delay
      setTimeout(() => {
        const form = document.getElementById('event-form') as HTMLFormElement;
        form?.requestSubmit();
      }, 500);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error('Please enter an access code');
      return;
    }
    setLoading(true);
    try {
      setLoadingStep('Validating access code...');
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
      setLoadingStep('Registering event access...');
      await supabase
        .from('event_codes')
        .update({ current_usage: data.current_usage + 1 })
        .eq('id', data.id);

      // Call gateway
      setLoadingStep('Granting network access...');
      await callGateway();

      toast.success('Event WiFi Access Granted!');
      navigate('/access-granted', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Failed to validate code');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <img src={logo} alt="SecureLab" className="h-14 w-14 mx-auto mb-4 rounded-xl" />
          <h2 className="text-2xl font-bold text-foreground">Event WiFi Access</h2>
          <p className="text-muted-foreground mt-1">Enter your event access code or scan QR</p>
        </div>

        <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
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

          {loading && loadingStep && (
            <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground animate-fade-in">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              {loadingStep}
            </div>
          )}
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
