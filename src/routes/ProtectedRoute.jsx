import React from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, requiredAdmin, requiredPermission }) => {
  const { isLoggedIn, user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  // 1. Inactive user safety check
  if (user?.status === 'inactive') {
    logout()
    return <Navigate to="/login" replace />
  }

  // 2. Wholesaler Role Isolation: Wholesalers can ONLY access /store
  if (user?.role === 'wholesaler') {
    if (location.pathname !== '/store') {
      return <Navigate to="/store" replace />
    }
    return children
  }

  // 3. Finance Agent Role Isolation: Finance Agents can ONLY access /agent-panel
  if (user?.role === 'finance_agent') {
    if (location.pathname !== '/agent-panel') {
      return <Navigate to="/agent-panel" replace />
    }
    return children
  }

  // 4. Admin Only Routes (/users, /backup, /sliders)
  if (requiredAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  // 5. Staff Permission Check
  if (user?.role === 'staff') {
    // Staff cannot access admin-only pages
    const adminOnlyPaths = ['/users', '/backup', '/sliders']
    if (adminOnlyPaths.some(p => location.pathname.startsWith(p))) {
      return <Navigate to="/dashboard" replace />
    }

    const perms = Array.isArray(user.permissions) ? user.permissions : []

    // If staff has no permissions assigned
    if (perms.length === 0) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '24px', textAlign: 'center', background: '#f8fafc' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '8px' }}>No Modules Assigned</h2>
          <p style={{ color: '#64748b', maxWidth: '420px', marginBottom: '24px' }}>
            No ERP modules have been assigned to your staff account. Please contact your system administrator.
          </p>
          <button className="btn btn-primary" onClick={() => { logout(); navigate('/login'); }}>
            Logout Account
          </button>
        </div>
      )
    }

    // Check module permission if required
    if (requiredPermission && !perms.includes(requiredPermission)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', padding: '24px', textAlign: 'center' }}>
          <h3 style={{ color: '#b91c1c', marginBottom: '8px' }}>Access Denied (403)</h3>
          <p style={{ color: '#4b5563', marginBottom: '16px' }}>
            You do not have permission to access the <strong>{requiredPermission}</strong> module.
          </p>
          <button className="btn btn-outline" onClick={() => window.history.back()}>
            Go Back
          </button>
        </div>
      )
    }
  }

  return children
}

export default ProtectedRoute
