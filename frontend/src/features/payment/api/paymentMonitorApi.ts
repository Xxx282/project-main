import axios from 'axios'

// Python Payment Monitor 服务的 base URL
// 可以通过环境变量配置，默认为 localhost:5001
const PAYMENT_MONITOR_BASE_URL = import.meta.env.VITE_PAYMENT_MONITOR_API_URL || 'http://localhost:5001'

// 创建 axios 实例
const paymentMonitorHttp = axios.create({
  baseURL: PAYMENT_MONITOR_BASE_URL,
  timeout: 30000,
})

// 请求拦截器 - 添加必要的 headers
paymentMonitorHttp.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证信息
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 统一错误处理
paymentMonitorHttp.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Payment Monitor API Error:', error)
    return Promise.reject(error)
  }
)

// ==================== 类型定义 ====================

export interface PaymentMonitorResponse {
  monitorId: string
  orderNo: string
  amount: number
  status: 'PENDING' | 'STARTING' | 'WAITING_LOGIN' | 'MONITORING' | 'SUCCESS' | 'TIMEOUT' | 'ERROR' | 'STOPPED'
  startTime: number
  endTime?: number
  checkCount: number
  errorMessage?: string
  paymentData?: {
    create_time: string
    pay_time: string
    name: string
    merchant_order_no: string
    alipay_trade_no: string
    buyer_info: string
    amount: string
    refund_amount: string
    trade_status: string
  }
}

export interface StartMonitorRequest {
  orderNo?: string
  amount?: number
  timeoutSeconds?: number
}

// ==================== API 函数 ====================

/**
 * 健康检查
 */
export async function checkPaymentMonitorHealth(): Promise<{ status: string; service: string }> {
  const response = await paymentMonitorHttp.get('/api/v1/health')
  return response.data
}

/**
 * 启动支付监控
 * @param orderNo 订单号（可选）
 * @param amount 金额（可选，后端通过支付时间判断）
 * @param timeoutSeconds 超时时间（秒），默认 60 秒
 */
export async function startPaymentMonitor(
  orderNo?: string,
  amount?: number,
  timeoutSeconds: number = 60  // 默认 60 秒超时
): Promise<{
  monitorId: string
  orderNo: string
  amount: number
  timeoutSeconds: number
  status: string
  message: string
}> {
  const response = await paymentMonitorHttp.post('/api/v1/monitor/start', {
    orderNo: orderNo || '',
    amount: amount || 0,
    timeoutSeconds,
  })
  return response.data
}

/**
 * 获取监控状态
 * @param monitorId 监控ID
 */
export async function getPaymentMonitorStatus(monitorId: string): Promise<PaymentMonitorResponse> {
  const response = await paymentMonitorHttp.get(`/api/v1/monitor/status/${monitorId}`)
  return response.data
}

/**
 * 停止支付监控
 * @param monitorId 监控ID
 */
export async function stopPaymentMonitor(monitorId: string): Promise<{ message: string; status: string }> {
  const response = await paymentMonitorHttp.post(`/api/v1/monitor/stop/${monitorId}`)
  return response.data
}

export default paymentMonitorHttp
