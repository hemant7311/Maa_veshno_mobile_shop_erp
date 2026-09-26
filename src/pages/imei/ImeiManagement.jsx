import React, { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import ImeiScannerModal from '../../components/common/ImeiScannerModal'

const statusLabel = (status) => status.charAt(0).toUpperCase() + status.slice(1)
const badgeClass = (status) => ({ available: 'badge-success', sold: 'badge-warning', damaged: 'badge-danger', lost: 'badge-danger', reserved: 'badge-primary' }[status] || '')

/* ── Add IMEI Modal ── */
const AddImeiModal = ({ products, onClose, onSaved }) => {
  const [productId, setProductId] = useState('')
  const [imeiText, setImeiText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const numbers = imeiText.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean)

  const save = async () => {
    if (!productId || !numbers.length) {
      setError('Select a product and enter at least one IMEI number.')
      return
    }
    if (new Set(numbers).size !== numbers.length) {
      setError('Duplicate IMEI numbers are not allowed.')
      return
    }
    try {
      setSaving(true)
      setError('')
      await api.post('/imeis', { productId, imeiNumbers: numbers })
      onSaved(`${numbers.length} IMEI${numbers.length > 1 ? 's' : ''} added successfully.`)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not add IMEIs.')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(event) => event.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Add IMEI to Inventory</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Every IMEI creates one saleable stock unit.</p>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '10px', borderRadius: 'var(--radius-sm)', marginBottom: '14px' }}>{error}</div>}
          <div className="form-group">
            <label className="form-label">Product <span className="required">*</span></label>
            <select className="form-select" value={productId} onChange={(event) => setProductId(event.target.value)}>
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>{product.productName} — {product.variant}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label className="form-label" style={{ margin: 0 }}>IMEI Number(s) <span className="required">*</span></label>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowScanner(true)} style={{ padding: '2px 10px', fontSize: '12px' }}>📷 Scan Camera</button>
            </div>
            <textarea className="form-textarea" value={imeiText} onChange={(event) => setImeiText(event.target.value)} placeholder="One IMEI per line, or comma separated" rows="6" />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{numbers.length} IMEI{numbers.length !== 1 ? 's' : ''} ready to add</span>
          </div>
          {showScanner && (
            <ImeiScannerModal
              onClose={() => setShowScanner(false)}
              onScan={(scannedVal) => {
                setShowScanner(false)
                setImeiText(prev => prev ? `${prev}\n${scannedVal}` : scannedVal)
              }}
            />
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : `Add ${numbers.length || ''} IMEI${numbers.length !== 1 ? 's' : ''}`}</button>
        </div>
      </div>
    </div>
  )
}

/* ── IMEI Management Page ── */
const ImeiManagement = () => {
  const [imeis, setImeis] = useState([])
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showMainScanner, setShowMainScanner] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const loadData = async () => {
    try {
      setLoading(true)
      const [imeiResponse, productResponse] = await Promise.all([api.get('/imeis'), api.get('/products')])
      setImeis(imeiResponse.data.data || [])
      setProducts(productResponse.data.data || [])
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load IMEI inventory.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const categories = useMemo(() => [...new Set(imeis.map((item) => item.productId?.categoryId?.categoryName).filter(Boolean))], [imeis])
  
  const filtered = imeis.filter((item) => {
    const term = search.toLowerCase()
    const product = item.productId || {}
    return (!term || [item.imeiNumber, product.productName, product.variant, product.categoryId?.categoryName].filter(Boolean).some((value) => value.toLowerCase().includes(term))) &&
      (!statusFilter || item.status === statusFilter) && (!categoryFilter || product.categoryId?.categoryName === categoryFilter)
  })

  const stats = {
    total: imeis.length,
    available: imeis.filter((item) => item.status === 'available').length,
    sold: imeis.filter((item) => item.status === 'sold').length,
    unavailable: imeis.filter((item) => ['inactive', 'damaged', 'lost', 'reserved'].includes(item.status)).length
  }

  const archive = async (item) => {
    if (!window.confirm(`Archive IMEI ${item.imeiNumber}?`)) return
    try {
      await api.delete(`/imeis/${item._id}`)
      setNotice('IMEI archived. Product stock updated.')
      loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not archive IMEI.')
    }
  }

  const changeStatus = async (item, status) => {
    try {
      await api.patch(`/imeis/${item._id}`, { status })
      setNotice('IMEI status updated. Product stock recalculated.')
      loadData()
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update IMEI status.')
    }
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
      {showModal && <AddImeiModal products={products} onClose={() => setShowModal(false)} onSaved={(message) => { setShowModal(false); setNotice(message); loadData() }} />}
      
      <div className="page-header">
        <div className="page-header-left">
          <h1>IMEI Management</h1>
          <p>Stock is calculated only from available IMEIs.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add New IMEI</button>
      </div>

      {notice && <div style={{ color: 'var(--success)', background: 'var(--success-light)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>{notice}</div>}
      {error && <div style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>{error}</div>}

      <div className="stat-cards-grid" style={{ marginBottom: '20px' }}>
        {[['Total IMEI', stats.total, 'blue'], ['Available / Stock', stats.available, 'green'], ['Sold IMEI', stats.sold, 'orange'], ['Unavailable IMEI', stats.unavailable, 'red']].map(([label, value, color]) => (
          <div className="stat-card" key={label}>
            <div className="stat-card-label">{label}</div>
            <div className={`stat-card-value ${color}`} style={{ fontSize: '28px', marginTop: '4px' }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar-left" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="search-bar" style={{ minWidth: '260px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input placeholder="Search IMEI or product..." value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1) }} />
            </div>
            <button type="button" className="btn btn-outline" onClick={() => setShowMainScanner(true)} title="Scan IMEI with Camera" style={{ height: '36px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              📷 Scan
            </button>
          </div>
          {showMainScanner && (
            <ImeiScannerModal
              onClose={() => setShowMainScanner(false)}
              onScan={(scannedVal) => {
                setSearch(scannedVal)
                setCurrentPage(1)
                setShowMainScanner(false)
              }}
            />
          )}
          <div className="table-toolbar-right">
            <select className="form-select" style={{ width: 'auto', height: '36px' }} value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setCurrentPage(1) }}>
              <option value="">All Categories</option>
              {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto', height: '36px' }} value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setCurrentPage(1) }}>
              <option value="">All Status</option>
              {['available', 'reserved', 'sold', 'returned', 'damaged', 'lost'].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>IMEI Number</th>
                <th>Category</th>
                <th>Product</th>
                <th>Variant</th>
                <th>Status</th>
                <th>Added On</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '28px' }}>Loading IMEIs...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '28px' }}>No IMEIs found.</td></tr>
              ) : currentItems.map((item, index) => (
                <tr key={item._id}>
                  <td style={{ color: 'var(--text-muted)' }}>{indexOfFirstItem + index + 1}</td>
                  <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>{item.imeiNumber}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{item.productId?.categoryId?.categoryName || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{item.productId?.productName || 'Deleted product'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{item.productId?.variant || '—'}</td>
                  <td>
                    <select className={`badge ${badgeClass(item.status)}`} value={item.status} onChange={(event) => changeStatus(item, event.target.value)} disabled={item.status === 'sold'}>
                      {['available', 'reserved', 'sold', 'returned', 'damaged', 'lost'].map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(item.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div className="action-btns">
                      <button className="action-btn danger" title="Archive" disabled={item.status === 'sold'} onClick={() => archive(item)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Showing {filtered.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filtered.length)} of {filtered.length} IMEIs</span>
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

export default ImeiManagement
