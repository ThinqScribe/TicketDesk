import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Public pages
import LandingPage from '@/pages/LandingPage'
import SignInPage from '@/pages/SignInPage'
import SignUpPage from '@/pages/SignUpPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import VerifyEmailPage from '@/pages/VerifyEmailPage'

// Dashboard shell
import DashboardLayout from '@/components/dashboard/DashboardLayout'

// Dashboard pages
import OverviewPage from '@/pages/dashboard/OverviewPage'
import TicketsPage from '@/pages/dashboard/TicketsPage'
import TicketDetailPage from '@/pages/dashboard/TicketDetailPage'
import CustomersPage from '@/pages/dashboard/CustomersPage'
import AgentsPage from '@/pages/dashboard/AgentsPage'
import ReportsPage from '@/pages/dashboard/ReportsPage'
import SettingsPage from '@/pages/dashboard/SettingsPage'
import BillingPage from '@/pages/dashboard/BillingPage'
import BillingSuccessPage from '@/pages/dashboard/BillingSuccessPage'
import BillingCancelPage from '@/pages/dashboard/BillingCancelPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Dashboard — protected by DashboardLayout */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="tickets/:id" element={<TicketDetailPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="billing/success" element={<BillingSuccessPage />} />
          <Route path="billing/cancel" element={<BillingCancelPage />} />
        </Route>

        {/* Stripe redirect fallbacks — handle old-style URLs without /dashboard prefix */}
        <Route path="/billing/success" element={<Navigate to="/dashboard/billing/success" replace />} />
        <Route path="/billing/cancel" element={<Navigate to="/dashboard/billing/cancel" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
