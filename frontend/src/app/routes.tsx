import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './shell/MainLayout'
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage'
import { AdminListingsReviewPage } from '../features/admin/pages/AdminListingsReviewPage'
import { AdminUsersPage } from '../features/admin/pages/AdminUsersPage'
import { RequireAuth } from '../features/auth/components/RequireAuth'
import { LoginPage } from '../features/auth/pages/LoginPage'
import { RegisterPage } from '../features/auth/pages/RegisterPage'
import { LandlordInquiriesPage } from '../features/landlord/pages/LandlordInquiriesPage'
import { LandlordListingEditPage } from '../features/landlord/pages/LandlordListingEditPage'
import { LandlordListingsPage } from '../features/landlord/pages/LandlordListingsPage'
import { LandlordPricePredictPage } from '../features/landlord/pages/LandlordPricePredictPage'
import { TenantComparePage } from '../features/tenant/pages/TenantComparePage'
import { TenantInquiriesPage } from '../features/tenant/pages/TenantInquiriesPage'
import { TenantListingDetailPage } from '../features/tenant/pages/TenantListingDetailPage'
import { TenantListingsPage } from '../features/tenant/pages/TenantListingsPage'
import { TenantPreferencesPage } from '../features/tenant/pages/TenantPreferencesPage'
import { TenantRecommendationsPage } from '../features/tenant/pages/TenantRecommendationsPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/tenant/listings" replace />} />

        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        <Route path="tenant">
          <Route index element={<Navigate to="listings" replace />} />
          {/* 未登录默认租户界面：房源列表与详情可匿名访问 */}
          <Route path="listings" element={<TenantListingsPage />} />
          <Route path="listings/:id" element={<TenantListingDetailPage />} />
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
            path="listings"
            element={
              <RequireAuth roles={['landlord']}>
                <LandlordListingsPage />
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
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

