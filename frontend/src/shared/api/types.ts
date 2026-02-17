export type Listing = {
  id: number
  title: string
  rent: number
  address?: string
  city?: string
  region?: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  price?: number
  description?: string
}

export type TenantPreferences = {
  budget?: number
  region?: string
  bedrooms?: number
}

export type InquiryStatus = 'pending' | 'replied' | 'closed'

export type Inquiry = {
  id: string
  listingId: number
  message: string
  status: InquiryStatus
  createdAt?: string
}

