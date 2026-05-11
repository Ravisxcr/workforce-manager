import { get, post, put, del } from './client'
import type {
  SalarySlipCreate, SalarySlipOut, SalarySlipUpdate,
  SalaryHistoryCreate, SalaryHistoryOut, SalaryHistoryUpdate,
  SalaryAnalytics,
} from '@/types'

export const createSalarySlip = (data: SalarySlipCreate) => post<SalarySlipOut>('/salary/salary-slip', data)
export const listAllSalarySlips = (params?: { employee_id?: string; month?: string; year?: number }) =>
  get<SalarySlipOut[]>('/salary/salary-slip', params)
export const getMySalarySlips = () => get<SalarySlipOut[]>('/salary/salary-slip/me')
export const getEmployeeSalarySlips = (employeeId: string) =>
  get<SalarySlipOut[]>(`/salary/salary-slip/${employeeId}`)
export const updateSalarySlip = (id: string, data: SalarySlipUpdate) =>
  put<SalarySlipOut>(`/salary/salary-slip/${id}`, data)
export const deleteSalarySlip = (id: string) => del(`/salary/salary-slip/${id}`)

export const getSalaryHistory = () => get<SalaryHistoryOut[]>('/salary/salary-history')
export const createSalaryHistory = (data: SalaryHistoryCreate) =>
  post<SalaryHistoryOut>('/salary/salary-history', data)
export const getMySalaryHistory = () => get<SalaryHistoryOut[]>('/salary/salary-history/me')
export const getEmployeeSalaryHistory = (employeeId: string) =>
  get<SalaryHistoryOut[]>(`/salary/salary-history/${employeeId}`)
export const updateSalaryHistory = (id: string, data: SalaryHistoryUpdate) =>
  put<SalaryHistoryOut>(`/salary/salary-history/${id}`, data)
export const deleteSalaryHistory = (id: string) => del(`/salary/salary-history/${id}`)
export const getSalaryAnalytics = () => get<SalaryAnalytics>('/salary/analytics')
