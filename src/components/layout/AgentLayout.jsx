import React from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const AgentLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* Agent Topbar */}
      <header className="agent-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: 'var(--card-bg)', 
        borderBottom: '1px solid var(--border)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
          <div>
            <h2 style={{ fontSize: '16px', margin: 0, color: 'var(--primary)', fontWeight: 700 }}>MAA VESHNO</h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AGENT PORTAL</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="hide-on-mobile" style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>{user?.name || user?.username || 'Agent'}</div>
            <div style={{ fontSize: '11px', color: 'var(--orange)' }}>Finance Agent</div>
          </div>
          <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }}>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="agent-main" style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>
    </div>
  )
}

export default AgentLayout
