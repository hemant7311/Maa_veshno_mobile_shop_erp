import React, { useEffect, useState } from 'react'
import api from '../../services/api'
import html2canvas from 'html2canvas'

const DEFAULT_WARRANTY_OPTIONS = ['No Guarantee', '1 Year Insurance', '6 Months Warranty', 'Screen Replacement', 'Liquid Damage']

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
            Close
          </button>
        </div>

        <div className="modal-body" style={{ padding: '16px 20px', maxHeight: '380px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1, margin: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input id="imei-input-customer-billing" placeholder="Search IMEI or Barcode..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { 
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
            <button type="button" onClick={() => document.getElementById('imei-input-customer-billing').focus()} className="btn btn-outline" title="Scan barcode" style={{ flexShrink: 0, padding: '0 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', height: '40px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 5v14M7 5v14M13 5v14M17 5v14M21 5v14M10 5v6M10 13v6"/>
              </svg>
              Scan
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '280px', paddingRight: '4px' }}>
            {loading ? (
              <p>Loading...</p>
            ) : filtered.map(p => (
              <div key={p._id} onClick={() => onSelect(p)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{p.productName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.brand}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary)' }}>₹{p.salePrice}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const PrintPreviewModal = ({ editingSaleId, existingInvoiceNo, customer, customerType, finance, payMode, downPaymentMode, financeType, items, billType, subtotal, discountAmt, gstAmt, grandTotal, warrantySaleAmount, warrantyOptions, onClose }) => {
  const [isSaving, setIsSaving] = useState(false)
  const taxableValue = subtotal - discountAmt
  const cgstAmt = gstAmt / 2
  const sgstAmt = gstAmt / 2
  const finalInvoiceNo = existingInvoiceNo || 'Pending Save'
  const emiDayOnly = finance.emiPayDate ? new Date(finance.emiPayDate).getDate() : ''
  const emiMethodLabel = finance.emiPaymentMethod === 'bank' ? 'Auto bank deduction' : 'Will come to shop'
  const downPaymentModeLabel = downPaymentMode.length > 0 ? downPaymentMode.join(', ').toUpperCase() : 'Cash'

  const handleSave = async (shouldPrint) => {
    if (items.length === 0) {
      alert('Please add at least one product before generating a bill.')
      return
    }
    if (!customer.name || !customer.mobile) {
      alert('Please enter Customer Name and Mobile No.')
      return
    }

    try {
      setIsSaving(true)
      const salePayload = {
        invoiceNumber: existingInvoiceNo || undefined,
        customerName: customer.name,
        phone: customer.mobile,
        address: customer.address,
        partyGst: customer.partyGst,
        amountPaid: customer.amountPaidNow ? Number(customer.amountPaidNow) : undefined,
        promisedDays: customer.promisedDays ? Number(customer.promisedDays) : undefined,
        saleType: customerType,
        paymentMode: payMode[0] || 'cash',
        subTotal: subtotal,
        totalDiscount: discountAmt,
        totalTax: gstAmt,
        warrantySaleAmount: Number(warrantySaleAmount) || 0,
        grandTotal: grandTotal,
        items: items.map(i => ({
          productId: i.productId || null, 
          productName: i.product,
          imei: i.imei,
          qty: i.qty,
          price: i.price,
          discount: i.discount,
          tax: 0,
          total: (i.price * i.qty) - i.discount
        })),
        financeDetails: payMode.includes('finance') ? {
          company: financeType === 'company' ? finance.company : finance.privateFinancier,
          loanId: finance.loanId,
          dpAmount: Number(finance.downPayment) || 0,
          emiAmount: Number(finance.emi) || 0,
          tenure: finance.tenure,
          emiPayDate: finance.emiPayDate,
          fileNo: finance.fileNo,
          emiPaymentMethod: finance.emiPaymentMethod
        } : undefined
      }

      let res;
      if (editingSaleId) {
         res = await api.put(`/sales/${editingSaleId}`, salePayload);
      } else {
         res = await api.post('/sales', salePayload);
      }

      setIsSaving(false);
      
      if (shouldPrint) {
        setTimeout(() => window.print(), 300);
      } else {
        alert('Bill saved successfully!');
        onClose();
        window.location.reload(); 
      }
    } catch (error) {
      setIsSaving(false);
      console.error('Failed to save bill', error)
      alert('Failed to save bill: ' + (error.response?.data?.message || error.message))
    }
  }

/* ── WHOLESALE BILL ── */
  if (customerType === 'wholesale') {
    return (
      <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.6)', overflowY: 'auto' }}>
        <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', margin: '40px auto', background: 'var(--bg)' }}>
          <div className="modal-header" style={{ background: 'var(--white)' }}>
            <h2 className="modal-title">Wholesale Invoice</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-success" onClick={() => handleSave(false)} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Bill'}</button>
<button className="btn btn-primary" onClick={() => handleSave(true)} disabled={isSaving}>{isSaving ? 'Saving...' : '🖨️  Save & Print'}</button>
              <button className="btn btn-outline" onClick={onClose}>Close</button>
            </div>
          </div>

          <div className="modal-body" style={{ background: 'var(--white)', padding: '24px' }}>
            <div id="print-area" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#000', background: '#fff', padding: '20px', border: '2px solid #1e3a8a', borderRadius: '8px' }}>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'inline-block', background: '#1e3a8a', color: '#fff', fontWeight: 'bold', fontSize: '13px', padding: '4px 20px', borderRadius: '4px', marginBottom: '10px' }}>CUSTOMER COPY</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src="/logo.png" alt="MVM" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#1e3a8a' }}>MAA VESHNO MOBILE</div>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f97316', letterSpacing: '2px' }}>WHOLESALE INVOICE</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px' }}>
                    <div><strong>Invoice No.:</strong> {finalInvoiceNo || 'Pending Save'}</div>
                    <div><strong>Date:</strong> {new Date().toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div style={{ marginBottom: '14px', fontSize: '12px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                  <strong style={{ minWidth: '90px' }}>Shop Name</strong>
                  <span>:</span>
                  <span style={{ borderBottom: '1px solid #000', flex: 1 }}>{customer.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                  <strong style={{ minWidth: '90px' }}>Address</strong>
                  <span>:</span>
                  <span style={{ borderBottom: '1px solid #000', flex: 1 }}>{customer.address || ''}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <strong style={{ minWidth: '90px' }}>Mobile No.</strong>
                  <span>:</span>
                  <span style={{ borderBottom: '1px solid #000', flex: 1 }}>{customer.mobile}</span>
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #1e3a8a' }}>
                <thead>
                  <tr style={{ background: '#1e3a8a', color: '#fff' }}>
                    <th style={{ padding: '8px 6px', textAlign: 'center', width: '40px' }}>S. No.</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>IMEI / IME Number</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>Product</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>Variant / Model</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', width: '45px' }}>Qty</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>Rate (₹)</th>
                    <th style={{ padding: '8px 6px', textAlign: 'center' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0
                    ? Array.from({ length: 5 }, (_, i) => (
                        <tr key={i}>
                          <td style={{ border: '1px solid #1e3a8a', padding: '10px 6px', textAlign: 'center' }}>{i + 1}</td>
                          <td style={{ border: '1px solid #1e3a8a', padding: '10px 6px' }}></td>
                          <td style={{ border: '1px solid #1e3a8a', padding: '10px 6px' }}></td>
                          <td style={{ border: '1px solid #1e3a8a', padding: '10px 6px' }}></td>
                          <td style={{ border: '1px solid #1e3a8a', padding: '10px 6px' }}></td>
                          <td style={{ border: '1px solid #1e3a8a', padding: '10px 6px' }}></td>
                          <td style={{ border: '1px solid #1e3a8a', padding: '10px 6px' }}></td>
                        </tr>
                      ))
                    : items.map((item, idx) => (
                        <tr key={item.id}>
                          <td style={{ border: '1px solid #1e3a8a', padding: '10px 6px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #1e3a8a', padding: '10px 6px', fontFamily: 'monospace', fontSize: '11px' }}>{item.imei || '—'}</td>
                          <td style={{ border: '1px solid #1e3a8a', padding: '10px 6px', fontWeight: 'bold' }}>{item.product}</td>
                          <td style={{ border: '1px solid #1e3a8a', padding: '10px 6px' }}>{item.brand}</td>
                          <td style={{ border: '1px solid #1e3a8a', padding: '10px 6px', textAlign: 'center' }}>{item.qty}</td>
                          <td style={{ border: '1px solid #1e3a8a', padding: '10px 6px', textAlign: 'right' }}>₹{item.price.toLocaleString('en-IN')}</td>
                          <td style={{ border: '1px solid #1e3a8a', padding: '10px 6px', textAlign: 'right' }}>₹{(item.price * item.qty).toLocaleString('en-IN')}</td>
                        </tr>
                      ))
                  }
                  <tr style={{ background: '#1e3a8a', color: '#fff' }}>
                    <td colSpan={5} style={{ border: '1px solid #1e3a8a', padding: '8px 6px' }}></td>
                    <td style={{ border: '1px solid #1e3a8a', padding: '8px 6px', fontWeight: 'bold', textAlign: 'right' }}>Total (₹)</td>
                    <td style={{ border: '1px solid #1e3a8a', padding: '8px 6px', fontWeight: 'bold', textAlign: 'right' }}>₹{grandTotal.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '14px', fontSize: '12px', fontStyle: 'italic', color: '#1e3a8a', fontWeight: 'bold' }}>
                Thank you for your business!
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── RETAIL / FINANCE BILL (single sheet) ── */
  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.6)', overflowY: 'auto' }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', margin: '40px auto', background: 'var(--bg)' }}>
        <div className="modal-header" style={{ background: 'var(--white)' }}>
          <h2 className="modal-title">Retail Invoice</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-success" onClick={() => handleSave(false)} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Bill'}</button>
<button className="btn btn-primary" onClick={() => handleSave(true)} disabled={isSaving}>{isSaving ? 'Saving...' : '🖨️  Save & Print'}</button>
            <button className="btn btn-outline" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="modal-body" style={{ background: 'var(--white)', padding: '24px' }}>
          {/* ─── SINGLE PRINT AREA ─── */}
          <div id="print-area" className="printable-invoice" style={{ border: '2px solid #1e3a8a', padding: '16px', background: '#fff', fontSize: '12px', color: '#000', fontFamily: 'monospace' }}>

            {billType === 'non-gst' ? (
              /* NON-GST Invoice */
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '36px', fontWeight: '900', margin: 0, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'Arial, sans-serif' }}>VAISHNO MOBILE</h1>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>TAX INVOICE</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'right', fontSize: '18px' }}>
                    <strong>ADDRESS:</strong><br/>
                    <span style={{ fontSize: '22px' }}>JALESAR ROAD</span>
                  </div>
                </div>

                <div style={{ border: '2px solid #000', borderRadius: '12px', padding: '16px', marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ lineHeight: '1.6', fontSize: '12px', fontWeight: 'bold' }}>
                      <div style={{ marginBottom: '4px' }}>Invoice to :</div>
                      <div style={{ display: 'flex' }}><span style={{ width: '60px' }}>M/s</span>: <span style={{ borderBottom: '1px solid #000', width: '220px', display: 'inline-block', paddingLeft: '8px' }}>{customer.name || 'Walk-in Customer'}</span></div>
                      <div style={{ display: 'flex' }}><span style={{ width: '60px' }}>Address</span>: <span style={{ borderBottom: '1px solid #000', width: '220px', display: 'inline-block', paddingLeft: '8px' }}>{customer.address || ''}</span></div>
                      <div style={{ display: 'flex' }}><span style={{ width: '60px' }}>Phone</span>: <span style={{ borderBottom: '1px solid #000', width: '220px', display: 'inline-block', paddingLeft: '8px' }}>{customer.mobile || ''}</span></div>
                    </div>
                    <div style={{ lineHeight: '1.6', fontSize: '12px' }}>
                      <div style={{ display: 'flex' }}><span style={{ width: '100px' }}>Date</span>: <span>{new Date().toLocaleDateString('en-IN')}</span></div>
                      <div style={{ display: 'flex' }}><span style={{ width: '100px' }}>Invoice No.</span>: <span>{finalInvoiceNo || 'Pending Save'}</span></div>
                      <div style={{ display: 'flex' }}><span style={{ width: '100px' }}>Reverse charge</span>: <span></span></div>
                    </div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                    <thead>
                      <tr style={{ borderTop: '2px solid #000', borderBottom: '1px solid #000' }}>
                        <th style={{ padding: '8px', textAlign: 'left' }}>Product Name</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Qty</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>RATE</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr><td colSpan="4" style={{ padding: '20px' }}></td></tr>
                      ) : items.map(item => (
                        <tr key={item.id}>
                          <td style={{ padding: '8px 8px 30px 8px', borderBottom: '1px solid #000' }}>{item.product} {item.imei && item.imei !== '—' ? `(IMEI: ${item.imei})` : ''}</td>
                          <td style={{ padding: '8px 8px 30px 8px', textAlign: 'center', borderBottom: '1px solid #000' }}>{item.qty}</td>
                          <td style={{ padding: '8px 8px 30px 8px', textAlign: 'center', borderBottom: '1px solid #000' }}>{item.price.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '8px 8px 30px 8px', textAlign: 'center', borderBottom: '1px solid #000' }}>{(item.price * item.qty).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    {Number(warrantySaleAmount) > 0 && (
                      <div style={{ display: 'flex', gap: '40px', alignItems: 'center', paddingRight: '20px' }}>
                        <strong style={{ fontSize: '13px' }}>Warranty Sale</strong>
                        <span style={{ width: '100px', textAlign: 'center', fontSize: '13px' }}>₹ {Number(warrantySaleAmount).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div style={{ border: '2px solid #000', borderRadius: '8px', padding: '10px 20px', display: 'flex', gap: '40px', alignItems: 'center' }}>
                      <strong style={{ fontSize: '14px' }}>Total Amount</strong>
                      <span style={{ borderBottom: '1px solid #000', width: '100px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>{grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                    {/* Payment info */}
                    <div style={{ fontSize: '12px', color: '#444' }}>
                      <strong>Payment:</strong> {payMode.includes('finance')
                        ? `Finance (Down: ₹${Number(finance.downPayment || 0).toLocaleString('en-IN')} via ${downPaymentModeLabel || '—'})`
                        : payMode.map(m => m.toUpperCase()).join(' + ')}
                    </div>
                  </div>

                  {/* Warranty */}
                  <div style={{ border: '1px solid #000', borderRadius: '6px', padding: '8px', marginBottom: '10px', fontSize: '10px' }}>
                    <strong>WARRANTY OPTIONS: </strong>
                    {warrantyOptions.length > 0 ? warrantyOptions.join(' | ') : 'None Selected'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11px', lineHeight: '1.5' }}>
                    <div>
                      <strong>WARRANTY COVERED AS COMPANY RULES REGULATIONS</strong><br />
                      <strong>For warranty go at care centre not Mobile Sales Centre</strong><br />
                      <strong>E,&amp;O.E.</strong><br />
                      1. Goods once sold will not be taken back.<br />
                      2. All subject to FIROZABAD Jurisdiction
                    </div>
                    <div style={{ textAlign: 'center', fontWeight: 'bold' }}>Customer's Signature</div>
                    <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
                      <div style={{ marginBottom: '15px' }}>For: Vaishno Mobile</div>
                      <div>Auth. Sign</div>
                    </div>
                  </div>
                </div>

                {/* Finance Slip (inline, same sheet) */}
                {payMode.includes('finance') && (
                  <div style={{ marginTop: '20px', borderTop: '2px dashed #000', paddingTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img src="/logo.png" alt="MVM" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>MAA VESHNO MOBILE</div>
                          <div style={{ fontSize: '11px', border: '1px solid #000', padding: '1px 6px', letterSpacing: '2px', display: 'inline-block' }}>FINANCE SLIP</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '11px' }}>
                        <div style={{ fontStyle: 'italic' }}>Rajeev Gupta</div>
                        <div>+91-9837616333</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex' }}><span style={{ width: '120px', fontWeight: 'bold' }}>FINANCE BY:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{financeType === 'company' ? finance.company : finance.privateFinancier}</span></div>
                        {finance.loanId && <div style={{ display: 'flex' }}><span style={{ width: '120px', fontWeight: 'bold' }}>LOAN ID:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{finance.loanId}</span></div>}
                        <div style={{ display: 'flex' }}><span style={{ width: '120px', fontWeight: 'bold' }}>CUSTOMER NAME:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{customer.name || '—'}</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '120px', fontWeight: 'bold' }}>MOBILE NAME:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{items[0]?.product || '—'}</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '120px', fontWeight: 'bold' }}>IMEI NO:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{items[0]?.imei || '—'}</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '120px', fontWeight: 'bold' }}>DOWN PAYMENT:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>₹{Number(finance.downPayment || 0).toLocaleString('en-IN')} ({downPaymentModeLabel || '—'})</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '120px', fontWeight: 'bold' }}>EMI METHOD:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{emiMethodLabel}</span></div>

                        {/* Warranty box */}
                        <div style={{ marginTop: '8px', border: '1px solid #000', padding: '6px', borderRadius: '4px', fontSize: '9px', lineHeight: '1.5' }}>
                          <strong>1. WATER/पानी</strong><br />
                          <strong>2. DAMAGE/टूट फूट</strong><br />
                          {warrantyOptions.map(opt => (
                            <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '2px 0' }}>
                              <div style={{ width: '12px', height: '12px', border: '1px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✓</div>
                              <span>{opt === 'No Guarantee' ? 'NO GUARANTEE / कोई गारंटी नहीं है' : opt === '1 Year Insurance' ? '1 YEAR INSURANCE / गारंटी है' : opt}</span>
                            </div>
                          ))}
                          <div style={{ fontWeight: 'bold', marginTop: '4px' }}>[समय पर ना जमा करने पर 650 रूपये की पेनाल्टी]</div>
                          <div style={{ fontWeight: 'bold' }}>650 RUPEES PENALTY WHEN NOT PAID ON TIME</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex' }}><span style={{ width: '110px', fontWeight: 'bold' }}>BILL DATE:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{new Date().toLocaleDateString('en-IN')}</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '110px', fontWeight: 'bold' }}>BILL NO:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1, fontWeight: 'bold' }}>{finalInvoiceNo || 'Pending Save'}</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '110px', fontWeight: 'bold' }}>EMI:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1, fontWeight: 'bold' }}>₹ {finance.emi || '0'}.00</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '110px', fontWeight: 'bold' }}>TENURE:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{finance.tenure}</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '110px', fontWeight: 'bold' }}>EMI DATE:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{emiDayOnly ? `Every ${emiDayOnly}${emiDayOnly === 1 ? 'st' : emiDayOnly === 2 ? 'nd' : emiDayOnly === 3 ? 'rd' : 'th'} of month` : '—'}</span></div>
                        {financeType === 'private' && (
                          <div style={{ marginTop: '8px', textAlign: 'center' }}>
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${window.location.origin}/track-emi/${customer.mobile}`)}`} alt="QR" style={{ border: '1px solid #000', padding: '2px' }} />
                            <div style={{ fontSize: '9px', marginTop: '2px', fontWeight: 'bold' }}>Scan for EMI Details</div>
                          </div>
                        )}
                        <div style={{ marginTop: '8px', fontSize: '9px', textAlign: 'center', lineHeight: '1.3' }}>
                          <strong>(NO GUARANTEE OF SNATCHING)</strong><br />
                          <strong>(चोरी की कोई गारंटी नहीं है)</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* GST Invoice */
              <>
                {/* Shop Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid #1e3a8a', paddingBottom: '10px' }}>
                  <div>
                    <div style={{ color: '#1e3a8a', fontSize: '10px', fontWeight: 'bold' }}>GSTIN: 09AHPPG6800Q1ZP</div>
                    <h1 style={{ color: '#1e3a8a', fontSize: '24px', fontWeight: 'bold', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src="/logo.png" alt="MVM" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
                      MAA VESHNO MOBILE
                    </h1>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '10px', color: '#1e3a8a', fontWeight: 'bold' }}>
                    <div style={{ fontSize: '13px', border: '1.5px solid #1e3a8a', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '4px' }}>TAX INVOICE</div>
                    <div>MOB: +91-9837616333</div>
                    <div>Email: maaveshnomvm@gmail.com</div>
                    <div style={{ maxWidth: '240px', fontSize: '9px', marginTop: '2px' }}>ADDRESS: NEAR GOPAL SWEET HOUSE JALESAR ROAD FIROZABAD</div>
                  </div>
                </div>

                {/* Customer & Invoice */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginTop: '12px', borderBottom: '1px solid #ddd', paddingBottom: '12px' }}>
                  <div style={{ borderRight: '1px solid #ddd', paddingRight: '12px' }}>
                    <div style={{ background: '#1e3a8a', color: '#fff', padding: '2px 6px', fontWeight: 'bold', display: 'inline-block', marginBottom: '6px' }}>Invoice to :</div>
                    <div style={{ paddingLeft: '4px' }}>
                      <div style={{ display: 'flex', margin: '4px 0' }}><span style={{ width: '80px', fontWeight: 'bold' }}>M/s :</span> <span style={{ borderBottom: '1px solid #000', flex: 1 }}>{customer.name || 'Walk-in Customer'}</span></div>
                      <div style={{ display: 'flex', margin: '4px 0' }}><span style={{ width: '80px', fontWeight: 'bold' }}>Address :</span> <span style={{ borderBottom: '1px solid #000', flex: 1 }}>{customer.address || ''}</span></div>
                      <div style={{ display: 'flex', margin: '4px 0' }}><span style={{ width: '80px', fontWeight: 'bold' }}>Phone :</span> <span style={{ borderBottom: '1px solid #000', flex: 1 }}>{customer.mobile || '—'}</span></div>
                      <div style={{ display: 'flex', margin: '4px 0' }}><span style={{ width: '80px', fontWeight: 'bold' }}>PARTY GST:</span> <span style={{ borderBottom: '1px solid #000', flex: 1 }}>{customer.partyGst || 'N/A'}</span></div>
                    </div>
                  </div>
                  <div>
                    <div style={{ paddingLeft: '4px', marginTop: '16px' }}>
                      <div style={{ display: 'flex', margin: '4px 0' }}><span style={{ width: '100px', fontWeight: 'bold' }}>Date :</span> <span style={{ borderBottom: '1px solid #000', flex: 1 }}>{new Date().toLocaleDateString('en-IN')}</span></div>
                      <div style={{ display: 'flex', margin: '4px 0' }}><span style={{ width: '100px', fontWeight: 'bold' }}>Invoice No. :</span> <span style={{ borderBottom: '1px solid #000', flex: 1 }}>{finalInvoiceNo || 'Pending Save'}</span></div>
                      <div style={{ display: 'flex', margin: '4px 0' }}><span style={{ width: '100px', fontWeight: 'bold' }}>Reverse charge:</span> <span style={{ borderBottom: '1px solid #000', flex: 1 }}>No</span></div>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', border: '1px solid #ddd' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #1e3a8a' }}>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', width: '50px' }}>S. No.</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'left' }}>Product Name</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', width: '90px' }}>HSN CODE</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', width: '90px' }}>RATE OF GST</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center', width: '50px' }}>Qty</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', width: '90px' }}>RATE</th>
                      <th style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right', width: '100px' }}>AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '12px', color: '#666' }}>No products added</td></tr>
                    ) : items.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid #ddd', padding: '6px' }}>
                          <div><strong>{item.product}</strong></div>
                          {item.imei && item.imei !== '—' && <div style={{ fontSize: '10px', color: '#555', marginTop: '2px' }}>IMEI: {item.imei}</div>}
                        </td>
                        <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>8517</td>
                        <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>18%</td>
                        <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'center' }}>{item.qty}</td>
                        <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right' }}>{item.price.toLocaleString('en-IN')}.00</td>
                        <td style={{ border: '1px solid #ddd', padding: '6px', textAlign: 'right' }}>{(item.price * item.qty).toLocaleString('en-IN')}.00</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals + Terms */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '16px' }}>
                  <div style={{ border: '1px solid #1e3a8a', padding: '10px', borderRadius: '4px' }}>
                    <div style={{ background: '#1e3a8a', color: '#fff', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', display: 'inline-block', marginBottom: '6px' }}>WARRANTY COVERED AS COMPANY RULES REGULATIONS</div>
                    <div style={{ fontSize: '9px', lineHeight: '1.4' }}>
                      For warranty go at care centre not Mobile Sales Centre<br />
                      E,&amp;O.E.<br />
                      1. Goods once sold will not be taken back.<br />
                      2. All subject to FIROZABAD Jurisdiction.
                    </div>
                    {/* Warranty selected options */}
                    {warrantyOptions.length > 0 && (
                      <div style={{ marginTop: '6px', fontSize: '9px', fontWeight: 'bold', color: '#1e3a8a' }}>
                        Warranty: {warrantyOptions.join(', ')}
                      </div>
                    )}
                    {/* Payment info */}
                    <div style={{ marginTop: '6px', fontSize: '9px' }}>
                      <strong>Payment Mode:</strong> {payMode.includes('finance')
                        ? `Finance — Down: ₹${Number(finance.downPayment || 0).toLocaleString('en-IN')} (${downPaymentModeLabel || '—'})`
                        : payMode.map(m => m.toUpperCase()).join(' + ')}
                    </div>
                    {payMode.includes('finance') && (
                      <div style={{ fontSize: '9px' }}>
                        <strong>EMI Collection:</strong> {emiMethodLabel}
                      </div>
                    )}
                  </div>
                  <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '4px', textAlign: 'left' }}>Discount</td>
                          <td style={{ padding: '4px', textAlign: 'right', borderBottom: '1px solid #ddd', width: '120px' }}>₹ {discountAmt.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px', textAlign: 'left' }}>Taxable value</td>
                          <td style={{ padding: '4px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>{taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px', textAlign: 'left' }}>SGST 9% @</td>
                          <td style={{ padding: '4px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>{sgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '4px', textAlign: 'left' }}>CGST 9% @</td>
                          <td style={{ padding: '4px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>{cgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                        {Number(warrantySaleAmount) > 0 && (
                          <tr>
                            <td style={{ padding: '4px', textAlign: 'left' }}>Warranty Sale</td>
                            <td style={{ padding: '4px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>₹ {Number(warrantySaleAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        )}
                        <tr style={{ background: '#1e3a8a', color: '#fff', fontWeight: 'bold' }}>
                          <td style={{ padding: '6px', textAlign: 'left' }}>Total Amount</td>
                          <td style={{ padding: '6px', textAlign: 'right' }}>₹ {grandTotal.toLocaleString('en-IN')}.00</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', padding: '0 10px' }}>
                  <div style={{ textAlign: 'center', width: '150px', borderTop: '1px solid #000', paddingTop: '4px', fontSize: '10px' }}>Customer's Signature</div>
                  <div style={{ textAlign: 'center', width: '220px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '24px' }}>For: Maa Veshno Mobile</div>
                    <div style={{ borderTop: '1px solid #000', paddingTop: '4px', fontSize: '10px' }}>Auth. Sign</div>
                  </div>
                </div>

                {/* Finance slip inline for GST bill */}
                {payMode.includes('finance') && (
                  <div style={{ marginTop: '20px', borderTop: '2px dashed #000', paddingTop: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <img src="/logo.png" alt="MVM" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>MAA VESHNO MOBILE</div>
                          <div style={{ fontSize: '11px', border: '1px solid #000', padding: '1px 6px', letterSpacing: '2px', display: 'inline-block' }}>FINANCE SLIP</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '11px' }}>
                        <div style={{ fontStyle: 'italic' }}>Rajeev Gupta</div>
                        <div>+91-9837616333</div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex' }}><span style={{ width: '120px', fontWeight: 'bold' }}>FINANCE BY:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{financeType === 'company' ? finance.company : finance.privateFinancier}</span></div>
                        {finance.loanId && <div style={{ display: 'flex' }}><span style={{ width: '120px', fontWeight: 'bold' }}>LOAN ID:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{finance.loanId}</span></div>}
                        <div style={{ display: 'flex' }}><span style={{ width: '120px', fontWeight: 'bold' }}>CUSTOMER NAME:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{customer.name || '—'}</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '120px', fontWeight: 'bold' }}>MOBILE NAME:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{items[0]?.product || '—'}</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '120px', fontWeight: 'bold' }}>IMEI NO:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{items[0]?.imei || '—'}</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '120px', fontWeight: 'bold' }}>DOWN PAYMENT:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>₹{Number(finance.downPayment || 0).toLocaleString('en-IN')} ({downPaymentModeLabel || '—'})</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '120px', fontWeight: 'bold' }}>EMI METHOD:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{emiMethodLabel}</span></div>

                        <div style={{ marginTop: '8px', border: '1px solid #000', padding: '6px', borderRadius: '4px', fontSize: '9px', lineHeight: '1.5' }}>
                          <strong>1. WATER/पानी</strong><br />
                          <strong>2. DAMAGE/टूट फूट</strong><br />
                          {warrantyOptions.map(opt => (
                            <div key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '2px 0' }}>
                              <div style={{ width: '12px', height: '12px', border: '1px solid #000', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>✓</div>
                              <span>{opt === 'No Guarantee' ? 'NO GUARANTEE / कोई गारंटी नहीं है' : opt === '1 Year Insurance' ? '1 YEAR INSURANCE / गारंटी है' : opt}</span>
                            </div>
                          ))}
                          <div style={{ fontWeight: 'bold', marginTop: '4px' }}>[समय पर ना जमा करने पर 650 रूपये की पेनाल्टी]</div>
                          <div style={{ fontWeight: 'bold' }}>650 RUPEES PENALTY WHEN NOT PAID ON TIME</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex' }}><span style={{ width: '110px', fontWeight: 'bold' }}>BILL DATE:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{new Date().toLocaleDateString('en-IN')}</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '110px', fontWeight: 'bold' }}>BILL NO:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1, fontWeight: 'bold' }}>{finalInvoiceNo || 'Pending Save'}</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '110px', fontWeight: 'bold' }}>EMI:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1, fontWeight: 'bold' }}>₹ {finance.emi || '0'}.00</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '110px', fontWeight: 'bold' }}>TENURE:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{finance.tenure}</span></div>
                        <div style={{ display: 'flex' }}><span style={{ width: '110px', fontWeight: 'bold' }}>EMI DATE:</span> <span style={{ borderBottom: '1.5px solid #000', flex: 1 }}>{emiDayOnly ? `Every ${emiDayOnly}${emiDayOnly === 1 ? 'st' : emiDayOnly === 2 ? 'nd' : emiDayOnly === 3 ? 'rd' : 'th'} of month` : '—'}</span></div>
                        {financeType === 'private' && (
                          <div style={{ marginTop: '8px', textAlign: 'center' }}>
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`${window.location.origin}/track-emi/${customer.mobile}`)}`} alt="QR" style={{ border: '1px solid #000', padding: '2px' }} />
                            <div style={{ fontSize: '9px', marginTop: '2px', fontWeight: 'bold' }}>Scan for EMI Details</div>
                          </div>
                        )}
                        <div style={{ marginTop: '8px', fontSize: '9px', textAlign: 'center', lineHeight: '1.3' }}>
                          <strong>(NO GUARANTEE OF SNATCHING)</strong><br />
                          <strong>(चोरी की कोई गारंटी नहीं है)</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Customer Billing Page ── */
const CustomerBilling = () => {
  const [billType, setBillType] = useState('gst')
  const [customerType, setCustomerType] = useState('retail')
  const [payMode, setPayMode] = useState(['finance'])
  const [downPaymentMode, setDownPaymentMode] = useState([]) // cash/upi for down payment
  const [showSelectModal, setShowSelectModal] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const [financeType, setFinanceType] = useState('company')
  
  const [customer, setCustomer] = useState({ name: '', mobile: '', address: '', description: '', partyGst: '', delayPaymentExpected: false,
    amountPaidNow: '',
    promisedDays: '' })
  const [warrantySaleAmount, setWarrantySaleAmount] = useState('')
  const [warrantyOptions, setWarrantyOptions] = useState([]) // selected warranty
  const [customWarrantyInput, setCustomWarrantyInput] = useState('') // new warranty input
  const [warrantyList, setWarrantyList] = useState([...DEFAULT_WARRANTY_OPTIONS])

  const [finance, setFinance] = useState({
    company: 'HDB Financial Services',
    loanId: '',
    downPayment: '',
    emiPayDate: '',
    emi: '',
    tenure: '6 Months',
    approvalNo: '',
    privateFinancier: '',
    fileCardName: '',
    fileNo: '',
    emiPaymentMethod: 'shop'
  })
  const [items, setItems] = useState([])
  const [agents, setAgents] = useState([])
  
  const [customDiscount, setCustomDiscount] = useState('')
  const [customGstPercent, setCustomGstPercent] = useState('')
  const [customGrandTotal, setCustomGrandTotal] = useState('')
  const [editingSaleId, setEditingSaleId] = useState(null)
  const [existingInvoiceNo, setExistingInvoiceNo] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (editId) {
      setEditingSaleId(editId);
      api.get(`/sales/${editId}`).then(res => {
        if (res.data?.success) {
          const sale = res.data.data;
          setExistingInvoiceNo(sale.invoiceNumber);
          setCustomerType(sale.saleType);
          setPayMode([sale.paymentMode]);
          setCustomer({
            name: sale.customerName,
            mobile: sale.phone,
            address: sale.address || '',
            partyGst: sale.partyGst || '',
            delayPaymentExpected: sale.delayPaymentExpected || false
          });
          setWarrantySaleAmount(sale.warrantySaleAmount || '');
          if (sale.financeDetails) {
            setFinance({
              company: sale.financeDetails.company || '',
              loanId: sale.financeDetails.loanId || '',
              downPayment: sale.financeDetails.dpAmount || '',
              emiPayDate: sale.financeDetails.emiPayDate || '',
              emi: sale.financeDetails.emiAmount || '',
              tenure: sale.financeDetails.tenure || '',
              privateFinancier: sale.financeDetails.company || '',
              fileNo: sale.financeDetails.fileNo || '',
              emiPaymentMethod: sale.financeDetails.emiPaymentMethod || 'shop'
            });
            setFinanceType(sale.financeDetails.loanId ? 'company' : 'private');
          }
          setItems(sale.items.map(i => ({
            productId: i.productId,
            product: i.productName,
            imei: i.imei,
            qty: i.qty,
            price: i.price,
            total: i.total
          })));
          setCustomDiscount(sale.totalDiscount || '');
          setCustomGrandTotal(sale.grandTotal || '');
        }
      }).catch(err => alert("Failed to load bill for editing: " + err.message));
    }
  }, []);

  useEffect(() => {
    if (financeType === 'private' && !finance.fileNo) {
      const generatedFileNo = 'FILE-' + Math.floor(Math.random() * 89999 + 10000);
      setFinance(prev => ({ ...prev, fileNo: generatedFileNo }));
    }
  }, [financeType, finance.fileNo]);

  useEffect(() => {
    api.get('/auth/agents')
      .then(res => setAgents(res.data.data || []))
      .catch(err => console.error('Failed to fetch agents', err))
  }, [])

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty - i.discount, 0)
  const discountAmt = customDiscount !== '' ? Number(customDiscount) : 0
  
  const gstPercent = customGstPercent !== '' ? Number(customGstPercent) : 18
  const gstAmt = billType === 'gst' ? (subtotal - discountAmt) * (gstPercent / 100) : 0
  
  const calculatedGrandTotal = (subtotal - discountAmt) + gstAmt + (Number(warrantySaleAmount) || 0)
  const grandTotal = customGrandTotal !== '' ? Number(customGrandTotal) : calculatedGrandTotal

  // Auto-calculate EMI
  useEffect(() => {
    if (payMode.includes('finance')) {
      const dp = Number(finance.downPayment) || 0;
      const monthsMatch = String(finance.tenure).match(/\d+/);
      const months = monthsMatch ? Number(monthsMatch[0]) : 6;
      
      const principal = grandTotal - dp;
      let calculatedEmi = '';
      if (principal > 0 && months > 0) {
        calculatedEmi = String(Math.round(principal / months));
      } else if (principal <= 0) {
        calculatedEmi = '0';
      }
      
      if (finance.emi !== calculatedEmi) {
        setFinance(prev => ({ ...prev, emi: calculatedEmi }));
      }
    }
  }, [finance.downPayment, finance.tenure, grandTotal, payMode, finance.emi]);

  const handleSelectProduct = (product) => {
    const newItem = {
      id: Date.now(),
      productId: product._id,
      product: product.productName,
      brand: product.brand,
      imei: product.imeiNumber || 'N/A',
      qty: 1,
      price: product.salePrice,
      discount: 0
    }
    setItems(current => [...current, newItem])
    setShowSelectModal(false)
  }

  const handleCustomerChange = (e) => setCustomer({ ...customer, [e.target.name]: e.target.value })
  const handleFinanceChange = (e) => setFinance({ ...finance, [e.target.name]: e.target.value })

  const handleWarrantyToggle = (option) => {
    setWarrantyOptions(prev => 
      prev.includes(option) ? prev.filter(w => w !== option) : [...prev, option]
    );
  }

  const handleAddCustomWarranty = () => {
    const trimmed = customWarrantyInput.trim();
    if (!trimmed) return;
    if (!warrantyList.includes(trimmed)) {
      setWarrantyList(prev => [...prev, trimmed]);
    }
    setWarrantyOptions(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
    setCustomWarrantyInput('');
  }

  const handleDownPaymentModeToggle = (mode) => {
    setDownPaymentMode(prev =>
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  }

  /* ─── RENDER ─── */
  return (
    <div>
      {showSelectModal && <SelectProductModal onClose={() => setShowSelectModal(false)} onSelect={handleSelectProduct} />}
      {showPrintModal && (
        <PrintPreviewModal
          editingSaleId={editingSaleId}
          existingInvoiceNo={existingInvoiceNo}
          customer={customer}
          customerType={customerType}
          finance={finance}
          payMode={payMode}
          downPaymentMode={downPaymentMode}
          financeType={financeType}
          items={items}
          billType={billType}
          subtotal={subtotal}
          discountAmt={discountAmt}
          gstAmt={gstAmt}
          grandTotal={grandTotal}
          warrantySaleAmount={warrantySaleAmount}
          warrantyOptions={warrantyOptions}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{editingSaleId ? 'Edit' : 'New'} {customerType === 'wholesale' ? 'Wholesale' : 'Retail'} Bill</h1>
          <p className="page-subtitle">{editingSaleId ? 'Update existing invoice details' : 'Create a new invoice and print receipt'}</p>
        </div>
      </div>

      <div className="form-layout-grid">
        {/* Left Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Choose Bill Type */}
          <div className="card">
            <div className="card-body">
              <div className="section-title">1. Choose Bill Type</div>
              <div className="toggle-btn-grid">
                {['gst', 'non-gst'].map(type => (
                  <button key={type} onClick={() => setBillType(type)}
                    disabled={customerType === 'wholesale'}
                    style={{ padding: '14px', border: `2px solid ${billType === type ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', background: billType === type ? 'var(--primary-light)' : 'var(--white)', color: billType === type ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: customerType === 'wholesale' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between', opacity: customerType === 'wholesale' ? 0.6 : 1 }}>
                    {type === 'gst' ? 'GST Bill' : 'Non GST Bill'}
                    {billType === type && <span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Type */}
          <div className="card">
            <div className="card-body">
              <div className="section-title">2. Customer Type</div>
              <div className="toggle-btn-grid">
                {['retail', 'wholesale'].map(type => (
                  <button key={type} onClick={() => {
                    setCustomerType(type);
                    if (type === 'wholesale') setBillType('non-gst');
                  }}
                    style={{ padding: '14px', border: `2px solid ${customerType === type ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', background: customerType === type ? 'var(--primary-light)' : 'var(--white)', color: customerType === type ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                    {type === 'retail' ? '👤 Retail' : '🏪 Wholesale'}
                    {customerType === type && <span style={{ color: 'var(--primary)', fontWeight: 700 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="card">
            <div className="card-body">
              <div className="section-title">3. Customer Details</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Customer Name <span className="required">*</span></label>
                  <input className="form-input" name="name" value={customer.name} onChange={handleCustomerChange} placeholder="Enter customer name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number <span className="required">*</span></label>
                  <input className="form-input" name="mobile" value={customer.mobile} onChange={handleCustomerChange} placeholder="Enter mobile number" />
                </div>
                {/* Address — always show for all types */}
                <div className="form-group form-grid-full" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Address</label>
                  <input className="form-input" name="address" value={customer.address || ''} onChange={handleCustomerChange} placeholder="Enter customer / shop address" />
                </div>
                <div className="form-group form-grid-full" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description (Optional)</label>
                  <input className="form-input" name="description" value={customer.description} onChange={handleCustomerChange} placeholder="Enter any extra details or description" />
                </div>
                {billType === 'gst' && (
                  <div className="form-group form-grid-full" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Party GSTIN (Optional)</label>
                    <input className="form-input" name="partyGst" value={customer.partyGst || ''} onChange={handleCustomerChange} placeholder="Enter 15-digit GST Number" />
                  </div>
                )}
                
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">4. Products</span>
              <button className="btn btn-outline btn-sm" onClick={() => setShowSelectModal(true)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Product
              </button>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>IMEI / Serial No.</th>
                      <th>Qty</th>
                      <th>Price (₹)</th>
                      <th>Discount (₹)</th>
                      <th>Total (₹)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                          No products added yet. Click "+ Add Product" to search and add.
                        </td>
                      </tr>
                    ) : items.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.product}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.brand}</div>
                        </td>
                        <td>
                          <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>{item.imei}</div>
                        </td>
                        <td>{item.qty}</td>
                        <td>{item.price.toLocaleString('en-IN')}</td>
                        <td>{item.discount}</td>
                        <td style={{ fontWeight: 600 }}>{((item.price * item.qty) - item.discount).toLocaleString('en-IN')}</td>
                        <td>
                          <button className="action-btn danger" onClick={() => setItems(items.filter(i => i.id !== item.id))}>🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Items: {items.length}</span>
                <span>Sub Total (₹): <strong style={{ color: 'var(--primary)', fontSize: '16px' }}>{subtotal.toLocaleString('en-IN')}.00</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Payment Mode */}
          <div className="card">
            <div className="card-body">
              <div className="section-title">5. Finance Slip</div>
              <div className="toggle-btn-grid" style={{ marginBottom: '16px' }}>
                {['cash', 'card', 'upi', 'finance'].map(mode => (
                  <button key={mode} onClick={() => {
                    if (payMode.includes(mode)) {
                      // Don't allow deselecting if it's the only one
                      if (payMode.length > 1) {
                        setPayMode(payMode.filter(m => m !== mode));
                      }
                    } else {
                      setPayMode([...payMode, mode]);
                    }
                  }}
                    style={{ padding: '10px', border: `2px solid ${payMode.includes(mode) ? 'var(--orange)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', background: payMode.includes(mode) ? 'var(--orange-light)' : 'var(--white)', color: payMode.includes(mode) ? 'var(--orange)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '12px', textTransform: 'capitalize' }}>
                    {mode === 'cash' ? '💵' : mode === 'card' ? '💳' : mode === 'upi' ? '📱' : '🏦'} {mode.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Finance type selector */}
              {payMode.includes('finance') && (
                <>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                    <button type="button" onClick={() => setFinanceType('company')}
                      style={{ flex: 1, padding: '10px', border: `1.5px solid ${financeType === 'company' ? 'var(--orange)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', background: financeType === 'company' ? 'var(--orange-light)' : 'var(--white)', color: financeType === 'company' ? 'var(--orange)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      🏦 Company
                    </button>
                    <button type="button" onClick={() => setFinanceType('private')}
                      style={{ flex: 1, padding: '10px', border: `1.5px solid ${financeType === 'private' ? 'var(--orange)' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', background: financeType === 'private' ? 'var(--orange-light)' : 'var(--white)', color: financeType === 'private' ? 'var(--orange)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      👤 Private
                    </button>
                  </div>

                  {/* Down Payment Method (Cash/UPI/Card) for Finance */}
                  <div className="form-group form-grid-full" style={{ marginBottom: '12px' }}>
                    <label className="form-label">Down Payment Received Via</label>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {['cash', 'upi', 'card'].map(m => (
                        <label key={m} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', cursor: 'pointer', fontWeight: downPaymentMode.includes(m) ? 700 : 400 }}>
                          <input type="checkbox" checked={downPaymentMode.includes(m)} onChange={() => handleDownPaymentModeToggle(m)} />
                          {m === 'cash' ? '💵 Cash' : m === 'upi' ? '📱 UPI' : '💳 Card'}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Company Finance fields */}
              {payMode.includes('finance') && financeType === 'company' && (
                <div className="form-grid" style={{ gap: '10px' }}>
                  <div className="form-group form-grid-full">
                    <label className="form-label">Finance Company <span className="required">*</span></label>
                    <select className="form-select" name="company" value={finance.company} onChange={handleFinanceChange}>
                      <option>HDB Financial Services</option>
                      <option>Bajaj Finserv</option>
                      <option>TVS Credit</option>
                      <option>Samsung Finance+</option>
                      <option>TechNova Solutions Pvt. Ltd.</option>
                      <option>Galaxy Retailers Pvt. Ltd.</option>
                      <option>SmartHub Enterprises</option>
                      <option>Future Vision Pvt. Ltd.</option>
                      <option>Digital World Solutions</option>
                    </select>
                  </div>
                  <div className="form-group form-grid-full">
                    <label className="form-label">Loan ID (Optional)</label>
                    <input className="form-input" name="loanId" value={finance.loanId} onChange={handleFinanceChange} placeholder="Enter Loan ID" />
                  </div>
                  <div className="form-group form-grid-full" style={{ marginBottom: '8px' }}>
                    <label className="form-label">EMI Payment Method</label>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="radio" name="emiPaymentMethod" value="shop" checked={finance.emiPaymentMethod === 'shop'} onChange={handleFinanceChange} />
                        Will come to shop
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="radio" name="emiPaymentMethod" value="bank" checked={finance.emiPaymentMethod === 'bank'} onChange={handleFinanceChange} />
                        Auto bank deduction
                      </label>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Down Payment (₹)</label>
                    <input className="form-input" name="downPayment" value={finance.downPayment} onChange={handleFinanceChange} placeholder="Enter down payment" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tenure (Months)</label>
                    <input className="form-input" list="tenure-options" name="tenure" value={finance.tenure} onChange={handleFinanceChange} placeholder="e.g. 5 Months" />
                    <datalist id="tenure-options">
                      <option value="3 Months" /><option value="6 Months" /><option value="9 Months" /><option value="12 Months" />
                    </datalist>
                  </div>
                  <div className="form-group">
                    <label className="form-label">EMI Pay Date</label>
                    <input type="date" className="form-input" name="emiPayDate" value={finance.emiPayDate} onChange={handleFinanceChange} />
                    {finance.emiPayDate && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Will show as: Every {new Date(finance.emiPayDate).getDate()} of the month
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">EMI (₹)</label>
                    <input className="form-input" name="emi" value={finance.emi} onChange={handleFinanceChange} placeholder="Auto-calculated" />
                  </div>
                </div>
              )}

              {/* Private Finance fields */}
              {payMode.includes('finance') && financeType === 'private' && (
                <div className="form-grid" style={{ gap: '10px' }}>
                  <div className="form-group form-grid-full">
                    <label className="form-label">Private Financier <span className="required">*</span></label>
                    <input className="form-input" list="agent-options" name="privateFinancier" value={finance.privateFinancier || ''} onChange={handleFinanceChange} placeholder="Select or type new agent name..." />
                    <datalist id="agent-options">
                      {agents.map(a => <option key={a._id} value={a.name} />)}
                      <option value="Self Finance" />
                    </datalist>
                  </div>
                  <div className="form-group form-grid-full">
                    <label className="form-label">File No. (Optional)</label>
                    <input className="form-input" name="fileNo" value={finance.fileNo} onChange={handleFinanceChange} placeholder="Enter File Number" />
                  </div>
                  <div className="form-group form-grid-full" style={{ marginBottom: '8px' }}>
                    <label className="form-label">EMI Payment Method</label>
                    <div style={{ display: 'flex', gap: '20px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="radio" name="emiPaymentMethod" value="shop" checked={finance.emiPaymentMethod === 'shop'} onChange={handleFinanceChange} />
                        Will come to shop
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                        <input type="radio" name="emiPaymentMethod" value="bank" checked={finance.emiPaymentMethod === 'bank'} onChange={handleFinanceChange} />
                        Auto bank deduction
                      </label>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Down Payment (₹)</label>
                    <input className="form-input" name="downPayment" value={finance.downPayment} onChange={handleFinanceChange} placeholder="Enter down payment" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tenure (Months)</label>
                    <input className="form-input" list="tenure-options" name="tenure" value={finance.tenure} onChange={handleFinanceChange} placeholder="e.g. 5 Months" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">EMI Pay Date</label>
                    <input type="date" className="form-input" name="emiPayDate" value={finance.emiPayDate} onChange={handleFinanceChange} />
                    {finance.emiPayDate && (
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Will show as: Every {new Date(finance.emiPayDate).getDate()} of the month
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">EMI (₹)</label>
                    <input className="form-input" name="emi" value={finance.emi} onChange={handleFinanceChange} placeholder="Auto-calculated" />
                  </div>
                </div>
              )}

              {/* Late EMI Collection Logic */}
              {payMode.includes('finance') && (
                <div style={{ marginTop: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '4px', color: '#92400e' }}>⏰ Late EMI Collection Note</div>
                  <div style={{ color: '#78350f', fontSize: '12px', lineHeight: '1.5' }}>
                    If a customer pays EMI after 2–3+ months, the collected amount in the Finance &gt; EMI Tracker section will show the correct outstanding. The tracker records actual payment date and marks month-by-month status so you can see exactly which months were skipped and when each was cleared.
                  </div>
                </div>
              )}

              {/* Warranty Options — shown for ALL payment types */}
              <div className="form-group form-grid-full" style={{ marginTop: '16px' }}>
                <label className="form-label">Warranty Options</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '6px' }}>
                  {warrantyList.map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                      <input type="checkbox" checked={warrantyOptions.includes(opt)} onChange={() => handleWarrantyToggle(opt)} />
                      {opt}
                    </label>
                  ))}
                </div>
                {/* Add custom warranty */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <input
                    className="form-input"
                    placeholder="Add custom warranty option..."
                    value={customWarrantyInput}
                    onChange={e => setCustomWarrantyInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddCustomWarranty()}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-outline btn-sm" onClick={handleAddCustomWarranty} type="button">+ Add</button>
                </div>
              </div>
            </div>
          </div>

          {/* Bill Summary */}
          <div className="card">
            <div className="card-body">
              <div className="section-title">6. Bill Summary</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Sub Total</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Discount</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>₹</span>
                    <input type="number" style={{ width: '80px', textAlign: 'right', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px' }} placeholder="0" value={customDiscount} onChange={e => setCustomDiscount(e.target.value)} />
                  </div>
                </div>
                {billType === 'gst' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>GST (18%)</span>
                    <span>₹{gstAmt.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '15px', paddingTop: '10px', borderTop: '2px solid var(--border)', alignItems: 'center' }}>
                  <span>Grand Total</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)' }}>
                    <span>₹</span>
                    <input type="number" style={{ width: '100px', textAlign: 'right', border: '1px solid var(--primary)', borderRadius: '4px', padding: '2px 4px', fontWeight: 700, color: 'var(--primary)', outline: 'none' }} placeholder={calculatedGrandTotal.toFixed(2)} value={customGrandTotal} onChange={e => setCustomGrandTotal(e.target.value)} />
                  </div>
                </div>
                {payMode.includes('cash') && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '10px', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Amount Paid Now</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>₹</span>
                        <input type="number" style={{ width: '100px', textAlign: 'right', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px' }} placeholder={grandTotal.toString()} value={customer.amountPaidNow} onChange={e => {
                          setCustomer({...customer, amountPaidNow: e.target.value});
                        }} />
                      </div>
                    </div>
                    {(customer.amountPaidNow !== '' && Number(customer.amountPaidNow) < grandTotal) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', paddingTop: '10px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Promised in (Days)</span>
                        <input type="number" style={{ width: '100px', textAlign: 'right', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px 4px' }} placeholder="e.g. 2, 7" value={customer.promisedDays} onChange={e => setCustomer({...customer, promisedDays: e.target.value})} />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button className="btn btn-outline" style={{ justifyContent: 'center' }} onClick={() => setShowPrintModal(true)}>📄 Generate Bill</button>
            <button className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setShowPrintModal(true)}>🖨 Print Bill</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerBilling