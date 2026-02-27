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

// ========== 收藏相关 API ==========

export type Favorite = {
  id: number
  userId: number
  propertyId: number
  createdAt: string
}

type FavoritesResponse = {
  code: number
  message: string
  data: {
    favorites: Favorite[]
    total: number
  }
  timestamp: number
  success: boolean
}

type FavoriteCheckResponse = {
  code: number
  message: string
  data: {
    propertyId: number
    favorited: boolean
  }
  timestamp: number
  success: boolean
}

type FavoriteActionResponse = {
  code: number
  message: string
  data: {
    message: string
    favorite?: Favorite
  }
  timestamp: number
  success: boolean
}

export async function getMyFavorites(): Promise<{ favorites: Favorite[]; total: number }> {
  const { data } = await http.get<FavoritesResponse>('/favorites')
  return data.data
}

export async function addFavorite(propertyId: number): Promise<Favorite> {
  const { data } = await http.post<FavoriteActionResponse>(`/favorites/${propertyId}`)
  return data.data.favorite!
}

export async function removeFavorite(propertyId: number): Promise<void> {
  await http.delete(`/favorites/${propertyId}`)
}

export async function checkFavorite(propertyId: number): Promise<boolean> {
  const { data } = await http.get<FavoriteCheckResponse>(`/favorites/check/${propertyId}`)
  return data.data.favorited
}
