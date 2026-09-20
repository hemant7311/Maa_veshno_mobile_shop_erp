import React, { useEffect, useState } from 'react'
import {
  getAllLoans, getLoanSummary, createLoan, updateLoan, deleteLoan,
  cancelLoan, addLoanPayment, getLoanPayments
} from '../../services/api'

const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`
const formatDate = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return date.toISOString().split('T')[0]
}

const ToastContainer = ({ toasts, onRemove }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast toast-${t.type}`} onClick={() => onRemove(t.id)}>
        {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : '⚠'} {t.message}
      </div>
    ))}
  </div>
)

const useToasts = () => {
  const [toasts, setToasts] = useState([])
  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))
  return { toasts, showToast, removeToast }
}

const StatusBadge = ({ status }) => {
  const lower = String(status || '').toLowerCase()
  let cls = 'badge-warning', text = status
  if (lower === 'paid') { cls = 'badge-success'; text = 'Paid' }
  else if (lower === 'partial' || lower === 'partially paid') { cls = 'badge-primary'; text = 'Partial' }
  else if (lower === 'pending') { cls = 'badge-warning'; text = 'Pending' }
  else if (lower === 'cancelled') { cls = 'badge-danger'; text = 'Cancelled' }
  return <span className={`badge ${cls}`}>{text}</span>
}

/* ============ ADD / EDIT LOAN MODAL ============ */
const LoanFormModal = ({ onClose, onSaved, editLoan }) => {
  const isEdit = !!editLoan
  const today = formatDate(new Date())
  const [form, setForm] = useState({
    personName: editLoan?.personName || '',
    mobile: editLoan?.mobile || '',
    address: editLoan?.address || '',
    amount: editLoan?.originalAmount || editLoan?.amount || '',
    date: editLoan?.date ? formatDate(editLoan.date) : today,
    purpose: editLoan?.purpose || '',
    notes: editLoan?.notes || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!form.personName.trim()) { setError('Person name is required'); return }
    if (!form.mobile.trim()) { setError('Mobile number is required'); return }
    if (!form.amount || Number(form.amount) <= 0) { setError('Valid amount is required'); return }
    try {
      setSaving(true); setError('')
      const payload = {
        ...form,
        originalAmount: Number(form.amount)
      }
      if (isEdit) {
        await updateLoan(editLoan._id, payload)
      } else {
        await createLoan(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} loan`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{isEdit ? 'Edit Loan' : 'Add New Loan'}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isEdit ? 'Update loan details' : 'Enter loan given details'}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Person Name <span className="required">*</span></label>
              <input className="form-input" name="personName" value={form.personName} onChange={handleChange} placeholder="Enter person name" />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number <span className="required">*</span></label>
              <input className="form-input" name="mobile" value={form.mobile} onChange={handleChange} placeholder="Enter mobile no." />
            </div>
            <div className="form-group form-grid-full">
              <label className="form-label">Address</label>
              <input className="form-input" name="address" value={form.address} onChange={handleChange} placeholder="Enter address" />
            </div>
            <div className="form-group">
              <label className="form-label">Loan Amount (₹) <span className="required">*</span></label>
              <input type="number" className="form-input" name="amount" value={form.amount} onChange={handleChange} placeholder="Enter amount" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Date <span className="required">*</span></label>
              <input type="date" className="form-input" name="date" value={form.date} onChange={handleChange} />
            </div>
            <div className="form-group form-grid-full">
              <label className="form-label">Purpose</label>
              <input className="form-input" name="purpose" value={form.purpose} onChange={handleChange} placeholder="Purpose of loan (optional)" />
            </div>
            <div className="form-group form-grid-full">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="Additional notes (optional)" rows="3" />
            </div>
          </div>
          {error && <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '12px' }}>{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : (isEdit ? 'Update Loan' : 'Save Loan')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============ REPAYMENT MODAL ============ */
const RepaymentModal = ({ loan, onClose, onSaved }) => {
  const originalAmt = Number(loan?.originalAmount ?? loan?.amount ?? 0)
  const remaining = loan?.remainingAmount !== undefined && loan?.remainingAmount !== null
    ? Number(loan.remainingAmount)
    : Math.max(0, originalAmt - Number(loan?.paidAmount || 0))
  const today = formatDate(new Date())
  const [form, setForm] = useState({
    amount: '',
    date: today,
    paymentMethod: 'Cash',
    reference: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const amtNum = Number(form.amount)
  const exceeds = amtNum > remaining

  const handleSubmit = async () => {
    if (!amtNum || amtNum <= 0) { setError('Enter valid amount'); return }
    if (exceeds) { setError(`Amount cannot exceed remaining ${formatCurrency(remaining)}`); return }
    try {
      setSaving(true); setError('')
      await addLoanPayment(loan._id, {
        amount: amtNum,
        date: form.date,
        paymentMethod: form.paymentMethod,
        reference: form.reference,
        notes: form.notes
      })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add repayment')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Add Repayment</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {loan?.personName} · {loan?.mobile}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px', padding: '14px', background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Original</div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary)' }}>{formatCurrency(originalAmt)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Paid</div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--success)' }}>{formatCurrency(loan?.paidAmount)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Remaining</div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--danger)' }}>{formatCurrency(remaining)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <StatusBadge status={loan?.status} />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Amount (₹) <span className="required">*</span></label>
              <input type="number" className="form-input" name="amount" value={form.amount} onChange={handleChange} placeholder="Enter repayment amount" min="0" />
              {exceeds && <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px' }}>Amount exceeds remaining balance</p>}
            </div>
            <div className="form-group">
              <label className="form-label">Date <span className="required">*</span></label>
              <input type="date" className="form-input" name="date" value={form.date} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select className="form-select" name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Card">Card</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Reference No.</label>
              <input className="form-input" name="reference" value={form.reference} onChange={handleChange} placeholder="UPI/Cheque/Ref no." />
            </div>
            <div className="form-group form-grid-full">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="Optional notes" rows="2" />
            </div>
          </div>
          {error && <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '12px' }}>{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-success" onClick={handleSubmit} disabled={saving || exceeds}>
            {saving ? 'Saving...' : 'Record Repayment'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============ VIEW LOAN + HISTORY MODAL ============ */
const ViewLoanModal = ({ loan, onClose, payments, loadingPayments, viewHistory }) => {
  const originalAmt = Number(loan?.originalAmount ?? loan?.amount ?? 0)
  const remaining = loan?.remainingAmount !== undefined && loan?.remainingAmount !== null
    ? Number(loan.remainingAmount)
    : Math.max(0, originalAmt - Number(loan?.paidAmount || 0))
  return (
    <div className="modal-overlay" onClick={onClose} style={{ overflowY: 'auto' }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', margin: '24px auto' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Loan Details {viewHistory ? '& Payment History' : ''}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{loan?.personName}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
            <div className="stat-card" style={{ padding: '14px' }}>
              <div className="stat-card-label">Original Amount</div>
              <div className="stat-card-value blue">{formatCurrency(originalAmt)}</div>
            </div>
            <div className="stat-card" style={{ padding: '14px' }}>
              <div className="stat-card-label">Total Repaid</div>
              <div className="stat-card-value green">{formatCurrency(loan?.paidAmount)}</div>
            </div>
            <div className="stat-card" style={{ padding: '14px' }}>
              <div className="stat-card-label">Outstanding</div>
              <div className="stat-card-value red">{formatCurrency(remaining)}</div>
            </div>
            <div className="stat-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="stat-card-label">Status</div>
              <div style={{ marginTop: '6px' }}><StatusBadge status={loan?.status} /></div>
            </div>
          </div>
          <div className="form-grid" style={{ marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mobile</div>
              <div style={{ fontWeight: 600 }}>{loan?.mobile || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Date</div>
              <div style={{ fontWeight: 600 }}>{formatDate(loan?.date)}</div>
            </div>
            <div className="form-grid-full">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Address</div>
              <div style={{ fontWeight: 500 }}>{loan?.address || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Purpose</div>
              <div style={{ fontWeight: 500 }}>{loan?.purpose || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cancellation Reason</div>
              <div style={{ fontWeight: 500, color: String(loan?.status || '').toLowerCase() === 'cancelled' ? 'var(--danger)' : 'inherit' }}>{loan?.cancelReason || '—'}</div>
            </div>
            <div className="form-grid-full">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Notes</div>
              <div style={{ fontWeight: 500 }}>{loan?.notes || '—'}</div>
            </div>
          </div>
          <h3 className="section-title">Payment History</h3>
          {loadingPayments ? (
            <div className="loading-state" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Loading history...</div>
          ) : !payments || payments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No payments yet</h3>
              <p>No repayment records found</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px' }}>Date</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '10px' }}>Method</th>
                    <th style={{ padding: '10px' }}>Reference</th>
                    <th style={{ padding: '10px' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => (
                    <tr key={p._id || i}>
                      <td style={{ padding: '10px', fontSize: '13px' }}>{formatDate(p.date)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                      <td style={{ padding: '10px', fontSize: '13px' }}>{p.paymentMethod || '—'}</td>
                      <td style={{ padding: '10px', fontSize: '13px' }}>{p.reference || '—'}</td>
                      <td style={{ padding: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

/* ============ CANCEL CONFIRMATION MODAL ============ */
const CancelModal = ({ loan, onClose, onConfirmed }) => {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (!reason.trim()) { setError('Cancellation reason is required'); return }
    try {
      setSaving(true); setError('')
      await cancelLoan(loan._id, reason.trim())
      onConfirmed()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel loan')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Cancel Loan</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>This action cannot be undone</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div style={{ padding: '14px', background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid #FECACA' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cancelling loan for</div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--danger)' }}>{loan?.personName} — {formatCurrency(loan?.originalAmount ?? loan?.amount)}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason for Cancellation <span className="required">*</span></label>
            <textarea className="form-textarea" value={reason} onChange={e => { setReason(e.target.value); setError('') }} placeholder="Please specify reason for cancellation" rows="3" />
          </div>
          {error && <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '10px' }}>{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>No, Keep Loan</button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={saving}>
            {saving ? 'Cancelling...' : 'Yes, Cancel Loan'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============ DELETE CONFIRM MODAL ============ */
const DeleteConfirmModal = ({ loan, onClose, onConfirmed }) => {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const handleConfirm = async () => {
    try {
      setSaving(true); setError('')
      await deleteLoan(loan._id)
      onConfirmed()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete')
    } finally { setSaving(false) }
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Delete Loan Record</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to permanently delete the loan record for <strong>{loan?.personName}</strong> ({formatCurrency(loan?.originalAmount ?? loan?.amount)})? This action cannot be undone.</p>
          {error && <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '10px' }}>{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={saving}>
            {saving ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ========================== MAIN PAGE ========================== */
const Loans = () => {
  const [loans, setLoans] = useState([])
  const [summary, setSummary] = useState({ totalBorrowed: 0, totalRepaid: 0, totalOutstanding: 0 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingLoan, setEditingLoan] = useState(null)
  const [repaymentLoan, setRepaymentLoan] = useState(null)
  const [viewingLoan, setViewingLoan] = useState(null)
  const [_viewingHistory, setViewingHistory] = useState(null)
  const [cancellingLoan, setCancellingLoan] = useState(null)
  const [deletingLoan, setDeletingLoan] = useState(null)
  const [payments, setPayments] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [viewMode, setViewMode] = useState('details')

  const { toasts, showToast, removeToast } = useToasts()

  const loadAll = async () => {
    try {
      setLoading(true); setError('')
      const [loansRes, summaryRes] = await Promise.all([getAllLoans(), getLoanSummary()])
      const list = loansRes.data?.data || []
      const enriched = list.map(l => {
        const orig = Number(l.originalAmount ?? l.amount ?? 0)
        const paid = Number(l.paidAmount || 0)
        const remain = l.remainingAmount !== undefined && l.remainingAmount !== null
          ? Number(l.remainingAmount)
          : Math.max(0, orig - paid)
        let status = l.status
        if (!status || status === 'pending') {
          if (paid >= orig && orig > 0) status = 'Paid'
          else if (paid > 0) status = 'Partial'
          else status = 'Pending'
        }
        return {
          ...l,
          originalAmount: orig,
          paidAmount: paid,
          remainingAmount: remain,
          status: String(status).charAt(0).toUpperCase() + String(status).slice(1)
        }
      })
      setLoans(enriched)
      const s = summaryRes.data?.data || {}
      setSummary({
        totalBorrowed: s.totalBorrowed ?? enriched.reduce((a, l) => a + l.originalAmount, 0),
        totalRepaid: s.totalRepaid ?? enriched.reduce((a, l) => a + l.paidAmount, 0),
        totalOutstanding: s.totalOutstanding ?? enriched.reduce((a, l) => a + l.remainingAmount, 0)
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load loans. Please try again.')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  const loadPayments = async (loanId) => {
    try {
      setLoadingPayments(true)
      const res = await getLoanPayments(loanId)
      setPayments(res.data?.data || [])
    } catch { setPayments([]) } finally { setLoadingPayments(false) }
  }

  const filtered = loans.filter(l => {
    const matchSearch = !search || (
      (l.personName || '').toLowerCase().includes(search.toLowerCase()) ||
      (l.mobile || '').includes(search) ||
      (l.address || '').toLowerCase().includes(search.toLowerCase())
    )
    const matchStatus = statusFilter === 'All' || String(l.status || '').toLowerCase() === statusFilter.toLowerCase()
    return matchSearch && matchStatus
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const lastIdx = currentPage * itemsPerPage
  const firstIdx = lastIdx - itemsPerPage
  const pageItems = filtered.slice(firstIdx, lastIdx)

  const openView = (loan, isHistory = false) => {
    setViewingLoan(loan)
    setViewingHistory(loan)
    setViewMode(isHistory ? 'history' : 'details')
    loadPayments(loan._id)
  }

  const statCards = [
    { label: 'Total Borrowed', value: formatCurrency(summary.totalBorrowed), color: 'blue', icon: '💰' },
    { label: 'Total Repaid', value: formatCurrency(summary.totalRepaid), color: 'green', icon: '✅' },
    { label: 'Total Outstanding', value: formatCurrency(summary.totalOutstanding), color: 'red', icon: '⚠️' },
    { label: 'Total Records', value: filtered.length, color: 'orange', icon: '📋' }
  ]

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {showAddForm && (
        <LoanFormModal
          onClose={() => setShowAddForm(false)}
          onSaved={() => { setShowAddForm(false); loadAll(); showToast('Loan added successfully') }}
        />
      )}
      {editingLoan && (
        <LoanFormModal
          editLoan={editingLoan}
          onClose={() => setEditingLoan(null)}
          onSaved={() => { setEditingLoan(null); loadAll(); showToast('Loan updated successfully') }}
        />
      )}
      {repaymentLoan && (
        <RepaymentModal
          loan={repaymentLoan}
          onClose={() => setRepaymentLoan(null)}
          onSaved={() => { setRepaymentLoan(null); loadAll(); showToast('Repayment recorded successfully') }}
        />
      )}
      {viewingLoan && (
        <ViewLoanModal
          loan={viewingLoan}
          payments={payments}
          loadingPayments={loadingPayments}
          viewHistory={viewMode === 'history'}
          onClose={() => { setViewingLoan(null); setViewingHistory(null) }}
        />
      )}
      {cancellingLoan && (
        <CancelModal
          loan={cancellingLoan}
          onClose={() => setCancellingLoan(null)}
          onConfirmed={() => { setCancellingLoan(null); loadAll(); showToast('Loan cancelled successfully') }}
        />
      )}
      {deletingLoan && (
        <DeleteConfirmModal
          loan={deletingLoan}
          onClose={() => setDeletingLoan(null)}
          onConfirmed={() => { setDeletingLoan(null); loadAll(); showToast('Loan deleted successfully') }}
        />
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Loan Management</h1>
          <p>Track loans given, repayments and outstanding balances</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add New Loan
          </button>
        </div>
      </div>

      <div className="stat-cards-grid">
        {statCards.map((s, i) => (
          <div className="stat-card" key={i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-card-label">{s.label}</div>
                <div className={`stat-card-value ${s.color}`} style={{ fontSize: '22px', marginTop: '4px' }}>{s.value}</div>
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
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Search by name, mobile or address..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} />
            </div>
          </div>
          <div className="table-toolbar-right">
            <select className="form-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }} style={{ width: 'auto', height: '36px' }}>
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Loading loans...
          </div>
        ) : error ? (
          <div className="error-state" style={{ padding: '48px', textAlign: 'center', color: 'var(--danger)' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚠️</div>
            <h3>Something went wrong</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{error}</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: '14px' }} onClick={loadAll}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💰</div>
            <h3>No loans found</h3>
            <p>{search || statusFilter !== 'All' ? 'Try adjusting your search filters' : 'Click "Add New Loan" to record your first loan'}</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Person Name</th>
                    <th>Mobile</th>
                    <th>Address</th>
                    <th style={{ textAlign: 'right' }}>Original</th>
                    <th style={{ textAlign: 'right' }}>Paid</th>
                    <th style={{ textAlign: 'right' }}>Remaining</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((l, i) => (
                    <tr key={l._id}>
                      <td style={{ color: 'var(--text-muted)' }}>{firstIdx + i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{l.personName}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{l.mobile || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.address || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(l.originalAmount)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(l.paidAmount)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: l.remainingAmount > 0 ? 'var(--danger)' : 'var(--success)' }}>{formatCurrency(l.remainingAmount)}</td>
                      <td style={{ fontSize: '13px' }}>{formatDate(l.date)}</td>
                      <td><StatusBadge status={l.status} /></td>
                      <td>
                        <div className="action-btns" style={{ justifyContent: 'center' }}>
                          <button className="action-btn" title="View Details" onClick={() => openView(l, false)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          {String(l.status || '').toLowerCase() !== 'cancelled' && (
                            <button className="action-btn" title="Edit" onClick={() => setEditingLoan(l)} style={{ color: 'var(--orange)', borderColor: 'var(--orange-light)', background: 'var(--orange-light)' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            </button>
                          )}
                          {String(l.status || '').toLowerCase() !== 'cancelled' && String(l.status || '').toLowerCase() !== 'paid' && (
                            <button className="action-btn" title="Add Repayment" onClick={() => setRepaymentLoan(l)} style={{ color: 'var(--success)', borderColor: 'var(--success-light)', background: 'var(--success-light)' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </button>
                          )}
                          <button className="action-btn" title="Payment History" onClick={() => openView(l, true)} style={{ color: 'var(--primary)', borderColor: 'var(--primary-light)', background: 'var(--primary-light)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          </button>
                          {String(l.status || '').toLowerCase() !== 'cancelled' && (
                            <button className="action-btn danger" title="Cancel Loan" onClick={() => setCancellingLoan(l)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            </button>
                          )}
                          <button className="action-btn danger" title="Delete" onClick={() => setDeletingLoan(l)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="table-footer">
                <span>Showing {filtered.length === 0 ? 0 : firstIdx + 1} to {Math.min(lastIdx, filtered.length)} of {filtered.length} records</span>
                <div className="pagination">
                  <button className="pagination-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>‹</button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i + 1} className={`pagination-btn${currentPage === i + 1 ? ' active' : ''}`} onClick={() => setCurrentPage(i + 1)}>
                      {i + 1}
                    </button>
                  ))}
                  <button className="pagination-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>›</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Loans
