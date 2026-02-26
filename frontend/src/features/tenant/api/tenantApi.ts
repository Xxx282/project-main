import { http } from '../../../shared/api/http'
import type { Inquiry, Listing, TenantPreferences } from '../../../shared/api/types'

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

export type ListingsQuery = {
  q?: string
  region?: string
  minRent?: number
  maxRent?: number
  bedrooms?: number
}

export async function listListings(query: ListingsQuery): Promise<Listing[]> {
  const { data } = await http.get<ListResponse<Listing>>('/listings', { params: query })
  return data.data
}

export async function getListing(id: number): Promise<Listing> {
  const { data } = await http.get<SingleResponse<Listing>>(`/listings/${id}`)
  return data.data
}

export async function getRecommendations(): Promise<Listing[]> {
  const { data } = await http.get<ListResponse<Listing>>('/tenant/recommendations')
  return data.data
}

export async function getPreferences(): Promise<TenantPreferences> {
  const { data } = await http.get<SingleResponse<TenantPreferences>>('/tenant/preferences')
  return data.data
}

export async function savePreferences(p: TenantPreferences): Promise<TenantPreferences> {
  const { data } = await http.put<SingleResponse<TenantPreferences>>('/tenant/preferences', p)
  return data.data
}

export async function listMyInquiries(): Promise<Inquiry[]> {
  const { data } = await http.get<ListResponse<Inquiry>>('/inquiries/my')
  return data.data
}

export async function createInquiry(req: { listingId: number; message: string }): Promise<Inquiry> {
  const { data } = await http.post<SingleResponse<Inquiry>>('/inquiries', req)
  return data.data
}
