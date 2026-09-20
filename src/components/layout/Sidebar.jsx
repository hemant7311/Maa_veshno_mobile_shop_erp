import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, FolderTree, Package, ScanLine, Users, UsersRound, Truck,
  Receipt, Wallet, Scale, LineChart, ShieldCheck, Settings, DownloadCloud, LogOut,
  Banknote, UserPlus, ShoppingCart
} from 'lucide-react'

const SidebarLink = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
  >
    <span className="sidebar-link-icon">
      <Icon size={20} strokeWidth={2} />
    </span>
    {label}
  </NavLink>
)

const Sidebar = ({ isOpen }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const hasAccess = (tab) => {
    if (user?.role === 'admin') return true
    if (user?.role === 'finance_agent') {
      return Array.isArray(user.permissions) && user.permissions.includes(tab)
    }
    return false
  }

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-logo" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '10px', minHeight: '80px', borderBottom: '1px solid var(--border)' }}>
        <img
          src="/logo.png"
          alt="Maa Veshno Mobile"
          style={{ width: '60px', height: '60px', objectFit: 'contain', flexShrink: 0 }}
        />
        <div className="sidebar-logo-text" style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="sidebar-logo-title" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary)', lineHeight: '1.2', letterSpacing: '0.3px' }}>MAA VESHNO</span>
          <span className="sidebar-logo-subtitle" style={{ fontSize: '10px', fontWeight: 700, color: 'var(--orange)', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '2px' }}>MOBILE</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {hasAccess('dashboard') && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">MAIN</div>
            <SidebarLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          </div>
        )}

        {hasAccess('products') && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">INVENTORY</div>
            {hasAccess('categories') && <SidebarLink to="/categories" icon={FolderTree} label="Categories" />}
            {hasAccess('products') && <SidebarLink to="/products" icon={Package} label="Products" />}
            {hasAccess('imeis') && <SidebarLink to="/imei" icon={ScanLine} label="IMEI Management" />}
            {hasAccess('products') && <SidebarLink to="/company-returns" icon={Package} label="Stock Returns" />}
          </div>
        )}

        {hasAccess('customers') && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">BUYER & SUPPLIER</div>
            {hasAccess('customers') && <SidebarLink to="/customers" icon={Users} label="Customers" />}
            {hasAccess('suppliers') && (
              <>
                <SidebarLink to="/buyers" icon={UsersRound} label="Wholesaler" />
                <SidebarLink to="/suppliers" icon={Truck} label="Suppliers" />
                <SidebarLink to="/purchases" icon={ShoppingCart} label="Purchases" />
              </>
            )}
          </div>
        )}

        {hasAccess('dashboard') && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">BILLING</div>
            <SidebarLink to="/billing/customer" icon={Receipt} label="Billing" />
          </div>
        )}

        {hasAccess('finance') && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">FINANCE</div>
            <SidebarLink to="/finance" icon={Wallet} label="Finance" />
            <SidebarLink to="/balance-sheet" icon={Scale} label="Balance Sheet" />
            <SidebarLink to="/loans" icon={Banknote} label="Loan Management" />
            <SidebarLink to="/customer-receivables" icon={UserPlus} label="Money Given" />
          </div>
        )}

        {hasAccess('reports') && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">REPORTS</div>
            <SidebarLink to="/reports" icon={LineChart} label="Reports" />
          </div>
        )}

        {hasAccess('settings') && (
          <div className="sidebar-section">
            <div className="sidebar-section-label">SETTINGS</div>
            <SidebarLink to="/users" icon={ShieldCheck} label="Staff" />
            <SidebarLink to="/settings" icon={Settings} label="Settings" />
            <SidebarLink to="/sliders" icon={LayoutDashboard} label="Sliders" />
            <SidebarLink to="/backup" icon={DownloadCloud} label="Backup" />
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={20} strokeWidth={2} style={{marginRight: '8px'}} />
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar

