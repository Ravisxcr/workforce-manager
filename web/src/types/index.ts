// ── Auth ─────────────────────────────────────────────────────────────────────
export interface UserLogin { email: string; password: string }
export interface UserSignUp { full_name: string; email: string; password: string }
export interface ChangePassword { current_password: string; new_password: string }
export interface ForgotPassword { email: string }
export interface ResetPassword { token: string; new_password: string }
export interface UserInfo {
  id: string
  email: string
  full_name: string
  role: string
  employee_id?: string
}

// ── Employee ──────────────────────────────────────────────────────────────────
export interface EmployeeCreate {
  full_name: string
  email: string
  phone?: string
  address?: string
  designation?: string
  department?: string
  dob?: string
  gender?: string
  date_joined?: string
  salary?: string
  manager_id?: string
}

export interface EmployeeOut {
  id: string
  full_name: string
  email: string
  phone?: string
  address?: string
  designation?: string
  department?: string
  dob?: string
  gender?: string
  date_joined?: string
  salary?: string
  manager_id?: string
  created_by_admin_id: string
  is_active: boolean
}

export type EmployeeUpdate = Partial<Omit<EmployeeCreate, 'email'>> & { email?: string }
export interface EmployeeStatusUpdate { is_active: boolean }

export interface IdCardCreate {
  user_id: string
  name: string
  designation: string
  department: string
  issue_date: string
  expiry_date: string
  card_number: string
}
export interface IdCardOut extends IdCardCreate { id: string }

// ── Attendance ────────────────────────────────────────────────────────────────
export interface AttendanceCheckIn { notes?: string }
export interface AttendanceCheckOut { notes?: string }

export interface AttendanceOut {
  id: string
  user_id: string
  date: string
  check_in?: string
  check_out?: string
  status: string
  work_hours?: number
  notes?: string
  is_manual: boolean
}

export interface AttendanceManualEntry {
  user_id: string
  date: string
  check_in?: string
  check_out?: string
  status?: string
  notes?: string
}

export interface AttendanceUpdate {
  check_in?: string
  check_out?: string
  status?: string
  notes?: string
}

export interface AttendanceAnalytics {
  user_id: string
  employee_name: string
  total_days: number
  present_days: number
  absent_days: number
  late_days: number
  half_days: number
  avg_work_hours?: number
}

// ── Leave ─────────────────────────────────────────────────────────────────────
export interface LeaveCreate {
  start_date: string
  end_date: string
  type: string
  reason: string
}

export interface LeaveOut {
  id: string
  user_id: string
  start_date: string
  end_date: string
  type: string
  reason: string
  status: string
  days: number
  approved_by?: string
  cancellation_requested: boolean
  cancellation_approved: boolean
}

export type LeaveUpdate = Partial<LeaveCreate>

export interface LeaveListResponse {
  data: LeaveOut[]
  extra: Record<string, unknown>
}

export interface LeaveAnalyticsItem {
  user_id: string
  employee_name: string
  approved_leaves: number
  cancelled_leaves: number
  pending_leaves: number
  total_leaves: number
  cancellation_requests: number
}

export interface LeaveAnalyticsResponse { analytics: LeaveAnalyticsItem[] }

// ── Reimbursement ─────────────────────────────────────────────────────────────
export interface ReimbursementOut {
  id: string
  user_id: string
  amount: string
  description?: string
  date: string
  type: string
  status: string
  approved_by_id?: string
  date_approved?: string
  receipt_url?: string
  remarks?: string
}

export interface ReimbursementUpdate {
  amount?: string
  description?: string
  date?: string
  type?: string
}

export interface ReimbursementUpdateStatus {
  status: string
  remarks?: string
  date_approved?: string
}

export interface ReimbursementAnalytics {
  total_claims: number
  total_approved: number
  total_pending: number
  total_rejected: number
  total_amount: string
  claims?: ReimbursementOut[]
}

// ── Document ──────────────────────────────────────────────────────────────────
export interface DocumentOut {
  id: string
  user_id: string
  document_type: string
  description: string
  file_path: string
  status: string
  verified_by_id: string
  verified_at: string
  comment: string
}

export interface DocumentVerify {
  status: string
  comment?: string
  verified_by_id?: string
  verified_at?: string
}

// ── Salary ────────────────────────────────────────────────────────────────────
export interface SalarySlipCreate {
  user_id: string
  month: string
  year: number
  basic: number
  hra: number
  allowances?: number
  deductions?: number
  net_pay: number
  date_generated: string
}

export interface SalarySlipOut {
  id: string
  user_id: string
  month: string
  year: number
  basic: number
  hra: number
  allowances: number
  deductions: number
  net_pay: number
  date_generated: string
}

export type SalarySlipUpdate = Partial<Omit<SalarySlipCreate, 'user_id'>>

export interface SalaryHistoryCreate {
  user_id: string
  amount: number
  date: string
  remarks?: string
}

export interface SalaryHistoryOut {
  id: string
  user_id: string
  amount: number
  date: string
  remarks?: string
}

export type SalaryHistoryUpdate = Partial<Omit<SalaryHistoryCreate, 'user_id'>>

export interface SalaryAnalyticsItem {
  user_id: string
  total_slips: number
  avg_net_pay: number
  latest_net_pay?: number
}

export interface SalaryAnalytics {
  total_employees: number
  avg_salary: number
  employees: SalaryAnalyticsItem[]
}

// ── Department ────────────────────────────────────────────────────────────────
export interface DepartmentCreate {
  name: string
  description?: string
  head_id?: string
}

export interface DepartmentOut {
  id: string
  name: string
  description?: string
  head_id?: string
}

export type DepartmentUpdate = Partial<DepartmentCreate>

export interface DesignationCreate {
  name: string
  department_id?: string
  level?: number
}

export interface DesignationOut {
  id: string
  name: string
  department_id?: string
  level?: number
}

export type DesignationUpdate = Partial<DesignationCreate>

// ── Notification ──────────────────────────────────────────────────────────────
export interface NotificationOut {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  type: string
  link?: string
  created_at: string
}

export interface NotificationSend {
  user_id: string
  title: string
  message: string
  type?: string
  link?: string
}

export interface NotificationBroadcast {
  user_ids: string[]
  title: string
  message: string
  type?: string
  link?: string
}

// ── Utility ───────────────────────────────────────────────────────────────────
export interface ApiError { detail: string | { loc: (string | number)[]; msg: string; type: string }[] }
