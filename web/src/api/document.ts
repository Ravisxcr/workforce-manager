import { get, patch, del, postForm } from './client'
import type { DocumentOut, DocumentVerify } from '@/types'

export const getDocumentTypes = () => get<string[]>('/document/types')

export const uploadDocument = (data: {
  document_type: string
  file: File
  description?: string
}) => {
  const form = new FormData()
  form.append('document_type', data.document_type)
  form.append('file', data.file)
  if (data.description) form.append('description', data.description)
  return postForm<DocumentOut>('/document/upload', form)
}

export const getMyDocuments = () => get<DocumentOut[]>('/document/my')
export const getPendingDocuments = () => get<DocumentOut[]>('/document/pending')
export const verifyDocument = (id: string, data: DocumentVerify) =>
  patch<DocumentOut>(`/document/${id}/verify`, data)
export const deleteDocument = (id: string) => del(`/document/${id}`)
export const getDocumentFileUrl = (id: string) =>
  `${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/document/${id}/file`
