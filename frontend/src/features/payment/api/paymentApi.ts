import { http } from '../../../shared/api/http'

// 支付订单类型
export interface PaymentOrder {
  id: number
  orderNo: string
  payerId: number
  payerUsername: string
  payerRealName?: string
  payeeId: number
  payeeUsername: string
  payeeRealName?: string
  propertyId: number
  propertyTitle?: string
  paymentType: 'DEPOSIT' | 'RENT'
  amount: number
  status: 'PENDING' | 'SUCCESS' | 'REJECTED' | 'REFUNDED'
  paymentChannel: 'WECHAT' | 'ALIPAY'
  transactionId?: string
  paidAt?: string
  reviewedAt?: string
  reviewerId?: number
  reviewNote?: string
  createdAt: string
  updatedAt: string
}

// 创建支付订单请求
export interface CreatePaymentRequest {
  payeeId: number
  propertyId: number
  paymentType: 'DEPOSIT' | 'RENT'
  amount: number
  paymentChannel: 'WECHAT' | 'ALIPAY'
}

// 审核请求
export interface ReviewPaymentRequest {
  orderId: number
  action: 'APPROVE' | 'REJECT' | 'REFUND'
  note?: string
}

// 分页响应
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

// 创建支付订单
export async function createPayment(data: CreatePaymentRequest): Promise<PaymentOrder> {
  const response = await http.post('/api/payments/create', data)
  return response.data.data
}

// 获取我的订单列表
export async function getMyPayments(
  page = 0,
  size = 10,
  sortBy = 'createdAt',
  sortDir = 'desc'
): Promise<PageResponse<PaymentOrder>> {
  const response = await http.get('/api/payments/my', {
    params: { page, size, sortBy, sortDir }
  })
  return response.data.data
}

// 获取订单详情
export async function getPaymentById(id: number): Promise<PaymentOrder> {
  const response = await http.get(`/api/payments/${id}`)
  return response.data.data
}

// ===== 管理员接口 =====

// 获取待审核订单
export async function getPendingPayments(
  page = 0,
  size = 10
): Promise<PageResponse<PaymentOrder>> {
  const response = await http.get('/api/payments/admin/pending', {
    params: { page, size }
  })
  return response.data.data
}

// 获取所有订单
export async function getAllPayments(
  page = 0,
  size = 10,
  status?: string
): Promise<PageResponse<PaymentOrder>> {
  const response = await http.get('/api/payments/admin/all', {
    params: { page, size, status }
  })
  return response.data.data
}

// 审核订单
export async function reviewPayment(data: ReviewPaymentRequest): Promise<PaymentOrder> {
  const response = await http.post('/api/payments/admin/review', data)
  return response.data.data
}

// 统计待审核数量
export async function getPendingCount(): Promise<number> {
  const response = await http.get('/api/payments/admin/pending-count')
  return response.data.data.count
}
