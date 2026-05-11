import { get, post, put, patch, del } from './client'
import type {
  EmployeeCreate, EmployeeOut, EmployeeUpdate, EmployeeStatusUpdate,
  EmployeeManagerPromotionOut, EmployeeRole, IdCardCreate, IdCardOut,
} from '@/types'

export const createEmployee = (data: EmployeeCreate) => post<EmployeeOut>('/employee/', data)

export const listEmployees = (params?: { department?: string; is_active?: boolean }) =>
  get<EmployeeOut[]>('/employee/', params)

export const searchEmployees = (q: string) =>
  get<EmployeeOut[]>('/employee/search', { q })

export const getManagers = () => get<EmployeeOut[]>('/employee/managers')

export const getEmployee = (id: string) => get<EmployeeOut>(`/employee/${id}`)

export const updateEmployee = (id: string, data: EmployeeUpdate) =>
  put<EmployeeOut>(`/employee/${id}`, data)

export const deleteEmployee = (id: string) => del(`/employee/${id}`)

export const updateEmployeeStatus = (id: string, data: EmployeeStatusUpdate) =>
  patch<EmployeeOut>(`/employee/${id}/status`, data)

export const changeEmployeeRole = (id: string, role: EmployeeRole) =>
  patch<EmployeeManagerPromotionOut>(`/employee/${id}/change-role/${role}`)

export const createIdCard = (data: IdCardCreate) => post<IdCardOut>('/employee/id-card', data)
export const verifyIdCard = (employeeId: string) =>
  get<IdCardOut[]>(`/employee/id-card/verify/${employeeId}`)
export const getMyIdCards = () => get<IdCardOut[]>('/employee/id-card/me')
