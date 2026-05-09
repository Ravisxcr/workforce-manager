import { get, post, put, del } from './client'
import type {
  DepartmentCreate, DepartmentOut, DepartmentUpdate,
  DesignationCreate, DesignationOut, DesignationUpdate,
} from '@/types'

export const listDepartments = () => get<DepartmentOut[]>('/department/')
export const createDepartment = (data: DepartmentCreate) => post<DepartmentOut>('/department/', data)
export const updateDepartment = (id: string, data: DepartmentUpdate) =>
  put<DepartmentOut>(`/department/${id}`, data)
export const deleteDepartment = (id: string) => del(`/department/${id}`)

export const createDesignation = (data: DesignationCreate) =>
  post<DesignationOut>('/department/designation', data)
export const listDesignations = (params?: { department_id?: string }) =>
  get<DesignationOut[]>('/department/designation', params)
export const updateDesignation = (id: string, data: DesignationUpdate) =>
  put<DesignationOut>(`/department/designation/${id}`, data)
export const deleteDesignation = (id: string) => del(`/department/designation/${id}`)
