import React, { useEffect, useState } from 'react'
import {
  getAllCompanyReturns, getCompanyReturnById, createCompanyReturn, deleteCompanyReturn,
  getAllSuppliers, getAllProducts, getAvailableImeisByProduct, getAllImeis,
  exportCompanyReturns, downloadBlob
} from '../../services/api'
import { subscribeSuppliersChanged } from '../../utils/supplierEvents'
import ImeiScannerModal from '../../components/common/ImeiScannerModal'

const formatDate = (d) => {
  if (!d) return ''
  const date = new Date(d)
  if (isNaN(date.getTime())) return ''
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
export const CreateReturnModal = ({ onClose, onSaved }) => {
  const today = formatDate(new Date())
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [availableImeis, setAvailableImeis] = useState([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingImeis, setLoadingImeis] = useState(false)
  const [imeiSearch, setImeiSearch] = useState('')
  const [showScanner, setShowScanner] = useState(false)
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
    const unsubscribe = subscribeSuppliersChanged(() => {
      loadSuppliers()
    })
    return unsubscribe
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
  }, [form.selectedImeis, hasImeiTracking])

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

  const handleScanCode = (code) => {
    const matched = availableImeis.find(i => String(i.imeiNumber).trim() === code.trim())
    if (matched) {
      if (!form.selectedImeis.includes(matched._id)) {
        handleImeiToggle(matched._id)
      }
      setShowScanner(false)
    } else {
      alert(`IMEI "${code}" not found or not available for this product.`)
    }
  }

  const handleSubmit = async () => {
    if (!form.supplierId) { setError('Please select a supplier/company'); return }
    if (!form.productId) { setError('Please select a product'); return }
    if (hasImeiTracking && form.selectedImeis.length === 0) {
      setError('Please select at least one available IMEI for this product'); return
    }
    if (!form.quantity || Number(form.quantity) < 1) { setError('Quantity must be at least 1'); return }

    try {
      setSaving(true); setError('')

      const selectedImeiObjects = availableImeis.filter(i => form.selectedImeis.includes(i._id))
      const imeiNumbers = selectedImeiObjects.map(i => i.imeiNumber)

      // Canonical payload matching backend contract
      const payload = {
        supplier: form.supplierId,
        product: form.productId,
        quantity: hasImeiTracking && form.selectedImeis.length > 0 ? form.selectedImeis.length : Number(form.quantity),
        returnDate: form.returnDate,
        reason: form.reason === 'Other' ? (form.customReason || 'Other') : form.reason,
        notes: form.notes,
        imeis: imeiNumbers,
        // Backward-compatibility aliases
        supplierId: form.supplierId,
        productId: form.productId,
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
      {showScanner && (
        <ImeiScannerModal
          onClose={() => setShowScanner(false)}
          onScan={handleScanCode}
        />
      )}

      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '720px', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
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

        <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px' }}>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Select IMEIs <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                        ({form.selectedImeis.length} selected / {availableImeis.length} available)
                      </span>
                    </label>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowScanner(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>
                      Open Camera Scanner
                    </button>
                  </div>

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
        <div className="modal-footer" style={{ flexShrink: 0 }}>
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
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '680px', margin: '24px auto', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
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
        <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px' }}>
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
                  : (returnItem?.supplierName || returnItem?.supplier?.name || returnItem?.supplier || '—')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Product</div>
              <div style={{ fontWeight: 600 }}>
                {typeof returnItem?.productId === 'object'
                  ? returnItem.productId.productName || '—'
                  : (returnItem?.productName || returnItem?.product?.productName || returnItem?.product || '—')}
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

          {returnItem?.imeis && returnItem.imeis.length > 0 && (
            <>
              <h3 className="section-title">IMEI Numbers ({returnItem.imeis.length})</h3>
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px',
                background: 'var(--bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)'
              }}>
                {returnItem.imeis.map((imei, i) => (
                  <span key={i} style={{
                    fontFamily: 'monospace', fontSize: '12px', padding: '6px 10px',
                    background: 'var(--white)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', fontWeight: 600
                  }}>
                    {typeof imei === 'string' ? imei : imei.imeiNumber}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="modal-footer" style={{ flexShrink: 0 }}>
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
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h2 className="modal-title">Delete Return Record</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div style={{ padding: '14px', background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid #FECACA' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Deleting return record</div>
            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--danger)' }}>
              {returnItem?.returnId || returnItem?._id} · Qty {returnItem?.quantity}
            </div>
          </div>
          <p>Are you sure you want to permanently delete this return record? This action cannot be undone.</p>
          {error && <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '10px' }}>{error}</p>}
        </div>
        <div className="modal-footer" style={{ flexShrink: 0 }}>
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

  const filtered = returns.filter(r => {
    const sType = String(r.supplier?.type || r.supplierId?.type || 'company').toLowerCase()
    if (filterSupplierType !== 'All' && sType !== filterSupplierType.toLowerCase()) return false
    
    const pBrand = r.product?.brand || r.productId?.brand || r.brand || ''
    if (filterBrand !== 'All' && pBrand !== filterBrand) return false

    const sId = r.supplier?._id || r.supplierId?._id || r.supplier || r.supplierId
    if (filterSupplierId !== 'All' && String(sId) !== filterSupplierId) return false

    const supplierName = r.supplier?.name || (typeof r?.supplierId === 'object' ? r.supplierId.name : r?.supplierName) || ''
    const productName = r.product?.productName || (typeof r?.productId === 'object' ? r.productId.productName : r?.productName) || ''
    const returnId = r?.returnId || r?._id || ''
    const reason = r?.reason || ''
    const notes = r?.notes || ''
    const imeis = r?.imeis || r?.imeiNumbers || []
    const imeisStr = imeis.map(i => typeof i === 'string' ? i : (i.imeiNumber || '')).join(' ')

    const haystack = `${supplierName} ${productName} ${returnId} ${reason} ${notes} ${imeisStr}`.toLowerCase()
    return !search || haystack.includes(search.toLowerCase())
  })

  const totalReturns = filtered.length
  const totalQuantity = filtered.reduce((sum, r) => sum + Number(r.quantity || 0), 0)
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const lastIdx = currentPage * itemsPerPage
  const firstIdx = lastIdx - itemsPerPage
  const pageItems = filtered.slice(firstIdx, lastIdx)

  const handleDownloadSheet = async () => {
    try {
      setExportingSheet(true)
      const headers = ['Return ID', 'Date', 'Supplier', 'Type', 'Product', 'Brand', 'Quantity', 'Reason', 'Status', 'IMEIs']
      const rows = filtered.map(r => [
        r.returnId || '-',
        formatDate(r.returnDate || r.createdAt),
        r.supplier?.name || r.supplierName || '-',
        r.supplier?.type || 'company',
        r.product?.productName || r.productName || '-',
        r.product?.brand || r.brand || '-',
        r.quantity || 1,
        r.reason || '-',
        r.status || '-',
        (r.imeis || []).map(i => typeof i === 'string' ? i : i.imeiNumber).join('; ')
      ])
      const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
      const dateStr = new Date().toISOString().split('T')[0]
      downloadBlob({ data: csvContent }, `stock_returns_${dateStr}.csv`)
      showToast('Return sheet downloaded successfully')
    } catch (err) {
      showToast('Failed to download return sheet', 'error')
    } finally { setExportingSheet(false) }
  }

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
          <p>Track and manage products returned to suppliers</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-outline" onClick={handleDownloadSheet} disabled={exportingSheet}>
            📥 Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Return
          </button>
        </div>
      </div>

      <div className="stat-cards-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <span className="stat-card-label">Total Returns</span>
          <div className="stat-card-value blue">{totalReturns}</div>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Total Quantity Returned</span>
          <div className="stat-card-value orange">{totalQuantity}</div>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Filtered Results</span>
          <div className="stat-card-value green">{filtered.length}</div>
        </div>
      </div>

      {error && <div style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>{error}</div>}

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-bar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Search returns by ID, product, supplier, IMEI..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Return ID</th>
                <th>Supplier</th>
                <th>Product</th>
                <th>IMEIs</th>
                <th>Qty</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px' }}>Loading returns...</td></tr>
              ) : pageItems.length === 0 ? (
                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No returns found.</td></tr>
              ) : (
                pageItems.map(r => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{r.returnId || r._id}</td>
                    <td>{r.supplier?.name || (typeof r.supplierId === 'object' ? r.supplierId.name : r.supplierName) || '—'}</td>
                    <td>{r.product?.productName || (typeof r.productId === 'object' ? r.productId.productName : r.productName) || '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {r.imeis && r.imeis.length > 0
                        ? `${typeof r.imeis[0] === 'string' ? r.imeis[0] : r.imeis[0].imeiNumber}${r.imeis.length > 1 ? ` (+${r.imeis.length - 1})` : ''}`
                        : r.imei || '—'}
                    </td>
                    <td style={{ fontWeight: 600 }}>{r.quantity}</td>
                    <td><ReasonBadge reason={r.reason} /></td>
                    <td>{formatDate(r.returnDate || r.createdAt)}</td>
                    <td><StatusBadge status={r.status || 'Returned'} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="action-btn" title="View" onClick={() => setViewingReturn(r)} style={{ marginRight: '6px' }}>👁</button>
                      <button className="action-btn danger" title="Delete" onClick={() => setDeletingReturn(r)}>🗑</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="table-footer">
            <span>Showing {firstIdx + 1} to {Math.min(lastIdx, filtered.length)} of {filtered.length}</span>
            <div className="pagination">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompanyReturns
