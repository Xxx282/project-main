import { useState, useEffect, useCallback, useRef } from 'react'
import type { PaymentMonitorResponse } from '../api/paymentMonitorApi'
import {
  startPaymentMonitor,
  getPaymentMonitorStatus,
  stopPaymentMonitor as stopMonitorApi
} from '../api/paymentMonitorApi'
import { message } from 'antd'

export type PaymentStatus = 'IDLE' | 'MONITORING' | 'SUCCESS' | 'TIMEOUT' | 'ERROR' | 'STOPPED'

interface UsePaymentMonitorOptions {
  orderNo?: string
  amount?: number
  timeoutSeconds?: number
  pollInterval?: number
  onSuccess?: (details: PaymentMonitorResponse['paymentData']) => void
  onTimeout?: () => void
  onError?: (error: Error) => void
}

interface UsePaymentMonitorReturn {
  status: PaymentStatus
  monitorId: string | null
  paymentDetails: PaymentMonitorResponse['paymentData'] | undefined
  error: Error | null
  start: () => Promise<void>
  stop: () => Promise<void>
  isMonitoring: boolean
}

export function usePaymentMonitor({
  orderNo,
  amount,
  timeoutSeconds = 60,  // 默认 60 秒超时
  pollInterval = 3000,  // 前端轮询间隔 3 秒（比后端刷新快，及时响应）
  onSuccess,
  onTimeout,
  onError,
}: UsePaymentMonitorOptions): UsePaymentMonitorReturn {
  const [status, setStatus] = useState<PaymentStatus>('IDLE')
  const [monitorId, setMonitorId] = useState<string | null>(null)
  const [paymentDetails, setPaymentDetails] = useState<PaymentMonitorResponse['paymentData'] | undefined>(undefined)
  const [error, setError] = useState<Error | null>(null)

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const monitorIdRef = useRef<string | null>(null)  // 使用 ref 避免闭包问题
  const mountedRef = useRef(true)

  // Cleanup function
  const cleanup = useCallback(async () => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
    // 使用 ref 中的 monitorId，避免闭包问题
    const currentMonitorId = monitorIdRef.current
    if (currentMonitorId) {
      try {
        await stopMonitorApi(currentMonitorId)
      } catch (e) {
        console.error('Failed to stop monitor:', e)
      }
      monitorIdRef.current = null
    }
  }, [])

  // Check status polling - directly call Python service
  const checkStatus = useCallback(async () => {
    const currentMonitorId = monitorIdRef.current
    if (!currentMonitorId || !mountedRef.current) return

    try {
      const result = await getPaymentMonitorStatus(currentMonitorId)

      if (!mountedRef.current) return

      switch (result.status) {
        case 'SUCCESS':
          setStatus('SUCCESS')
          setPaymentDetails(result.paymentData || undefined)
          message.success('支付成功！')
          onSuccess?.(result.paymentData || undefined)
          await cleanup()
          break

        case 'TIMEOUT':
          setStatus('TIMEOUT')
          message.warning('支付超时，请检查是否已支付')
          onTimeout?.()
          await cleanup()
          break

        case 'STOPPED':
          setStatus('STOPPED')
          await cleanup()
          break

        case 'ERROR':
          setStatus('ERROR')
          setError(new Error(result.errorMessage || 'Monitor error'))
          onError?.(new Error(result.errorMessage || 'Monitor error'))
          await cleanup()
          break

        case 'PENDING':
        case 'STARTING':
        case 'WAITING_LOGIN':
        case 'MONITORING':
          // Continue polling
          break
      }
    } catch (e) {
      if (mountedRef.current) {
        console.error('Error checking payment status:', e)
        setError(e as Error)
        onError?.(e as Error)
      }
    }
  }, [cleanup, onSuccess, onTimeout, onError])

  // Start monitoring - directly call Python service
  const start = useCallback(async () => {
    // 防止重复启动
    if (pollTimerRef.current) {
      console.log('Monitor already running, skipping duplicate start')
      return
    }

    try {
      setError(null)
      setStatus('MONITORING')
      setPaymentDetails(undefined)

      const result = await startPaymentMonitor(orderNo, amount, timeoutSeconds)

      if (!mountedRef.current) return

      setMonitorId(result.monitorId)
      monitorIdRef.current = result.monitorId  // 同步更新 ref

      // Start polling
      pollTimerRef.current = setInterval(checkStatus, pollInterval)

    } catch (e) {
      if (mountedRef.current) {
        console.error('Failed to start monitor:', e)
        setStatus('ERROR')
        setError(e as Error)
        onError?.(e as Error)
      }
    }
  }, [orderNo, amount, timeoutSeconds, pollInterval, checkStatus, onError])

  // Stop monitoring
  const stop = useCallback(async () => {
    setStatus('STOPPED')
    await cleanup()
  }, [cleanup])

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      cleanup()
    }
  }, [cleanup])

  return {
    status,
    monitorId,
    paymentDetails,
    error,
    start,
    stop,
    isMonitoring: status === 'MONITORING',
  }
}
