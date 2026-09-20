import React, { useEffect, useState } from 'react'
import {
  getAllCompanyReturns, getCompanyReturnById, createCompanyReturn, deleteCompanyReturn,
  getAllSuppliers, getAllProducts, getAvailableImeisByProduct, getAllImeis,
  exportCompanyReturns, exportCompanyReturnsByMobile, downloadBlob
} from '../../services/api'

const formatDate = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return date.toISOString().split('T')[0]
}

const ToastContainer = ({ toasts, onRemove }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast toast-${t.type}`} onClick={() => onRemove(t.id)}>
        {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : '⚠'} {t.message}
      </div>
    ))}
  </div>
)

const useToasts = () => {
  const [toasts, setToasts] = useState([])
  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))
  return { toasts, showToast, removeToast }
}

const StatusBadge = ({ status }) => {
  const lower = String(status || '').toLowerCase()
  let cls = 'badge-warning', text = status
  if (lower === 'completed' || lower === 'returned' || lower === 'accepted') { cls = 'badge-success'; text = 'Returned' }
  else if (lower === 'pending') { cls = 'badge-warning'; text = 'Pending' }
  else if (lower === 'cancelled') { cls = 'badge-danger'; text = 'Cancelled' }
  else if (lower === 'processing') { cls = 'badge-primary'; text = 'Processing' }
  return <span className={`badge ${cls}`}>{text}</span>
}

const ReasonBadge = ({ reason }) => {
  const lower = String(reason || '').toLowerCase()
  let cls = 'badge-warning', text = reason || '—'
  if (lower === 'defective') { cls = 'badge-danger'; text = 'Defective' }
  else if (lower === 'warranty') { cls = 'badge-primary'; text = 'Warranty' }
  else if (lower === 'dead on arrival' || lower === 'doa') { cls = 'badge-info'; text = 'DOA' }
  else if (lower === 'other') { cls = 'badge-warning'; text = 'Other' }
  return <span className={`badge ${cls}`}>{text}</span>
}

/* ============ CREATE RETURN FORM MODAL ============ */
const CreateReturnModal = ({ onClose, onSaved }) => {
  const today = formatDate(new Date())
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [availableImeis, setAvailableImeis] = useState([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingImeis, setLoadingImeis] = useState(false)
  const [imeiSearch, setImeiSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    supplierId: '',
    productId: '',
    selectedImeis: [],
    quantity: 1,
    returnDate: today,
    reason: 'Defective',
    customReason: '',
    notes: ''
  })

  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true)
      const res = await getAllSuppliers()
      setSuppliers(res.data?.data || [])
    } catch (err) {
      console.error('Failed to load suppliers', err)
    } finally { setLoadingSuppliers(false) }
  }

  const loadProducts = async () => {
    try {
      setLoadingProducts(true)
      const res = await getAllProducts()
      setProducts(res.data?.data || [])
    } catch (err) {
      console.error('Failed to load products', err)
    } finally { setLoadingProducts(false) }
  }

  useEffect(() => {
    loadSuppliers()
    loadProducts()
  }, [])

  const selectedProduct = products.find(p => p._id === form.productId)
  const hasImeiTracking = selectedProduct?.hasImeiTracking !== undefined
    ? selectedProduct.hasImeiTracking
    : (selectedProduct?.categoryId?.categoryName || '').toLowerCase().includes('mobile') ||
      (selectedProduct?.categoryName || '').toLowerCase().includes('mobile') ||
      String(selectedProduct?.productName || '').toLowerCase().includes('mobile') ||
      (availableImeis.length > 0 && form.productId)

  useEffect(() => {
    if (form.productId) {
      const loadImeis = async () => {
        try {
          setLoadingImeis(true)
          setAvailableImeis([])
          const res = await getAvailableImeisByProduct(form.productId)
          const imeis = res.data?.data || []
          setAvailableImeis(imeis.filter(i => String(i.status || '').toLowerCase() === 'available' || String(i.status || '').toLowerCase() === 'sellable'))
        } catch (err) {
          console.error('Failed to load IMEIs', err)
          setAvailableImeis([])
        } finally { setLoadingImeis(false) }
      }
      loadImeis()
    } else {
      setAvailableImeis([])
    }
  }, [form.productId])

  useEffect(() => {
    if (hasImeiTracking && form.selectedImeis.length > 0) {
      setForm(prev => ({ ...prev, quantity: form.selectedImeis.length }))
    }
  }, [form.selectedImeis])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleImeiToggle = (imeiId) => {
    setForm(prev => {
      const isSelected = prev.selectedImeis.includes(imeiId)
      const newSelected = isSelected
        ? prev.selectedImeis.filter(id => id !== imeiId)
        : [...prev.selectedImeis, imeiId]
      return { ...prev, selectedImeis: newSelected }
    })
  }

  const handleSubmit = async () => {
    if (!form.supplierId) { setError('Please select a supplier/company'); return }
    if (!form.productId) { setError('Please select a product'); return }
    if (hasImeiTracking && form.selectedImeis.length === 0 && !form.quantity) {
      setError('Please select at least one IMEI or enter quantity'); return
    }
    if (!form.quantity || Number(form.quantity) < 1) { setError('Quantity must be at least 1'); return }

    try {
      setSaving(true); setError('')

      const selectedImeiObjects = availableImeis.filter(i => form.selectedImeis.includes(i._id))
      const imeiNumbers = selectedImeiObjects.map(i => i.imeiNumber)

      const payload = {
        supplierId: form.supplierId,
        productId: form.productId,
        quantity: hasImeiTracking && form.selectedImeis.length > 0 ? form.selectedImeis.length : Number(form.quantity),
        returnDate: form.returnDate,
        reason: form.reason === 'Other' ? (form.customReason || 'Other') : form.reason,
        notes: form.notes,
        imeiIds: form.selectedImeis,
        imeiNumbers: imeiNumbers
      }

      await createCompanyReturn(payload)
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create return')
    } finally {
      setSaving(false)
    }
  }


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Create Company Return</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Record products being returned to supplier/company
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Supplier / Company <span className="required">*</span></label>
              <select
                className="form-select"
                name="supplierId"
                value={form.supplierId}
                onChange={handleChange}
                disabled={loadingSuppliers}
              >
                <option value="">{loadingSuppliers ? 'Loading suppliers...' : 'Select supplier'}</option>
                {suppliers.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.shopName ? `(${s.shopName})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Return Date <span className="required">*</span></label>
              <input type="date" className="form-input" name="returnDate" value={form.returnDate} onChange={handleChange} />
            </div>

            <div className="form-group form-grid-full">
              <label className="form-label">Product <span className="required">*</span></label>
              <select
                className="form-select"
                name="productId"
                value={form.productId}
                onChange={(e) => { handleChange(e); setForm(prev => ({ ...prev, selectedImeis: [] })) }}
                disabled={loadingProducts}
              >
                <option value="">{loadingProducts ? 'Loading products...' : 'Select product'}</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.productName} {p.brand ? `- ${p.brand}` : ''} {p.model ? `(${p.model})` : ''} {p.variant ? `[${p.variant}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {hasImeiTracking && form.productId && (
              <div className="form-group form-grid-full">
                  <label className="form-label">
                    Select IMEIs <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                      ({form.selectedImeis.length} selected / {availableImeis.length} available)
                    </span>
                  </label>
                  <div style={{ marginBottom: '10px' }}>
                    <div className="search-bar" style={{ margin: 0, padding: '0 12px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input 
                        type="text" 
                        placeholder="Scan or type IMEI and press Enter..." 
                        value={imeiSearch}
                        onChange={(e) => setImeiSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const found = availableImeis.find(i => i.imeiNumber === imeiSearch.trim());
                            if (found) {
                              if (!form.selectedImeis.includes(found._id)) {
                                handleImeiToggle(found._id);
                              }
                              setImeiSearch('');
                            } else {
                               alert('IMEI not found or not available for this product.');
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                  {loadingImeis ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Loading available IMEIs...
                  </div>
                ) : availableImeis.length === 0 ? (
                  <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    No available IMEIs found for this product
                  </div>
                ) : (
                  <div style={{
                    maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '8px'
                  }}>
                    {availableImeis.map(imei => {
                      const checked = form.selectedImeis.includes(imei._id)
                      return (
                        <label
                          key={imei._id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
                            cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                            background: checked ? 'var(--primary-light)' : 'transparent',
                            marginBottom: '4px', transition: 'background 0.15s'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleImeiToggle(imei._id)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600 }}>
                            {imei.imeiNumber}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Quantity <span className="required">*</span></label>
              <input
                type="number"
                className="form-input"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min="1"
                disabled={hasImeiTracking && form.selectedImeis.length > 0}
                style={hasImeiTracking && form.selectedImeis.length > 0 ? { background: 'var(--bg)', color: 'var(--text-secondary)' } : {}}
              />
              {hasImeiTracking && form.selectedImeis.length > 0 && (
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Auto-set based on IMEI selection
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Return Reason <span className="required">*</span></label>
              <select className="form-select" name="reason" value={form.reason} onChange={handleChange}>
                <option value="Defective">Defective</option>
                <option value="Warranty">Warranty</option>
                <option value="Dead on Arrival">Dead on Arrival</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {form.reason === 'Other' && (
              <div className="form-group form-grid-full">
                <label className="form-label">Specify Reason <span className="required">*</span></label>
                <input
                  className="form-input"
                  name="customReason"
                  value={form.customReason}
                  onChange={handleChange}
                  placeholder="Please specify the reason"
                />
              </div>
            )}

            <div className="form-group form-grid-full">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Additional notes about this return (optional)"
                rows="3"
              />
            </div>
          </div>
          {error && <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '12px' }}>{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-success" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating...' : 'Create Return'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============ VIEW RETURN MODAL ============ */
const ViewReturnModal = ({ returnItem, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ overflowY: 'auto' }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', margin: '24px auto' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Return Details</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Return ID: {returnItem?.returnId || returnItem?._id}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
            <div className="stat-card" style={{ padding: '14px' }}>
              <div className="stat-card-label">Return Date</div>
              <div className="stat-card-value blue" style={{ fontSize: '15px' }}>{formatDate(returnItem?.returnDate || returnItem?.date)}</div>
            </div>
            <div className="stat-card" style={{ padding: '14px' }}>
              <div className="stat-card-label">Quantity</div>
              <div className="stat-card-value green" style={{ fontSize: '20px' }}>{returnItem?.quantity || 0}</div>
            </div>
            <div className="stat-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="stat-card-label">Status</div>
              <div style={{ marginTop: '6px' }}><StatusBadge status={returnItem?.status || 'Returned'} /></div>
            </div>
          </div>

          <div className="form-grid" style={{ marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Supplier / Company</div>
              <div style={{ fontWeight: 600 }}>
                {typeof returnItem?.supplierId === 'object'
                  ? `${returnItem.supplierId.name || ''} ${returnItem.supplierId.shopName ? `(${returnItem.supplierId.shopName})` : ''}`
                  : (returnItem?.supplierName || returnItem?.supplier || '—')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Product</div>
              <div style={{ fontWeight: 600 }}>
                {typeof returnItem?.productId === 'object'
                  ? returnItem.productId.productName || '—'
                  : (returnItem?.productName || returnItem?.product || '—')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reason</div>
              <div style={{ marginTop: '2px' }}><ReasonBadge reason={returnItem?.reason} /></div>
            </div>
            <div className="form-grid-full">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Notes</div>
              <div style={{ fontWeight: 500 }}>{returnItem?.notes || '—'}</div>
            </div>
          </div>

          {returnItem?.imeiNumbers && returnItem.imeiNumbers.length > 0 && (
            <>
              <h3 className="section-title">IMEI Numbers ({returnItem.imeiNumbers.length})</h3>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px',
                background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)'
              }}>
                {returnItem.imeiNumbers.map((imei, i) => (
                  <span key={i} style={{
                    fontFamily: 'monospace', fontSize: '12px', padding: '6px 10px',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', fontWeight: 600
                  }}>
                    {imei}
                  </span>
                ))}
              </div>
            </>
          )}

          {(returnItem?.imeis && returnItem.imeis.length > 0 && !returnItem?.imeiNumbers) && (
            <>
              <h3 className="section-title">IMEI Numbers ({returnItem.imeis.length})</h3>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px',
                background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)'
              }}>
                {returnItem.imeis.map((imei, i) => (
                  <span key={imei._id || i} style={{
                    fontFamily: 'monospace', fontSize: '12px', padding: '6px 10px',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', fontWeight: 600
                  }}>
                    {typeof imei === 'string' ? imei : (imei.imeiNumber || '—')}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

/* ============ DELETE CONFIRM MODAL ============ */
const DeleteConfirmModal = ({ returnItem, onClose, onConfirmed }) => {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const handleConfirm = async () => {
    try {
      setSaving(true); setError('')
      await deleteCompanyReturn(returnItem._id)
      onConfirmed()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete')
    } finally { setSaving(false) }
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Delete Return Record</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div style={{ padding: '14px', background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid #FECACA' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Deleting return record</div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--danger)' }}>
              {returnItem?.returnId || returnItem?._id} · Qty {returnItem?.quantity}
            </div>
          </div>
          <p>Are you sure you want to permanently delete this return record? This action cannot be undone.</p>
          {error && <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '10px' }}>{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={saving}>
            {saving ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ========================== MAIN PAGE ========================== */
const CompanyReturns = () => {
  const returnTabs = [
    { key: 'All',     label: 'All Returns',     icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
    { key: 'company', label: 'Company Returns', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { key: 'private', label: 'Private Returns', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
  ];

  const [returns, setReturns] = useState([])
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterSupplierType, setFilterSupplierType] = useState('All')
  const [filterBrand, setFilterBrand] = useState('All')
  const [filterSupplierId, setFilterSupplierId] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [exportingSheet, setExportingSheet] = useState(false)
  const [exportingMobileSheet, setExportingMobileSheet] = useState(false)
  const itemsPerPage = 10

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [viewingReturn, setViewingReturn] = useState(null)
  const [deletingReturn, setDeletingReturn] = useState(null)
  const [downloadingReturnId, setDownloadingReturnId] = useState(null)

  const { toasts, showToast, removeToast } = useToasts()

  const loadAll = async () => {
    try {
      setLoading(true); setError('')
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      const res = await getAllCompanyReturns(params)
      setReturns(res.data?.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load returns. Please try again.')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  useEffect(() => { setCurrentPage(1) }, [search, startDate, endDate])

  
  const brands = ['All', ...new Set(returns.map(r => r.product?.brand || r.productId?.brand || r.productBrand).filter(Boolean))];
  
  const extractedSuppliers = [];
  const seenSupplierIds = new Set();
  returns.forEach(r => {
    const sId = r.supplier?._id || r.supplierId?._id || r.supplier || r.supplierId;
    const sName = r.supplier?.name || r.supplierId?.name || r.supplierName || r.supplier;
    const sType = String(r.supplier?.type || r.supplierId?.type || 'company').toLowerCase();
    
    if (sId && sName && typeof sName === 'string' && !seenSupplierIds.has(String(sId))) {
      if (filterSupplierType === 'All' || sType === filterSupplierType.toLowerCase()) {
         seenSupplierIds.add(String(sId));
         extractedSuppliers.push({ _id: String(sId), name: sName });
      }
    }
  });
  const suppliersByType = extractedSuppliers;
  
  const filtered = returns.filter(r => {
    if (filterSupplierType !== 'All') {
      const sType = String(r.supplier?.type || r.supplierId?.type || 'company').toLowerCase();
      if (sType !== filterSupplierType.toLowerCase()) return false;
    }
    if (filterBrand !== 'All') {
      const pBrand = r.product?.brand || r.productId?.brand || r.productBrand;
      if (pBrand !== filterBrand) return false;
    }
    if (filterSupplierId !== 'All') {
      const sId = r.supplier?._id || r.supplierId?._id || r.supplier || r.supplierId;
      if (String(sId) !== filterSupplierId) return false;
    }

    const supplierName = typeof r?.supplierId === 'object' ? (r.supplierId.name || '') : (r?.supplierName || r?.supplier || '')
    const productName = typeof r?.productId === 'object' ? (r.productId.productName || '') : (r?.productName || r?.product || '')
    const returnId = r?.returnId || r?._id || ''
    const reason = r?.reason || ''
    const notes = r?.notes || ''
    const imeis = r?.imeiNumbers || r?.imeis || []
    const imeisStr = imeis.map(i => typeof i === 'string' ? i : (i.imeiNumber || '')).join(' ')

    const haystack = `${supplierName} ${productName} ${returnId} ${reason} ${notes} ${imeisStr}`.toLowerCase()
    return !search || haystack.includes(search.toLowerCase())
  })

  const totalReturns = filtered.length
  const totalQuantity = filtered.reduce((sum, r) => sum + Number(r.quantity || 0), 0)
  const productCounts = {}
  filtered.forEach(r => {
    const pName = typeof r?.productId === 'object'
      ? (r.productId.productName || 'Unknown')
      : (r?.productName || r?.product || 'Unknown')
    productCounts[pName] = (productCounts[pName] || 0) + Number(r.quantity || 0)
  })
  const topProductEntry = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]
  const topProduct = topProductEntry ? `${topProductEntry[0]} (${topProductEntry[1]})` : '—'

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const lastIdx = currentPage * itemsPerPage
  const firstIdx = lastIdx - itemsPerPage
  const pageItems = filtered.slice(firstIdx, lastIdx)

  const handleDownloadSheet = async () => {
    try {
      setExportingSheet(true)
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      
      const headers = ['Return ID', 'Date', 'Supplier', 'Type', 'Product', 'Brand', 'Variant', 'Quantity', 'Reason', 'Status', 'IMEIs'];
      const rows = filtered.map(r => [
        r.returnId || '-',
        formatDate(r.returnDate || r.date),
        r.supplierId?.name || '-',
        r.supplierId?.type || '-',
        r.productId?.productName || '-',
        r.productId?.brand || '-',
        r.productId?.variant || '-',
        r.quantity || 1,
        r.reason || '-',
        r.status || '-',
        (r.imeis || []).map(i => i.imeiNumber).join('; ')
      ]);
      const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const dateStr = new Date().toISOString().split('T')[0];
      downloadBlob({ data: csvContent }, `stock_returns_${filterSupplierType}_${dateStr}.csv`);

      showToast('Return sheet downloaded successfully')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to download return sheet', 'error')
    } finally { setExportingSheet(false) }
  }

  const handleDownloadMobileSheet = async () => {
    try {
      setExportingMobileSheet(true)
      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      const headers = ['Return ID', 'Date', 'Supplier', 'Type', 'Product', 'Brand', 'Variant', 'IMEI', 'Price', 'Reason', 'Status', 'Notes'];
      const rows = [];
      filtered.forEach(r => {
        const baseRow = [
          r.returnId || '-',
          formatDate(r.returnDate || r.date),
          r.supplier?.name || r.supplierId?.name || r.supplierName || '-',
          r.supplier?.type || r.supplierId?.type || 'company',
          r.product?.productName || r.productId?.productName || r.productName || '-',
          r.product?.brand || r.productId?.brand || r.productBrand || '-',
          r.product?.variant || r.productId?.variant || '-',
          '', // IMEI placeholder
          r.purchasePrice || 0,
          r.reason || '-',
          r.status || '-',
          r.notes || ''
        ];
        
        const imeis = r.imeis || r.imeiNumbers || [];
        if (imeis.length === 0 && r.imei) {
          const row = [...baseRow];
          row[7] = r.imei;
          rows.push(row);
        } else if (imeis.length > 0) {
          imeis.forEach(i => {
            const row = [...baseRow];
            row[7] = typeof i === 'string' ? i : (i.imeiNumber || '');
            rows.push(row);
          });
        } else {
          rows.push(baseRow);
        }
      });
      
      const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const dateStr = new Date().toISOString().split('T')[0];
      downloadBlob({ data: csvContent }, `mobile_returns_${filterSupplierType}_${dateStr}.csv`);
      showToast('Mobile-wise return sheet downloaded successfully')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to download mobile return sheet', 'error')
    } finally { setExportingMobileSheet(false) }
  }

  const handleDownloadSingleSheet = async (returnItem) => {
    try {
      setDownloadingReturnId(returnItem._id)
      const params = { returnId: returnItem._id }
      const res = await exportCompanyReturns(params)
      const dateStr = formatDate(returnItem.returnDate || returnItem.date) || new Date().toISOString().split('T')[0]
      const id = returnItem.returnId || returnItem._id
      downloadBlob(res, `return_${id}_${dateStr}.csv`)
      showToast('Return sheet downloaded')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to download sheet', 'error')
    } finally { setDownloadingReturnId(null) }
  }

  const getSupplierDisplay = (r) => {
    if (typeof r?.supplierId === 'object') {
      return `${r.supplierId.name || ''} ${r.supplierId.shopName ? `(${r.supplierId.shopName})` : ''}`.trim()
    }
    return r?.supplierName || r?.supplier || '—'
  }

  const getProductDisplay = (r) => {
    if (typeof r?.productId === 'object') {
      return r.productId.productName || '—'
    }
    return r?.productName || r?.product || '—'
  }

  const getImeiDisplay = (r) => {
    const imeis = r?.imeiNumbers || (r?.imeis ? r.imeis.map(i => typeof i === 'string' ? i : i.imeiNumber) : [])
    if (!imeis || imeis.length === 0) return '—'
    if (imeis.length === 1) return imeis[0]
    return `${imeis[0]} +${imeis.length - 1} more`
  }

  const statCards = [
    { label: 'Total Returns', value: totalReturns, color: 'blue', icon: '📦' },
    { label: 'Total Quantity Returned', value: totalQuantity, color: 'orange', icon: '🔄' },
    { label: 'Top Returned Product', value: topProduct, color: 'purple', icon: '🏆' },
    { label: 'Current Page Results', value: filtered.length, color: 'green', icon: '📋' }
  ]

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {showCreateForm && (
        <CreateReturnModal
          onClose={() => setShowCreateForm(false)}
          onSaved={() => { setShowCreateForm(false); loadAll(); showToast('Return created successfully') }}
        />
      )}
      {viewingReturn && (
        <ViewReturnModal
          returnItem={viewingReturn}
          onClose={() => setViewingReturn(null)}
        />
      )}
      {deletingReturn && (
        <DeleteConfirmModal
          returnItem={deletingReturn}
          onClose={() => setDeletingReturn(null)}
          onConfirmed={() => { setDeletingReturn(null); loadAll(); showToast('Return deleted successfully') }}
        />
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Stock Returns (Company & Private)</h1>
          <p>Track and manage products returned to company and private suppliers</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Return
          </button>
        </div>
      </div>

      <div className="stat-cards-grid">
        {statCards.map((s, i) => (
          <div className="stat-card" key={i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-card-label">{s.label}</div>
                <div className={`stat-card-value ${s.color}`} style={{ fontSize: s.label === 'Top Returned Product' ? '14px' : '22px', marginTop: '4px', wordBreak: 'break-word' }}>
                  {s.value}
                </div>
              </div>
              <div className={`stat-card-icon ${s.color}`} style={{ fontSize: '20px' }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      
<div className="table-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {returnTabs.map(tab => (
              <button key={tab.key} onClick={() => { setFilterSupplierType(tab.key); setCurrentPage(1); }}
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: `1px solid ${filterSupplierType.toLowerCase() === tab.key.toLowerCase() ? 'var(--primary)' : 'var(--border)'}`, background: filterSupplierType.toLowerCase() === tab.key.toLowerCase() ? 'var(--primary)' : 'var(--white)', color: filterSupplierType.toLowerCase() === tab.key.toLowerCase() ? 'var(--white)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'var(--transition)' }}>
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
             <select className="form-select" value={filterBrand} onChange={e => { setFilterBrand(e.target.value); setCurrentPage(1); }} style={{ width: '180px', height: '36px', fontSize: '13px' }}>
                {brands.map(b => <option key={b} value={b}>{b === 'All' ? 'All Brands' : b}</option>)}
             </select>
             <select className="form-select" value={filterSupplierId} onChange={e => { setFilterSupplierId(e.target.value); setCurrentPage(1); }} style={{ width: '220px', height: '36px', fontSize: '13px' }}>
                <option value="All">All Suppliers</option>
                {suppliersByType.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
             </select>
          </div>
        </div>
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-bar" style={{ minWidth: '280px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Search by return ID, supplier, product, IMEI..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="table-toolbar-right" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>From:</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                style={{ width: 'auto', height: '36px', padding: '6px 10px', fontSize: '13px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>To:</label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                style={{ width: 'auto', height: '36px', padding: '6px 10px', fontSize: '13px' }}
              />
            </div>
            {(startDate || endDate) && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => { setStartDate(''); setEndDate('') }}
              >
                Clear
              </button>
            )}
            <button
              className="btn btn-outline btn-sm"
              onClick={handleDownloadSheet}
              disabled={exportingSheet}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {exportingSheet ? 'Exporting...' : 'Return Sheet'}
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleDownloadMobileSheet}
              disabled={exportingMobileSheet}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12" y2="18"/>
              </svg>
              {exportingMobileSheet ? 'Exporting...' : 'Mobile-wise Sheet'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Loading returns...
          </div>
        ) : error ? (
          <div className="error-state" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚠️</div>
            <h3 style={{ color: 'var(--danger)' }}>Something went wrong</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{error}</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: '14px' }} onClick={loadAll}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>No returns found</h3>
            <p>{search || startDate || endDate ? 'Try adjusting your search filters' : 'Click "Create Return" to record your first product return'}</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Return ID</th>
                    <th>Date</th>
                    <th>Company / Supplier</th>
                    <th>Product</th>
                    <th>Price</th>
                    <th>IMEI</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th>Reason</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((r, i) => (
                    <tr key={r._id}>
                      <td style={{ color: 'var(--text-muted)' }}>{firstIdx + i + 1}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>
                        {r.returnId || r._id?.slice(-8) || '—'}
                      </td>
                      <td style={{ fontSize: '13px' }}>{formatDate(r.returnDate || r.date)}</td>
                      <td style={{ fontWeight: 500 }}>{getSupplierDisplay(r)}</td>
                      <td style={{ fontSize: '13px' }}>{getProductDisplay(r)}</td>
                      <td style={{ fontSize: '13px', fontWeight: 600 }}>₹{(r.purchasePrice || (r.product?.costPrice) || 0).toLocaleString()}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>{getImeiDisplay(r)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.quantity || 0}</td>
                      <td><ReasonBadge reason={r.reason} /></td>
                      <td>
                        <div className="action-btns" style={{ justifyContent: 'center' }}>
                          <button className="action-btn" title="View Details" onClick={() => setViewingReturn(r)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          <button
                            className="action-btn"
                            title="Download Sheet"
                            onClick={() => handleDownloadSingleSheet(r)}
                            disabled={downloadingReturnId === r._id}
                            style={{ color: 'var(--info)', borderColor: 'var(--info-light)', background: 'var(--info-light)' }}
                          >
                            {downloadingReturnId === r._id ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinner-sm">
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                            )}
                          </button>
                          <button className="action-btn danger" title="Delete" onClick={() => setDeletingReturn(r)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="table-footer">
                <span>Showing {filtered.length === 0 ? 0 : firstIdx + 1} to {Math.min(lastIdx, filtered.length)} of {filtered.length} records</span>
                <div className="pagination">
                  <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i + 1} className={`pagination-btn${currentPage === i + 1 ? ' active' : ''}`} onClick={() => setCurrentPage(i + 1)}>
                      {i + 1}
                    </button>
                  ))}
                  <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CompanyReturns
