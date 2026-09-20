import React, { useState } from 'react'

/* ── View Products Modal ── */
const ViewProductsModal = ({ wholesaler, onClose, onMakePayment }) => {
  const [payAmount, setPayAmount] = useState('')

  if (!wholesaler) return null

  const formatCurrency = (amount) => '₹' + Number(amount).toLocaleString('en-IN')

  // Calculate totals across all products for this wholesaler
  const totalKulAmount = wholesaler.purchasedProducts.reduce((acc, p) => acc + (p.rate * p.qty), 0)
  const totalPaidAmount = wholesaler.purchasedProducts.reduce((acc, p) => acc + p.paidAmount, 0)
  const totalPendingAmount = wholesaler.purchasedProducts.reduce((acc, p) => acc + p.pendingAmount, 0)

  const handlePaymentSubmit = (e) => {
    e.preventDefault()
    if (!payAmount || isNaN(payAmount) || Number(payAmount) <= 0) {
      alert("Please enter a valid amount")
      return
    }

    if (Number(payAmount) > totalPendingAmount) {
      alert(`Cannot pay more than the total pending amount of ${formatCurrency(totalPendingAmount)}`)
      return
    }

    onMakePayment(wholesaler.id, Number(payAmount))
    setPayAmount('')
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: '20px' }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', background: '#fafafa' }}>
        
        {/* 1. Summary Cards Section */}
        <div style={{ display: 'flex', gap: '24px', background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '24px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>KUL AMOUNT (TOTAL)</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(totalKulAmount)}</div>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>PAID AMOUNT</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#22c55e' }}>{formatCurrency(totalPaidAmount)}</div>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>PENDING AMOUNT</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#ef4444' }}>{formatCurrency(totalPendingAmount)}</div>
          </div>
        </div>

        {/* 2. Payment Section */}
        {totalPendingAmount > 0 && (
          <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '12px', padding: '24px', marginBottom: '32px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#b45309', marginBottom: '12px' }}>Pay Pending Balance (₹)</div>
            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <input 
                type="number" 
                placeholder="Enter amount to pay" 
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                style={{ flex: 1, minWidth: '200px', padding: '12px 16px', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '15px', outline: 'none', background: '#fff' }}
                min="1"
                max={totalPendingAmount}
                required
              />
              <button type="submit" style={{ background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 32px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap' }}>
                Record Payment
              </button>
            </form>
          </div>
        )}

        {/* 3. Products List */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Supplied Items List (Stock History)</h3>
          <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>Date</th>
                  <th style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>Product Name</th>
                  <th style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>Variant</th>
                  <th style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>IMEI Number</th>
                  <th style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #f1f5f9' }}>Purchase Price</th>
                  <th style={{ padding: '14px 16px', fontSize: '13px', color: '#64748b', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid #f1f5f9' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {wholesaler.purchasedProducts?.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#64748b' }}>1/8/2026</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{p.name}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{p.description ? p.description.split(',')[0] : 'Standard'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#475569' }}>{p.imei}</td>
                    <td style={{ padding: '14px 16px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{formatCurrency(p.rate)}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button style={{ background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', padding: '4px 12px', borderRadius: '16px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Return</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #eaeaea' }}>
          <button type="button" style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '8px 24px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#475569' }} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

/* ── Wholesalers Page ── */
const Buyers = () => {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All Status')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('All Payment Status')
  const [selectedWholesaler, setSelectedWholesaler] = useState(null)


  const [buyers, setBuyers] = useState([])
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const { default: api } = await import('../../services/api')
      const res = await api.get('/sales')
      if (res.data?.success) {
        const wholesaleSales = res.data.data.filter(s => s.saleType === 'wholesale')
        const mapped = wholesaleSales.map(s => ({
          id: s._id,
          name: s.customerName,
          phone: s.phone,
          shop: s.customerName,
          products: s.items.length,
          total: s.grandTotal,
          payStatus: s.paymentMode !== 'finance' ? 'Paid' : 'Pending',
          date: s.createdAt,
          purchasedProducts: s.items.map(i => ({
            id: i.productId || Math.random(),
            name: i.productName,
            category: 'Mobile',
            rate: i.price,
            qty: i.qty,
            imei: i.imei || 'N/A',
            description: '-',
            paidAmount: i.total,
            pendingAmount: 0
          }))
        }))
        setBuyers(mapped)
      }
    } catch (err) {
      console.error('Failed to fetch wholesale sales', err)
    } finally {
      setLoading(false)
    }
  }

  const totalWholesalers = buyers.length
  const activeWholesalers = buyers.filter(b => b.payStatus === 'Paid').length
  const pendingWholesalers = buyers.filter(b => b.payStatus === 'Pending').length

  const totalCollection = buyers.reduce((sum, b) => sum + (Number(b.total) || 0), 0)

  const stats = [
    { label: 'Total Wholesalers', value: totalWholesalers, sub: 'All Registered', color: 'blue', icon: '👥', filterValue: 'All' },
    { label: 'Active Wholesalers', value: activeWholesalers, sub: 'Currently Active', color: 'green', icon: '✅', filterValue: 'Paid' },
    { label: 'Pending Wholesalers', value: pendingWholesalers, sub: 'Payment Pending', color: 'orange', icon: '⏳', filterValue: 'Pending' },
    { label: 'Total Collection', value: `₹${totalCollection.toLocaleString('en-IN')}`, sub: 'All Buyers', color: 'purple', icon: '₹', filterValue: null },
  ]

  const handleMakePayment = (wholesalerId, amount) => {
    setBuyers(prev => prev.map(w => {
      if (w.id !== wholesalerId) return w

      let remainingPayment = amount;
      let updatedPendingAmountTotal = 0;

      const updatedProducts = w.purchasedProducts.map(p => {
        if (remainingPayment > 0 && p.pendingAmount > 0) {
          const deduction = Math.min(p.pendingAmount, remainingPayment);
          remainingPayment -= deduction;
          const newPending = p.pendingAmount - deduction;
          updatedPendingAmountTotal += newPending;
          return {
            ...p,
            paidAmount: p.paidAmount + deduction,
            pendingAmount: newPending
          }
        } else {
          updatedPendingAmountTotal += p.pendingAmount;
          return p;
        }
      })

      const updatedWholesaler = {
        ...w,
        purchasedProducts: updatedProducts,
        payStatus: updatedPendingAmountTotal === 0 ? 'Paid' : 'Pending'
      }

      if (selectedWholesaler && selectedWholesaler.id === wholesalerId) {
         setSelectedWholesaler(updatedWholesaler)
      }

      return updatedWholesaler
    }))
  }

  const filtered = buyers.filter(b =>
    (filterStatus === 'All Status' || b.status === filterStatus) &&
    (filterPaymentStatus === 'All Payment Status' || b.payStatus === filterPaymentStatus) &&
    (b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.phone.includes(search) ||
    b.shop.toLowerCase().includes(search.toLowerCase()))
  )

  const payBadge = (status) => {
    if (status === 'Paid') return <span className="badge badge-success">Paid</span>
    return <span className="badge badge-warning">Pending</span>
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Wholesaler</h1>
          <p>Manage all wholesalers and their purchase history</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Export
          </button>
          <button className="btn btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Wholesaler
          </button>
        </div>
      </div>

      <div className="stat-cards-grid" style={{ marginBottom: '20px' }}>
        {stats.map((s, i) => (
          <div 
            className="stat-card" 
            key={i}
            onClick={() => s.filterValue && setFilterStatus(s.filterValue)}
            style={{ 
              cursor: s.filterValue ? 'pointer' : 'default',
              border: filterStatus === s.filterValue ? `2px solid var(--${s.color})` : '1px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-card-label">{s.label}</div>
                <div className={`stat-card-value ${s.color}`} style={{ fontSize: '24px', marginTop: '4px' }}>{s.value}</div>
                <div className="stat-card-sub" style={{ marginTop: '4px' }}>{s.sub}</div>
              </div>
              <div className={`stat-card-icon ${s.color}`} style={{ fontSize: '20px' }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-bar" style={{ minWidth: '260px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="table-toolbar-right">
            <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto', height: '36px' }}><option>All Status</option><option>Active</option><option>Inactive</option></select>
            <select className="form-select" value={filterPaymentStatus} onChange={e => setFilterPaymentStatus(e.target.value)} style={{ width: 'auto', height: '36px' }}><option>All Payment Status</option><option>Paid</option><option>Pending</option></select>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Buyer Name</th>
                <th>Phone</th>
                <th>Shop Name</th>
                <th style={{ textAlign: 'center' }}>Total Products</th>
                <th>Total Amount (₹)</th>
                <th>Payment Status</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
            {filtered.map((b, i) => (
              <tr key={b.id}>
                <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{b.name}</td>
                <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{b.phone}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{b.shop}</td>
                <td style={{ fontWeight: 600, textAlign: 'center' }}>{b.products}</td>
                <td style={{ fontWeight: 600 }}>₹{Number(b.total).toLocaleString('en-IN')}</td>
                <td>{payBadge(b.payStatus)}</td>
                <td style={{ textAlign: 'center' }}>
                  <button 
                    className="action-btn" 
                    title="View Purchased Products"
                    onClick={() => setSelectedWholesaler(b)}
                    style={{ 
                      color: 'var(--primary)', 
                      background: 'var(--primary-light)', 
                      border: 'none',
                      borderRadius: '4px',
                      padding: '6px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.filter = 'brightness(0.9)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = 'none'
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <div className="table-footer">
          <span>Showing 1 to {filtered.length} of 86 wholesalers</span>
          <div className="pagination">
            <button className="pagination-btn" disabled>‹</button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn">2</button>
            <button className="pagination-btn">...</button>
            <button className="pagination-btn">9</button>
            <button className="pagination-btn">›</button>
          </div>
        </div>
      </div>

      {selectedWholesaler && (
        <ViewProductsModal 
          wholesaler={selectedWholesaler} 
          onClose={() => setSelectedWholesaler(null)} 
          onMakePayment={handleMakePayment}
        />
      )}
    </div>
  )
}

export default Buyers
