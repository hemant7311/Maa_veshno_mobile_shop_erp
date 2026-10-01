import EMIModal from '../../components/modals/EMIModal'
import React, { useState, useEffect } from 'react'
import api from '../../services/api'

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`

const AgentPanel = () => {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [filterDueOnly, setFilterDueOnly] = useState(false)

  const loadRecords = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/finance/agent/records')
      const rawData = response?.data?.data !== undefined ? response.data.data : response?.data
      setRecords(Array.isArray(rawData) ? rawData : [])
    } catch (requestError) {
      try {
        const fallback = await api.get('/finance/my-records')
        const rawFb = fallback?.data?.data !== undefined ? fallback.data.data : fallback?.data
        setRecords(Array.isArray(rawFb) ? rawFb : [])
      } catch (fbErr) {
        setError(requestError.response?.data?.message || fbErr.response?.data?.message || 'Your finance records could not be loaded.')
        setRecords([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [])

  const safeRecords = Array.isArray(records) ? records : []
  const totalFinanced = safeRecords.reduce((sum, record) => sum + Number(record?.usedLimit || record?.totalAmount || 0), 0)
  const totalOutstanding = safeRecords.reduce((sum, record) => sum + Number(record?.stats?.totalPendingEmiAmount || record?.availableLimit || record?.totalLimit || 0), 0)
  const totalPendingEMIs = safeRecords.reduce((sum, record) => sum + Number(record?.stats?.pendingInstallmentCount || 0), 0)

  const isDueSoon = (record) => {
    if (!record || !record.stats || !record.stats.nextEmiDueDate) return false
    const nextEmiDate = new Date(record.stats.nextEmiDueDate)
    if (isNaN(nextEmiDate.getTime())) return false
    
    const diffDays = Math.ceil((nextEmiDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 3 && diffDays >= -30 // within 3 days future, or up to 30 days overdue
  }

  const displayedRecords = filterDueOnly ? safeRecords.filter(isDueSoon) : safeRecords
  const totalDueSoon = safeRecords.filter(isDueSoon).length

  return (
    <div>
      {selectedRecord && <EMIModal record={selectedRecord} onClose={() => setSelectedRecord(null)} onRefresh={loadRecords} />}

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
