import { get, post, del, setToken } from './client'
import type { UserLogin, UserSignUp, UserSignUpResponse, ChangePassword, ForgotPassword, ResetPassword, UserInfo } from '@/types'

export async function login(data: UserLogin): Promise<{ access_token: string; token_type: string }> {
  const res = await post<{ access_token: string; token_type: string }>('/auth/login', data)
  setToken(res.access_token)
  return res
}

export const logout = () => post<void>('/auth/logout')
export const addUser = (data: UserSignUp) => post<UserSignUpResponse>('/auth/add-user', data)
export const deleteUser = (email: string) => del(`/auth/delete-user/${encodeURIComponent(email)}`)
export const refreshToken = () => post<void>('/auth/refresh-token')
export const getUserInfo = () => get<UserInfo>('/auth/user-info')
export const changePassword = (data: ChangePassword) => post<void>('/auth/change-password', data)
export const forgotPassword = (data: ForgotPassword) => post<void>('/auth/forgot-password', data)
export const resetPassword = (data: ResetPassword) => post<void>('/auth/reset-password', data)
