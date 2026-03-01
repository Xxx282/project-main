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
  budget?: number
  city?: string
  region?: string
  bedrooms?: number
  bathrooms?: number
  minArea?: number
  maxArea?: number
  minFloors?: number
  maxFloors?: number
  orientation?: 'east' | 'south' | 'west' | 'north'
  decoration?: 'rough' | 'simple' | 'fine' | 'luxury'
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

