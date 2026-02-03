import { http } from '../../../shared/api/http'
import type { Listing } from '../../../shared/api/types'
import type { AuthUser } from '../../auth/store/authStore'

type ListResponse<T> = {
  code: number
  message: string
  data: T[]
  timestamp: number
  success: boolean
}

type SingleResponse<T> = {
  code: number
  message: string
  data: T
  timestamp: number
  success: boolean
}

export type AdminUser = AuthUser & { enabled?: boolean }

export type AdminListing = Listing & { status?: 'pending' | 'approved' | 'rejected' }

export type Dashboard = {
  users: number
  listings: number
  inquiriesToday: number
  pendingListings: number
}

export async function getDashboard(): Promise<Dashboard> {
  const { data } = await http.get<SingleResponse<Dashboard>>('/admin/dashboard')
  return data.data
}

export async function listUsers(): Promise<AdminUser[]> {
  const { data } = await http.get<ListResponse<AdminUser>>('/admin/users')
  return data.data
}

export async function setUserEnabled(id: string, enabled: boolean): Promise<void> {
  await http.patch(`/admin/users/${id}`, { enabled })
}

export async function listListingsForReview(): Promise<AdminListing[]> {
  const { data } = await http.get<ListResponse<AdminListing>>('/admin/listings')
  return data.data
}

export async function reviewListing(id: string, status: 'approved' | 'rejected'): Promise<void> {
  await http.patch(`/admin/listings/${id}`, { status })
}

