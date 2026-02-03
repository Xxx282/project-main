export type Listing = {
  id: string
  title: string
  rent: number
  region?: string
  bedrooms?: number
  bathrooms?: number
  area?: number
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
  listingId: string
  message: string
  status: InquiryStatus
  createdAt?: string
}

