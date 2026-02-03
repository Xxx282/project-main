import type { Inquiry, Listing, TenantPreferences } from './types'

export const mockListings: Listing[] = [
  {
    id: '1',
    title: '近地铁两室一厅（示例）',
    rent: 3200,
    region: '示例区域 A',
    bedrooms: 2,
    bathrooms: 1,
    area: 65,
    description: '采光好，配套齐全，步行 8 分钟到地铁。',
  },
  {
    id: '2',
    title: '精装一室（示例）',
    rent: 2600,
    region: '示例区域 B',
    bedrooms: 1,
    bathrooms: 1,
    area: 40,
    description: '适合单人/情侣，拎包入住。',
  },
  {
    id: '3',
    title: '三室合租主卧（示例）',
    rent: 3800,
    region: '示例区域 A',
    bedrooms: 3,
    bathrooms: 2,
    area: 95,
    description: '可短租，生活便利。',
  },
]

export const mockPreferences: TenantPreferences = {
  budget: 3500,
  region: '示例区域 A',
  bedrooms: 2,
}

export const mockInquiries: Inquiry[] = [
  {
    id: 'inq-1',
    listingId: '1',
    message: '请问可否养宠物？',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
]

