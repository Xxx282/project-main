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

export type PropertyImage = {
  id: number
  propertyId: number
  imageUrl: string
  sortOrder: number
  createdAt?: string
}

export type TenantPreferences = {
  budget?: number | null
  city?: string | null
  region?: string | null
  bedrooms?: number | null
  bathrooms?: number | null
  minArea?: number | null
  maxArea?: number | null
  minFloors?: number | null
  maxFloors?: number | null
  orientation?: 'east' | 'south' | 'west' | 'north' | null
  decoration?: 'rough' | 'simple' | 'fine' | 'luxury' | null
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

