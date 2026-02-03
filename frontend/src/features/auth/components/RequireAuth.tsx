import { Spin } from 'antd'
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { UserRole } from '../store/authStore'
import { useAuth } from '../context/AuthContext'

export function RequireAuth(props: {
  children: React.ReactNode
  roles?: UserRole[]
}) {
  const auth = useAuth()
  const location = useLocation()

  if (auth.loading) {
    return <Spin fullscreen />
  }

  if (!auth.user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (props.roles?.length && !props.roles.includes(auth.user.role)) {
    return <Navigate to="/" replace />
  }

  return props.children
}

