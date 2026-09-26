import React, { useEffect, useState } from 'react'
import api from '../../services/api'

const ViewBillModal = ({ saleId, invoiceNumber, onClose }) => {
  const [bill, setBill] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get(saleId ? `/sales/${saleId}` : `/sales/invoice/${invoiceNumber}`)
      .then(res => {
        if (res.data?.success) {
          setBill(res.data.data)
        } else {
          setError('Failed to load bill data.')
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || err.message || 'Error loading bill.')
      })
      .finally(() => setLoading(false))
  }, [saleId, invoiceNumber])

  if (loading) return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading Bill...</p>
        <button className="btn btn-outline" onClick={onClose} style={{ marginTop: '10px' }}>Cancel</button>
      </div>
    </div>
  )

  if (error || !bill) return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ padding: '40px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger)' }}>Error</h3>
        <p>{error}</p>
        <button className="btn btn-outline" onClick={onClose} style={{ marginTop: '10px' }}>Close</button>
      </div>
    </div>
  )

  const isWholesale = bill.saleType === 'wholesale'
  const editUrl = isWholesale ? `/billing/buyer?edit=${bill._id}` : `/billing/customer?edit=${bill._id}`

  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.6)', overflowY: 'auto' }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', margin: '40px auto', background: 'var(--bg)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div className="modal-header" style={{ background: 'var(--white)', flexShrink: 0 }}>
          <h2 className="modal-title">View Invoice - #{bill.invoiceNumber}</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-warning" onClick={() => window.location.href = editUrl}>Edit Bill</button>
            {bill.status !== 'cancelled' && (
              <button className="btn btn-danger" onClick={() => {
                if (window.confirm('Are you sure you want to cancel this bill?')) {
                  api.patch(`/sales/${bill._id}/cancel`).then(res => {
                    alert('Bill Cancelled')
                    onClose()
                  }).catch(e => alert(e.response?.data?.message || 'Failed to cancel'))
                }
              }}>Cancel Bill</button>
            )}
            <button className="btn btn-primary" onClick={() => window.print()}>🖨️ Print</button>
            <button className="btn btn-outline" onClick={onClose}>Close</button>
          </div>
        </div>

        <div className="modal-body" style={{ background: 'var(--white)', padding: '24px', flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {bill.billImageUrl ? (
            <div style={{ textAlign: 'center' }}>
              <img src={bill.billImageUrl} alt={`Bill #${bill.invoiceNumber}`} style={{ maxWidth: '100%', border: '1px solid var(--border)', borderRadius: '4px' }} />
            </div>
          ) : (
            <div id="print-area" className="printable-invoice" style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#000', background: '#fff', padding: '20px', border: '2px solid #1e3a8a', borderRadius: '8px' }}>
              
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'inline-block', background: '#1e3a8a', color: '#fff', fontWeight: 'bold', fontSize: '13px', padding: '4px 20px', borderRadius: '4px', marginBottom: '10px' }}>
                  {isWholesale ? 'WHOLESALE INVOICE' : 'RETAIL INVOICE'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src="/logo.png" alt="MVM" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '22px', fontWeight: '900', color: '#1e3a8a' }}>MAA VESHNO MOBILE</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Near Bus Stand, City Center</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px' }}>
                    <div><strong>Invoice No.:</strong> #{bill.invoiceNumber}</div>
                    <div><strong>Date:</strong> {new Date(bill.createdAt).toLocaleDateString('en-IN')}</div>
                    {bill.status === 'cancelled' && <div style={{ color: 'red', fontWeight: 'bold', marginTop: '4px', fontSize: '14px' }}>CANCELLED</div>}
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #1e3a8a', borderBottom: '2px solid #1e3a8a', padding: '10px 0', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Billed To:</div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{bill.customerName}</div>
                  <div>Phone: {bill.phone}</div>
                </div>
                {isWholesale && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', color: '#1e3a8a', marginBottom: '4px' }}>Wholesale Details:</div>
                    <div>GST No.: {bill.partyGst || 'N/A'}</div>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                <thead>
                  <tr style={{ background: '#1e3a8a', color: '#fff', fontSize: '11px' }}>
                    <th style={{ padding: '6px', textAlign: 'left' }}>S.No</th>
                    <th style={{ padding: '6px', textAlign: 'left' }}>Product Description</th>
                    <th style={{ padding: '6px', textAlign: 'left' }}>IMEI/Serial</th>
                    <th style={{ padding: '6px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>Rate (₹)</th>
                    <th style={{ padding: '6px', textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {bill.items?.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '6px' }}>{idx + 1}</td>
                      <td style={{ padding: '6px' }}>{item.productName}</td>
                      <td style={{ padding: '6px', fontFamily: 'monospace' }}>{item.imei || '-'}</td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>{item.qty}</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>{item.price.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '6px', textAlign: 'right' }}>{item.total.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: '250px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>Subtotal:</span>
                    <span>₹{bill.subTotal?.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>Discount:</span>
                    <span>-₹{bill.totalDiscount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>Tax/GST ({bill.gstPercent || 18}%):</span>
                    <span>₹{bill.totalTax?.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '2px solid #1e3a8a', borderBottom: '2px solid #1e3a8a', fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>
                    <span>Grand Total:</span>
                    <span>₹{bill.grandTotal?.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              <div style={{ marginTop: '20px', border: '1px dashed #ccc', padding: '10px', borderRadius: '4px', background: '#f9fafb' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#1e3a8a' }}>Payment Status</div>
                    <div>Mode: <span style={{ textTransform: 'capitalize' }}>{bill.paymentMode}</span></div>
                    {bill.paymentMode === 'finance' && bill.financeDetails && (
                      <div style={{ marginTop: '4px', fontSize: '11px', color: '#444' }}>
                        <div>Financier: {bill.financeDetails.company || bill.financeDetails.fileNo}</div>
                        <div>EMI Amount: ₹{bill.financeDetails.emiAmount}</div>
                        <div>Tenure: {bill.financeDetails.tenure}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#1e3a8a' }}>Amount Details</div>
                    <div>Paid: ₹{bill.amountPaid?.toLocaleString('en-IN') || 0}</div>
                    <div>Due: ₹{bill.amountDue?.toLocaleString('en-IN') || 0}</div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ViewBillModal
