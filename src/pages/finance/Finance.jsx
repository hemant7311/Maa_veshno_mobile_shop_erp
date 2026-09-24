import React, { useState, useEffect } from 'react'
import api from '../../services/api'
import ViewBillModal from '../../components/modals/ViewBillModal'

/* ── Modal: Add Finance ── */
// Kept for manual entry if needed, but the main flow is from billing
const AddFinanceModal = ({ onClose }) => {
  const [financeType, setFinanceType] = useState('Company')
  const [form, setForm] = useState({
    cardName: '', companyName: '', customerName: '', mobileNumber: '',
    totalLimit: '', usedLimit: '', status: 'Active'
  })

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{financeType === 'Company' ? 'Add Company Finance' : 'Add Private Finance'}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Add new finance details.</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          {/* Form simplified for brevity */}
          <p>Finance recording now mainly happens automatically via the Billing page.</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

const CustomerFinanceDetailsModal = ({ record, onClose }) => {
  const tenureMatch = String(record.tenure || '6').match(/\d+/);
  const tenure = tenureMatch ? parseInt(tenureMatch[0], 10) : 6;
  const emiAmount = record.emiAmount || Math.round(record.usedLimit / tenure);
  
  const [showBill, setShowBill] = useState(false);
  const [emiSchedule, setEmiSchedule] = useState(() => {
    if (record.installments && record.installments.length > 0) {
      return record.installments.map(inst => ({
        id: inst.installmentNumber,
        dueDate: new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        amount: inst.expectedAmount,
        status: inst.status
      }))
    }
    // Legacy fallback just in case
    return Array.from({ length: tenure }).map((_, i) => {
      const date = new Date(record.createdAt || new Date())
      date.setMonth(date.getMonth() + i + 1)
      return {
        id: i + 1,
        dueDate: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        amount: emiAmount,
        status: (record.paidEmis || []).includes(i + 1) ? 'Paid' : 'Pending'
      }
    })
  })

  const toggleStatus = async (id) => {
    const currentEmi = emiSchedule.find(e => e.id === id);
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
      const inputAmount = prompt(`Enter payment amount for EMI ${id} (Remaining: ₹${defaultAmount}):`, defaultAmount);
      if (inputAmount === null) return; // Cancelled
      
      paymentAmount = Number(inputAmount);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        alert('Invalid amount entered.');
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to REVERSE this payment? This will refund ₹${currentEmi.amount - (currentEmi.remainingAmount !== undefined ? currentEmi.remainingAmount : 0)} to the customer's balance.`)) {
        return;
      }
    }

    // Optimistic update
    setEmiSchedule(prev => prev.map(emi => 
      emi.id === id ? { ...emi, status: newStatus } : emi
    ));
    
    try {
      const res = await api.put(`/finance/${record._id}/emi/${id}`, { status: newStatus, amount: paymentAmount });
      if (res.data?.data?.installments) {
        // Sync with backend truth
        setEmiSchedule(res.data.data.installments.map(inst => ({
          id: inst.installmentNumber,
          dueDate: new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          amount: inst.expectedAmount,
          status: inst.status,
          remainingAmount: inst.remainingAmount
        })));
      }
    } catch (err) {
      console.error('Failed to sync EMI status', err);
      alert(err.response?.data?.message || 'Failed to update EMI status');
      // Re-fetch to revert optimistic update
      const res = await api.get(`/finance/customer/${record.mobileNumber}`);
      if (res.data?.data?.installments) {
        setEmiSchedule(res.data.data.installments.map(inst => ({
          id: inst.installmentNumber,
          dueDate: new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          amount: inst.expectedAmount,
          status: inst.status,
          remainingAmount: inst.remainingAmount
        })));
      }
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.6)', overflowY: 'auto', zIndex: 1000 }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', margin: '40px auto', background: 'var(--bg)' }}>
        <div className="modal-header" style={{ background: 'var(--white)' }}>
          <h2 className="modal-title">Customer Purchase Details</h2>
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
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Invoice: {record.billRef || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Payment Mode</div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>Finance ({record.financeType})</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{record.entityName}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Amount</div>
              <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--success)' }}>₹{record.totalLimit?.toLocaleString('en-IN')}</div>
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
        </div>
      </div>
    </div>
  )
}

/* ── Modal: View Entity Finances (Agent/Company) ── */
const ViewEntityFinancesModal = ({ entityName, onClose }) => {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  useEffect(() => {
    api.get(`/finance/${encodeURIComponent(entityName)}`)
      .then(res => setRecords(res.data.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [entityName])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
        <div className="modal-header">
          <h2 className="modal-title">All Finances by: {entityName}</h2>
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
                  {records.length === 0 ? <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>No records found.</td></tr> : null}
                  {records.map((r, i) => (
                    <tr key={r._id}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td style={{ fontWeight: 500 }}>{r.customerName}</td>
                      <td>{r.mobileNumber}</td>
                      <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                      <td>{r.billRef || '-'}</td>
                      <td style={{ fontSize: '13px', color: 'var(--primary)' }}>{r.productDetails || '-'}</td>
                      <td>₹{r.usedLimit}</td>
                      <td>
                        <button className="action-btn" title="View Details" onClick={() => setSelectedCustomer(r)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {selectedCustomer && <CustomerFinanceDetailsModal record={selectedCustomer} onClose={() => setSelectedCustomer(null)} />}
      </div>
    </div>
  )
}

/* ── Main Finance Page ── */
const Finance = () => {
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('Company')
  
  const [summaryData, setSummaryData] = useState([])
  const [viewEntity, setViewEntity] = useState(null)

  const fetchSummary = () => {
    api.get('/finance/summary')
      .then(res => setSummaryData(res.data.data || []))
      .catch(err => console.error(err))
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const filtered = summaryData.filter(f => {
    const matchesTab = activeTab === 'all' || f.financeType.toLowerCase() === activeTab
    const matchesSearch = f.entityName.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  const tabs = [
    { key: 'all',     label: 'All Finance',     icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> },
    { key: 'company', label: 'Company Finance', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { key: 'private', label: 'Private Finance', icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg> },
  ]

  const openModal = (type) => { setModalType(type); setShowModal(true) }

  return (
    <div>
      {showModal && <AddFinanceModal onClose={() => setShowModal(false)} defaultType={modalType} />}
      {viewEntity && <ViewEntityFinancesModal entityName={viewEntity} onClose={() => setViewEntity(null)} />}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Finance Tracker</h1>
          <p>Monitor your company and private finance counts.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-outline" onClick={() => openModal('Private')}>
            Add Private Finance
          </button>
          <button className="btn btn-primary" onClick={() => openModal('Company')}>
            Add Company Finance
          </button>
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
          <div className="search-bar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Search Agent or Company..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Finance Type</th>
                <th>Agent / Company Name</th>
                <th>Total Cases</th>
                <th>Total Financed Amount (₹)</th>
                <th>Agent Login</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>No records found. Generate a bill with finance to see counts here.</td></tr> : null}
              {filtered.map((item, index) => (
                <tr key={`${item.financeType}-${item.entityName}`}>
                  <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                  <td>
                    <span className={`badge badge-${item.financeType === 'Company' ? 'primary' : 'warning'}`}>
                      {item.financeType}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600' }}>{item.entityName}</td>
                  <td style={{ fontWeight: '700', fontSize: '15px' }}>{item.totalCount}</td>
                  <td style={{ fontWeight: '600', color: 'var(--success)' }}>₹{item.totalFinancedAmount.toLocaleString('en-IN')}</td>
                  <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {item.financeType === 'Private' ? (
                      <>
                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>ID: {item.agentUsername}</div>
                        <div>Pass: {item.agentPassword}</div>
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="action-btn" title="View Details" onClick={() => setViewEntity(item.entityName)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button className="action-btn" title="Edit Name" style={{ color: 'var(--primary)' }} onClick={async () => {
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
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button className="action-btn" title="Delete All" style={{ color: 'var(--danger)' }} onClick={async () => {
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
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
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
