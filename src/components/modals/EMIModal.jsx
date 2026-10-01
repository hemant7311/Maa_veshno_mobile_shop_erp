import React, { useState } from 'react'
import api from '../../services/api'
import ViewBillModal from './ViewBillModal'

const EMIModal = ({ record, onClose, onRefresh }) => {
  const [showBill, setShowBill] = useState(false)
  const [loadingId, setLoadingId] = useState(null)
  
  // Use the full record (which includes our computed .stats)
  // or fallback to basic calculations if .stats isn't available
  const stats = record.stats || {}
  
  const [emiSchedule, setEmiSchedule] = useState(() => {
    if (record.installments && record.installments.length > 0) {
      return record.installments.map(inst => ({
        id: inst.installmentNumber,
        dueDate: inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
        amount: inst.expectedAmount,
        paidAmount: inst.paidAmount || 0,
        remainingAmount: inst.remainingAmount !== undefined ? inst.remainingAmount : (inst.expectedAmount - (inst.paidAmount || 0)),
        status: inst.status
      }))
    }
    return []
  })

  const toggleStatus = async (id) => {
      if (loadingId) return // Prevent duplicate clicks

      const currentEmi = emiSchedule.find(e => e.id === id);
      if (!currentEmi) return

      let newStatus = currentEmi.status === 'Paid' ? 'Pending' : 'Paid';
      let paymentAmount = undefined;
      
      if (currentEmi.status === 'Partially Paid') {
        newStatus = 'Paid';
      }

      if (newStatus === 'Paid') {
        paymentAmount = currentEmi.remainingAmount !== undefined ? currentEmi.remainingAmount : currentEmi.amount;
      } else {
        if (!window.confirm(`Are you sure you want to REVERSE this payment? This will refund ₹${currentEmi.paidAmount || currentEmi.amount} to customer balance.`)) {
          return;
        }
      }

      try {

      setLoadingId(id);
      const res = await api.put(`/finance/${record._id}/emi/${id}`, { status: newStatus, amount: paymentAmount });
      if (res.data?.data?.installments) {
        setEmiSchedule(res.data.data.installments.map(inst => ({
          id: inst.installmentNumber,
          dueDate: inst.dueDate ? new Date(inst.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
          amount: inst.expectedAmount,
          paidAmount: inst.paidAmount || 0,
          remainingAmount: inst.remainingAmount !== undefined ? inst.remainingAmount : (inst.expectedAmount - (inst.paidAmount || 0)),
          status: inst.status
        })));
        
        // Let parent update global stats if needed
        if (onRefresh) onRefresh()
      }
    } catch (err) {
      console.error('Failed to sync EMI status', err);
      const errData = err.response?.data || {};
      let errorMsg = errData.message || 'Failed to update EMI status';
      
      // Detailed validation parsing
      if (errData.errors && typeof errData.errors === 'object' && Object.keys(errData.errors).length > 0) {
        // Exclude potentially sensitive fields if any exist (though usually field names are safe)
        const details = Object.entries(errData.errors)
          .map(([field, msg]) => `${field}: ${msg}`)
          .join('\n');
        errorMsg += '\n\nDetails:\n' + details;
      }
      
      alert(errorMsg);
    } finally {
      setLoadingId(null);
    }
  }

  const grandTotal = Number(record.totalLimit) || 0
  const financedAmt = Number(record.usedLimit) || 0
  const dpAmount = stats.dpAmount !== undefined ? stats.dpAmount : Math.max(0, grandTotal - financedAmt)

  return (
    <div className="modal-overlay" onClick={onClose} style={{ background: 'rgba(0,0,0,0.6)', overflowY: 'auto', zIndex: 1000 }}>
      {showBill && record.billRef && <ViewBillModal invoiceNumber={record.billRef} onClose={() => setShowBill(false)} />}

      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px', margin: '40px auto', background: 'var(--bg)' }}>
        <div className="modal-header" style={{ background: 'var(--white)' }}>
          <h2 className="modal-title">Customer Finance Details - {record.billRef || 'N/A'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body" style={{ background: 'var(--white)', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px', padding: '16px', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Customer Name</div>
              <div style={{ fontWeight: '600', fontSize: '16px' }}>{record.customerName}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>📞 {record.mobileNumber}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Product Details</div>
              <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--primary)' }}>{record.productDetails || 'N/A'}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Invoice: <strong>{record.billRef || 'N/A'}</strong>
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
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Tenure: {stats.totalInstallments || record.tenure || 0} Months | 
                EMI: ₹{record.emiAmount?.toLocaleString('en-IN') || 0}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Amount Details</div>
              <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--success)' }}>Financed: ₹{financedAmt.toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Bill Total: ₹{grandTotal.toLocaleString('en-IN')} | DP: ₹{dpAmount.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
             <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}>
               <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Scheduled EMI Total</div>
               <div style={{ fontWeight: '600', fontSize: '15px' }}>₹{(stats.totalScheduledEmiAmount || 0).toLocaleString('en-IN')}</div>
             </div>
             <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}>
               <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>EMI Received</div>
               <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--success)' }}>₹{(stats.totalEmiAmountPaid || 0).toLocaleString('en-IN')}</div>
             </div>
             <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}>
               <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pending Amount</div>
               <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--danger)' }}>₹{(stats.totalPendingEmiAmount || 0).toLocaleString('en-IN')}</div>
             </div>
             <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}>
               <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Paid / Pending</div>
               <div style={{ fontWeight: '600', fontSize: '15px' }}>
                 <span style={{color: 'var(--success)'}}>{stats.paidInstallmentCount || 0}</span> / 
                 <span style={{color: 'var(--danger)'}}> {stats.pendingInstallmentCount || 0}</span>
               </div>
             </div>
             <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}>
               <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Overdue Amount</div>
               <div style={{ fontWeight: '600', fontSize: '15px', color: (stats.overdueAmount > 0) ? 'var(--danger)' : 'var(--text-primary)' }}>
                 ₹{(stats.overdueAmount || 0).toLocaleString('en-IN')} ({stats.overdueInstallmentCount || 0})
               </div>
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
                      <th style={{ padding: '12px', textAlign: 'right' }}>Remaining (₹)</th>
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
                          <td style={{ textAlign: 'right', fontWeight: '600', color: 'var(--danger)' }}>₹{(emi.remainingAmount || 0).toLocaleString('en-IN')}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge badge-${isPaid ? 'success' : emi.status === 'Overdue' ? 'danger' : 'warning'}`}>
                              {emi.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', cursor: loadingId === emi.id ? 'not-allowed' : 'pointer', gap: '6px', opacity: loadingId === emi.id ? 0.5 : 1 }}>
                              <input 
                                type="checkbox" 
                                checked={isPaid} 
                                onChange={() => toggleStatus(emi.id)} 
                                disabled={loadingId === emi.id}
                                style={{ width: '16px', height: '16px', cursor: 'inherit', accentColor: 'var(--success)' }}
                              />
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', userSelect: 'none' }}>
                                {loadingId === emi.id ? 'Saving...' : 'Mark Paid'}
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

export default EMIModal
