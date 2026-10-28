import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataModeProvider } from './contexts/DataModeContext';
import { AdminRoute, StudentRoute } from './components/auth/ProtectedRoutes';

// Public pages
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import SuccessPage from './pages/SuccessPage';

// Auth pages
import StudentLoginPage from './pages/auth/StudentLoginPage';
import StudentSignupPage from './pages/auth/StudentSignupPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import ClaimAccountPage from './pages/auth/ClaimAccountPage';

// Student Portal
import StudentDashboardPage from './pages/student/StudentDashboardPage';

// Admin Growth Dashboard pages
import DashboardLayout from './components/layout/DashboardLayout';
import OverviewPage from './pages/dashboard/OverviewPage';
import RegistrationsPage from './pages/dashboard/RegistrationsPage';
import ChannelsPage from './pages/dashboard/ChannelsPage';
import ReferralsPage from './pages/dashboard/ReferralsPage';
import CampaignPage from './pages/dashboard/CampaignPage';
import ExperimentsPage from './pages/dashboard/ExperimentsPage';

export default function App() {
  return (
    <AuthProvider>
      <DataModeProvider>
        <Routes>
          {/* Public Student-Facing Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/signup" element={<StudentSignupPage />} />
          <Route path="/login" element={<StudentLoginPage />} />
          <Route path="/claim-account" element={<ClaimAccountPage />} />
          <Route path="/success" element={<SuccessPage />} />

          {/* Admin Authentication Route */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Student Portal Routes */}
          <Route element={<StudentRoute />}>
            <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          </Route>

          {/* Protected Growth Operations Dashboard Routes (Admin only) */}
          <Route element={<AdminRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="registrations" element={<RegistrationsPage />} />
              <Route path="channels" element={<ChannelsPage />} />
              <Route path="referrals" element={<ReferralsPage />} />
              <Route path="campaign" element={<CampaignPage />} />
              <Route path="experiments" element={<ExperimentsPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DataModeProvider>
    </AuthProvider>
  );
}
