import React, { useEffect, useState } from 'react'
import {
  getAllCustomerReceivables, getCustomerReceivableSummary, createCustomerReceivable,
  updateCustomerReceivable, deleteCustomerReceivable, cancelCustomerReceivable,
  giveMoney, receiveMoney, getCustomerReceivablePayments
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
  if (lower === 'paid' || lower === 'received' || lower === 'settled') { cls = 'badge-success'; text = 'Received' }
  else if (lower === 'partial' || lower === 'partially received') { cls = 'badge-primary'; text = 'Partial' }
  else if (lower === 'pending') { cls = 'badge-warning'; text = 'Pending' }
  else if (lower === 'cancelled') { cls = 'badge-danger'; text = 'Cancelled' }
  else if (lower === 'given') { cls = 'badge-info'; text = 'Given' }
  return <span className={`badge ${cls}`}>{text}</span>
}

/* ============ NEW RECORD FORM MODAL ============ */
const NewRecordModal = ({ onClose, onSaved, editRecord }) => {
  const isEdit = !!editRecord
  const today = formatDate(new Date())
  const [form, setForm] = useState({
    customerName: editRecord?.customerName || '',
    mobile: editRecord?.mobile || '',
    amount: editRecord?.givenAmount ?? editRecord?.amountGiven ?? editRecord?.amount ?? '',
    date: editRecord?.date ? formatDate(editRecord.date) : today,
    notes: editRecord?.notes || ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!form.customerName.trim()) { setError('Customer name is required'); return }
    if (!form.mobile.trim()) { setError('Mobile number is required'); return }
    if (!form.amount || Number(form.amount) <= 0) { setError('Valid amount is required'); return }
    try {
      setSaving(true); setError('')
      const payload = {
        customerName: form.customerName,
        mobile: form.mobile,
        givenAmount: Number(form.amount),
        date: form.date,
        notes: form.notes
      }
      if (isEdit) {
        await updateCustomerReceivable(editRecord._id, payload)
      } else {
        await createCustomerReceivable(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} record`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">{isEdit ? 'Edit Record' : 'New Money Given Record'}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isEdit ? 'Update money given details' : 'Record money given to a customer'}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Customer Name <span className="required">*</span></label>
              <input className="form-input" name="customerName" value={form.customerName} onChange={handleChange} placeholder="Enter customer name" />
            </div>
            <div className="form-group">
              <label className="form-label">Mobile Number <span className="required">*</span></label>
              <input className="form-input" name="mobile" value={form.mobile} onChange={handleChange} placeholder="Enter mobile no." />
            </div>
            <div className="form-group">
              <label className="form-label">Amount Given (₹) <span className="required">*</span></label>
              <input type="number" className="form-input" name="amount" value={form.amount} onChange={handleChange} placeholder="Enter amount given" min="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Date <span className="required">*</span></label>
              <input type="date" className="form-input" name="date" value={form.date} onChange={handleChange} />
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
            {saving ? 'Saving...' : (isEdit ? 'Update Record' : 'Save Record')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============ GIVE MONEY MODAL ============ */
const GiveMoneyModal = ({ record, onClose, onSaved }) => {
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

  const handleSubmit = async () => {
    const amtNum = Number(form.amount)
    if (!amtNum || amtNum <= 0) { setError('Enter valid amount'); return }
    try {
      setSaving(true); setError('')
      await giveMoney(record._id, {
        amount: amtNum,
        date: form.date,
        paymentMethod: form.paymentMethod,
        reference: form.reference,
        notes: form.notes
      })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record money given')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Give More Money</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {record?.customerName} · {record?.mobile}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Amount (₹) <span className="required">*</span></label>
              <input type="number" className="form-input" name="amount" value={form.amount} onChange={handleChange} placeholder="Enter amount" min="0" autoFocus />
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
              <input className="form-input" name="reference" value={form.reference} onChange={handleChange} placeholder="Ref/UPI/Cheque no." />
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
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : 'Record Money Given'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============ RECEIVE MONEY MODAL (WITH VALIDATION) ============ */
const ReceiveMoneyModal = ({ record, onClose, onSaved }) => {
  const given = Number(record?.givenAmount ?? record?.amountGiven ?? 0)
  const received = Number(record?.receivedAmount ?? record?.amountReceived ?? 0)
  const remaining = record?.remainingAmount !== undefined && record?.remainingAmount !== null
    ? Number(record.remainingAmount)
    : Math.max(0, given - received)
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
  const validAmount = amtNum > 0 && !exceeds

  const handleSubmit = async () => {
    if (!validAmount) {
      setError(exceeds ? `Amount cannot exceed remaining ${formatCurrency(remaining)}` : 'Enter valid amount')
      return
    }
    try {
      setSaving(true); setError('')
      await receiveMoney(record._id, {
        amount: amtNum,
        date: form.date,
        paymentMethod: form.paymentMethod,
        reference: form.reference,
        notes: form.notes
      })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record money received')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Receive Money</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {record?.customerName} · {record?.mobile}
            </p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '20px', padding: '14px', background: 'var(--bg)', borderRadius: 'var(--radius-md)' }}>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Given</div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--primary)' }}>{formatCurrency(given)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Received</div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--success)' }}>{formatCurrency(received)}</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Remaining</div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--danger)' }}>{formatCurrency(remaining)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <StatusBadge status={record?.status} />
            </div>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Amount (₹) <span className="required">*</span></label>
              <input type="number" className="form-input" name="amount" value={form.amount} onChange={handleChange} placeholder={`Max ${formatCurrency(remaining)}`} min="0" style={{ borderColor: exceeds ? 'var(--danger)' : undefined }} autoFocus />
              {exceeds && (
                <p style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px', fontWeight: 600 }}>
                  ⚠ Amount cannot exceed remaining {formatCurrency(remaining)}
                </p>
              )}
              {!exceeds && amtNum > 0 && remaining > 0 && (
                <p style={{ fontSize: '12px', color: 'var(--success)', marginTop: '4px' }}>
                  After this: {formatCurrency(remaining - amtNum)} will remain
                </p>
              )}
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
              <input className="form-input" name="reference" value={form.reference} onChange={handleChange} placeholder="Ref/UPI/Cheque no." />
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
          <button className="btn btn-success" onClick={handleSubmit} disabled={saving || exceeds || !validAmount}>
            {saving ? 'Saving...' : 'Record Received'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============ VIEW + HISTORY MODAL ============ */
const ViewRecordModal = ({ record, onClose, payments, loadingPayments, isHistory }) => {
  const given = Number(record?.givenAmount ?? record?.amountGiven ?? 0)
  const received = Number(record?.receivedAmount ?? record?.amountReceived ?? 0)
  const remaining = record?.remainingAmount !== undefined && record?.remainingAmount !== null
    ? Number(record.remainingAmount)
    : Math.max(0, given - received)
  return (
    <div className="modal-overlay" onClick={onClose} style={{ overflowY: 'auto' }}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', margin: '24px auto' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Record Details {isHistory ? '& Transaction History' : ''}</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{record?.customerName}</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
            <div className="stat-card" style={{ padding: '14px' }}>
              <div className="stat-card-label">Total Given</div>
              <div className="stat-card-value blue">{formatCurrency(given)}</div>
            </div>
            <div className="stat-card" style={{ padding: '14px' }}>
              <div className="stat-card-label">Total Received</div>
              <div className="stat-card-value green">{formatCurrency(received)}</div>
            </div>
            <div className="stat-card" style={{ padding: '14px' }}>
              <div className="stat-card-label">Remaining</div>
              <div className="stat-card-value red">{formatCurrency(remaining)}</div>
            </div>
            <div className="stat-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div className="stat-card-label">Status</div>
              <div style={{ marginTop: '6px' }}><StatusBadge status={record?.status} /></div>
            </div>
          </div>
          <div className="form-grid" style={{ marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mobile</div>
              <div style={{ fontWeight: 600 }}>{record?.mobile || '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Date</div>
              <div style={{ fontWeight: 600 }}>{formatDate(record?.date)}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cancelled</div>
              <div style={{ fontWeight: 500, color: String(record?.status || '').toLowerCase() === 'cancelled' ? 'var(--danger)' : 'var(--text-secondary)' }}>
                {String(record?.status || '').toLowerCase() === 'cancelled' ? 'Yes' : 'No'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Last Updated</div>
              <div style={{ fontWeight: 500 }}>{record?.updatedAt ? formatDate(record.updatedAt) : '—'}</div>
            </div>
            <div className="form-grid-full">
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Notes</div>
              <div style={{ fontWeight: 500 }}>{record?.notes || '—'}</div>
            </div>
          </div>
          <h3 className="section-title">Transaction History</h3>
          {loadingPayments ? (
            <div className="loading-state" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Loading history...</div>
          ) : !payments || payments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <h3>No transactions yet</h3>
              <p>Use Give Money or Receive Money actions to record transactions</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ padding: '10px' }}>Date</th>
                    <th style={{ padding: '10px' }}>Type</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '10px' }}>Method</th>
                    <th style={{ padding: '10px' }}>Reference</th>
                    <th style={{ padding: '10px' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, i) => {
                    const tType = p.type || (p.amount && p.amountGiven || p.amountGivenDelta ? 'Given' : 'Received')
                    const tLower = String(tType).toLowerCase()
                    return (
                      <tr key={p._id || i}>
                        <td style={{ padding: '10px', fontSize: '13px' }}>{formatDate(p.date || p.createdAt)}</td>
                        <td style={{ padding: '10px' }}>
                          <span className={`badge ${tLower.includes('give') ? 'badge-primary' : 'badge-success'}`}>
                            {tLower.includes('give') ? 'Given' : 'Received'}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: tLower.includes('give') ? 'var(--primary)' : 'var(--success)' }}>
                          {formatCurrency(p.amount || p.amountGiven || p.amountReceived)}
                        </td>
                        <td style={{ padding: '10px', fontSize: '13px' }}>{p.paymentMethod || '—'}</td>
                        <td style={{ padding: '10px', fontSize: '13px' }}>{p.reference || '—'}</td>
                        <td style={{ padding: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>{p.notes || '—'}</td>
                      </tr>
                    )
                  })}
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

/* ============ CANCEL MODAL ============ */
const CancelModal = ({ record, onClose, onConfirmed }) => {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const handleConfirm = async () => {
    try {
      setSaving(true); setError('')
      await cancelCustomerReceivable(record._id)
      onConfirmed()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel')
    } finally { setSaving(false) }
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Cancel Record</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>This action cannot be undone</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <div style={{ padding: '14px', background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', marginBottom: '16px', border: '1px solid #FECACA' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cancelling record for</div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--danger)' }}>
              {record?.customerName} · Given {formatCurrency(record?.givenAmount ?? record?.amountGiven)} · Remaining {formatCurrency(Math.max(0, Number(record?.givenAmount ?? record?.amountGiven ?? 0) - Number(record?.receivedAmount ?? record?.amountReceived ?? 0)))}
            </div>
          </div>
          <p>Are you sure you want to cancel this money given record? This will mark the record as cancelled.</p>
          {error && <p style={{ fontSize: '13px', color: 'var(--danger)', marginTop: '10px' }}>{error}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>No, Keep Record</button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={saving}>
            {saving ? 'Cancelling...' : 'Yes, Cancel Record'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ============ DELETE MODAL ============ */
const DeleteConfirmModal = ({ record, onClose, onConfirmed }) => {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const handleConfirm = async () => {
    try {
      setSaving(true); setError('')
      await deleteCustomerReceivable(record._id)
      onConfirmed()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete')
    } finally { setSaving(false) }
  }
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Delete Record Permanently</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to permanently delete the money given record for <strong>{record?.customerName}</strong> (Given: {formatCurrency(record?.givenAmount ?? record?.amountGiven)})? This action cannot be undone.</p>
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
const CustomerReceivables = () => {
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState({ totalGiven: 0, totalReceived: 0, totalOutstanding: 0 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [giveMoneyRecord, setGiveMoneyRecord] = useState(null)
  const [receiveMoneyRecord, setReceiveMoneyRecord] = useState(null)
  const [viewingRecord, setViewingRecord] = useState(null)
  const [_viewingHistory, setViewingHistory] = useState(null)
  const [cancellingRecord, setCancellingRecord] = useState(null)
  const [deletingRecord, setDeletingRecord] = useState(null)
  const [payments, setPayments] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [viewMode, setViewMode] = useState('details')

  const { toasts, showToast, removeToast } = useToasts()

  const computeStatus = (r) => {
    if (r.status && r.status !== 'pending') return r.status
    const given = Number(r.givenAmount ?? r.amountGiven ?? r.amount ?? 0)
    const received = Number(r.receivedAmount ?? r.amountReceived ?? 0)
    if (received >= given && given > 0) return 'Received'
    if (received > 0) return 'Partial'
    return 'Pending'
  }

  const loadAll = async () => {
    try {
      setLoading(true); setError('')
      const [recordsRes, summaryRes] = await Promise.all([
        getAllCustomerReceivables(),
        getCustomerReceivableSummary()
      ])
      const list = recordsRes.data?.data || []
      const enriched = list.map(r => {
        const given = Number(r.givenAmount ?? r.amountGiven ?? r.amount ?? 0)
        const received = Number(r.receivedAmount ?? r.amountReceived ?? 0)
        const remain = r.remainingAmount !== undefined && r.remainingAmount !== null
          ? Number(r.remainingAmount)
          : Math.max(0, given - received)
        let status = computeStatus(r)
        return {
          ...r,
          givenAmount: given,
          amountGiven: given,
          receivedAmount: received,
          amountReceived: received,
          remainingAmount: remain,
          status: String(status).charAt(0).toUpperCase() + String(status).slice(1)
        }
      })
      setRecords(enriched)
      const s = summaryRes.data?.data || {}
      setSummary({
        totalGiven: s.totalGiven ?? enriched.reduce((a, r) => a + r.givenAmount, 0),
        totalReceived: s.totalReceived ?? enriched.reduce((a, r) => a + r.receivedAmount, 0),
        totalOutstanding: s.totalOutstanding ?? enriched.reduce((a, r) => a + r.remainingAmount, 0)
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load records. Please try again.')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadAll() }, [])

  const loadPayments = async (id) => {
    try {
      setLoadingPayments(true)
      const res = await getCustomerReceivablePayments(id)
      setPayments(res.data?.data || [])
    } catch { setPayments([]) } finally { setLoadingPayments(false) }
  }

  const filtered = records.filter(r => {
    const matchSearch = !search || (
      (r.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.mobile || '').includes(search)
    )
    const rStatus = String(r.status || '').toLowerCase()
    const filterLower = statusFilter.toLowerCase()
    const matchStatus = statusFilter === 'All' || rStatus === filterLower
    return matchSearch && matchStatus
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const lastIdx = currentPage * itemsPerPage
  const firstIdx = lastIdx - itemsPerPage
  const pageItems = filtered.slice(firstIdx, lastIdx)

  const openView = (rec, isHistory = false) => {
    setViewingRecord(rec)
    setViewingHistory(rec)
    setViewMode(isHistory ? 'history' : 'details')
    loadPayments(rec._id)
  }

  const statCards = [
    { label: 'Total Given', value: formatCurrency(summary.totalGiven), color: 'blue', icon: '💸' },
    { label: 'Total Received', value: formatCurrency(summary.totalReceived), color: 'green', icon: '✅' },
    { label: 'Total Outstanding', value: formatCurrency(summary.totalOutstanding), color: 'red', icon: '⚠️' },
    { label: 'Total Records', value: filtered.length, color: 'orange', icon: '📋' }
  ]

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {showAddForm && (
        <NewRecordModal
          onClose={() => setShowAddForm(false)}
          onSaved={() => { setShowAddForm(false); loadAll(); showToast('Record created successfully') }}
        />
      )}
      {editingRecord && (
        <NewRecordModal
          editRecord={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaved={() => { setEditingRecord(null); loadAll(); showToast('Record updated successfully') }}
        />
      )}
      {giveMoneyRecord && (
        <GiveMoneyModal
          record={giveMoneyRecord}
          onClose={() => setGiveMoneyRecord(null)}
          onSaved={() => { setGiveMoneyRecord(null); loadAll(); showToast('Money given recorded successfully') }}
        />
      )}
      {receiveMoneyRecord && (
        <ReceiveMoneyModal
          record={receiveMoneyRecord}
          onClose={() => setReceiveMoneyRecord(null)}
          onSaved={() => { setReceiveMoneyRecord(null); loadAll(); showToast('Money received recorded successfully') }}
        />
      )}
      {viewingRecord && (
        <ViewRecordModal
          record={viewingRecord}
          payments={payments}
          loadingPayments={loadingPayments}
          isHistory={viewMode === 'history'}
          onClose={() => { setViewingRecord(null); setViewingHistory(null) }}
        />
      )}
      {cancellingRecord && (
        <CancelModal
          record={cancellingRecord}
          onClose={() => setCancellingRecord(null)}
          onConfirmed={() => { setCancellingRecord(null); loadAll(); showToast('Record cancelled successfully') }}
        />
      )}
      {deletingRecord && (
        <DeleteConfirmModal
          record={deletingRecord}
          onClose={() => setDeletingRecord(null)}
          onConfirmed={() => { setDeletingRecord(null); loadAll(); showToast('Record deleted successfully') }}
        />
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Money Given (Customer Receivables)</h1>
          <p>Track money given to customers and collections</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Record
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
              <input placeholder="Search by customer name or mobile..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} />
            </div>
          </div>
          <div className="table-toolbar-right">
            <select className="form-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }} style={{ width: 'auto', height: '36px' }}>
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Partial">Partial</option>
              <option value="Received">Received</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Loading records...
          </div>
        ) : error ? (
          <div className="error-state" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>⚠️</div>
            <h3 style={{ color: 'var(--danger)' }}>Something went wrong</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>{error}</p>
            <button className="btn btn-primary btn-sm" style={{ marginTop: '14px' }} onClick={loadAll}>Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <h3>No records found</h3>
            <p>{search || statusFilter !== 'All' ? 'Try adjusting your search filters' : 'Click "New Record" to record your first transaction'}</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Customer Name</th>
                    <th>Mobile</th>
                    <th style={{ textAlign: 'right' }}>Given</th>
                    <th style={{ textAlign: 'right' }}>Received</th>
                    <th style={{ textAlign: 'right' }}>Remaining</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((r, i) => (
                    <tr key={r._id}>
                      <td style={{ color: 'var(--text-muted)' }}>{firstIdx + i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{r.customerName}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{r.mobile || '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>{formatCurrency(r.amountGiven)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(r.amountReceived)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: r.remainingAmount > 0 ? 'var(--danger)' : 'var(--success)' }}>{formatCurrency(r.remainingAmount)}</td>
                      <td style={{ fontSize: '13px' }}>{formatDate(r.date)}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td>
                        <div className="action-btns" style={{ justifyContent: 'center' }}>
                          <button className="action-btn" title="View Details" onClick={() => openView(r, false)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                          {String(r.status || '').toLowerCase() !== 'cancelled' && (
                            <button className="action-btn" title="Edit Record" onClick={() => setEditingRecord(r)} style={{ color: 'var(--orange)', borderColor: 'var(--orange-light)', background: 'var(--orange-light)' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            </button>
                          )}
                          {String(r.status || '').toLowerCase() !== 'cancelled' && (
                            <button className="action-btn" title="Give More Money" onClick={() => setGiveMoneyRecord(r)} style={{ color: 'var(--primary)', borderColor: 'var(--primary-light)', background: 'var(--primary-light)' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            </button>
                          )}
                          {String(r.status || '').toLowerCase() !== 'cancelled' && String(r.status || '').toLowerCase() !== 'received' && r.remainingAmount > 0 && (
                            <button className="action-btn" title="Receive Money" onClick={() => setReceiveMoneyRecord(r)} style={{ color: 'var(--success)', borderColor: 'var(--success-light)', background: 'var(--success-light)' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                            </button>
                          )}
                          <button className="action-btn" title="Transaction History" onClick={() => openView(r, true)} style={{ color: 'var(--info)', borderColor: 'var(--info-light)', background: 'var(--info-light)' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          </button>
                          {String(r.status || '').toLowerCase() !== 'cancelled' && (
                            <button className="action-btn danger" title="Cancel Record" onClick={() => setCancellingRecord(r)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                            </button>
                          )}
                          <button className="action-btn danger" title="Delete" onClick={() => setDeletingRecord(r)}>
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

export default CustomerReceivables
