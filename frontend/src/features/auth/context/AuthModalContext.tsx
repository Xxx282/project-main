import React, { createContext, useContext, useState, useCallback } from 'react'

type AuthModalMode = 'login' | 'register'

type AuthModalState = {
  visible: boolean
  mode: AuthModalMode
}

type AuthModalContextType = {
  authModal: AuthModalState
  openAuthModal: (mode: AuthModalMode) => void
  closeAuthModal: () => void
}

const AuthModalContext = createContext<AuthModalContextType | null>(null)

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider')
  }
  return context
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [authModal, setAuthModal] = useState<AuthModalState>({
    visible: false,
    mode: 'login',
  })

  const openAuthModal = useCallback((mode: AuthModalMode) => {
    setAuthModal({ visible: true, mode })
  }, [])

  const closeAuthModal = useCallback(() => {
    setAuthModal((prev) => ({ ...prev, visible: false }))
  }, [])

  return (
    <AuthModalContext.Provider value={{ authModal, openAuthModal, closeAuthModal }}>
      {children}
    </AuthModalContext.Provider>
  )
}
