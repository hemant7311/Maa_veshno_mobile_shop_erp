import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../../services/api'

const formatPrice = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

/* ── Add IMEI Modal (Split View) ── */
const AddImeiModal = ({ product, onClose, onSaved }) => {
  const [newImei, setNewImei] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [existingImeis, setExistingImeis] = useState([])

  const loadImeis = async () => {
    try {
      const response = await api.get(`/imeis?productId=${product._id}`)
      setExistingImeis(response.data.data || [])
    } catch { setError('Existing IMEIs load nahi ho sake.') }
  }

  useEffect(() => { loadImeis() }, [product._id])

  const handleSave = async () => {
    if (!newImei.trim()) { setError('IMEI number daalna zaroori hai'); return }
    if (newImei.trim().length < 14) { setError('IMEI kam se kam 14 digits ka hona chahiye'); return }
    try {
      setSaving(true)
      setError('')
      await api.post('/imeis', { productId: product._id, imeiNumber: newImei.trim() })
      setNewImei('')
      await loadImeis()
      onSaved()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'IMEI save nahi ho saka.')
    } finally {
      setSaving(false)
    }
  }

  const statusColor = (s) => s === 'available' ? 'var(--success)' : s === 'sold' ? 'var(--orange)' : 'var(--text-muted)'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Add IMEI — {product.productName}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {product.brand} · {product.model} · {product.variant || '—'}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body — Split Layout */}
        <div className="imei-modal-grid" style={{ minHeight: '340px' }}>

          {/* LEFT — Existing IMEIs */}
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Added IMEIs
              </h3>
              <span className="badge badge-primary">{existingImeis.length} Total</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {existingImeis.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>No IMEI added yet.</p>}
              {existingImeis.map((item) => (
                <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  {/* Barcode icon */}
                  <div style={{ width: '32px', height: '32px', background: 'var(--white)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 5v14M7 5v14M13 5v14M17 5v14M21 5v14M10 5v6M10 13v6"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                      {item.imeiNumber}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Added: {new Date(item.createdAt).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: statusColor(item.status), background: item.status === 'available' ? 'var(--success-light)' : item.status === 'sold' ? '#FFF7ED' : 'var(--bg)', padding: '2px 8px', borderRadius: 'var(--radius-full)', flexShrink: 0 }}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          
          <div className="imei-modal-divider" />

          {/* RIGHT — Add New IMEI Form */}
          <div style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Add New IMEI
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Product Info (readonly) */}
              <div className="form-group">
                <label className="form-label">Product</label>
                <input className="form-input" value={product.productName} readOnly style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" value={product.categoryId?.categoryName || '—'} readOnly style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Variant</label>
                <input className="form-input" value={product.variant || '—'} readOnly style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }} />
              </div>

              {/* IMEI Input */}
              <div className="form-group">
                <label className="form-label">IMEI Number <span className="required">*</span></label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    id="imei-input-products"
                    className="form-input"
                    value={newImei}
                    onChange={e => { setNewImei(e.target.value); setError('') }}
                    placeholder="Enter 15-digit IMEI"
                    maxLength={15}
                    style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '1px', fontSize: '14px' }}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    autoFocus
                  />
                  <button type="button" onClick={() => document.getElementById('imei-input-products').focus()} className="btn btn-outline btn-sm" title="Scan barcode" style={{ flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 5v14M7 5v14M13 5v14M17 5v14M21 5v14M10 5v6M10 13v6"/>
                    </svg>
                    Scan
                  </button>
                </div>
                {error && <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '5px' }}>{error}</p>}
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
                  💡 IMEI 14-15 digits ka hota hai
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                Save IMEI
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Products Page ── */
const Products = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')
  const [deletingId, setDeletingId] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [imeiModal, setImeiModal] = useState(null) // selected product for IMEI modal

  const loadProducts = async () => {
    try {
      setLoading(true); setError('')
      const response = await api.get('/products')
      setProducts(response.data.data || [])
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load products. Please refresh and try again.')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadProducts() }, [])

  const categories = useMemo(() => [...new Set(products.map(p => p.categoryId?.categoryName).filter(Boolean))], [products])
  const filtered = products.filter(product => {
    const term = search.toLowerCase()
    const matchesSearch = !term || [product.productName, product.brand, product.model, product.variant, product.imeiNumber]
      .filter(Boolean).some(v => v.toLowerCase().includes(term))
    return matchesSearch && (!categoryFilter || product.categoryId?.categoryName === categoryFilter)
  })

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.productName}"? This action cannot be undone.`)) return
    try {
      setDeletingId(product._id); setError('')
      await api.delete(`/products/${product._id}`)
      setProducts(curr => curr.filter(item => item._id !== product._id))
      setNotice('Product deleted successfully.')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not delete the product. Please try again.')
    } finally { setDeletingId('') }
  }

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const renderPaginationButtons = () => {
    const buttons = []
    
    // Previous Button
    buttons.push(
      <button key="prev" className="pagination-btn" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
        ‹
      </button>
    )

    // Always show page 1
    buttons.push(
      <button key={1} className={`pagination-btn${currentPage === 1 ? ' active' : ''}`} onClick={() => handlePageChange(1)}>
        1
      </button>
    )

    if (currentPage > 3) {
      buttons.push(<span key="dots-left" style={{ display: 'flex', alignItems: 'center', padding: '0 8px', color: 'var(--text-muted)' }}>...</span>)
    }

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      buttons.push(
        <button key={i} className={`pagination-btn${currentPage === i ? ' active' : ''}`} onClick={() => handlePageChange(i)}>
          {i}
        </button>
      )
    }

    if (currentPage < totalPages - 2) {
      buttons.push(<span key="dots-right" style={{ display: 'flex', alignItems: 'center', padding: '0 8px', color: 'var(--text-muted)' }}>...</span>)
    }

    // Always show last page if it's not page 1
    if (totalPages > 1) {
      buttons.push(
        <button key={totalPages} className={`pagination-btn${currentPage === totalPages ? ' active' : ''}`} onClick={() => handlePageChange(totalPages)}>
          {totalPages}
        </button>
      )
    }

    // Next Button
    buttons.push(
      <button key="next" className="pagination-btn" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
        ›
      </button>
    )

    return buttons
  }

  return (
    <div>
      {/* Add IMEI Modal */}
      {imeiModal && <AddImeiModal product={imeiModal} onClose={() => setImeiModal(null)} onSaved={() => { loadProducts(); setNotice('IMEI added successfully.') }} />}

      <div className="page-header">
        <div className="page-header-left"><h1>Products</h1><p>Manage all your mobile products</p></div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => navigate('/products/add')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Product
          </button>
        </div>
      </div>

      {notice && <div style={{ color: 'var(--success)', background: 'var(--success-light)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>{notice}</div>}
      {error  && <div style={{ color: 'var(--danger)',  background: 'var(--danger-light)',  padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>{error}</div>}

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-bar" style={{ minWidth: '300px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Search products, model, IMEI..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="table-toolbar-right">
            <select className="form-select" style={{ width: 'auto', height: '36px' }} value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1) }}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Category Name</th>
                <th>Variant (RAM &amp; GB)</th>
                <th>Purchase (₹)</th>
                <th>Retail (₹)</th>
                <th>Wholesale (₹)</th>
                <th>IMEI Number</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan="11" style={{ textAlign: 'center', padding: '28px' }}>Loading products...</td></tr>
                : currentItems.length === 0
                ? <tr><td colSpan="11" style={{ textAlign: 'center', padding: '28px' }}>No products found.</td></tr>
                : currentItems.map((product, index) => (
                  <tr key={product._id}>
                    <td style={{ color: 'var(--text-muted)' }}>{indexOfFirstItem + index + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                          <img src={product.image || 'https://fdn2.gsmarena.com/vv/pics/apple/apple-iphone-15-pro-max-1.jpg'} alt={product.productName} style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{product.productName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{product.brand} · {product.model}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{product.categoryId?.categoryName || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{product.variant || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{product.purchasePrice ? product.purchasePrice.toLocaleString('en-IN') : '0'}</td>
                    <td style={{ fontWeight: 500 }}>{product.salePrice ? product.salePrice.toLocaleString('en-IN') : '0'}</td>
                    <td style={{ fontWeight: 500, color: 'var(--primary)' }}>{product.wholesalePrice ? product.wholesalePrice.toLocaleString('en-IN') : '0'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 600 }}>
                          {product.imeiNumber || '—'}
                        </span>
                        <button
                          onClick={() => setImeiModal(product)}
                          title="Add IMEI"
                          style={{
                            width: '22px', height: '22px', borderRadius: '50%',
                            background: 'var(--primary)', border: 'none',
                            color: 'white', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, transition: 'var(--transition)',
                            boxShadow: '0 1px 4px rgba(37,99,235,0.35)'
                          }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: (product.stock < product.minStock) ? 'var(--danger)' : 'var(--success)' }}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      {(() => {
                        const isActive = product.stock > 0 && product.status === 'active'
                        return (
                          <span className={`badge ${isActive ? 'badge-success' : 'badge-danger'}`}
                            style={isActive ? {} : { background: 'var(--danger-light)', color: 'var(--danger)' }}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        )
                      })()}
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="action-btn" title="Edit" onClick={() => navigate(`/products/${product._id}/edit`)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="action-btn danger" title="Delete" disabled={deletingId === product._id} onClick={() => handleDelete(product)}>
                          {deletingId === product._id ? '...' : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>Showing {filtered.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filtered.length)} of {filtered.length} products</span>
          {totalPages > 1 && (
            <div className="pagination">
              {renderPaginationButtons()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Products
