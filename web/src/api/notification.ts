import { get, patch, post, del } from './client'
import type { NotificationOut, NotificationSend, NotificationBroadcast } from '@/types'

export const getMyNotifications = () => get<NotificationOut[]>('/notification/')
export const getUnreadCount = () => get<{ count: number }>('/notification/unread-count')
export const markAsRead = (id: string) => patch<NotificationOut>(`/notification/${id}/read`)
export const markAllRead = () => patch<void>('/notification/read-all')
export const sendNotification = (data: NotificationSend) =>
  post<NotificationOut>('/notification/send', data)
export const deleteNotification = (id: string) => del(`/notification/${id}`)
export const broadcastNotification = (data: NotificationBroadcast) =>
  post<NotificationOut[]>('/notification/broadcast', data)
export const adminDeleteNotification = (id: string) => del(`/notification/admin/${id}`)
