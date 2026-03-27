import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Wifi } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuthStore();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 1200);
    const t2 = setTimeout(() => setStep(2), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (step < 2) return;
    if (loading) return;
    if (user) {
      navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [step, loading, user, role, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-8 animate-fade-in">
        {/* WiFi pulse rings */}
        <div className="relative h-28 w-28 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-accent/30 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-3 rounded-full border-2 border-accent/40 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
          <div className="absolute inset-6 rounded-full border-2 border-accent/50 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.6s' }} />
          <div className="relative h-16 w-16 rounded-full gradient-primary flex items-center justify-center shadow-elevated">
            <Wifi className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {step === 0 && 'Detecting network...'}
            {step >= 1 && 'Redirecting to SecureLab...'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === 0 && 'Scanning for available WiFi networks'}
            {step >= 1 && 'Captive portal authentication required'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 mx-auto h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary rounded-full transition-all duration-1000 ease-out"
            style={{ width: step === 0 ? '30%' : step === 1 ? '70%' : '100%' }}
          />
        </div>

        <p className="text-xs text-muted-foreground/60">SecureLab WiFi Access Control</p>
      </div>
    </div>
  );
}
