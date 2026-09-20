import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import MobileBottomNav from './MobileBottomNav'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', zIndex: 99 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="main-content">
        <Navbar onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav onMoreClick={() => setSidebarOpen(true)} />
    </div>
  )
}

export default Layout
