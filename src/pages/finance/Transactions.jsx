import React, { useEffect, useState, useMemo } from 'react'
import { getAllTransactions, getTransactionSummary } from '../../services/api'

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

const TRANSACTION_TYPE_CONFIG = {
  sale:              { label: 'Sale',              icon: '💰', cls: 'badge-success' },
  purchase:          { label: 'Purchase',          icon: '📦', cls: 'badge-primary' },
  customer_payment:  { label: 'Customer Payment',  icon: '💵', cls: 'badge-success' },
  supplier_payment:  { label: 'Supplier Payment',  icon: '🏦', cls: 'badge-primary' },
  loan_payment:      { label: 'Loan Payment',      icon: '📝', cls: 'badge-warning' },
  receivable_payment:{ label: 'Receivable Payment',icon: '🔄', cls: 'badge-warning' },
  expense:           { label: 'Expense',           icon: '💸', cls: 'badge-danger' },
  emi:               { label: 'EMI',               icon: '📅', cls: 'badge-warning' },
  return:            { label: 'Return',            icon: '↩️', cls: 'badge-danger' },
  refund:            { label: 'Refund',            icon: '💰', cls: 'badge-danger' },
}

const INCOME_TYPES = new Set(['customer_payment', 'loan_payment', 'receivable_payment'])
const NEUTRAL_TYPES = new Set(['sale', 'purchase']) // For display purposes, these are neither direct cash in nor out, though purchase is an outflow of stock/money and sale is inflow of revenue. We will handle their display in the component.

const TransactionTypeBadge = ({ type }) => {
  const config = TRANSACTION_TYPE_CONFIG[type] || { label: String(type || 'Unknown').replace(/_/g, ' '), icon: '📋', cls: 'badge-warning' }
  return (
    <span className={`badge ${config.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textTransform: 'capitalize' }}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  )
}

const TYPE_OPTIONS = [
  { value: 'All',               label: 'All Types' },
  { value: 'sale',              label: 'Sales' },
  { value: 'purchase',          label: 'Purchases' },
  { value: 'customer_payment',  label: 'Customer Payments' },
  { value: 'supplier_payment',  label: 'Supplier Payments' },
  { value: 'loan_payment',      label: 'Loan Payments' },
  { value: 'receivable_payment',label: 'Receivable Payments' },
  { value: 'expense',           label: 'Expenses' },
  { value: 'emi',               label: 'EMI' },
  { value: 'return',            label: 'Returns' },
  { value: 'refund',            label: 'Refunds' },
]

const PAYMENT_METHOD_OPTIONS = [
  'All', 'Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque'
]

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const { toasts, showToast, removeToast } = useToasts()

  const loadAll = async () => {
    try {
      setLoading(true)
      setError('')

      const params = {}
      if (startDate) params.startDate = startDate
      if (endDate) params.endDate = endDate
      if (typeFilter !== 'All') params.type = typeFilter

      const [txRes, summaryRes] = await Promise.all([
        getAllTransactions(params),
        getTransactionSummary(params).catch(() => null)
      ])

      const list = txRes.data?.data || []
      setTransactions(list)

      if (summaryRes && summaryRes.data?.data) {
        setSummary(summaryRes.data.data)
      } else {
        setSummary(null)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load transactions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [startDate, endDate, typeFilter])

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchSearch = !search || (
        (t.referenceNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.relatedEntity || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.notes || '').toLowerCase().includes(search.toLowerCase())
      )
      const matchType = typeFilter === 'All' || t.transactionType === typeFilter
      const matchMethod = paymentMethodFilter === 'All' ||
        String(t.paymentMethod || '').toLowerCase() === String(paymentMethodFilter).toLowerCase()
      return matchSearch && matchType && matchMethod
    })
  }, [transactions, search, typeFilter, paymentMethodFilter])

  useEffect(() => { setCurrentPage(1) }, [search, paymentMethodFilter, startDate, endDate, typeFilter])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const lastIdx = currentPage * itemsPerPage
  const firstIdx = lastIdx - itemsPerPage
  const pageItems = filtered.slice(firstIdx, lastIdx)

  const computedStats = useMemo(() => {
    const totalTransactions = filtered.length
    const totalAmountIn = filtered
      .filter(t => INCOME_TYPES.has(t.transactionType))
      .reduce((a, t) => a + Number(t.amount || 0), 0)

    const typeCounts = {}
    const methodCounts = {}
    filtered.forEach(t => {
      const ty = t.transactionType || 'unknown'
      typeCounts[ty] = (typeCounts[ty] || 0) + 1
      const m = String(t.paymentMethod || 'Other')
      methodCounts[m] = (methodCounts[m] || 0) + 1
    })

    let topCategory = '—'
    let topCount = 0
    Object.entries(typeCounts).forEach(([k, v]) => {
      if (v > topCount) { topCount = v; topCategory = k }
    })
    const topCatConfig = TRANSACTION_TYPE_CONFIG[topCategory]
    const topCategoryLabel = topCatConfig ? `${topCatConfig.label} (${topCount})` : (topCount ? `${topCategory} (${topCount})` : '—')

    const cashTotal = Object.entries(methodCounts)
      .filter(([k]) => k.toLowerCase() === 'cash')
      .reduce((a, [, v]) => a + v, 0)
    const upiTotal = Object.entries(methodCounts)
      .filter(([k]) => k.toLowerCase() === 'upi')
      .reduce((a, [, v]) => a + v, 0)
    const byMethodLabel = filtered.length === 0 ? '—' : `Cash: ${cashTotal} · UPI: ${upiTotal}`

    return {
      totalTransactions: summary?.totalTransactions ?? totalTransactions,
      totalAmountIn: summary?.totalAmountIn ?? totalAmountIn,
      topCategoryLabel: summary?.topCategory ?? topCategoryLabel,
      byMethodLabel: summary?.byMethod ?? byMethodLabel,
    }
  }, [filtered, summary])

  const statCards = [
    { label: 'Total Transactions', value: computedStats.totalTransactions, color: 'blue',   icon: '📊' },
    { label: 'Total Amount (In)',  value: formatCurrency(computedStats.totalAmountIn), color: 'green',  icon: '💵' },
    { label: 'Top Category',       value: computedStats.topCategoryLabel, color: 'orange', icon: '🏷️' },
    { label: 'By Method (Cash/UPI)', value: computedStats.byMethodLabel, color: 'purple', icon: '💳' },
  ]

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <div className="page-header-left">
          <h1>Transactions</h1>
          <p>View all financial transactions, payments and records</p>
        </div>
      </div>

      <div className="stat-cards-grid">
        {statCards.map((s, i) => (
          <div className="stat-card" key={i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-card-label">{s.label}</div>
                <div className={`stat-card-value ${s.color}`} style={{ fontSize: '18px', marginTop: '4px', wordBreak: 'break-word' }}>{s.value}</div>
              </div>
              <div className={`stat-card-icon ${s.color}`} style={{ fontSize: '20px' }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="table-wrapper">
        <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div className="table-toolbar-left" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <div className="search-bar" style={{ minWidth: '280px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                placeholder="Search reference, entity, description, notes..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>From</label>
              <input
                type="date"
                className="form-input"
                style={{ width: 'auto', height: '36px', fontSize: '13px' }}
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>To</label>
              <input
                type="date"
                className="form-input"
                style={{ width: 'auto', height: '36px', fontSize: '13px' }}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="table-toolbar-right" style={{ flexWrap: 'wrap', gap: '10px' }}>
            <select
              className="form-select"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ width: 'auto', height: '36px' }}
            >
              {TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              className="form-select"
              value={paymentMethodFilter}
              onChange={e => setPaymentMethodFilter(e.target.value)}
              style={{ width: 'auto', height: '36px' }}
            >
              {PAYMENT_METHOD_OPTIONS.map(m => (
                <option key={m} value={m}>{m === 'All' ? 'All Methods' : m}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px' }} />
            Loading transactions...
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
            <div className="empty-state-icon">📋</div>
            <h3>No transactions found</h3>
            <p>
              {search || typeFilter !== 'All' || paymentMethodFilter !== 'All' || startDate || endDate
                ? 'Try adjusting your search filters or date range'
                : 'No transaction records have been recorded yet'}
            </p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Reference</th>
                    <th>Related Entity</th>
                    <th>Description</th>
                    <th>Payment Method</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th>Created By</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((t, i) => {
                    const isPositive = INCOME_TYPES.has(t.transactionType)
                    return (
                      <tr key={t._id || i}>
                        <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>{formatDate(t.transactionDate)}</td>
                        <td><TransactionTypeBadge type={t.transactionType} /></td>
                        <td style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 600 }}>
                          {t.referenceNumber || t.referenceId || '—'}
                        </td>
                        <td style={{ fontSize: '13px' }}>{t.relatedEntity || '—'}</td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={t.description || ''}>
                            {t.description || '—'}
                          </div>
                        </td>
                        <td style={{ fontSize: '13px' }}>{t.paymentMethod || '—'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: INCOME_TYPES.has(t.transactionType) ? 'var(--success)' : (NEUTRAL_TYPES.has(t.transactionType) ? 'var(--text)' : 'var(--danger)') }}>
                          {formatCurrency(t.amount)}
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {t.createdBy?.username || t.createdBy?.name || '-'}
                        </td>
                      </tr>
                    )
                  })}
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

export default Transactions
