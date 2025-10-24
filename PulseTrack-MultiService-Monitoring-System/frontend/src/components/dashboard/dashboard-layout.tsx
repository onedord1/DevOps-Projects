'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useWebSocket } from '@/lib/websocket-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Activity,
  LayoutDashboard,
  Bell,
  Settings,
  Users,
  LogOut,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  FolderKanban,
} from 'lucide-react'
import { useTheme } from 'next-themes'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/dashboard/projects', icon: FolderKanban },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { isConnected } = useWebSocket()
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Modern Sidebar */}
      <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex flex-col h-full">
          {/* Professional Logo Section */}
          <div className="px-6 py-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-30"></div>
                <div className="relative bg-gradient-to-br from-blue-600 to-cyan-600 p-2.5 rounded-xl">
                  <Activity className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h2 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">PulseTrack</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Real-time Monitoring</p>
              </div>
            </div>
          </div>

          {/* Modern Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 relative overflow-hidden',
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                  )}
                  <item.icon className={cn(
                    'h-5 w-5 relative z-10',
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-cyan-400'
                  )} />
                  <span className="relative z-10">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto h-2 w-2 rounded-full bg-white relative z-10 animate-pulse"></div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Modern User Section */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-4 space-y-3">
            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <div className={cn(
                'h-2 w-2 rounded-full animate-pulse',
                isConnected ? 'bg-green-500' : 'bg-red-500'
              )} />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {isConnected ? 'Live Connected' : 'Disconnected'}
              </span>
              {isConnected ? 
                <Wifi className="h-3.5 w-3.5 text-green-500 ml-auto" /> : 
                <WifiOff className="h-3.5 w-3.5 text-red-500 ml-auto" />
              }
            </div>
            
            {/* User Profile Card */}
            <div className="flex items-center gap-3 px-3 py-3 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                {theme === 'dark' ? 
                  <Sun className="h-4 w-4 text-yellow-500" /> : 
                  <Moon className="h-4 w-4 text-slate-700" />
                }
              </button>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 group"
            >
              <LogOut className="h-4 w-4 group-hover:translate-x-[-2px] transition-transform" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content with modern spacing */}
      <div className="pl-72">
        <main className="p-8 min-h-screen">{children}</main>
      </div>
    </div>
  )
}
