import { get, post, put, del } from './client'
import type { LeaveCreate, LeaveOut, LeaveUpdate, LeaveListResponse, LeaveAnalyticsResponse } from '@/types'

export const getLeaves = () => get<LeaveListResponse>('/leave/')
export const createLeave = (data: LeaveCreate) => post<LeaveOut>('/leave/', data)
export const getLeaveBalance = () => get<Record<string, { total: number; used: number; remaining: number }>>('/leave/balance')
export const getLeaveCalendar = (params: { month: number; year: number }) =>
  get<unknown>('/leave/calendar', params)
export const getTeamLeaves = (params?: { status?: string }) =>
  get<LeaveOut[]>('/leave/team', params)
export const approveLeave = (id: string) => put<LeaveOut>(`/leave/approve/${id}`)
export const rejectLeave = (id: string) => put<LeaveOut>(`/leave/reject/${id}`)
export const adminDeleteLeave = (id: string) => del(`/leave/admin/${id}`)
export const updateLeave = (id: string, data: LeaveUpdate) => put<LeaveOut>(`/leave/${id}`, data)
export const deleteLeave = (id: string) => del(`/leave/${id}`)
export const requestLeaveCancellation = (id: string) => put<LeaveOut>(`/leave/cancel-request/${id}`)
export const approveLeaveCancellation = (id: string) => put<LeaveOut>(`/leave/cancel-approve/${id}`)
export const getLeaveAnalytics = () => get<LeaveAnalyticsResponse>('/leave/analytics')
