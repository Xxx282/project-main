export type UserRole = 'tenant' | 'landlord' | 'admin'

export type AuthUser = {
  id: number | string
  username: string
  email?: string
  role: UserRole
}

const TOKEN_KEY = 'accessToken'

let memoryToken: string | null = null

export const authStore = {
  getToken(): string | null {
    return memoryToken ?? localStorage.getItem(TOKEN_KEY)
  },
  setToken(token: string, persist: boolean) {
    memoryToken = token
    if (persist) localStorage.setItem(TOKEN_KEY, token)
  },
  clearToken() {
    memoryToken = null
    localStorage.removeItem(TOKEN_KEY)
  },
}

