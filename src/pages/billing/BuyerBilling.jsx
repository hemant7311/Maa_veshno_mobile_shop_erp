import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import html2canvas from 'html2canvas'

/* ── Select Product Modal (Wholesale) ── */
const SelectProductModal = ({ onClose, onSelect }) => {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get('/products')
      .then((response) => setProducts(response.data.data || []))
      .catch(() => setError('Products load nahi ho sake.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = products.filter(p =>
    (p.imeiNumber && p.imeiNumber.toLowerCase().includes(search.toLowerCase())) ||
    (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header" style={{ padding: '16px 20px' }}>
          <div>
            <h2 className="modal-title" style={{ fontSize: '15px' }}>Select Product</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Choose product to add to bill (by IMEI or Barcode)</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 20px', maxHeight: '380px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1, margin: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input id="imei-input-buyer-billing" placeholder="Search IMEI or Barcode..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { 
                if (e.key === 'Enter') {
                  const val = e.target.value.trim().toLowerCase();
                  if (!val) return;
                  const currentFiltered = products.filter(p => 
                    (p.imeiNumber && p.imeiNumber.toLowerCase().includes(val)) ||
                    (p.barcode && p.barcode.toLowerCase().includes(val))
                  );
                  if (currentFiltered.length > 0) { 
                    onSelect(currentFiltered[0]); 
                  }
                } 
              }} autoFocus />
            </div>
            <button type="button" onClick={() => document.getElementById('imei-input-buyer-billing').focus()} className="btn btn-outline" title="Scan barcode" style={{ flexShrink: 0, padding: '0 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', height: '40px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5v14M7 5v14M13 5v14M17 5v14M21 5v14M10 5v6M10 13v6"/>
              </svg>
              Scan
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '280px', paddingRight: '4px' }}>
            {loading ? (
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', padding: '10px' }}>Loading products...</p>
            ) : error ? (
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--danger)', padding: '10px' }}>{error}</p>
            ) : filtered.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', padding: '10px' }}>No products found</p>
            ) : filtered.map(p => (
              <div key={p._id} onClick={() => onSelect(p)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'var(--transition)' }}
                onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.productName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.brand} · {p.variant || 'Standard'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary)' }}>₹{p.salePrice.toLocaleString('en-IN')}</div>
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
const PrintPreviewModal = ({ form, items, onClose }) => {
  const total = items.reduce((sum, i) => sum + i.rate * i.qty, 0)
  const invoiceNo = React.useMemo(() => 'MVM-WS-' + (Math.floor(Math.random() * 8999) + 1000), []);

  const handlePrint = async () => {
    if (items.length === 0) {
      alert('Please add at least one product before generating a bill.')
      return
    }
    if (!form.shopName || !form.mobileNo) {
      alert('Please enter Shop Name and Mobile No.')
      return
    }

    try {
      const salePayload = {
        invoiceNumber: invoiceNo,
        customerName: form.shopName,
        phone: form.mobileNo,
        saleType: 'wholesale',
        paymentMode: 'cash',
        pickedBy: form.pickedBy,
        subTotal: total,
        totalDiscount: 0, // Implement if needed
        totalTax: 0, // Implement if needed
        grandTotal: total,
        items: items.map(i => ({
          productId: i.productId || null, 
          productName: i.product,
          imei: i.imeis ? i.imeis.join(', ') : '',
          qty: i.qty,
          price: i.rate,
          discount: 0,
          tax: 0,
          total: (i.rate * i.qty)
        }))
      }
      
      // We assume `api` is imported, but let's make sure it doesn't crash if it's not
      // Actually we need to make sure api is imported at the top of BuyerBilling.jsx
      await window.api.post('/sales', salePayload).catch(async () => {
         // Fallback if window.api is not defined
         const { default: api } = await import('../../services/api')
         await api.post('/sales', salePayload)
      })

      window.print()
    } catch (error) {
      console.error('Failed to save wholesale bill', error)
      alert('Failed to save wholesale bill: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleShareWhatsApp = async () => {
    if (!form.mobileNo) return alert('No mobile number provided.');
    
    // Open chat without pre-filled text
    const url = `https://wa.me/91${form.mobileNo.replace(/\D/g, '')}`;
    
    try {
      const printArea = document.getElementById('print-area');
      if (printArea) {
        // Temporarily scroll to top to prevent html2canvas from cutting off the image
        const modalOverlay = document.querySelector('.modal-overlay');
        const prevScroll = modalOverlay ? modalOverlay.scrollTop : 0;
        if (modalOverlay) modalOverlay.scrollTop = 0;

        const canvas = await html2canvas(printArea, { 
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        });

        // Restore scroll
        if (modalOverlay) modalOverlay.scrollTop = prevScroll;

        canvas.toBlob(blob => {
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]).then(() => {
            // Open WhatsApp Web immediately, image is in clipboard ready to paste
            window.open(url, '_blank');
          }).catch(err => {
            console.error('Clipboard write failed, downloading instead:', err);
            const link = document.createElement('a');
            link.download = `Bill_${invoiceNo}.png`;
            link.href = canvas.toDataURL();
            link.click();
            window.open(url, '_blank');
          });
        });
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Failed to capture bill image', error);
      window.open(url, '_blank');
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.6)', overflowY: 'auto' }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', margin: '40px auto', background: 'var(--white)' }}>
        <div className="modal-header">
          <h2 className="modal-title">Wholesale Invoice Print Preview</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" style={{ borderColor: '#25D366', color: '#25D366' }} onClick={handleShareWhatsApp}>
              WhatsApp
            </button>
            <button className="btn btn-primary" onClick={handlePrint}>🖨️ Print Invoice</button>
            <button className="btn btn-outline" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
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
                <div style={{ margin: '3px 0' }}><strong>Invoice No.:</strong> <span style={{ borderBottom: '1px solid #000', paddingRight: '15px' }}>{invoiceNo}</span></div>
                <div style={{ margin: '3px 0' }}><strong>Date:</strong> <span style={{ borderBottom: '1px solid #000', paddingRight: '15px' }}>{new Date().toLocaleDateString('en-IN')}</span></div>
              </div>
            </div>

            {/* Buyer Details Card/Section */}
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
  const [form, setForm] = useState({ shopName: '', pickedBy: '', mobileNo: '' })
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)

  const total = items.reduce((sum, i) => sum + i.rate * i.qty, 0)

  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSelectProduct = (product) => {
    const newItem = {
      id: Date.now(),
      productId: product._id,
      imei: product.imeiNumber || 'N/A',
      product: product.productName,
      variant: product.variant || 'Standard',
      qty: 1,
      rate: product.salePrice
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
          form={form}
          items={items}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Buyer Billing</h1>
          <p>Create wholesale invoices for buyers</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-outline" onClick={() => setShowPrintModal(true)}>🖨 Print Bill</button>
          <button className="btn btn-primary" onClick={() => setShowPrintModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Generate Invoice
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
                <input className="form-input" value="MVM-WS-001" readOnly style={{ background: 'var(--bg)' }} />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '13px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Discount</span>
              <span>₹ 0</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontWeight: 700, fontSize: '15px' }}>
              <span>Total (₹)</span>
              <span style={{ color: 'var(--primary)' }}>₹ {total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px 18px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <strong style={{ color: 'var(--text-primary)' }}>Terms &amp; Conditions:</strong>
        <ul style={{ marginTop: '6px', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <li>Goods once sold will not be taken back.</li>
          <li>All subject to Firozabad Jurisdiction.</li>
          <li>Thank you for your business!</li>
        </ul>
      </div>
    </div>
  )
}

export default BuyerBilling