import { http } from '../../../shared/api/http'
import { mockInquiries, mockListings, mockPreferences } from '../../../shared/api/mockData'
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
  try {
    const { data } = await http.get<ListResponse<Listing>>('/listings', { params: query })
    return data.data
  } catch {
    const q = (query.q ?? '').trim().toLowerCase()
    return mockListings.filter((x) => {
      const okQ = !q || x.title.toLowerCase().includes(q)
      const okRegion = !query.region || x.region === query.region
      const okBedrooms = !query.bedrooms || x.bedrooms === query.bedrooms
      const okMin = query.minRent == null || x.rent >= query.minRent
      const okMax = query.maxRent == null || x.rent <= query.maxRent
      return okQ && okRegion && okBedrooms && okMin && okMax
    })
  }
}

export async function getListing(id: string): Promise<Listing> {
  try {
    const { data } = await http.get<SingleResponse<Listing>>(`/listings/${id}`)
    return data.data
  } catch {
    const hit = mockListings.find((x) => x.id === id)
    if (!hit) throw new Error('Listing not found')
    return hit
  }
}

export async function getRecommendations(): Promise<Listing[]> {
  try {
    const { data } = await http.get<ListResponse<Listing>>('/tenant/recommendations')
    return data.data
  } catch {
    // mock: 简单按预算/区域偏好做一次筛选
    return mockListings.slice(0, 2)
  }
}

export async function getPreferences(): Promise<TenantPreferences> {
  try {
    const { data } = await http.get<SingleResponse<TenantPreferences>>('/tenant/preferences')
    return data.data
  } catch {
    return mockPreferences
  }
}

export async function savePreferences(p: TenantPreferences): Promise<TenantPreferences> {
  try {
    const { data } = await http.put<SingleResponse<TenantPreferences>>('/tenant/preferences', p)
    return data.data
  } catch {
    return p
  }
}

export async function listMyInquiries(): Promise<Inquiry[]> {
  try {
    const { data } = await http.get<ListResponse<Inquiry>>('/inquiries/my')
    return data.data
  } catch {
    return mockInquiries
  }
}

export async function createInquiry(req: { listingId: string; message: string }): Promise<Inquiry> {
  try {
    const { data } = await http.post<SingleResponse<Inquiry>>('/inquiries', req)
    return data.data
  } catch {
    return {
      id: `inq-mock-${Date.now()}`,
      listingId: req.listingId,
      message: req.message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
  }
}

