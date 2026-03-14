import { http } from '../../../shared/api/http'
import type { Listing, PropertyImage, TenantPreferences } from '../../../shared/api/types'

type ListResponse<T> = {
  code: number
  message: string
  data: T[]
  timestamp: number
  success: boolean
}

type PageResponse<T> = {
  code: number
  message: string
  data: {
    content: T[]
    totalElements: number
    totalPages: number
    size: number
    number: number
  }
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
  city?: string
  region?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  status?: string
  page?: number
  size?: number
}

export async function listListings(query: ListingsQuery): Promise<Listing[]> {
  const { data } = await http.get<ListResponse<Listing>>('/listings', { params: query })
  return data.data
}

// AI 智能搜索（返回 AI 总结 + 房源列表）
export type AiSearchResponse = {
  aiAnswer: string
  properties: Listing[]
  criteria?: { city?: string; bedrooms?: number; minPrice?: number; maxPrice?: number }
  totalFound: number
}

export async function aiSearch(query: string, limit = 20): Promise<AiSearchResponse> {
  const { data } = await http.post<SingleResponse<AiSearchResponse>>('/ai/search', { query, limit })
  return data.data
}

// 城市统计类型
export type CityStats = [string, number][]

type CityStatsResponse = {
  code: number
  message: string
  data: [string, number][]
  timestamp: number
  success: boolean
}

/**
 * 获取城市统计（用于词云图）
 */
export async function getCityStatistics(): Promise<CityStats> {
  const { data } = await http.get<CityStatsResponse>('/listings/cities')
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

export async function listMyInquiries(): Promise<any[]> {
  const { data } = await http.get<PageResponse<any>>('/conversations/tenant', { params: { size: 100 } })
  return data.data.content
}

export async function createInquiry(req: { propertyId: number; landlordId: number; message: string }): Promise<any> {
  const { data } = await http.post<SingleResponse<any>>('/conversations', req)
  return data.data
}

// 获取或创建对话（如果有已有对话则返回，没有则创建）
export async function getOrCreateConversation(propertyId: number, landlordId: number): Promise<any> {
  const { data } = await http.post<SingleResponse<any>>('/conversations', {
    propertyId,
    landlordId,
    message: '您好，我想咨询一下这套房源'
  })
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

// ========== 房源图片 API ==========

type PropertyImagesResponse = {
  code: number
  message: string
  data: PropertyImage[]
  timestamp: number
  success: boolean
}

export async function getListingImages(propertyId: number): Promise<PropertyImage[]> {
  const { data } = await http.get<PropertyImagesResponse>(`/listings/${propertyId}/images`)
  return data.data
}

// ========== 房东信息 API ==========

export type LandlordInfo = {
  id: number
  username: string
  realName?: string
  phone?: string
  email?: string
}

type LandlordInfoResponse = {
  code: number
  message: string
  data: LandlordInfo
  timestamp: number
  success: boolean
}

export async function getLandlordInfo(propertyId: number): Promise<LandlordInfo> {
  const { data } = await http.get<LandlordInfoResponse>(`/listings/${propertyId}/landlord`)
  return data.data
}

// ========== 租客信息 API ==========

export type TenantInfo = {
  id: number
  username: string
  realName?: string
  phone?: string
  email?: string
}

type TenantInfoResponse = {
  code: number
  message: string
  data: TenantInfo
  timestamp: number
  success: boolean
}

export async function getTenantInfo(tenantId: number): Promise<TenantInfo> {
  const { data } = await http.get<TenantInfoResponse>(`/users/${tenantId}`)
  return data.data
}
