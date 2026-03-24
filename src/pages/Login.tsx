import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { registerDevice, createSession } from '@/lib/deviceInfo';
import logo from '@/assets/logo.png';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wifi, Lock, Mail, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [loading, setLoading] = useState(false);
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
      if (isSignUp) {
        if (!email.trim().endsWith('.ac.ke')) {
          toast.error('Only academic emails ending in .ac.ke are allowed to register.');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName.trim(), registration_number: regNumber.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success('Account created! Check your email to verify, or login if auto-confirm is enabled.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;

        const userId = data.user.id;

        // Check if blocked
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_blocked')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.is_blocked) {
          await supabase.auth.signOut();
          toast.error('Your account has been blocked. Contact administrator.');
          setLoading(false);
          return;
        }

        // Register device & create session
        const deviceId = await registerDevice(supabase, userId);
        await createSession(supabase, userId, deviceId);

        // Fetch role and redirect
        await fetchUserRole(userId);
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        toast.success('Access Granted! Connected to SecureLab WiFi.');

        if (roleData?.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
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
            <h2 className="text-2xl font-bold text-foreground">
              {isSignUp ? 'Create Account' : 'WiFi Portal Login'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {isSignUp ? 'Register for WiFi access' : 'Authenticate to access the network'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
            )}
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
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="regNumber">Registration Number (optional)</Label>
                <Input
                  id="regNumber"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  placeholder="e.g. CS/001/2024"
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isSignUp ? 'Create Account' : 'Connect to WiFi'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-accent hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
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
