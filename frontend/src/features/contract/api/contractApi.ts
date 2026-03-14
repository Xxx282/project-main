import { http } from '../../../shared/api/http'

// 合同实体
export interface RentalContract {
  id: number
  contractNo: string
  tenantId: number
  tenantUsername?: string
  tenantRealName?: string
  landlordId: number
  landlordUsername?: string
  landlordRealName?: string
  propertyId: number
  propertyTitle?: string
  propertyAddress?: string
  monthlyRent: number
  deposit: number
  leaseStart: string
  leaseEnd: string
  // 后端枚举：pending_sign / signed / completed / cancelled
  status: 'pending_sign' | 'signed' | 'completed' | 'cancelled'
  tenantSignature?: string
  signedAt?: string
  tenantIp?: string
  createdAt: string
  updatedAt: string
}

// 创建合同请求
export interface CreateContractRequest {
  landlordId: number
  propertyId: number
  monthlyRent: number
  deposit: number
  leaseStart: string
  leaseEnd: string
}

// 签署合同请求
export interface SignContractRequest {
  contractId: number
  signature: string // Base64 图片
}

// 创建合同
export async function createContract(data: CreateContractRequest): Promise<RentalContract> {
  const response = await http.post('/api/contracts/create', data)
  return response.data.data
}

// 签署合同
export async function signContract(data: SignContractRequest): Promise<RentalContract> {
  const response = await http.post('/api/contracts/sign', data)
  return response.data.data
}

// 获取我的合同列表
export async function getMyContracts(): Promise<RentalContract[]> {
  const response = await http.get('/api/contracts/my')
  return response.data.data
}

// 获取合同详情
export async function getContractById(id: number): Promise<RentalContract> {
  const response = await http.get(`/api/contracts/${id}`)
  return response.data.data
}

// 管理员获取所有合同
export async function getAllContracts(): Promise<RentalContract[]> {
  const response = await http.get('/api/contracts/admin/all')
  return response.data.data
}

// 房东获取我的合同列表
export async function getLandlordContracts(): Promise<RentalContract[]> {
  const response = await http.get('/api/contracts/landlord/my')
  return response.data.data
}

// 房东签署合同
export async function signContractAsLandlord(data: SignContractRequest): Promise<RentalContract> {
  const response = await http.post('/api/contracts/landlord/sign', data)
  return response.data.data
}


