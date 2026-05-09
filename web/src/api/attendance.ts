import { get, post, put, del } from './client'
import type {
  AttendanceCheckIn, AttendanceCheckOut, AttendanceOut,
  AttendanceManualEntry, AttendanceUpdate, AttendanceAnalytics,
} from '@/types'

export const checkIn = (data: AttendanceCheckIn) => post<AttendanceOut>('/attendance/check-in', data)
export const checkOut = (data: AttendanceCheckOut) => post<AttendanceOut>('/attendance/check-out', data)

export const getMyAttendance = (params?: { month?: number; year?: number }) =>
  get<AttendanceOut[]>('/attendance/me', params)

export const getTodayAttendance = () => get<AttendanceOut[]>('/attendance/today')

export const getMonthlyAttendance = (params: { month: number; year: number; employee_id?: string }) =>
  get<AttendanceOut[]>('/attendance/monthly', params)

export const getAttendanceAnalytics = (params: { month: number; year: number }) =>
  get<AttendanceAnalytics[]>('/attendance/analytics', params)

export const manualEntry = (data: AttendanceManualEntry) =>
  post<AttendanceOut>('/attendance/manual-entry', data)

export const updateAttendance = (id: string, data: AttendanceUpdate) =>
  put<AttendanceOut>(`/attendance/${id}`, data)

export const deleteAttendance = (id: string) => del(`/attendance/${id}`)

export const getEmployeeAttendance = (
  employeeId: string,
  params?: { month?: number; year?: number },
) => get<AttendanceOut[]>(`/attendance/${employeeId}`, params)
