import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PublicLayout from '../components/layout/PublicLayout'
import api from '../services/api'

const Home = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [sliders, setSliders] = useState([])
  const [currentSlide, setCurrentSlide] = useState(0)
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterBrand, setFilterBrand] = useState('All')
  const [filterCategory, setFilterCategory] = useState('All')
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [prodRes, sliderRes] = await Promise.all([
          api.get('/products/public'),
          api.get('/sliders')
        ])
        if (prodRes.data?.success) {
          const sorted = prodRes.data.data.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
          setProducts(sorted)
        }
        if (sliderRes.data?.success) setSliders(sliderRes.data.data)
      } catch (err) {
        console.error('Failed to load public data', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (sliders.length > 1) {
      const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % sliders.length), 5000)
      return () => clearInterval(timer)
    }
  }, [sliders.length])

  const brands = ['All', ...new Set(products.map(p => p.brand).filter(Boolean))]
  const categories = ['All', ...new Set(products.map(p => p.categoryName || p.categoryId?.categoryName).filter(Boolean))]

  const filteredProducts = products.filter(p => {
    if (filterBrand !== 'All' && p.brand !== filterBrand) return false
    const pCat = p.categoryName || p.categoryId?.categoryName || 'Unknown'
    if (filterCategory !== 'All' && pCat !== filterCategory) return false
    return true
  })

  const itemsPerPage = 20
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <PublicLayout>
      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-box portal-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedProduct.productName}</h2>
              <button className="modal-close" onClick={() => setSelectedProduct(null)}>×</button>
            </div>
            <div className="modal-body portal-modal-body" style={{ display: 'flex', gap: '24px', padding: '16px 0' }}>
              <div className="modal-img-container" style={{ flex: 1, background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px' }}>
                <img
                  src={selectedProduct.image || 'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-1.jpg'}
                  alt={selectedProduct.productName}
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', borderRadius: '12px' }}
                />
              </div>
              <div className="modal-desc-container" style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span className="portal-badge" style={{ alignSelf: 'flex-start' }}>{selectedProduct.brand}</span>
                <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}><strong>Variant:</strong> {selectedProduct.variant || '256GB'}</p>
                <p style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>₹{selectedProduct.salePrice?.toLocaleString('en-IN')}</p>
                <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>
                  High performance mobile device with brand warranty, secure shipping, and cash-on-delivery availability. Get touch screen efficiency and high definition display support.
                </div>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 'auto', width: '100%', height: '40px' }}
                  onClick={() => setSelectedProduct(null)}
                >
                  Close Detail
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner Slider */}
      {sliders.length > 0 && (
        <section className="portal-hero-slider">
          <div className="portal-container hero-slider-flex">
            {sliders.map((slide, idx) => (
              <div
                key={slide._id}
                style={{
                  display: idx === currentSlide ? 'flex' : 'none',
                  width: '100%',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '40px'
                }}
              >
                <div className="hero-slide-text" style={{ flex: '1 1 300px' }}>
                  <span className="hero-category-label">Featured</span>
                  <h1 className="hero-slide-title">{slide.title}</h1>
                  <p className="hero-slide-desc">{slide.subtitle}</p>
                  <button className="hero-shop-btn" onClick={() => navigate('/all-products')}>
                    Shop Now &gt;
                  </button>
                </div>
                <div className="hero-slide-image-wrapper" style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
                  {slide.mediaType === 'video' ? (
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="hero-slide-img"
                      src={slide.mediaUrl}
                      style={{ borderRadius: '14px', width: '100%', maxWidth: '440px', height: '248px', objectFit: 'cover', boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.15)', border: '1px solid #e2e8f0' }}
                    />
                  ) : (
                    <img
                      className="hero-slide-img"
                      src={slide.mediaUrl}
                      alt={slide.title}
                      style={{ borderRadius: '14px', width: '100%', maxWidth: '440px', height: '248px', objectFit: 'cover', boxShadow: '0 12px 24px -10px rgba(0, 0, 0, 0.15)', border: '1px solid #e2e8f0' }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {sliders.length > 1 && (
            <div className="hero-slider-dots">
              {sliders.map((_, idx) => (
                <span
                  key={idx}
                  className={`dot ${idx === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(idx)}
                  style={{ cursor: 'pointer' }}
                ></span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Brand Category Grid Cards */}
      <section className="portal-brands-grid">
        <div className="portal-container brands-grid-flex">
          {/* Samsung */}
          <div className="brand-card card-samsung" onClick={() => navigate('/all-products?brand=Samsung')}>
            <div className="brand-card-content">
              <span className="brand-name">SAMSUNG</span>
              <p className="brand-desc">Latest Samsung Smartphones</p>
              <span className="brand-shop-link">Shop Now →</span>
            </div>
            <img src="https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=140&q=80" alt="Samsung" className="brand-card-img" />
          </div>

          {/* Xiaomi */}
          <div className="brand-card card-xiaomi" onClick={() => navigate('/all-products?brand=Xiaomi')}>
            <div className="brand-card-content">
              <span className="brand-name" style={{ color: '#ff6700' }}>XIAOMI</span>
              <p className="brand-desc">Mi Smartphones Best in Class</p>
              <span className="brand-shop-link">Shop Now →</span>
            </div>
            <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=140&q=80" alt="Xiaomi" className="brand-card-img" />
          </div>

          {/* Realme */}
          <div className="brand-card card-realme" onClick={() => navigate('/all-products?brand=Realme')}>
            <div className="brand-card-content">
              <span className="brand-name" style={{ color: '#ffc107' }}>REALME</span>
              <p className="brand-desc">Realme Performance Real Quality</p>
              <span className="brand-shop-link">Shop Now →</span>
            </div>
            <img src="https://images.unsplash.com/photo-1565849906662-68031f88e651?auto=format&fit=crop&w=140&q=80" alt="Realme" className="brand-card-img" />
          </div>

          {/* OnePlus */}
          <div className="brand-card card-oneplus" onClick={() => navigate('/all-products?brand=OnePlus')}>
            <div className="brand-card-content">
              <span className="brand-name" style={{ color: '#eb0028' }}>ONEPLUS</span>
              <p className="brand-desc">Never Settle Premium Phones</p>
              <span className="brand-shop-link">Shop Now →</span>
            </div>
            <img src="https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=140&q=80" alt="OnePlus" className="brand-card-img" />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="portal-featured-section">
        <div className="portal-container">
          <div className="featured-section-header">
            <h2 className="featured-title">Featured Products</h2>
            <Link to="/all-products" className="featured-viewall-link">View All</Link>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <select className="form-select" value={filterBrand} onChange={e => { setFilterBrand(e.target.value); setCurrentPage(1); }}>
              {brands.map(b => <option key={b} value={b}>{b === 'All' ? 'All Brands' : b}</option>)}
            </select>
            <select className="form-select" value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}>
              {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
            </select>
          </div>
          <div className="featured-products-grid">
            {currentProducts.map(p => (
              <div className="portal-product-card" key={p._id} onClick={() => setSelectedProduct(p)}>
                <div className="product-card-img-wrapper">
                  <img
                    src={p.image || 'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-1.jpg'}
                    alt={p.productName}
                    className="product-card-img"
                    style={{ objectFit: 'contain', padding: '10px' }}
                  />
                </div>
                <div className="product-card-info">
                  <span className="product-card-brand">{p.brand}</span>
                  <h3 className="product-card-title">{p.productName}</h3>
                  <span className="product-card-variant">{p.variant || '256GB'}</span>
                  <span className="product-card-price">₹{p.salePrice ? p.salePrice.toLocaleString('en-IN') : '0'}</span>
                  <div className="product-card-actions">
                    <button className="product-card-view-btn" onClick={(e) => { e.stopPropagation(); setSelectedProduct(p) }}>
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

export default Home
