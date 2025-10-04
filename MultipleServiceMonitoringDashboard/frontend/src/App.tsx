import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { EnvironmentProvider } from '@/contexts/EnvironmentContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout'; // AppLayout now renders Outlet
import { ConnectionStatus } from '@/components/common/ConnectionStatus';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Monitors } from '@/pages/Monitors';
import { Alerts } from '@/pages/Alerts';
import { Incidents } from '@/pages/Incidents';
import { Topology } from '@/pages/Topology';
import { Settings } from '@/pages/Settings';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <EnvironmentProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} /> {/* Redirect root to dashboard */}
              
              {/* This is the main layout route */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/monitors" element={<Monitors />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/incidents" element={<Incidents />} />
                <Route path="/topology" element={<Topology />} />
                <Route path="/settings" element={<Settings />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <ConnectionStatus />
          </BrowserRouter>
          <Toaster />
        </EnvironmentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;