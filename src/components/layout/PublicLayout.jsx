import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const PublicLayout = ({ children, initialSearch = '' }) => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState(initialSearch)

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/all-products?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="home-portal-wrapper">
      {/* Main Header */}
      <header className="portal-header">
        <div className="portal-container header-flex">
          {/* Logo brand */}
          <div className="portal-logo" onClick={() => navigate('/')}>
            <img
              src="/logo.png"
              alt="Maa Veshno Mobile Logo"
              style={{ width: '56px', height: '56px', objectFit: 'contain', flexShrink: 0 }}
            />
            <div className="logo-texts">
              <span className="logo-main">MAA VESHNO</span>
              <span className="logo-sub">MOBILE</span>
              <span className="logo-tagline">Trust. Service. Satisfaction.</span>
            </div>
          </div>

          {/* Search bar */}
          <form className="portal-search-form" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              placeholder="Search for products, brands..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="portal-search-input"
            />
            <button type="submit" className="portal-search-btn">Search</button>
          </form>

          {/* Contacts and buttons */}
          <div className="portal-header-actions">
            <div className="header-contact-info">
              <span className="contact-phone">📞 +91 98765 43210</span>
              <span className="contact-time">Mon - Sat 10:00 AM - 8:00 PM</span>
            </div>
            <button className="portal-login-btn" onClick={() => navigate('/login')}>
              Login
            </button>
            <button className="portal-getstarted-btn" onClick={() => navigate('/all-products')}>
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Sticky Navigation Menu bar */}
      <nav className="portal-navbar">
        <div className="portal-container nav-flex">
          <div className="nav-dropdown-btn" onClick={() => navigate('/all-products')}>
            <span>Mobile Phones</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div className="nav-menu-links">
            <Link to="/all-products?brand=Apple">Smartphones</Link>
            <Link to="/all-products?category=Accessories">Accessories</Link>
            <Link to="/all-products?brand=Samsung">Tablets</Link>
            <Link to="/all-products?category=Chargers">Mobile Chargers</Link>
            <Link to="/all-products">Other Devices</Link>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="portal-main-content">
        {children}
      </main>

      {/* Footer Area */}
      <footer className="portal-footer">
        <div className="portal-container footer-grid">
          {/* Categories */}
          <div className="footer-col">
            <h4 className="footer-col-title">CATEGORIES</h4>
            <ul className="footer-links">
              <li><Link to="/all-products">Mobile Phones</Link></li>
              <li><Link to="/all-products">Smartphones</Link></li>
              <li><Link to="/all-products">Accessories</Link></li>
              <li><Link to="/all-products">Tablets</Link></li>
              <li><Link to="/all-products">Mobile Chargers</Link></li>
              <li><Link to="/all-products">Other Devices</Link></li>
            </ul>
          </div>

          {/* Information */}
          <div className="footer-col">
            <h4 className="footer-col-title">INFORMATION</h4>
            <ul className="footer-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms & Conditions</Link></li>
              <li><Link to="/refund">Refund Policy</Link></li>
              <li><a href="#shipping" onClick={e => { e.preventDefault(); alert('Standard free shipping across India within 3-5 business days.') }}>Shipping Policy</a></li>
            </ul>
          </div>

          {/* Follow Us */}
          <div className="footer-col">
            <h4 className="footer-col-title">FOLLOW US</h4>
            <div className="social-links-row" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn f" title="Facebook">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                </svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn i" title="Instagram">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-icon-btn y" title="YouTube">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer" className="social-icon-btn w" title="WhatsApp">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.451 5.097 0 9.25-4.154 9.253-9.252.001-2.47-.961-4.794-2.709-6.543C16.172 3.06 13.85 2.1 11.382 2.1 6.286 2.1 2.133 6.253 2.131 11.35c0 1.62.43 3.202 1.25 4.616l-.995 3.635 3.731-.977z"/>
                </svg>
              </a>
            </div>
            <h4 className="footer-col-title">NEWSLETTER</h4>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px', lineHeight: 1.4 }}>
              Subscribe to get updates about our latest offers
            </p>
            <form className="newsletter-form" onSubmit={e => { e.preventDefault(); alert('Subscribed to newsletter successfully!'); e.target.reset() }}>
              <input type="email" placeholder="Enter your email" required className="newsletter-input" />
              <button type="submit" className="newsletter-btn">🚀</button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="portal-container footer-bottom">
          <p className="copyright-text">© 2024 Maa Veshno Mobile. All rights reserved.</p>
          <div className="payment-gateways" style={{ display: 'flex', gap: '12px', opacity: 0.8 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>VISA</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>MasterCard</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>UPI</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Paytm</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicLayout
