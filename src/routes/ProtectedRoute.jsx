import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, requireAdmin, requireAgent }) => {
  const { isLoggedIn, user } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) return <Navigate to="/login" replace />

  // If user is wholesaler trying to access admin dashboard
  if (user?.role === 'wholesaler' && location.pathname !== '/store') {
    return <Navigate to="/store" replace />
  }

  // If route requires admin/staff level access
  if (requireAdmin && user?.role === 'finance_agent') {
    return <Navigate to="/agent-panel" replace />
  }

  // If route requires agent level access
  if (requireAgent && user?.role !== 'finance_agent') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
