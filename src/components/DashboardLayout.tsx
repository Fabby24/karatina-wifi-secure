import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import logo from '@/assets/logo.png';
import {
  LayoutDashboard, Users, Wifi, Key, BarChart3, LogOut,
  Monitor, History, Menu, X, Shield, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAutoLogout } from '@/hooks/useAutoLogout';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/devices', icon: Monitor, label: 'Devices' },
  { to: '/admin/events', icon: Key, label: 'Event Codes' },
  { to: '/admin/sessions', icon: History, label: 'Sessions' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
];

const userLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dashboard/devices', icon: Monitor, label: 'My Devices' },
  { to: '/dashboard/history', icon: History, label: 'Login History' },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, role, signOut } = useAuthStore();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = role === 'admin' ? adminLinks : userLinks;
  useAutoLogout();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 gradient-hero text-sidebar-foreground transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
            <img src={logo} alt="SecureLab" className="h-10 w-10 rounded-lg object-contain bg-sidebar-foreground/10 p-1" />
            <div>
              <h1 className="font-bold text-sm text-sidebar-foreground">SecureLab</h1>
              <p className="text-xs text-sidebar-foreground/60">WiFi Access Control</p>
            </div>
            <button className="ml-auto lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {links.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                  {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.email}</p>
                <div className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-sidebar-primary" />
                  <span className="text-xs text-sidebar-foreground/60 capitalize">{role}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 lg:px-6">
          <div className="flex items-center gap-4">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5 text-foreground" />
            </button>
            <h2 className="text-lg font-semibold text-foreground">
              {role === 'admin' ? 'Admin Dashboard' : 'User Dashboard'}
            </h2>
          </div>
        </header>
        <div className="flex-1 p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
