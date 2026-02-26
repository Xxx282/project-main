export type Listing = {
  id: number
  title: string
  price: number
  city?: string
  region?: string
  bedrooms?: number
  bathrooms?: number
  area?: number
  totalFloors?: number
  orientation?: 'east' | 'south' | 'west' | 'north'
  decoration?: 'rough' | 'simple' | 'fine' | 'luxury'
  description?: string
  status?: 'available' | 'rented' | 'offline'
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
  tenantId?: number
  tenantUsername?: string
  message: string
  status: InquiryStatus
  createdAt?: string
}

