import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import html2canvas from 'html2canvas'
import ImeiScannerModal from '../../components/common/ImeiScannerModal'

/* ── Select Product Modal (Wholesale) ── */
const SelectProductModal = ({ onClose, onSelect }) => {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/products')
      .then((response) => setProducts(response.data.data || []))
      .catch(() => setError('Products could not be loaded.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p =>
    (p.productName && p.productName.toLowerCase().includes(search.toLowerCase())) ||
    (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())) ||
    (p.imeiNumber && p.imeiNumber.toLowerCase().includes(search.toLowerCase())) ||
    (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header" style={{ padding: '16px 20px' }}>
          <div>
            <h2 className="modal-title" style={{ fontSize: '15px' }}>Select Product for Wholesale</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Choose product to add to wholesale bill</p>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: '16px 20px', maxHeight: '380px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1, margin: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input id="imei-input-buyer-billing" placeholder="Search product name, IMEI or Barcode..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
            </div>
            <button type="button" onClick={() => setShowScanner(true)} className="btn btn-outline" title="Scan barcode with camera" style={{ flexShrink: 0, padding: '0 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', height: '40px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5v14M7 5v14M13 5v14M17 5v14M21 5v14M10 5v6M10 13v6"/>
              </svg>
              Scan
            </button>
          </div>

          {showScanner && (
            <ImeiScannerModal
              onClose={() => setShowScanner(false)}
              onScan={(scannedVal) => {
                setSearch(scannedVal)
                setShowScanner(false)
                const matched = products.find(p =>
                  (p.imeiNumber && p.imeiNumber.toLowerCase() === scannedVal.toLowerCase()) ||
                  (p.barcode && p.barcode.toLowerCase() === scannedVal.toLowerCase())
                )
                if (matched) {
                  onSelect(matched)
                }
              }}
            />
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '280px', paddingRight: '4px' }}>
            {loading ? (
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', padding: '10px' }}>Loading products...</p>
            ) : error ? (
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--danger)', padding: '10px' }}>{error}</p>
            ) : filtered.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', padding: '10px' }}>No products found</p>
            ) : filtered.map(p => (
              <div key={p._id} onClick={() => onSelect(p)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.productName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.brand} · {p.variant || 'Standard'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary)' }}>₹{(p.wholesalePrice || p.salePrice || 0).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '10px', color: p.stock > 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>Stock: {p.stock}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Wholesale Invoice Print Preview Modal ── */
const PrintPreviewModal = ({ editingSaleId, existingInvoiceNo, form, items, total, onClose }) => {
  const [isSaving, setIsSaving] = useState(false)
  const displayInvoiceNo = existingInvoiceNo || 'Pending Save'

  const handleSave = async (shouldPrint) => {
    if (items.length === 0) {
      alert('Please add at least one product before generating a bill.')
      return
    }
    const duplicateImeis = items
      .map(i => i.imei)
      .filter(imei => imei && imei !== 'N/A' && imei.trim() !== '')
      .filter((imei, idx, self) => self.findIndex(t => t.toLowerCase() === imei.toLowerCase()) !== idx);
    if (duplicateImeis.length > 0) {
      alert(`Cannot save bill: Duplicate IMEI numbers in sale items list (${[...new Set(duplicateImeis)].join(', ')})`);
      return;
    }
    if (!form.shopName || !form.mobileNo) {
      alert('Please enter Shop Name and Mobile No.')
      return
    }

    try {
      setIsSaving(true)
      const salePayload = {
        invoiceNumber: existingInvoiceNo || undefined,
        customerName: form.shopName,
        phone: form.mobileNo,
        saleType: 'wholesale',
        paymentMode: 'cash',
        pickedBy: form.pickedBy,
        partyGst: form.partyGst || '',
        subTotal: total,
        totalDiscount: 0,
        totalTax: 0,
        grandTotal: total,
        items: items.map(i => ({
          productId: i.productId || null, 
          productName: i.product,
          imei: i.imei || '',
          qty: i.qty,
          price: i.rate,
          discount: 0,
          tax: 0,
          total: (i.rate * i.qty)
        }))
      }
      
      let res
      if (editingSaleId) {
        res = await api.put(`/sales/${editingSaleId}`, salePayload)
      } else {
        res = await api.post('/sales', salePayload)
      }

      const savedSale = res.data?.data
      if (savedSale && savedSale._id) {
        try {
          const printEl = document.getElementById('print-area')
          if (printEl) {
            const canvas = await html2canvas(printEl, { scale: 2, useCORS: true, logging: false })
            const imgData = canvas.toDataURL('image/png')
            await api.post(`/sales/${savedSale._id}/bill-image`, { billImageUrl: imgData })
          }
        } catch (imgErr) {
          console.warn('Failed to upload wholesale bill snapshot:', imgErr)
        }
      }

      setIsSaving(false)
      
      if (shouldPrint) {
        setTimeout(() => window.print(), 300)
      } else {
        alert('Wholesale bill saved successfully!')
        onClose()
        window.location.href = '/billing/buyer'
      }
    } catch (error) {
      setIsSaving(false)
      console.error('Failed to save wholesale bill', error)
      alert('Failed to save wholesale bill: ' + (error.response?.data?.message || error.message))
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.6)', overflowY: 'auto' }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', margin: '40px auto', background: 'var(--white)', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <h2 className="modal-title">Wholesale Invoice Preview</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-success" onClick={() => handleSave(false)} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Bill'}</button>
            <button className="btn btn-primary" onClick={() => handleSave(true)} disabled={isSaving}>{isSaving ? 'Saving...' : '🖨️ Save & Print'}</button>
            <button className="btn btn-outline" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="modal-body" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px' }}>
          {/* Printable Container */}
          <div id="print-area" className="printable-invoice" style={{ border: '2.5px solid #1e3a8a', padding: '24px', background: '#fff', fontSize: '12px', color: '#000', fontFamily: 'sans-serif', position: 'relative' }}>
            
            {/* Top Label */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <span style={{ background: '#1e3a8a', color: '#fff', fontWeight: 'bold', fontSize: '12px', padding: '4px 20px', borderRadius: '4px', textTransform: 'uppercase' }}>CUSTOMER COPY</span>
            </div>

            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1e3a8a', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/logo.png" alt="MVM" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
                <div>
                  <h1 style={{ color: '#1e3a8a', fontSize: '26px', fontWeight: '800', margin: 0, letterSpacing: '0.5px' }}>MAA VESHNO MOBILE</h1>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', letterSpacing: '3px', textTransform: 'uppercase', marginTop: '2px', display: 'block' }}>WHOLESALE INVOICE</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '11px' }}>
                <div style={{ margin: '3px 0' }}><strong>Invoice No.:</strong> <span style={{ borderBottom: '1px solid #000', paddingRight: '15px' }}>{displayInvoiceNo}</span></div>
                <div style={{ margin: '3px 0' }}><strong>Date:</strong> <span style={{ borderBottom: '1px solid #000', paddingRight: '15px' }}>{new Date().toLocaleDateString('en-IN')}</span></div>
              </div>
            </div>

            {/* Buyer Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '90px', fontWeight: 'bold' }}>Shop Name</span>
                <span style={{ width: '15px' }}>:</span>
                <span style={{ borderBottom: '1.5px solid #000', flex: 1, fontWeight: 'bold' }}>{form.shopName || '—'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '90px', fontWeight: 'bold' }}>Picked By</span>
                <span style={{ width: '15px' }}>:</span>
                <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{form.pickedBy || '—'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '90px', fontWeight: 'bold' }}>Mobile No.</span>
                <span style={{ width: '15px' }}>:</span>
                <span style={{ borderBottom: '1.5px solid #000', flex: 1, fontWeight: 'bold' }}>{form.mobileNo || '—'}</span>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.5px solid #1e3a8a', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1.5px solid #1e3a8a' }}>
                  <th style={{ border: '1px solid #1e3a8a', padding: '8px', textAlign: 'center', width: '50px', fontWeight: 'bold', color: '#1e3a8a' }}>S. No.</th>
                  <th style={{ border: '1px solid #1e3a8a', padding: '8px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>IMEI / IME Number</th>
                  <th style={{ border: '1px solid #1e3a8a', padding: '8px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Product</th>
                  <th style={{ border: '1px solid #1e3a8a', padding: '8px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a8a' }}>Variant / Model</th>
                  <th style={{ border: '1px solid #1e3a8a', padding: '8px', textAlign: 'center', width: '60px', fontWeight: 'bold', color: '#1e3a8a' }}>Qty</th>
                  <th style={{ border: '1px solid #1e3a8a', padding: '8px', textAlign: 'right', width: '100px', fontWeight: 'bold', color: '#1e3a8a' }}>Rate (₹)</th>
                  <th style={{ border: '1px solid #1e3a8a', padding: '8px', textAlign: 'right', width: '110px', fontWeight: 'bold', color: '#1e3a8a' }}>Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#666' }}>No products added yet.</td>
                  </tr>
                ) : items.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ border: '1px solid #1e3a8a', padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #1e3a8a', padding: '8px', fontFamily: 'monospace', fontWeight: 600 }}>{item.imei || '—'}</td>
                    <td style={{ border: '1px solid #1e3a8a', padding: '8px', fontWeight: 500 }}>{item.product || '—'}</td>
                    <td style={{ border: '1px solid #1e3a8a', padding: '8px' }}>{item.variant || '—'}</td>
                    <td style={{ border: '1px solid #1e3a8a', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{item.qty}</td>
                    <td style={{ border: '1px solid #1e3a8a', padding: '8px', textAlign: 'right' }}>{item.rate.toLocaleString('en-IN')}.00</td>
                    <td style={{ border: '1px solid #1e3a8a', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>{(item.rate * item.qty).toLocaleString('en-IN')}.00</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Block & Signatures */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '16px' }}>
              <span style={{ fontSize: '12px', fontStyle: 'italic', fontWeight: 'bold', color: '#1e3a8a' }}>Thank you for your business!</span>
              
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ background: '#1e3a8a', color: '#fff', fontWeight: 'bold', fontSize: '13px', padding: '6px 20px', borderTopLeftRadius: '4px', borderBottomLeftRadius: '4px' }}>Total (₹)</span>
                <span style={{ border: '1.5px solid #1e3a8a', padding: '4px 20px', fontSize: '13px', fontWeight: 'bold', borderTopRightRadius: '4px', borderBottomRightRadius: '4px', minWidth: '110px', textAlign: 'right' }}>
                  {total.toLocaleString('en-IN')}.00
                </span>
              </div>
            </div>

            {/* Buyer Sign area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', padding: '0 8px' }}>
              <div style={{ textAlign: 'center', width: '150px', borderTop: '1px solid #000', paddingTop: '4px', fontSize: '10px' }}>Receiver's Signature</div>
              <div style={{ textAlign: 'center', width: '150px', borderTop: '1px solid #000', paddingTop: '4px', fontSize: '10px' }}>Authorised Signatory</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Wholesale Buyer Billing Page ── */
const BuyerBilling = () => {
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ shopName: '', pickedBy: '', mobileNo: '', partyGst: '' })
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [editingSaleId, setEditingSaleId] = useState(null)
  const [existingInvoiceNo, setExistingInvoiceNo] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const editId = params.get('edit')
    if (editId) {
      setEditingSaleId(editId)
      api.get(`/sales/${editId}`).then(res => {
        if (res.data?.success) {
          const sale = res.data.data
          setExistingInvoiceNo(sale.invoiceNumber)
          setForm({
            shopName: sale.customerName || '',
            pickedBy: sale.pickedBy || '',
            mobileNo: sale.phone || '',
            partyGst: sale.partyGst || ''
          })
          setItems(sale.items.map((i, idx) => ({
            id: Date.now() + idx,
            productId: i.productId,
            product: i.productName,
            variant: i.variant || 'Standard',
            imei: i.imei || '',
            qty: i.qty,
            rate: i.price
          })))
        }
      }).catch(err => alert("Failed to load wholesale bill for editing: " + err.message))
    }
  }, [])

  const total = items.reduce((sum, i) => sum + i.rate * i.qty, 0)

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSelectProduct = (product) => {
    if (product.imeiNumber && product.imeiNumber !== 'N/A' && product.imeiNumber.trim() !== '') {
      const exists = items.some(item => 
        item.imei && item.imei !== 'N/A' && item.imei.trim().toLowerCase() === product.imeiNumber.trim().toLowerCase()
      );
      if (exists) {
        alert(`IMEI ${product.imeiNumber} is already added to this bill!`);
        return;
      }
    }
    const newItem = {
      id: Date.now(),
      productId: product._id,
      imei: product.imeiNumber || '',
      product: product.productName,
      variant: product.variant || 'Standard',
      qty: 1,
      rate: product.wholesalePrice || product.salePrice || 0
    }
    setItems(current => [...current, newItem])
    setShowSelectModal(false)
  }

  const removeItem = (id) => setItems(items.filter(i => i.id !== id))

  return (
    <div>
      {showSelectModal && <SelectProductModal onClose={() => setShowSelectModal(false)} onSelect={handleSelectProduct} />}
      {showPrintModal && (
        <PrintPreviewModal
          editingSaleId={editingSaleId}
          existingInvoiceNo={existingInvoiceNo}
          form={form}
          items={items}
          total={total}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1>{editingSaleId ? 'Edit Wholesale Bill' : 'Buyer Billing'}</h1>
          <p>{editingSaleId ? `Editing Invoice #${existingInvoiceNo}` : 'Create wholesale invoices for buyers'}</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-outline" onClick={() => setShowPrintModal(true)}>🖨 Print Bill</button>
          <button className="btn btn-primary" onClick={() => setShowPrintModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            {editingSaleId ? 'Save Edits' : 'Generate Invoice'}
          </button>
        </div>
      </div>

      <div className="form-grid" style={{ marginBottom: '20px' }}>
        {/* Buyer Details */}
        <div className="card">
          <div className="card-header"><span className="card-title">Buyer Details</span></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Shop Name <span className="required">*</span></label>
                <input className="form-input" name="shopName" value={form.shopName} onChange={handleFormChange} placeholder="Enter shop name" />
              </div>
              <div className="form-group">
                <label className="form-label">Picked By</label>
                <input className="form-input" name="pickedBy" value={form.pickedBy} onChange={handleFormChange} placeholder="Enter person name" />
              </div>
              <div className="form-group">
                <label className="form-label">Mobile No. <span className="required">*</span></label>
                <input className="form-input" name="mobileNo" value={form.mobileNo} onChange={handleFormChange} placeholder="Enter mobile number" />
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="card">
          <div className="card-header"><span className="card-title">Invoice Info</span></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Invoice No.</label>
                <input className="form-input" value={existingInvoiceNo || 'Auto-generated'} readOnly style={{ background: 'var(--bg)' }} />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label className="form-label">Invoice Type</label>
                <input className="form-input" value="Wholesale Invoice" readOnly style={{ background: 'var(--bg)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="table-wrapper" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <span className="card-title">Products</span>
          <button className="btn btn-outline btn-sm" onClick={() => setShowSelectModal(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Product
          </button>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>S. No.</th>
                <th>IMEI / IME Number</th>
                <th>Product</th>
                <th>Variant / Model</th>
                <th>Qty</th>
                <th>Rate (₹)</th>
                <th>Amount (₹)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No products added yet. Click "+ Add Product" to search and add.
                  </td>
                </tr>
              ) : items.map((item, i) => (
                <tr key={item.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>{item.imei || '-'}</span></td>
                  <td style={{ fontWeight: 500 }}>{item.product || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{item.variant || '-'}</td>
                  <td style={{ fontWeight: 600 }}>{item.qty}</td>
                  <td>{item.rate.toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: 700 }}>{(item.rate * item.qty).toLocaleString('en-IN')}</td>
                  <td>
                    <button className="action-btn danger" onClick={() => removeItem(item.id)}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6M14 11v6"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ minWidth: '220px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Sub Total</span>
              <span>₹ {total.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 700, fontSize: '15px' }}>
              <span>Total (₹)</span>
              <span style={{ color: 'var(--primary)' }}>₹ {total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BuyerBilling