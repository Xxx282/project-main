import axios from 'axios'

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as any
    return (
      data?.message ||
      data?.error ||
      err.response?.statusText ||
      err.message ||
      '请求失败'
    )
  }
  if (err instanceof Error) return err.message
  return '请求失败'
}

