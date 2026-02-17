import { http } from '../../../shared/api/http'
import { mockListings } from '../../../shared/api/mockData'
import type { Inquiry, Listing } from '../../../shared/api/types'

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

export type PricePredictRequest = {
  bedrooms?: number
  bathrooms?: number
  area?: number
  region?: string
}

export type PricePredictResponse = {
  predictedRent: number
  currency?: string
  confidence?: number
}

export async function listMyListings(): Promise<Listing[]> {
  try {
    const { data } = await http.get<ListResponse<Listing>>('/listings/mine')
    return data.data
  } catch {
    return mockListings
  }
}

export async function createListing(payload: Partial<Listing>): Promise<Listing> {
  try {
    const { data } = await http.post<SingleResponse<Listing>>('/listings', payload)
    return data.data
  } catch {
    return { ...(payload as Listing), id: Date.now(), rent: payload.rent ?? 0, title: payload.title ?? '新房源' }
  }
}

export async function updateListing(id: number, payload: Partial<Listing>): Promise<Listing> {
  try {
    const { data } = await http.put<SingleResponse<Listing>>(`/listings/${id}`, payload)
    return data.data
  } catch {
    const base = mockListings.find((x) => x.id === id) ?? (payload as Listing)
    return { ...base, ...payload, id }
  }
}

export async function deleteListing(id: number): Promise<void> {
  try {
    await http.delete(`/listings/${id}`)
  } catch {
    // mock: ignore
  }
}

export async function pricePredict(req: PricePredictRequest): Promise<PricePredictResponse> {
  try {
    const { data } = await http.post<PricePredictResponse>('/pricing/predict', req)
    return data
  } catch {
    const base = 1500
    const b = (req.bedrooms ?? 1) * 700
    const ba = (req.bathrooms ?? 1) * 350
    const area = (req.area ?? 40) * 10
    return { predictedRent: Math.round(base + b + ba + area), currency: 'CNY', confidence: 0.7 }
  }
}

export async function listLandlordInquiries(): Promise<Inquiry[]> {
  try {
    const { data } = await http.get<ListResponse<Inquiry>>('/landlord/inquiries')
    return data.data
  } catch {
    return [
      { id: 'lq-1', listingId: 1, message: '什么时候方便看房？', status: 'pending' },
    ]
  }
}

