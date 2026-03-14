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

