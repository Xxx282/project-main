import axios from 'axios'
import { env } from './env'
import { authStore } from '../../features/auth/store/authStore'
import { getErrorMessage } from './errors'

export const http = axios.create({
  baseURL: env.apiBaseUrl ?? '/api',
  timeout: 30_000,
})

http.interceptors.request.use((config) => {
  const token = authStore.getToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    // 统一把后端错误规范化（上层页面按需展示）
    return Promise.reject(new Error(getErrorMessage(err)))
  },
)

