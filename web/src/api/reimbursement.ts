import { get, post, put, del, postForm } from './client'
import type {
  ReimbursementOut, ReimbursementUpdate, ReimbursementUpdateStatus, ReimbursementAnalytics,
} from '@/types'

export const createReimbursement = (
  params: { amount: string; description?: string; date: string; remarks: string },
  receipt: File,
) => {
  const form = new FormData()
  form.append('receipt', receipt)
  const url = new URLSearchParams(params as Record<string, string>).toString()
  return postForm<ReimbursementOut>(`/reimbursement/?${url}`, form)
}

export const getMyReimbursements = () => get<ReimbursementOut[]>('/reimbursement/')
export const getAllReimbursements = (params?: { status?: string }) =>
  get<ReimbursementOut[]>('/reimbursement/all', params)
export const getReimbursementAnalytics = () =>
  get<ReimbursementAnalytics>('/reimbursement/analytics')
export const getReimbursement = (id: string) => get<ReimbursementOut>(`/reimbursement/${id}`)
export const updateReimbursement = (id: string, data: ReimbursementUpdate) =>
  put<ReimbursementOut>(`/reimbursement/${id}`, data)
export const deleteReimbursement = (id: string) => del(`/reimbursement/${id}`)
export const approveReimbursement = (id: string, data: ReimbursementUpdateStatus) =>
  post<ReimbursementOut>(`/reimbursement/approve/${id}`, data)
