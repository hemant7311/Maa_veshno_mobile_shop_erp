import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './WholesaleHome.css';

const WholesaleHome = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [sliders, setSliders] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterBrand, setFilterBrand] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');;
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'wholesaler') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, sliderRes] = await Promise.all([
        api.get('/products/wholesale'),
        api.get('/sliders')
      ]);
      const sorted = (prodRes.data?.data || []).sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0));
        setProducts(sorted);
      setSliders(sliderRes.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch storefront data', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto slide
  useEffect(() => {
    if (sliders.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % sliders.length);
      }, 4000);
      
  const brands = ['All', ...new Set(products.map(p => p.brand).filter(Boolean))];
  const categories = ['All', ...new Set(products.map(p => p.categoryName || p.categoryId?.categoryName).filter(Boolean))];
  
  const filteredProducts = products.filter(p => {
    if (filterBrand !== 'All' && p.brand !== filterBrand) return false;
    const pCat = p.categoryName || p.categoryId?.categoryName || 'Unknown';
    if (filterCategory !== 'All' && pCat !== filterCategory) return false;
    return true;
  });

  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return () => clearInterval(timer);
    }
  }, [sliders.length]);

  const brands = ['All', ...new Set(products.map(p => p.brand).filter(Boolean))];

  const filteredProducts = products.filter(p => {
    const matchSearch = p.productName?.toLowerCase().includes(search.toLowerCase()) ||
                        p.brand?.toLowerCase().includes(search.toLowerCase()) ||
                        p.variant?.toLowerCase().includes(search.toLowerCase());
    const matchBrand = selectedBrand === 'All' || p.brand === selectedBrand;
    return matchSearch && matchBrand;
  });

  const handleWhatsAppEnquiry = (product) => {
    const msg = `Hello! I am interested in wholesale pricing for:\n*${product.productName}* (${product.variant})\nPlease share the bulk price.`;
    window.open(`https://wa.me/919876543210?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="ws-page">
      {/* ─── NAVBAR ─── */}
      <nav className="ws-nav">
        <div className="ws-nav-inner">
          <div className="ws-brand">
            <img src="/logo.png" alt="MVM" className="ws-logo" />
            <div>
              <h1 className="ws-brand-name">MAA VESHNO</h1>
              <span className="ws-brand-tag">WHOLESALE PORTAL</span>
            </div>
          </div>

          <div className="ws-search-wrap">
            <span className="ws-search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            </span>
            <input
              className="ws-search"
              type="text"
              placeholder="Search by product, brand, variant..."
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedBrand('All'); }}
            />
            {search && (
              <button className="ws-search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          <div className="ws-nav-right">
            <div className="ws-user-info">
              <div className="ws-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
              <div className="ws-user-text">
                <span className="ws-user-name">{user?.name}</span>
                <span className="ws-user-role">Wholesaler</span>
              </div>
            </div>
            <button className="ws-logout-btn" onClick={handleLogout}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO SLIDER ─── */}
      {!search && sliders.length > 0 && (
        <section className="ws-hero">
          <div className="ws-hero-slides" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {sliders.map((slide) => (
              <div key={slide._id} className="ws-slide">
                <div className="ws-slide-content">
                  <span className="ws-slide-badge">🏷️ Wholesale Offer</span>
                  <h2 className="ws-slide-title">{slide.title}</h2>
                  <p className="ws-slide-sub">{slide.subtitle}</p>
                  <button className="ws-slide-btn" onClick={() => setSearch('')}>
                    Explore Catalog →
                  </button>
                </div>
                <div className="ws-slide-media">
                  {slide.mediaType === 'video' ? (
                    <video src={slide.mediaUrl} autoPlay loop muted playsInline className="ws-slide-img" />
                  ) : (
                    <img src={slide.mediaUrl} alt={slide.title} className="ws-slide-img" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {sliders.length > 1 && (
            <div className="ws-dots">
              {sliders.map((_, i) => (
                <button
                  key={i}
                  className={`ws-dot ${i === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(i)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ─── STATS BAR ─── */}
      {!search && (
        <div className="ws-stats">
          <div className="ws-stat-item">
            <span className="ws-stat-num">{products.length}+</span>
            <span className="ws-stat-label">Products</span>
          </div>
          <div className="ws-stat-divider" />
          <div className="ws-stat-item">
            <span className="ws-stat-num">{brands.length - 1}</span>
            <span className="ws-stat-label">Brands</span>
          </div>
          <div className="ws-stat-divider" />
          <div className="ws-stat-item">
            <span className="ws-stat-num">Best</span>
            <span className="ws-stat-label">Wholesale Rates</span>
          </div>
          <div className="ws-stat-divider" />
          <div className="ws-stat-item">
            <span className="ws-stat-num">Fast</span>
            <span className="ws-stat-label">Delivery</span>
          </div>
        </div>
      )}

      {/* ─── CATALOG ─── */}
      <main className="ws-main">

        {/* Brand Filter Tabs */}
        {!search && (
          <div className="ws-brands-row">
            {brands.map(brand => (
              <button
                key={brand}
                className={`ws-brand-chip ${selectedBrand === brand ? 'active' : ''}`}
                onClick={() => setSelectedBrand(brand)}
              >
                {brand}
              </button>
            ))}
          </div>
        )}

        {/* Title */}
        <div className="ws-catalog-header">
          <h2 className="ws-catalog-title">
            {search
              ? `🔍 Results for "${search}" (${filteredProducts.length})`
              : selectedBrand !== 'All'
              ? `${selectedBrand} Products (${filteredProducts.length})`
              : 'Wholesale Catalog'}
          </h2>
          {(search || selectedBrand !== 'All') && (
            <button className="ws-clear-btn" onClick={() => { setSearch(''); setSelectedBrand('All'); }}>
              Clear Filter ✕
            </button>
          )}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="ws-loading">
            <div className="ws-spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : (
          <div className="ws-grid">
            {filteredProducts.map(p => (
              <div key={p._id} className="ws-card">
                <div className="ws-card-top">
                  <span className="ws-brand-badge">{p.brand}</span>
                  {p.quantity > 0 ? (
                    <span className="ws-stock in">In Stock</span>
                  ) : (
                    <span className="ws-stock out">Out of Stock</span>
                  )}
                </div>

                {p.image ? (
                  <img src={p.image} alt={p.productName} className="ws-card-img" />
                ) : (
                  <div className="ws-card-img-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/></svg>
                  </div>
                )}

                <div className="ws-card-body">
                  <h3 className="ws-card-name">{p.productName}</h3>
                  {p.variant && <p className="ws-card-variant">{p.variant}</p>}

                  <div className="ws-price-box">
                    <div>
                      <span className="ws-price-label">Wholesale Price</span>
                      <span className="ws-price">₹{(p.wholesalePrice || p.salePrice || 0).toLocaleString('en-IN')}</span>
                    </div>
                    {p.salePrice && p.wholesalePrice && p.wholesalePrice < p.salePrice && (
                      <span className="ws-mrp">MRP ₹{p.salePrice.toLocaleString('en-IN')}</span>
                    )}
                  </div>

                  <button
                    className="ws-enquiry-btn"
                    onClick={() => handleWhatsAppEnquiry(p)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.528 5.86L0 24l6.312-1.507A11.947 11.947 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.85 0-3.585-.48-5.093-1.32l-.366-.214-3.746.894.928-3.63-.24-.38A9.958 9.958 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                    WhatsApp Enquiry
                  </button>
                </div>
              </div>
            ))}

            {filteredProducts.length === 0 && !loading && (
              <div className="ws-no-results">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <p>No products found for <strong>"{search || selectedBrand}"</strong></p>
                <button className="ws-clear-btn" onClick={() => { setSearch(''); setSelectedBrand('All'); }}>Clear Filter</button>
              </div>
            )}
          </div>
        )}
      
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '30px' }}>
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>Previous</button>
              <span style={{ padding: '8px', fontWeight: 'bold' }}>Page {currentPage} of {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}>Next</button>
            </div>
          )}
        </main>

      {/* ─── FOOTER ─── */}
      <footer className="ws-footer">
        <p>© 2026 Maa Veshno Mobile · Wholesale Portal · All rights reserved</p>
        <p>📞 +91 98765 43210 &nbsp;|&nbsp; 📧 wholesale@maaveshno.com</p>
      </footer>
    </div>
  );
};

export default WholesaleHome;
