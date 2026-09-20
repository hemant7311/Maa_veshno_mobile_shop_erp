import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import PublicLayout from '../components/layout/PublicLayout'
import api from '../services/api'

const demoCatalogProducts = [
  { _id: 'demo1', productName: 'iPhone 15 Pro Max', variant: '256GB', brand: 'Apple', salePrice: 159900, category: 'Smartphones', image: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ3Af_eWd1ZOIAmWOuJPZUCl50vDJ2PwefRItK9hQpJdh0Hs-dwE8qOCqvMAgZjFR5T6jhamb0Jq2G8D33dXi3eiQ_kArh86Wp1wXPxQFmsyA7E0Xee6ro' },
  { _id: 'demo2', productName: 'Samsung Galaxy S24 Ultra', variant: '256GB', brand: 'Samsung', salePrice: 129999, category: 'Smartphones', image: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ3Af_eWd1ZOIAmWOuJPZUCl50vDJ2PwefRItK9hQpJdh0Hs-dwE8qOCqvMAgZjFR5T6jhamb0Jq2G8D33dXi3eiQ_kArh86Wp1wXPxQFmsyA7E0Xee6ro' },
  { _id: 'demo3', productName: 'OnePlus 12R', variant: '256GB', brand: 'OnePlus', salePrice: 49999, category: 'Smartphones', image: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ3Af_eWd1ZOIAmWOuJPZUCl50vDJ2PwefRItK9hQpJdh0Hs-dwE8qOCqvMAgZjFR5T6jhamb0Jq2G8D33dXi3eiQ_kArh86Wp1wXPxQFmsyA7E0Xee6ro' },
  { _id: 'demo4', productName: 'Xiaomi 14', variant: '256GB', brand: 'Xiaomi', salePrice: 69999, category: 'Smartphones', image: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ3Af_eWd1ZOIAmWOuJPZUCl50vDJ2PwefRItK9hQpJdh0Hs-dwE8qOCqvMAgZjFR5T6jhamb0Jq2G8D33dXi3eiQ_kArh86Wp1wXPxQFmsyA7E0Xee6ro' },
  { _id: 'demo5', productName: 'Realme GT 6', variant: '256GB', brand: 'Realme', salePrice: 39999, category: 'Smartphones', image: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ3Af_eWd1ZOIAmWOuJPZUCl50vDJ2PwefRItK9hQpJdh0Hs-dwE8qOCqvMAgZjFR5T6jhamb0Jq2G8D33dXi3eiQ_kArh86Wp1wXPxQFmsyA7E0Xee6ro' },
  { _id: 'demo6', productName: 'iQOO Neo 9 Pro', variant: '256GB', brand: 'iQOO', salePrice: 34999, category: 'Smartphones', image: 'https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcQ3Af_eWd1ZOIAmWOuJPZUCl50vDJ2PwefRItK9hQpJdh0Hs-dwE8qOCqvMAgZjFR5T6jhamb0Jq2G8D33dXi3eiQ_kArh86Wp1wXPxQFmsyA7E0Xee6ro' },
  { _id: 'demo7', productName: 'Fast Charging Charger 30W', variant: 'Dual Port', brand: 'Apple', salePrice: 1999, category: 'Chargers', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=400&q=80' },
  { _id: 'demo8', productName: 'Wireless Charging Pad', variant: '15W Fast', brand: 'Samsung', salePrice: 3499, category: 'Chargers', image: 'https://images.unsplash.com/photo-1622445262465-2481c4574875?auto=format&fit=crop&w=400&q=80' },
  { _id: 'demo9', productName: 'Premium Glass Protector', variant: 'Gorilla Fit', brand: 'Accessories', salePrice: 499, category: 'Accessories', image: 'https://images.unsplash.com/photo-1605152276897-4f618f83196b?auto=format&fit=crop&w=400&q=80' },
  { _id: 'demo10', productName: 'Silicone Matte Cover case', variant: 'iPhone 15 Pro Max', brand: 'Accessories', salePrice: 999, category: 'Accessories', image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=400&q=80' }
]

const AllProductsList = () => {
  const [searchParams] = useSearchParams()
  const initialBrand = searchParams.get('brand') || ''
  const initialSearch = searchParams.get('search') || ''
  const initialCategory = searchParams.get('category') || ''

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [search, setSearch] = useState(initialSearch)
  const [brandFilter, setBrandFilter] = useState(initialBrand)
  const [categoryFilter, setCategoryFilter] = useState(initialCategory)
  const [priceSort, setPriceSort] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)

  useEffect(() => {
    const fetchPublicProducts = async () => {
      try {
        const res = await api.get('/products/public');
        if (res.data?.success) {
          setProducts(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load public products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicProducts();
  }, [])

  // Sync state with url params changes
  useEffect(() => {
    setBrandFilter(searchParams.get('brand') || '')
    setSearch(searchParams.get('search') || '')
    setCategoryFilter(searchParams.get('category') || '')
  }, [searchParams])

  const filtered = products.filter(p => {
    const term = search.toLowerCase()
    const matchesSearch = !term || p.productName.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term)
    const matchesBrand = !brandFilter || p.brand.toLowerCase() === brandFilter.toLowerCase()
    const matchesCategory = !categoryFilter || p.category.toLowerCase() === categoryFilter.toLowerCase()
    return matchesSearch && matchesBrand && matchesCategory
  }).sort((a, b) => {
    if (priceSort === 'low') return a.salePrice - b.salePrice
    if (priceSort === 'high') return b.salePrice - a.salePrice
    return 0
  })

  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))]
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))]

  return (
    <PublicLayout initialSearch={search}>
      <div className="portal-page-header">
        <div className="portal-container">
          <h1 className="portal-page-title">Explore Catalog</h1>
          <p className="portal-page-subtitle">Browse, sort and check technical specifications of smartphones and accessories</p>
        </div>
      </div>

      <div className="portal-container portal-content-body" style={{ padding: '32px 16px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Left Filter Sidebar */}
        <div style={{ flex: 0.8, minWidth: '240px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', height: 'fit-content' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Filters</span>
            {(brandFilter || categoryFilter || search || priceSort) && (
              <span onClick={() => { setBrandFilter(''); setCategoryFilter(''); setSearch(''); setPriceSort('') }} style={{ fontSize: '12px', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>Reset All</span>
            )}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Search */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Search Keywords</label>
              <input
                type="text"
                placeholder="Product name, brand..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13px' }}
              />
            </div>

            {/* Brand */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Brand</label>
              <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '13px', background: 'white' }}>
                <option value="">All Brands</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Category */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Category</label>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '13px', background: 'white' }}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Price sort */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Sort Price</label>
              <select value={priceSort} onChange={e => setPriceSort(e.target.value)} style={{ height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 8px', fontSize: '13px', background: 'white' }}>
                <option value="">Default sorting</option>
                <option value="low">Price: Low to High</option>
                <option value="high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Catalog Grid */}
        <div style={{ flex: 3, minWidth: '300px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#64748b' }}>
              <h3>No products match your filters</h3>
              <p style={{ fontSize: '13px', marginTop: '4px' }}>Try resetting or modifying filter criteria</p>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '16px', fontSize: '13.5px', color: '#64748b' }}>Showing {filtered.length} products</div>
              <div className="featured-products-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {filtered.map(p => (
                  <div className="portal-product-card" key={p._id} onClick={() => setSelectedProduct(p)}>
                    <div className="product-card-img-wrapper" style={{ height: '180px' }}>
                      <img
                        src={p.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=300&q=80'}
                        alt={p.productName}
                        className="product-card-img"
                      />
                    </div>
                    <div className="product-card-info">
                      <span className="product-card-brand">{p.brand}</span>
                      <h3 className="product-card-title">{p.productName}</h3>
                      <span className="product-card-variant">{p.variant || '256GB'}</span>
                      <span className="product-card-price">₹{p.salePrice ? p.salePrice.toLocaleString('en-IN') : '0'}</span>
                      <div className="product-card-actions">
                        <button className="product-card-add-btn" onClick={(e) => { e.stopPropagation(); alert(`${p.productName} added to cart!`) }}>
                          Add to Cart
                        </button>
                        <button className="product-card-view-btn" onClick={(e) => { e.stopPropagation(); setSelectedProduct(p) }}>
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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
                  src={selectedProduct.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80'}
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
    </PublicLayout>
  )
}

export default AllProductsList
