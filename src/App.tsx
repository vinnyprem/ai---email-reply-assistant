import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/auth';
import { ToastProvider } from '@/components/Toast';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Inbox } from '@/pages/Inbox';
import { EmailView } from '@/pages/EmailView';
import { History } from '@/pages/History';
import { Sent } from '@/pages/Sent';
import { Settings } from '@/pages/Settings';
import { Profile } from '@/pages/Profile';
import { Stats } from '@/pages/Stats';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/inbox" replace />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="email" element={<EmailView />} />
              <Route path="sent" element={<Sent />} />
              <Route path="history" element={<History />} />
              <Route path="stats" element={<Stats />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
