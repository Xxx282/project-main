import { http } from '../../../shared/api/http'
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
  predictedPrice: number
  currency?: string
  confidence?: number
}

export async function listMyListings(): Promise<Listing[]> {
  const { data } = await http.get<ListResponse<Listing>>('/listings/mine')
  return data.data
}

export async function createListing(payload: Partial<Listing>): Promise<Listing> {
  const { data } = await http.post<SingleResponse<Listing>>('/listings', payload)
  return data.data
}

export async function updateListing(id: number, payload: Partial<Listing>): Promise<Listing> {
  const { data } = await http.put<SingleResponse<Listing>>(`/listings/${id}`, payload)
  return data.data
}

export async function deleteListing(id: number): Promise<void> {
  await http.delete(`/listings/${id}`)
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
    return { predictedPrice: Math.round(base + b + ba + area), currency: 'CNY', confidence: 0.7 }
  }
}

export async function listLandlordInquiries(): Promise<Inquiry[]> {
  const { data } = await http.get<ListResponse<Inquiry>>('/inquiries/landlord')
  return data.data
}

