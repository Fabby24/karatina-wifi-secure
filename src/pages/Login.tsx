import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { registerDevice, createSession } from '@/lib/deviceInfo';
import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wifi, Lock, Mail, Eye, EyeOff, Loader2, UserPlus, Shield, Info } from 'lucide-react';
import { toast } from 'sonner';
import { callGateway } from '@/lib/gateway';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const navigate = useNavigate();
  const { fetchUserRole } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;

      const userId = data.user.id;

      setLoadingStep('Verifying credentials...');
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_blocked')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.is_blocked) {
        await supabase.auth.signOut();
        toast.error('Your account has been blocked. Contact administrator.');
        setLoading(false);
        setLoadingStep('');
        return;
      }

      setLoadingStep('Registering device...');
      const deviceId = await registerDevice(supabase, userId);
      await createSession(supabase, userId, deviceId);

      setLoadingStep('Granting network access...');
      await callGateway(userId);
      await fetchUserRole(userId);

      toast.success('Access Granted! Connected to SecureLab WiFi.');
      navigate('/access-granted', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-primary-foreground/20"
              style={{
                width: `${Math.random() * 200 + 50}px`,
                height: `${Math.random() * 200 + 50}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center">
          <Wifi className="h-20 w-20 text-primary-foreground/80 mb-6 animate-pulse-soft" />
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">
            SecureLab WiFi
          </h1>
          <p className="text-lg text-primary-foreground/70 max-w-md">
            Karatina University Smart WiFi Access Control & Event Management System
          </p>
          <div className="mt-8 flex items-center gap-2 text-primary-foreground/50 text-sm">
            <Lock className="h-4 w-4" />
            <span>Enterprise-grade security</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-8">
            <img src={logo} alt="SecureLab" className="h-16 w-16 mx-auto mb-4 rounded-xl" />
            <h2 className="text-2xl font-bold text-foreground">WiFi Portal Login</h2>
            <p className="text-muted-foreground mt-1">Authenticate to access the network</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@karatinauniversity.ac.ke"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Connect to WiFi
            </Button>

            {loading && loadingStep && (
              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground animate-fade-in">
                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                {loadingStep}
              </div>
            )}
          </form>

          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
              <span>Your login credentials were sent to your university email. Contact IT support if you haven't received them.</span>
            </div>
            <div className="text-center">
              <Link to="/event-access" className="text-sm text-muted-foreground hover:text-accent">
                <UserPlus className="h-3 w-3 inline mr-1" />
                Event WiFi Access
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
