import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getDeviceInfo } from '@/lib/deviceInfo';
import { CheckCircle, Wifi, Monitor, Globe, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccessGranted() {
  const { user, role } = useAuthStore();
  const [countdown, setCountdown] = useState(5);
  const [deviceInfo] = useState(() => getDeviceInfo());

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          window.location.href = 'https://google.com';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const dashboardPath = role === 'admin' ? '/admin' : '/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-6 animate-slide-up max-w-md w-full">
        {/* Success icon */}
        <div className="relative h-24 w-24 mx-auto">
          <div className="absolute inset-0 rounded-full bg-success/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="relative h-24 w-24 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="h-12 w-12 text-success" />
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">Access Granted</h1>
          <p className="text-muted-foreground mt-1">You are now connected to SecureLab WiFi</p>
        </div>

        {/* Connection details */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3 text-left">
          <div className="flex items-center gap-3">
            <Wifi className="h-4 w-4 text-accent shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Network</p>
              <p className="text-sm font-medium text-card-foreground">SecureLab-Secure</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Monitor className="h-4 w-4 text-accent shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Device</p>
              <p className="text-sm font-medium text-card-foreground">{deviceInfo.deviceName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-accent shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">IP Address</p>
              <p className="text-sm font-mono text-card-foreground">{deviceInfo.ip}</p>
            </div>
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-success shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Session</p>
                <p className="text-sm font-medium text-success">Active</p>
              </div>
            </div>
          )}
        </div>

        {/* Countdown */}
        <div className="space-y-2">
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Redirecting to the internet in <span className="font-semibold text-foreground">{countdown}s</span>
          </p>
        </div>

        {/* Dashboard link */}
        {user && (
          <Link to={dashboardPath}>
            <Button variant="outline" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
