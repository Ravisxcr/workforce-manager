import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/auth-context'
import { ProtectedLayout, PublicLayout } from '@/components/common/layout'

import LoginPage from '@/app/login/page'
import DashboardPage from '@/app/dashboard/page'
import EmployeesPage from '@/app/employees/page'
import AttendancePage from '@/app/attendance/page'
import LeavePage from '@/app/leave/page'
import SalaryPage from '@/app/salary/page'
import ReimbursementsPage from '@/app/reimbursements/page'
import DocumentsPage from '@/app/documents/page'
import DepartmentsPage from '@/app/departments/page'
import NotificationsPage from '@/app/notifications/page'
import SettingsPage from '@/app/settings/page'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
          <Route path="/" element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
          <Route path="/employees" element={<ProtectedLayout><EmployeesPage /></ProtectedLayout>} />
          <Route path="/attendance" element={<ProtectedLayout><AttendancePage /></ProtectedLayout>} />
          <Route path="/leave" element={<ProtectedLayout><LeavePage /></ProtectedLayout>} />
          <Route path="/salary" element={<ProtectedLayout><SalaryPage /></ProtectedLayout>} />
          <Route path="/reimbursements" element={<ProtectedLayout><ReimbursementsPage /></ProtectedLayout>} />
          <Route path="/documents" element={<ProtectedLayout><DocumentsPage /></ProtectedLayout>} />
          <Route path="/departments" element={<ProtectedLayout><DepartmentsPage /></ProtectedLayout>} />
          <Route path="/notifications" element={<ProtectedLayout><NotificationsPage /></ProtectedLayout>} />
          <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
