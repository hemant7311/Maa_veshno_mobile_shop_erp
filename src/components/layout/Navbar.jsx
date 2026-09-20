import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

const Navbar = ({ onMenuToggle }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/sales/notifications/emi')
      if (res.data?.success) {
        setNotifications(res.data.data || [])
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err)
    }
  }

  const handleSendWhatsApp = (notif) => {
    const text = `Dear ${notif.customerName},\nThis is a gentle reminder that your Maa Veshno Mobile EMI / Payment of Rs ${notif.dueAmount.toLocaleString('en-IN')} is pending.\nPlease arrange the payment at the earliest.\n\nThank you!`;
    const url = `https://wa.me/91${notif.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  return (
    <header className="navbar">
      <div className="navbar-left">
        {/* User Info */}
        <div className="navbar-user">
          <div className="navbar-avatar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div className="navbar-user-info">
            <span className="navbar-user-name">{user?.name || 'Admin User'}</span>
            <span className="navbar-user-role">{user?.role || 'Administrator'}</span>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>

      <div className="navbar-right">
        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button className="navbar-icon-btn" aria-label="Notifications" onClick={() => setShowDropdown(!showDropdown)}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {notifications.length > 0 && <span className="navbar-badge">{notifications.length}</span>}
          </button>

          {showDropdown && (
            <div style={{ 
              position: 'absolute', top: '100%', right: '0', width: '320px', 
              background: 'var(--white)', border: '1px solid var(--border)', 
              borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 1000 
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Pending EMIs ({notifications.length})</span>
                <button onClick={() => setShowDropdown(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>No pending EMIs!</div>
                ) : notifications.map(n => (
                  <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: 'var(--primary)' }}>{n.customerName}</strong>
                      <span style={{ color: 'var(--error)' }}>₹{n.dueAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      {n.phone} • {n.daysSince} days ago
                    </div>
                    <button 
                      onClick={() => handleSendWhatsApp(n)}
                      style={{ 
                        background: '#25D366', color: '#fff', border: 'none', padding: '4px 8px', 
                        borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center' 
                      }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      Send WhatsApp Reminder
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button className="navbar-menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    </header>
  )
}

export default Navbar
