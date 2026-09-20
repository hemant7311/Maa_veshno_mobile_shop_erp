import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import ViewBillModal from '../../components/modals/ViewBillModal'

const CustomerDetailsModal = ({ customer, onClose }) => {
  const isFinance = (customer.mode || '').toLowerCase() === 'finance'
  
  const totalAmountStr = String(customer.total).replace(/[^0-9.]/g, '')
  const totalAmount = parseInt(totalAmountStr, 10) || 0
  
  const tenure = parseInt(customer.tenure, 10) || 6
  const emiAmount = customer.emiAmount || Math.round(totalAmount / tenure)
  
  const [emiSchedule, setEmiSchedule] = useState(() => {
    if (!isFinance) return []
    return Array.from({ length: tenure }).map((_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() + i + 1)
      return {
        id: i + 1,
        dueDate: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        amount: emiAmount,
        status: i < 2 ? 'Paid' : 'Pending'
      }
    })
  })

  const toggleStatus = (id) => {
    setEmiSchedule(prev => prev.map(emi => 
      emi.id === id 
        ? { ...emi, status: emi.status === 'Paid' ? 'Pending' : 'Paid' }
        : emi
    ))
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.6)', overflowY: 'auto', zIndex: 1000 }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', margin: '40px auto', background: 'var(--bg)' }}>
        <div className="modal-header" style={{ background: 'var(--white)' }}>
          <h2 className="modal-title">Customer Purchase Details</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ background: 'var(--white)', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', padding: '16px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Customer Name</div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>{customer.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>📞 {customer.phone}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Product Details</div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--primary)' }}>{customer.product}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>IMEI: {customer.imei || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Payment Mode</div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{customer.mode} {isFinance ? `(${customer.finType})` : ''}</div>
              {isFinance && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <div>{customer.company}</div>
                  {customer.loanId !== '-' && <div>ID/File: {customer.loanId}</div>}
                  {customer.emiPaymentMethod !== '-' && <div>EMI via: <strong style={{ color: 'var(--orange)', textTransform: 'capitalize' }}>{customer.emiPaymentMethod}</strong></div>}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Amount</div>
              <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--success)' }}>₹{Number(customer.total || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>

          {isFinance ? (
            <div>
              <h3 style={{ fontSize: '15px', marginBottom: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>EMI Schedule Tracker</h3>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <table className="data-table" style={{ margin: 0, width: '100%' }}>
                  <thead style={{ background: 'var(--bg)' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'center' }}>EMI No.</th>
                      <th style={{ padding: '12px' }}>Due Date</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Amount (₹)</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emiSchedule.map((emi) => (
                      <tr key={emi.id}>
                        <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>{emi.id}</td>
                        <td style={{ fontWeight: '500' }}>{emi.dueDate}</td>
                        <td style={{ textAlign: 'right', fontWeight: '600' }}>{emi.amount.toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge badge-${emi.status === 'Paid' ? 'success' : 'warning'}`}>
                            {emi.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '6px' }}>
                            <input 
                              type="checkbox" 
                              checked={emi.status === 'Paid'} 
                              onChange={() => toggleStatus(emi.id)} 
                              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--success)' }}
                            />
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', userSelect: 'none' }}>
                              Mark Paid
                            </span>
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '15px', marginBottom: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>Purchase Invoice Details</h3>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <table className="data-table" style={{ margin: 0, width: '100%' }}>
                  <thead style={{ background: 'var(--bg)' }}>
                    <tr>
                      <th style={{ padding: '12px' }}>Date</th>
                      <th style={{ padding: '12px' }}>Description</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Taxable Value</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>GST (18%)</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '12px' }}>{new Date().toLocaleDateString('en-IN')}</td>
                      <td style={{ padding: '12px' }}>
                        <div><strong>{customer.product}</strong></div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>IMEI: {customer.imei || '—'}</div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>₹{Math.round(totalAmount / 1.18).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>₹{(totalAmount - Math.round(totalAmount / 1.18)).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>₹{totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Customers = () => {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All Status')
  const [filterPaymentMode, setFilterPaymentMode] = useState('All Payment Mode')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewingCustomer, setViewingCustomer] = useState(null)
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const itemsPerPage = 10

  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      const res = await api.get('/sales')
      if (res.data?.success) {
        const retailSales = res.data.data.filter(s => s.saleType === 'retail')
        const mapped = retailSales.map(s => ({
          id: s._id,
          invoiceNumber: s.invoiceNumber,
          name: s.customerName,
          phone: s.phone,
          product: s.items.map(i => i.productName).join(', '),
          imei: s.items.map(i => i.imei).join(', '),
          total: s.grandTotal,
          amountPaid: s.amountPaid,
          amountDue: s.amountDue,
          mode: s.paymentMode.charAt(0).toUpperCase() + s.paymentMode.slice(1),
          finType: s.financeDetails?.company ? 'Company Finance' : 'Private Finance',
          company: s.financeDetails?.company || '-',
          status: s.status === 'completed' ? 'Active' : 'Pending',
          date: s.createdAt,
          tenure: s.financeDetails?.tenure || 6,
          emiAmount: s.financeDetails?.emiAmount || 0,
          emiPaymentMethod: s.financeDetails?.emiPaymentMethod || '-',
          loanId: s.financeDetails?.loanId || s.financeDetails?.fileNo || '-'
        }))
        setCustomers(mapped)
      }
    } catch (err) {
      console.error('Failed to fetch sales for customers', err)
    } finally {
      setLoading(false)
    }
  }

  const totalCustomers = customers.length
  const activeCustomers = customers.filter(c => c.status === 'Active').length
  const pendingCustomers = customers.filter(c => c.status === 'Pending').length
  
  const totalSales = customers.reduce((sum, c) => sum + (Number(c.total) || 0), 0)

  const stats = [
    { label: 'Total Customers', value: totalCustomers, sub: 'All Registered', color: 'blue', icon: '👥', filterValue: 'All' },
    { label: 'Active Customers', value: activeCustomers, sub: 'Active', color: 'green', icon: '✅', filterValue: 'Active' },
    { label: 'Pending Customers', value: pendingCustomers, sub: 'Pending', color: 'orange', icon: '⏳', filterValue: 'Pending' },
    { label: 'Total Sales', value: `₹${totalSales.toLocaleString('en-IN')}`, sub: 'All Customers', color: 'purple', icon: '₹', filterValue: null },
  ]

  const filtered = customers.filter(c =>
    (filterStatus === 'All Status' || c.status === filterStatus) &&
    (filterPaymentMode === 'All Payment Mode' || c.mode === filterPaymentMode) &&
      (filterStatus === 'All Status' || (filterStatus === 'Pending Dues' && c.amountDue > 0)) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.product.toLowerCase().includes(search.toLowerCase()))
  )

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const statusBadge = (status) => {
    if (status === 'Active') return <span className="badge badge-success">Active</span>
    if (status === 'Pending') return <span className="badge badge-warning">Pending</span>
    return <span className="badge badge-danger">{status}</span>
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
      {viewingCustomer && <ViewBillModal saleId={viewingCustomer.id} onClose={() => setViewingCustomer(null)} />}
      
      <div className="page-header">
        <div className="page-header-left">
          <h1>Customers</h1>
          <p>Manage your customer and their purchases</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-outline">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Import
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-cards-grid" style={{ marginBottom: '20px' }}>
        {stats.map((s, i) => (
          <div 
            className="stat-card" 
            key={i}
            onClick={() => s.filterValue && (setFilterStatus(s.filterValue), setCurrentPage(1))}
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
            <div className="search-bar" style={{ minWidth: '280px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Search by name, phone or product..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} />
            </div>
          </div>
          <div className="table-toolbar-right">
            <select className="form-select" style={{ width: 'auto', height: '36px' }}><option>All Customers</option></select>
            <select className="form-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }} style={{ width: 'auto', height: '36px' }}><option>All Status</option><option>Active</option><option>Pending</option><option>Inactive</option></select>
            <select className="form-select" value={filterPaymentMode} onChange={e => { setFilterPaymentMode(e.target.value); setCurrentPage(1); }} style={{ width: 'auto', height: '36px' }}><option>All Payment Mode</option><option>Finance</option><option>Card</option><option>Cash</option><option>UPI</option></select>
            <select className="form-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }} style={{ width: 'auto', height: '36px', marginLeft: '8px' }}><option>All Status</option><option>Pending Dues</option></select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Product Name</th>
                <th>IMEI Number</th>
                <th>Total Purchase (₹)</th>
                <th>Payment Mode</th>
                <th>Finance Company</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No customers found.
                  </td>
                </tr>
              ) : currentItems.map((c, i) => (
                <tr key={c.id}>
                  <td style={{ color: 'var(--text-muted)' }}>{indexOfFirstItem + i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{c.phone}</td>
                  <td style={{ color: 'var(--primary)' }}>{c.product}</td>
                  <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '13px' }}>{c.imei || '-'}</td>
                  <td style={{ fontWeight: 600 }}>₹{Number(c.total).toLocaleString('en-IN')}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.mode}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.company}</td>
                  <td>{statusBadge(c.status)}</td>
                  <td>
                    
                    {c.amountDue > 0 && (
                      <button className="action-btn" onClick={() => {
                        const amount = window.prompt('Enter amount received from ' + c.name + ' (Remaining: ₹' + c.amountDue + '):');
                        if (amount && !isNaN(amount)) {
                          api.patch('/sales/' + c.id, { amountPaid: (c.amountPaid || 0) + Number(amount) })
                            .then(() => window.location.reload())
                            .catch(e => alert('Failed: ' + e.message));
                        }
                      }} title="Receive Payment" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'auto', padding: '4px 10px', color: 'var(--success)', border: '1px solid var(--success-light)', background: 'var(--success-light)', marginRight: '8px' }}>
                        Pay
                      </button>
                    )}
                    <button className="action-btn" onClick={() => setViewingCustomer(c)} title="View Bill" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'auto', padding: '4px 10px', color: 'var(--primary)', border: '1px solid var(--primary-light)', background: 'var(--primary-light)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>Showing {filtered.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filtered.length)} of {filtered.length} customers</span>
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

export default Customers
