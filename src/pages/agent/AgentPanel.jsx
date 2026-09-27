import React, { useState, useEffect } from 'react'
import api from '../../services/api'

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

const FinanceDetailsModal = ({ finance, onClose }) => {
  if (!finance) return null

  const tenure = parseInt(finance.tenure) || 6
  const totalAmountStr = String(finance.totalAmount || finance.totalLimit || finance.usedLimit || 0)
  const totalAmount = parseInt(totalAmountStr.replace(/[^0-9]/g, ''), 10) || 0
  const emiAmount = Math.round(totalAmount / tenure)
  const paidEmisList = Array.isArray(finance.paidEmis) ? finance.paidEmis : []
  
  const [emiSchedule, setEmiSchedule] = useState(() => {
    return Array.from({ length: tenure }).map((_, i) => {
      const date = new Date(finance.date || finance.paymentDate || finance.createdAt || new Date())
      if (isNaN(date.getTime())) date.setTime(Date.now())
      date.setMonth(date.getMonth() + i + 1)
      return {
        id: i + 1,
        dueDate: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        amount: emiAmount,
        status: paidEmisList.includes(i + 1) ? 'Paid' : 'Pending'
      }
    })
  })

  const paidCount = emiSchedule.filter(e => e.status === 'Paid').length
  const pendingCount = Math.max(0, tenure - paidCount)

  const toggleStatus = async (id) => {
    const targetEmi = emiSchedule.find(e => e.id === id)
    if (!targetEmi) return

    const newStatus = targetEmi.status === 'Paid' ? 'Pending' : 'Paid'
    setEmiSchedule(prev => prev.map(emi => 
      emi.id === id ? { ...emi, status: newStatus } : emi
    ))
    
    try {
      await api.put(`/finance/${finance._id}/emi/${id}`, { status: newStatus })
    } catch (err) {
      console.error('Failed to sync EMI status', err)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.6)', overflowY: 'auto', zIndex: 1000 }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', margin: '40px auto', background: 'var(--bg)' }}>
        <div className="modal-header" style={{ background: 'var(--white)' }}>
          <h2 className="modal-title">Finance & EMI Details</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body" style={{ background: 'var(--white)', padding: '24px' }}>
          <div className="form-grid-3" style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Customer Name</div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>{finance.customerName || finance.name || '—'}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>📞 {finance.mobileNumber || finance.phone || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Product & IMEI</div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--primary)' }}>{finance.productDetails || finance.product || '—'}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Invoice: {finance.billRef || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Amount</div>
              <div style={{ fontWeight: '700', fontSize: '18px', color: 'var(--success)' }}>{formatCurrency(totalAmount)}</div>
            </div>
            
            <div style={{ padding: '12px', background: 'var(--white)', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total EMIs</div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>{tenure}</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--white)', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Paid EMIs</div>
              <div style={{ fontWeight: '600', fontSize: '16px', color: 'var(--success)' }}>{paidCount}</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--white)', borderRadius: '6px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending EMIs</div>
              <div style={{ fontWeight: '600', fontSize: '16px', color: 'var(--danger)' }}>{pendingCount}</div>
            </div>
          </div>

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
                      <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(emi.amount)}</td>
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
                          <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-secondary)' }}>Mark Paid</span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Detail = ({ label, value }) => (
  <div style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)' }}>
    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '14px', fontWeight: 600, wordBreak: 'break-word' }}>{value}</div>
  </div>
)

const AgentPanel = () => {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [filterDueOnly, setFilterDueOnly] = useState(false)

  useEffect(() => {
    let isMounted = true
    const loadRecords = async () => {
      setLoading(true)
      setError('')
      try {
        const response = await api.get('/finance/agent/records')
        if (!isMounted) return
        const rawData = response?.data?.data !== undefined ? response.data.data : response?.data
        setRecords(Array.isArray(rawData) ? rawData : [])
      } catch (requestError) {
        try {
          const fallback = await api.get('/finance/my-records')
          if (!isMounted) return
          const rawFb = fallback?.data?.data !== undefined ? fallback.data.data : fallback?.data
          setRecords(Array.isArray(rawFb) ? rawFb : [])
        } catch (fbErr) {
          if (!isMounted) return
          setError(requestError.response?.data?.message || fbErr.response?.data?.message || 'Your finance records could not be loaded.')
          setRecords([])
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadRecords()
    return () => { isMounted = false }
  }, [])

  const safeRecords = Array.isArray(records) ? records : []
  const totalFinanced = safeRecords.reduce((sum, record) => sum + Number(record?.usedLimit || record?.totalAmount || 0), 0)
  const totalOutstanding = safeRecords.reduce((sum, record) => sum + Number(record?.availableLimit || record?.totalLimit || 0), 0)
  const totalPendingEMIs = safeRecords.reduce((sum, record) => {
    const tenure = parseInt(record?.tenure) || 6
    const paidEmis = Array.isArray(record?.paidEmis) ? record.paidEmis : []
    return sum + Math.max(0, tenure - paidEmis.length)
  }, 0)

  const isDueSoon = (record) => {
    if (!record) return false
    const tenure = parseInt(record.tenure) || 6
    const paidEmis = Array.isArray(record.paidEmis) ? record.paidEmis : []
    const paidCount = paidEmis.length
    if (paidCount >= tenure) return false
    
    const recordDate = record.createdAt || record.paymentDate || record.date
    const nextEmiDate = recordDate ? new Date(recordDate) : new Date()
    if (isNaN(nextEmiDate.getTime())) return false
    nextEmiDate.setMonth(nextEmiDate.getMonth() + paidCount + 1)
    
    const diffDays = Math.ceil((nextEmiDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 3
  }

  const displayedRecords = filterDueOnly ? safeRecords.filter(isDueSoon) : safeRecords
  const totalDueSoon = safeRecords.filter(isDueSoon).length

  return (
    <div>
      {selectedRecord && <FinanceDetailsModal finance={selectedRecord} onClose={() => setSelectedRecord(null)} />}

      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div className="page-header-left">
          <h1>My Finance Records</h1>
          <p>Only finance cases assigned to your agent account are shown here.</p>
        </div>
      </div>

      <div className="stat-cards-grid" style={{ marginBottom: '20px' }}>
        <SummaryCard title="Total Finance Cases" value={safeRecords.length} note="Assigned to you" color="var(--primary)" />
        <SummaryCard title="Total Financed Amount" value={formatCurrency(totalFinanced)} note="Across your cases" color="var(--orange)" />
        <SummaryCard title="Available Balance" value={formatCurrency(totalOutstanding)} note="As recorded on bills" color="var(--success, #10B981)" />
        <SummaryCard 
          title="Pending EMIs" 
          value={totalPendingEMIs} 
          note={totalDueSoon > 0 ? `🔥 ${totalDueSoon} customers due soon (Click to filter)` : "Across all customers"} 
          color="var(--danger)" 
          onClick={() => setFilterDueOnly(!filterDueOnly)}
          isActive={filterDueOnly}
        />
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <span className="card-title">
            {filterDueOnly ? 'Customers Due Soon' : 'Assigned Finance Customers'}
          </span>
          {filterDueOnly && (
            <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '12px', marginLeft: 'auto' }} onClick={() => setFilterDueOnly(false)}>
              Clear Filter
            </button>
          )}
        </div>
        <div className="card-body">
          {loading ? <p style={{ padding: '20px', color: 'var(--text-muted)' }}>Loading your finance records...</p> : null}
          {error ? <p style={{ padding: '20px', color: 'var(--danger)' }}>{error}</p> : null}
          {!loading && !error ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Customer Name</th>
                    <th>Mobile Number</th>
                    <th>Product & IMEI</th>
                    <th>Invoice No.</th>
                    <th>Financed Amount</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRecords.length === 0 ? <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px' }}>{filterDueOnly ? 'No customers are due for EMI right now.' : 'No finance records have been assigned to you yet.'}</td></tr> : null}
                  {displayedRecords.map((record, index) => (
                    <tr key={record._id || index}>
                      <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                      <td style={{ fontWeight: 500 }}>{record.customerName || record.name || '—'}</td>
                      <td>
                        {record.mobileNumber || record.phone ? (
                          <a href={`tel:${record.mobileNumber || record.phone}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '500' }}>
                            📞 {record.mobileNumber || record.phone}
                          </a>
                        ) : '—'}
                      </td>
                      <td style={{ color: 'var(--primary)', maxWidth: '260px' }}>{record.productDetails || record.product || '—'}</td>
                      <td>{record.billRef || '—'}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(record.usedLimit || record.totalAmount)}</td>
                      <td>{record.createdAt ? new Date(record.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => setSelectedRecord(record)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const SummaryCard = ({ title, value, note, color, onClick, isActive }) => (
  <div 
    className="card agent-stat-card" 
    onClick={onClick}
    style={{ 
      borderTop: `4px solid ${color}`, 
      cursor: onClick ? 'pointer' : 'default',
      background: isActive ? 'var(--bg)' : 'var(--white)',
      transform: isActive ? 'scale(0.98)' : 'scale(1)',
      transition: 'all 0.2s ease',
      boxShadow: isActive ? 'inset 0 2px 4px rgba(0,0,0,0.05)' : '0 1px 3px rgba(0,0,0,0.1)'
    }}
  >
    <h3 className="agent-stat-title" style={{ margin: '0 0 10px', color: 'var(--text-secondary)' }}>{title}</h3>
    <div className="agent-stat-value" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
    <p className="agent-stat-note" style={{ margin: '10px 0 0', color: onClick ? 'var(--primary)' : 'var(--text-muted)', fontWeight: onClick ? 500 : 400 }}>{note}</p>
  </div>
)

export default AgentPanel
