import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Activity, Bell, TriangleAlert as AlertTriangle, Network, Settings, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/monitors', label: 'Monitors', icon: Activity },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { path: '/topology', label: 'Topology', icon: Network },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onToggle}
      />

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-card border-r transition-transform duration-300',
          'w-64 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Monitor</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="lg:hidden"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3',
                      isActive && 'bg-primary/10 text-primary hover:bg-primary/20'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>
    </>
  );
}
