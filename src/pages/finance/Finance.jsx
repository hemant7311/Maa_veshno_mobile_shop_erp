import EMIModal from '../../components/modals/EMIModal'
import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import ViewBillModal from '../../components/modals/ViewBillModal'
import { Eye, Edit, Trash2, CheckCircle, Clock } from 'lucide-react'

const CustomerFinanceDetailsModal = ({ record, onClose, onRefresh }) => {
  const tenureMatch = String(record.tenure || '6').match(/\d+/);
  const tenure = tenureMatch ? parseInt(tenureMatch[0], 10) : 6;
  const emiAmount = record.emiAmount || Math.round((record.usedLimit || 0) / tenure);
  
  const [showBill, setShowBill] = useState(false);
  const [emiSchedule, setEmiSchedule] = useState(() => {
    if (record.installments && record.installments.length > 0) {
      return record.installments.map(inst => ({
        id: inst.installmentNumber,
        dueDate: inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
        amount: inst.expectedAmount,
        paidAmount: inst.paidAmount || 0,
        remainingAmount: inst.remainingAmount !== undefined ? inst.remainingAmount : (inst.expectedAmount - (inst.paidAmount || 0)),
        status: inst.status
      }))
    }
    return []
  })

  const toggleStatus = async (id) => {
    const currentEmi = emiSchedule.find(e => e.id === id);
    if (!currentEmi) return

    let newStatus = currentEmi.status === 'Paid' ? 'Pending' : 'Paid';
    let paymentAmount = undefined;
    
    if (currentEmi.status === 'Partially Paid') {
      const action = prompt(`EMI ${id} is Partially Paid. Remaining: ₹${currentEmi.remainingAmount}.\nType 'pay' to pay remaining, or 'reverse' to undo payment:`, 'pay');
      if (action === null) return;
      if (action.trim().toLowerCase() === 'reverse') {
         newStatus = 'Pending';
      } else {
         newStatus = 'Paid';
      }
    }

    if (newStatus === 'Paid') {
      const defaultAmount = currentEmi.remainingAmount !== undefined ? currentEmi.remainingAmount : currentEmi.amount;
      const inputAmount = prompt(`Enter payment amount for EMI ${id} (Remaining: ₹${defaultAmount.toLocaleString('en-IN')}):`, defaultAmount);
      if (inputAmount === null) return;
      
      paymentAmount = Number(inputAmount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        alert('Invalid amount entered.');
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to REVERSE this payment? This will refund ₹${currentEmi.paidAmount || currentEmi.amount} to customer balance.`)) {
        return;
      }
    }

    try {
      const res = await api.put(`/finance/${record._id}/emi/${id}`, { status: newStatus, amount: paymentAmount });
      if (res.data?.data?.installments) {
        setEmiSchedule(res.data.data.installments.map(inst => ({
          id: inst.installmentNumber,
          dueDate: inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
          amount: inst.expectedAmount,
          paidAmount: inst.paidAmount || 0,
          remainingAmount: inst.remainingAmount !== undefined ? inst.remainingAmount : (inst.expectedAmount - (inst.paidAmount || 0)),
          status: inst.status
        })));
        if (onRefresh) onRefresh()
      }
    } catch (err) {
      console.error('Failed to sync EMI status', err);
      alert(err.response?.data?.message || 'Failed to update EMI status');
    }
  }

  const grandTotal = record.totalLimit || 0
  const financedAmt = record.usedLimit || 0
  const dpAmount = Math.max(0, grandTotal - financedAmt)

  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.6)', overflowY: 'auto', zIndex: 1000 }}>
      {showBill && record.billRef && <ViewBillModal invoiceNumber={record.billRef} onClose={() => setShowBill(false)} />}

      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', margin: '40px auto', background: 'var(--bg)' }}>
        <div className="modal-header" style={{ background: 'var(--white)' }}>
          <h2 className="modal-title">Customer Finance Details - {record.billRef || '—'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body" style={{ background: 'var(--white)', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', padding: '16px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Customer Name</div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>{record.customerName}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>📞 {record.mobileNumber}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Product Details</div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--primary)' }}>{record.productDetails || 'N/A'}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Invoice: <strong>{record.billRef || '—'}</strong>
                {record.billRef && (
                  <button onClick={() => setShowBill(true)} style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    View Bill
                  </button>
                )}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Finance Company / Agent</div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>{record.entityName} ({record.financeType})</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tenure: {record.tenure} Months | EMI: ₹{record.emiAmount?.toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Financed Amount Details</div>
              <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--success)' }}>Financed: ₹{financedAmt.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bill Total: ₹{grandTotal.toLocaleString('en-IN')} | Down Payment: ₹{dpAmount.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '15px', marginBottom: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>EMI Schedule Tracker</h3>
            {emiSchedule.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>No EMI schedule records found.</div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <table className="data-table" style={{ margin: 0, width: '100%' }}>
                  <thead style={{ background: 'var(--bg)' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'center' }}>EMI No.</th>
                      <th style={{ padding: '12px' }}>Due Date</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Due Amount (₹)</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Paid Amount (₹)</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emiSchedule.map((emi) => {
                      const isPaid = emi.status === 'Paid'
                      return (
                        <tr key={emi.id}>
                          <td style={{ textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>#{emi.id}</td>
                          <td style={{ fontWeight: '500' }}>{emi.dueDate}</td>
                          <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{emi.amount.toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--success)' }}>₹{(emi.paidAmount || 0).toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge badge-${isPaid ? 'success' : emi.status === 'Overdue' ? 'danger' : 'warning'}`}>
                              {emi.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', gap: '6px' }}>
                              <input 
                                type="checkbox" 
                                checked={isPaid} 
                                onChange={() => toggleStatus(emi.id)} 
                                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--success)' }}
                              />
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', userSelect: 'none' }}>
                                Mark Paid
                              </span>
                            </label>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Modal: View Entity Finances (Agent/Company) ── */
const ViewEntityFinancesModal = ({ entityName, onClose, onRefresh }) => {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  const fetchRecords = () => {
    setLoading(true)
    api.get(`/finance/${encodeURIComponent(entityName)}`)
      .then(res => setRecords(res.data.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRecords()
  }, [entityName])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <div className="modal-header">
          <h2 className="modal-title">All Finances for: {entityName}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? <p style={{ padding: '20px' }}>Loading records...</p> : (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer Name</th>
                    <th>Mobile Number</th>
                    <th>Date</th>
                    <th>Invoice No</th>
                    <th>Product Details</th>
                    <th>Financed Amt</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No finance records found for {entityName}.</td></tr> : null}
                  {records.map((r, i) => (
                    <tr key={r._id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                      <td>{r.mobileNumber}</td>
                      <td>{new Date(r.createdAt || r.paymentDate).toLocaleDateString('en-IN')}</td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{r.billRef || '-'}</td>
                      <td style={{ fontSize: '13px', color: 'var(--primary)' }}>{r.productDetails || '-'}</td>
                      <td style={{ fontWeight: 'bold' }}>₹{Number(r.usedLimit || 0).toLocaleString('en-IN')}</td>
                      <td>
                        <button className="action-btn" title="View Details" onClick={() => setSelectedCustomer(r)}>
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {selectedCustomer && <EMIModal record={selectedCustomer} onClose={() => setSelectedCustomer(null)} onRefresh={() => { fetchRecords(); if (onRefresh) onRefresh(); }} />}
      </div>
    </div>
  )
}

/* ── Main Finance Page ── */
const Finance = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [summaryData, setSummaryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewEntity, setViewEntity] = useState(null)

  const fetchSummary = () => {
    setLoading(true)
    setError('')
    api.get('/finance/summary')
      .then(res => {
        if (res.data?.success) {
          setSummaryData(res.data.data || [])
        } else {
          setError('Failed to load finance summary data.')
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || err.message || 'Error fetching finance summary')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const filtered = summaryData.filter(f => {
    const matchesTab = activeTab === 'all' || (f.financeType || '').toLowerCase() === activeTab
    const q = search.toLowerCase().trim()
    const matchesSearch = !q ||
      (f.entityName && f.entityName.toLowerCase().includes(q)) ||
      (f.agentName && f.agentName.toLowerCase().includes(q)) ||
      (f.agentUsername && f.agentUsername.toLowerCase().includes(q)) ||
      (f.agentId && String(f.agentId).toLowerCase().includes(q))
    return matchesTab && matchesSearch
  })

  const tabs = [
    { key: 'all',     label: 'All Finance',     icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
    { key: 'company', label: 'Company Finance', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { key: 'private', label: 'Private Finance', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
  ]

  return (
    <div>
      {viewEntity && <ViewEntityFinancesModal entityName={viewEntity} onClose={() => setViewEntity(null)} onRefresh={fetchSummary} />}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Finance Tracker</h1>
          <p>Monitor your company and private finance counts.</p>
        </div>
      </div>

      <div className="table-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: `1px solid ${activeTab === tab.key ? 'var(--primary)' : 'var(--border)'}`, background: activeTab === tab.key ? 'var(--primary)' : 'var(--white)', color: activeTab === tab.key ? 'var(--white)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'var(--transition)' }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <div className="search-bar" style={{ minWidth: '280px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search Agent, Company, ID, Username..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {error && (
          <div style={{ padding: '16px', color: 'var(--danger)', background: '#fee2e2', borderRadius: '4px', margin: '16px' }}>
            {error}
          </div>
        )}

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Finance Type</th>
                <th>Agent / Company</th>
                <th>Agent ID</th>
                <th>Total Cases</th>
                <th>Total Financed Amount (₹)</th>
                <th>Total Paid (₹)</th>
                <th>Total Pending (₹)</th>
                {activeTab === 'private' && <th>Agent Login</th>}
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'private' ? 8 : 7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    Loading finance records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'private' ? 8 : 7} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No records found. Generate a bill with finance to see counts here.
                  </td>
                </tr>
              ) : filtered.map((item, index) => (
                <tr key={`${item.financeType}-${item.entityName}`}>
                  <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                  <td>
                    <span className={`badge badge-${item.financeType === 'Company' ? 'primary' : 'warning'}`}>
                      {item.financeType}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600' }}>{item.entityName}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {item.agentId ? String(item.agentId).slice(-8) : 'N/A'}
                  </td>
                  <td style={{ fontWeight: '700', fontSize: '15px' }}>{item.totalCount}</td>
                  <td style={{ fontWeight: '600', color: 'var(--success)' }}>₹{Number(item.totalFinancedAmount || 0).toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: '600', color: 'var(--primary)' }}>₹{Number(item.totalPaid || 0).toLocaleString('en-IN')}</td>
                  <td style={{ fontWeight: '600', color: 'var(--danger)' }}>₹{Number(item.totalPending || 0).toLocaleString('en-IN')}</td>
                  {activeTab === 'private' && (
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {item.agentUsername ? item.agentUsername : 'N/A'}
                    </td>
                  )}
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn" title="View Details" aria-label="View Details" onClick={() => setViewEntity(item.entityName)}>
                        <Eye size={15} />
                      </button>
                      <button className="action-btn" title="Edit Name" aria-label="Edit Name" style={{ color: 'var(--primary)' }} onClick={async () => {
                        const newName = prompt(`Enter new name for ${item.entityName}:`, item.entityName)
                        if (newName && newName.trim() && newName.trim() !== item.entityName) {
                          try {
                            await api.put(`/finance/entity/${encodeURIComponent(item.entityName)}`, { newEntityName: newName.trim() })
                            alert('Name updated successfully in all records!')
                            fetchSummary()
                          } catch(err) {
                            alert(err.response?.data?.message || 'Update failed')
                          }
                        }
                      }}>
                        <Edit size={15} />
                      </button>
                      <button className="action-btn" title="Delete All" aria-label="Delete All" style={{ color: 'var(--danger)' }} onClick={async () => {
                        if (window.confirm(`WARNING: Deleting "${item.entityName}" will permanently delete ALL ${item.totalCount} finance records associated with it. Are you sure?`)) {
                          try {
                            await api.delete(`/finance/entity/${encodeURIComponent(item.entityName)}`)
                            alert('All associated records deleted successfully!')
                            fetchSummary()
                          } catch(err) {
                            alert(err.response?.data?.message || 'Delete failed')
                          }
                        }
                      }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Finance
