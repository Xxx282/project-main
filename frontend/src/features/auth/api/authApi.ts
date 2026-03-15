import { http } from '../../../shared/api/http'
import type { AuthUser, UserRole } from '../store/authStore'

export type LoginRequest = {
  usernameOrEmail: string
  password: string
  role?: UserRole
}

export type LoginResponse = {
  accessToken: string
  user: AuthUser
}

export type LoginResponseData = {
  code: number
  message: string
  data: LoginResponse
  timestamp: number
  success: boolean
}

export type RegisterRequest = {
  username: string
  email: string
  password: string
  phone: string
  role: Exclude<UserRole, 'admin'>
}

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponseData>('/auth/login', req)
  return data.data
}

export async function register(req: RegisterRequest): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponseData>('/auth/register', req)
  return data.data
}

export type MeResponseData = {
  code: number
  message: string
  data: AuthUser
  timestamp: number
  success: boolean
}

export async function me(): Promise<AuthUser> {
  const { data } = await http.get<MeResponseData>('/auth/me')
  return data.data
}

/** 忘记密码：请求向邮箱发送重置链接 */
export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await http.post<{ data: { message: string } }>('/auth/forgot-password', { email })
  return data.data
}

/** 重置密码（需携带邮件中的 token 与 email） */
export async function resetPassword(params: {
  email: string
  token: string
  newPassword: string
}): Promise<{ message: string }> {
  const { data } = await http.post<{ data: { message: string } }>('/auth/reset-password', params)
  return data.data
}

/** 用户信息响应类型 */
export type UserProfileResponseData = {
  code: number
  message: string
  data: {
    id: number
    username: string
    email: string
    phone: string | null
    realName: string | null
    role: string
    isActive: boolean
    emailVerified: boolean
    createdAt: string
    updatedAt: string
  }
  timestamp: number
  success: boolean
}

/** 获取当前用户资料 */
export async function getUserProfile(): Promise<UserProfileResponseData['data']> {
  const { data } = await http.get<UserProfileResponseData>('/users/profile')
  return data.data
}

/** 更新用户资料 */
export type UpdateProfileRequest = {
  username?: string
  phone?: string
  realName?: string
}

export async function updateUserProfile(req: UpdateProfileRequest): Promise<UserProfileResponseData['data']> {
  const { data } = await http.put<UserProfileResponseData>('/users/profile', req)
  return data.data
}

/** 请求更改邮箱 */
export async function requestEmailChange(newEmail: string): Promise<{ message: string }> {
  const { data } = await http.post<{ data: { message: string } }>('/users/profile/email-change', { newEmail })
  return data.data
}

/** 确认邮箱更改 */
export async function confirmEmailChange(newEmail: string, verificationCode: string): Promise<UserProfileResponseData['data']> {
  const { data } = await http.post<UserProfileResponseData>('/users/profile/email-change/confirm', {
    newEmail,
    verificationCode,
  })
  return data.data
}

