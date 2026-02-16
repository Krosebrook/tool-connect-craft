import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Plug2, 
  LayoutDashboard, 
  Activity,
  Shield,
  Link2,
  Menu,
  X,
  Clock,
  Webhook,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useState } from 'react';

const navItems = [
  { href: '/connectors', label: 'Connectors', icon: Plug2, tooltip: 'Browse and manage service integrations' },
  { href: '/connections', label: 'Connections', icon: Link2, tooltip: 'View active OAuth connections and token status' },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tooltip: 'Monitor jobs, logs, and connector health' },
  { href: '/scheduler', label: 'Scheduler', icon: Clock, tooltip: 'Manage automated cron jobs and background tasks' },
  { href: '/webhooks', label: 'Webhooks', icon: Webhook, tooltip: 'Configure webhook endpoints for event notifications' },
  { href: '/settings/notifications', label: 'Notifications', icon: Bell, tooltip: 'Set email, push, and webhook alert preferences' },
  { href: '/settings/security', label: 'Security', icon: Shield, tooltip: 'Token management, session security, and privacy' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Plug2 className="h-5 w-5 text-primary" />
              <div className="absolute inset-0 rounded-lg ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all" />
            </div>
            <span className="font-semibold text-lg hidden sm:block">
              <span className="text-foreground">MCP</span>
              <span className="text-muted-foreground ml-1">Hub</span>
            </span>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{item.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
          
          {/* Right side */}
          <div className="flex items-center gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground cursor-default">
                  <Activity className="h-3.5 w-3.5 text-success pulse-live" />
                  <span>All systems operational</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>All connectors and services are healthy</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
            <nav className="container px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <div>
                      <div>{item.label}</div>
                      <div className="text-xs text-muted-foreground font-normal">{item.tooltip}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>
      
      {/* Main content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
}
