import { http } from '../../../shared/api/http'
import type { Listing } from '../../../shared/api/types'

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

export type AdminUser = {
  id: number
  username: string
  email: string
  role: 'tenant' | 'landlord' | 'admin'
  phone?: string
  realName?: string
  isActive: boolean
  createdAt: string
}

export type AdminListing = Listing & { status?: 'pending' | 'approved' | 'rejected' | 'available' | 'rented' | 'offline' }

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
  await http.patch(`/admin/users/${Number(id)}?enabled=${enabled}`)
}

export async function listListingsForReview(): Promise<AdminListing[]> {
  const { data } = await http.get<ListResponse<AdminListing>>('/admin/listings')
  return data.data
}

export async function reviewListing(id: string, status: 'approved' | 'rejected'): Promise<void> {
  await http.patch(`/admin/listings/${id}`, { status })
}

