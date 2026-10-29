import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthLayout } from '../../layouts/AuthLayout'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { LoginPage } from '../../features/auth/pages/LoginPage'
import { RegisterPage } from '../../features/auth/pages/RegisterPage'
import { ForgotPasswordPage } from '../../features/auth/pages/ForgotPasswordPage'
import { DashboardHomePage } from '../../features/dashboard/pages/DashboardHomePage'
import { VehiclesPage } from '../../features/vehicles/pages/VehiclesPage'
import { SearchParkingPage } from '../../features/parking-search/pages/SearchParkingPage'
import { ParkingDetailPage } from '../../features/parking-search/pages/ParkingDetailPage'
import { NotificationsPage } from '../../features/notifications/pages/NotificationsPage'
import { MyBookingsPage } from '../../features/bookings/pages/MyBookingsPage'
import { ProfilePage } from '../../features/profile/pages/ProfilePage'
import { ChangePasswordPage } from '../../features/profile/pages/ChangePasswordPage'
import { DriverQueuesPage } from '../../features/queues/pages/DriverQueuesPage'
import { DriverPaymentsPage } from '../../features/payments/pages/DriverPaymentsPage'
import { PaymentReturnPage } from '../../features/payments/pages/PaymentReturnPage'
import { ProtectedRoute } from './ProtectedRoute'
import { getAuthSession } from '../../shared/auth/session'
import { MerchantLayout } from '../../features/merchant/layout/MerchantLayout'
import { MerchantDashboardPage } from '../../features/merchant/dashboard/pages/MerchantDashboardPage'
import { MerchantProfilePage } from '../../features/merchant/profile/pages/MerchantProfilePage'
import { MerchantParkingLotsPage } from '../../features/merchant/parking-lots/pages/MerchantParkingLotsPage'
import { CreateMerchantParkingLotPage } from '../../features/merchant/parking-lots/pages/CreateMerchantParkingLotPage'
import { MerchantParkingLotDetailPage } from '../../features/merchant/parking-lots/pages/MerchantParkingLotDetailPage'
import { EditMerchantParkingLotPage } from '../../features/merchant/parking-lots/pages/EditMerchantParkingLotPage'
import { MerchantSlotsPage } from '../../features/merchant/slots/pages/MerchantSlotsPage'
import { MerchantPricingPage } from '../../features/merchant/pricing/pages/MerchantPricingPage'
import { MerchantBookingsPage } from '../../features/merchant/bookings/pages/MerchantBookingsPage'
import { MerchantBookingDetailPage } from '../../features/merchant/bookings/pages/MerchantBookingDetailPage'
import { MerchantQrScannerPage } from '../../features/merchant/qr-scanner/pages/MerchantQrScannerPage'
import { MerchantRevenuePage } from '../../features/merchant/revenue/pages/MerchantRevenuePage'
import { MerchantWithdrawalsPage } from '../../features/merchant/withdrawals/pages/MerchantWithdrawalsPage'
import { MerchantDisputesPage } from '../../features/merchant/disputes/pages/MerchantDisputesPage'
import { MerchantDisputeDetailPage } from '../../features/merchant/disputes/pages/MerchantDisputeDetailPage'
import { MerchantNotificationsPage } from '../../features/merchant/notifications/pages/MerchantNotificationsPage'
import { ForbiddenPage } from '../../features/errors/pages/ForbiddenPage'
import { AdminLayout } from '../../features/admin/layout/AdminLayout'
import { AdminDashboardPage } from '../../features/admin/dashboard/AdminDashboardPage'
import { AdminParkingLotsPage } from '../../features/admin/parking-approvals/AdminParkingLotsPage'
import { AdminParkingLotDetailPage } from '../../features/admin/parking-approvals/AdminParkingLotDetailPage'
import { AdminUsersPage } from '../../features/admin/users/AdminUsersPage'
import { AdminUserDetailPage } from '../../features/admin/users/AdminUserDetailPage'
import { AdminTransactionsPage } from '../../features/admin/transactions/AdminTransactionsPage'
import { AdminWithdrawalsPage } from '../../features/admin/withdrawals/AdminWithdrawalsPage'
import { AdminDisputesPage } from '../../features/admin/disputes/AdminDisputesPage'
import { AdminDisputeDetailPage } from '../../features/admin/disputes/AdminDisputeDetailPage'
import { AdminAuditLogsPage } from '../../features/admin/audit-logs/AdminAuditLogsPage'
import { AdminNotificationsPage } from '../../features/admin/notifications/AdminNotificationsPage'
import { AdminProfilePage } from '../../features/admin/profile/AdminProfilePage'

import { 
  LandingLayout, 
  LandingPage,
  DriverSolutionsPage,
  OwnerSolutionsPage,
  PricingPage,
  ApiIntegrationPage,
  AboutUsPage,
  CareersPage,
  BlogPage,
  ContactPage
} from '../../features/landing'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<LandingLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/notifications" element={<ProtectedRoute allowedRoles={['DRIVER']}><NotificationsPage /></ProtectedRoute>} />
        <Route path="/parking" element={<ProtectedRoute allowedRoles={['DRIVER']}><SearchParkingPage /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute allowedRoles={['DRIVER']}><MyBookingsPage /></ProtectedRoute>} />
        <Route path="/queues" element={<ProtectedRoute allowedRoles={['DRIVER']}><DriverQueuesPage /></ProtectedRoute>} />
        <Route path="/payments" element={<ProtectedRoute allowedRoles={['DRIVER']}><DriverPaymentsPage /></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute allowedRoles={['DRIVER']}><VehiclesPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['DRIVER']}><ProfilePage /></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute allowedRoles={['DRIVER']}><ChangePasswordPage /></ProtectedRoute>} />
        <Route path="/solutions/drivers" element={<DriverSolutionsPage />} />
        <Route path="/solutions/owners" element={<OwnerSolutionsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/solutions/api" element={<ApiIntegrationPage />} />
        <Route path="/company/about" element={<AboutUsPage />} />
        <Route path="/company/careers" element={<CareersPage />} />
        <Route path="/company/blog" element={<BlogPage />} />
        <Route path="/company/contact" element={<ContactPage />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/payment/success" element={<PaymentReturnPage mode="success" />} />
      <Route path="/payment/cancel" element={<PaymentReturnPage mode="cancel" />} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="parking-lots" element={<AdminParkingLotsPage />} />
        <Route path="parking-lots/:parkingLotId" element={<AdminParkingLotDetailPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="users/:userId" element={<AdminUserDetailPage />} />
        <Route path="transactions" element={<AdminTransactionsPage />} />
        <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
        <Route path="disputes" element={<AdminDisputesPage />} />
        <Route path="disputes/:disputeId" element={<AdminDisputeDetailPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
      </Route>
      <Route
        path="/merchant"
        element={
          <ProtectedRoute allowedRoles={['MERCHANT']}>
            <MerchantLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<MerchantDashboardPage />} />
        <Route path="profile" element={<MerchantProfilePage />} />
        <Route path="parking-lots" element={<MerchantParkingLotsPage />} />
        <Route path="parking-lots/new" element={<CreateMerchantParkingLotPage />} />
        <Route path="parking-lots/:parkingLotId" element={<MerchantParkingLotDetailPage />} />
        <Route path="parking-lots/:parkingLotId/edit" element={<EditMerchantParkingLotPage />} />
        <Route path="parking-lots/:parkingLotId/slots" element={<MerchantSlotsPage />} />
        <Route path="parking-lots/:parkingLotId/pricing" element={<MerchantPricingPage />} />
        <Route path="bookings" element={<MerchantBookingsPage />} />
        <Route path="bookings/:bookingId" element={<MerchantBookingDetailPage />} />
        <Route path="qr-scanner" element={<MerchantQrScannerPage />} />
        <Route path="revenue" element={<MerchantRevenuePage />} />
        <Route path="withdrawals" element={<MerchantWithdrawalsPage />} />
        <Route path="disputes" element={<MerchantDisputesPage />} />
        <Route path="disputes/:ticketId" element={<MerchantDisputeDetailPage />} />
        <Route path="notifications" element={<MerchantNotificationsPage />} />
      </Route>
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardEntry />} />
        <Route
          path="/dashboard/vehicles"
          element={
            <ProtectedRoute allowedRoles={['DRIVER']}>
              <VehiclesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/search"
          element={
            <ProtectedRoute allowedRoles={['DRIVER']}>
              <SearchParkingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/parking/:id"
          element={
            <ProtectedRoute allowedRoles={['DRIVER']}>
              <ParkingDetailPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function DashboardEntry() {
  const session = getAuthSession()
  if (session?.role === 'MERCHANT') return <Navigate to="/merchant/dashboard" replace />
  if (session?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />
  return <DashboardHomePage />
}
