import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './shell/MainLayout'
import { HomePage } from '../features/home/pages/HomePage'
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage'
import { AdminListingsReviewPage } from '../features/admin/pages/AdminListingsReviewPage'
import { AdminUsersPage } from '../features/admin/pages/AdminUsersPage'
import { AdminPaymentsPage } from '../features/admin/pages/AdminPaymentsPage'
import { RequireAuth } from '../features/auth/components/RequireAuth'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { EmailVerifyPage } from '../features/auth/pages/EmailVerifyPage'
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage'
import { LandlordInquiriesPage } from '../features/landlord/pages/LandlordInquiriesPage'
import { LandlordInquiryPage } from '../features/landlord/pages/LandlordInquiryPage'
import { LandlordListingEditPage } from '../features/landlord/pages/LandlordListingEditPage'
import { LandlordListingsPage } from '../features/landlord/pages/LandlordListingsPage'
import { LandlordPricePredictPage } from '../features/landlord/pages/LandlordPricePredictPage'
import { TenantComparePage } from '../features/tenant/pages/TenantComparePage'
import { TenantInquiriesPage } from '../features/tenant/pages/TenantInquiriesPage'
import { TenantListingDetailPage } from '../features/tenant/pages/TenantListingDetailPage'
import { TenantInquiryPage } from '../features/tenant/pages/TenantInquiryPage'
import { TenantListingsPage } from '../features/tenant/pages/TenantListingsPage'
import { TenantPreferencesPage } from '../features/tenant/pages/TenantPreferencesPage'
import { TenantRecommendationsPage } from '../features/tenant/pages/TenantRecommendationsPage'
import { TenantPaymentPage } from '../features/tenant/pages/TenantPaymentPage'
import { TenantPaymentsPage } from '../features/tenant/pages/TenantPaymentsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />

        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="verify-email" element={<EmailVerifyPage />} />

        <Route path="tenant">
          <Route index element={<Navigate to="listings" replace />} />
          {/* 未登录默认租户界面：房源列表与详情可匿名访问 */}
          <Route path="listings" element={<TenantListingsPage />} />
          <Route path="listings/:id" element={<TenantListingDetailPage />} />
          <Route
            path="inquiries"
            element={
              <RequireAuth roles={['tenant']}>
                <TenantInquiriesPage />
              </RequireAuth>
            }
          />
          <Route
            path="chats/:id"
            element={
              <RequireAuth roles={['tenant']}>
                <TenantInquiryPage />
              </RequireAuth>
            }
          />
          <Route
            path="recommendations"
            element={
              <RequireAuth roles={['tenant']}>
                <TenantRecommendationsPage />
              </RequireAuth>
            }
          />
          <Route
            path="compare"
            element={
              <RequireAuth roles={['tenant']}>
                <TenantComparePage />
              </RequireAuth>
            }
          />
          <Route
            path="preferences"
            element={
              <RequireAuth roles={['tenant']}>
                <TenantPreferencesPage />
              </RequireAuth>
            }
          />
          <Route
            path="payments"
            element={
              <RequireAuth roles={['tenant']}>
                <TenantPaymentsPage />
              </RequireAuth>
            }
          />
          <Route
            path="payments/create"
            element={
              <RequireAuth roles={['tenant']}>
                <TenantPaymentPage />
              </RequireAuth>
            }
          />
          <Route
            path="inquiries"
            element={
              <RequireAuth roles={['tenant']}>
                <TenantInquiriesPage />
              </RequireAuth>
            }
          />
        </Route>

        <Route path="landlord">
          <Route index element={<Navigate to="listings" replace />} />
          <Route
            path="all-listings"
            element={
              <RequireAuth roles={['landlord']}>
                <TenantListingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="listings"
            element={
              <RequireAuth roles={['landlord']}>
                <LandlordListingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="favorites"
            element={
              <RequireAuth roles={['landlord']}>
                <TenantComparePage />
              </RequireAuth>
            }
          />
          <Route
            path="listings/new"
            element={
              <RequireAuth roles={['landlord']}>
                <LandlordListingEditPage mode="create" />
              </RequireAuth>
            }
          />
          <Route
            path="listings/:id/edit"
            element={
              <RequireAuth roles={['landlord']}>
                <LandlordListingEditPage mode="edit" />
              </RequireAuth>
            }
          />
          <Route
            path="predict"
            element={
              <RequireAuth roles={['landlord']}>
                <LandlordPricePredictPage />
              </RequireAuth>
            }
          />
          <Route
            path="inquiries"
            element={
              <RequireAuth roles={['landlord']}>
                <LandlordInquiriesPage />
              </RequireAuth>
            }
          />
          <Route
            path="inquiries/:id"
            element={
              <RequireAuth roles={['landlord']}>
                <LandlordInquiryPage />
              </RequireAuth>
            }
          />
        </Route>

        <Route path="admin">
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <RequireAuth roles={['admin']}>
                <AdminDashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="users"
            element={
              <RequireAuth roles={['admin']}>
                <AdminUsersPage />
              </RequireAuth>
            }
          />
          <Route
            path="listings"
            element={
              <RequireAuth roles={['admin']}>
                <AdminListingsReviewPage />
              </RequireAuth>
            }
          />
          <Route
            path="payments"
            element={
              <RequireAuth roles={['admin']}>
                <AdminPaymentsPage />
              </RequireAuth>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

