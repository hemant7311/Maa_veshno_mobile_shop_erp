import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, requireAdmin, requireAgent }) => {
  const { isLoggedIn, user } = useAuth()
  const location = useLocation()

  if (!isLoggedIn) return <Navigate to="/login" replace />

  // If this route is STRICTLY for admins, block agents
  if (requireAdmin && user?.role === 'finance_agent') {
    return <Navigate to="/agent-panel" replace />
  }

  // If this route is STRICTLY for agents, block admins
  if (requireAgent && user?.role !== 'finance_agent') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
