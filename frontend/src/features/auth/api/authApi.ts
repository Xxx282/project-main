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

