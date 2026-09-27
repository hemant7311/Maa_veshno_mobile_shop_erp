import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { CreateReturnModal } from './inventory/CompanyReturns'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const todayStr = new Date().toLocaleDateString('en-CA')
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [activeView, setActiveView] = useState('sales')
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState(null)
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', description: '' })
  const [savingExpense, setSavingExpense] = useState(false)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [showAllRecords, setShowAllRecords] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const [dashboardData, setDashboardData] = useState({
    totalSales: 0,
    todayTotalSales: 0,
    totalProfit: 0,
    todayProfit: 0,
    todayExpense: 0,
    todayStockIn: 0,
    todayReturnsCount: 0,
    todayReturnsAmount: 0,
    soldProducts: [],
    allSales: [],
    returnedProducts: [],
    allReturnedProducts: [],
    shopExpenses: [],
    allExpenses: []
  })

  const loadDashboard = useCallback(async () => {
    try {
      const dashRes = await api.get('/dashboard', { params: { date: selectedDate } })

      if (dashRes.data?.success && dashRes.data?.data) {
        const d = dashRes.data.data
        setDashboardData({
          totalSales: Number(d.totalSales) || 0,
          todayTotalSales: Number(d.todayTotalSales) || 0,
          totalProfit: Number(d.totalProfit) || 0,
          todayProfit: Number(d.todayProfit) || 0,
          todayExpense: Number(d.todayExpense) || 0,
          todayStockIn: Number(d.todayStockIn) || 0,
          todayReturnsCount: Number(d.todayReturnsCount) || 0,
          todayReturnsAmount: Number(d.todayReturnsAmount) || 0,
          soldProducts: d.todaySoldProducts || d.soldProducts || [],
          allSales: d.allSales || [],
          returnedProducts: d.returnedProducts || [],
          allReturnedProducts: d.allReturnedProducts || d.returnedProducts || [],
          shopExpenses: d.todayExpenses || d.shopExpenses || [],
          allExpenses: d.allExpenses || []
        })
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err.message)
    }
  }, [selectedDate])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const displayedSales = showAllRecords ? (dashboardData.allSales || []) : (dashboardData.soldProducts || [])
  const displayedExpenses = showAllRecords ? (dashboardData.allExpenses || []) : (dashboardData.shopExpenses || [])
  const displayedReturns = showAllRecords ? (dashboardData.allReturnedProducts || []) : (dashboardData.returnedProducts || [])

  const computedTotalItems = displayedSales.length
  const computedProductsSold = displayedSales.length

  const todaySalesCount = (dashboardData.soldProducts || []).length
  const profitMarginPercent = dashboardData.todayTotalSales > 0 
    ? ((dashboardData.todayProfit / dashboardData.todayTotalSales) * 100).toFixed(2)
    : '0.00'

  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.category) {
      alert("Please enter both category and amount.")
      return
    }
    try {
      setSavingExpense(true)
      if (editingExpenseId) {
        await api.put(`/expenses/${editingExpenseId}`, {
          category: expenseForm.category.trim(),
          description: expenseForm.description?.trim() || expenseForm.category.trim(),
          amount: Number(expenseForm.amount),
          date: selectedDate
        })
      } else {
        await api.post('/expenses', {
          category: expenseForm.category.trim(),
          description: expenseForm.description?.trim() || expenseForm.category.trim(),
          amount: Number(expenseForm.amount),
          date: selectedDate
        })
      }
      setIsExpenseModalOpen(false)
      setEditingExpenseId(null)
      setExpenseForm({ category: '', amount: '', description: '' })
      setActiveView('expenses')
      await loadDashboard()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save expense')
    } finally {
      setSavingExpense(false)
    }
  }

  const handleEditSale = (sale) => {
    const saleId = sale._id || sale.id
    if (saleId) {
      navigate(`/billing/customer?edit=${saleId}`)
    } else {
      navigate('/billing/customer')
    }
  }

  const handleDeleteSale = async (sale) => {
    const saleId = sale._id || sale.id
    const invoiceNum = sale.invoiceNumber || sale.id || ''
    if (!window.confirm(`Are you sure you want to cancel/delete Sale Invoice #${invoiceNum}? Stock and IMEI state will be restored.`)) return
    try {
      await api.delete(`/sales/${saleId}`)
      alert(`Invoice #${invoiceNum} cancelled/deleted successfully.`)
      await loadDashboard()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete sale.')
    }
  }

  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense._id || expense.id)
    setExpenseForm({
      category: expense.category || '',
      amount: expense.amount || '',
      description: expense.description || ''
    })
    setIsExpenseModalOpen(true)
  }

  const handleDeleteExpense = async (expense) => {
    const expId = expense._id || expense.id
    if (!window.confirm(`Are you sure you want to delete expense "${expense.category}"?`)) return
    try {
      await api.delete(`/expenses/${expId}`)
      alert(`Expense deleted successfully.`)
      await loadDashboard()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete expense.')
    }
  }

  const handleEditReturn = (ret) => {
    navigate('/inventory/returns')
  }

  const handleDeleteReturn = async (ret) => {
    const retId = ret._id || ret.id
    if (!window.confirm(`Are you sure you want to delete return record for "${ret.name}"?`)) return
    try {
      await api.delete(`/company-returns/${retId}`)
      alert(`Return record deleted successfully.`)
      await loadDashboard()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete return.')
    }
  }

  const renderTable = (isMob) => (
    <table className="data-table" style={{ width: '100%', minWidth: isMob ? '680px' : 'auto', borderCollapse: 'collapse' }}>
      <thead>
        {activeView === 'sales' ? (
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ width: isMob ? '90px' : '110px', padding: isMob ? '10px 12px' : '14px 20px', textAlign: 'left', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Invoice</th>
            <th style={{ padding: isMob ? '10px 12px' : '14px 20px', textAlign: 'left', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Customer</th>
            <th style={{ padding: isMob ? '10px 12px' : '14px 20px', textAlign: 'left', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Products</th>
            <th style={{ textAlign: 'center', padding: isMob ? '10px 12px' : '14px 20px', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Mode</th>
            <th style={{ textAlign: 'right', padding: isMob ? '10px 12px' : '14px 20px', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Amount</th>
            <th style={{ textAlign: 'right', padding: isMob ? '10px 12px' : '14px 20px', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Date</th>
            <th style={{ textAlign: 'center', padding: isMob ? '10px 12px' : '14px 20px', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Actions</th>
          </tr>
        ) : activeView === 'expenses' ? (
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ width: '50px', padding: isMob ? '10px 12px' : '14px 20px', textAlign: 'left', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>#</th>
            <th style={{ padding: isMob ? '10px 12px' : '14px 20px', textAlign: 'left', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Category</th>
            <th style={{ padding: isMob ? '10px 12px' : '14px 20px', textAlign: 'left', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Description</th>
            <th style={{ textAlign: 'right', padding: isMob ? '10px 12px' : '14px 20px', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Amount</th>
            <th style={{ textAlign: 'right', padding: isMob ? '10px 12px' : '14px 20px', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Time</th>
            <th style={{ textAlign: 'center', padding: isMob ? '10px 12px' : '14px 20px', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Actions</th>
          </tr>
        ) : (
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <th style={{ width: '50px', padding: isMob ? '10px 12px' : '14px 20px', textAlign: 'left', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>#</th>
            <th style={{ padding: isMob ? '10px 12px' : '14px 20px', textAlign: 'left', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Product Name</th>
            <th style={{ padding: isMob ? '10px 12px' : '14px 20px', textAlign: 'left', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Brand</th>
            <th style={{ padding: isMob ? '10px 12px' : '14px 20px', textAlign: 'left', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Variant</th>
            <th style={{ padding: isMob ? '10px 12px' : '14px 20px', textAlign: 'left', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>IMEI Number</th>
            <th style={{ textAlign: 'right', padding: isMob ? '10px 12px' : '14px 20px', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Price (₹)</th>
            <th style={{ textAlign: 'right', padding: isMob ? '10px 12px' : '14px 20px', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Date</th>
            <th style={{ textAlign: 'center', padding: isMob ? '10px 12px' : '14px 20px', fontSize: isMob ? '11px' : '12px', fontWeight: 700, color: '#64748b' }}>Actions</th>
          </tr>
        )}
      </thead>
      <tbody>
        {activeView === 'sales' ? (
          displayedSales.length === 0 ? (
            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: isMob ? '11px' : '13px' }}>No sales found for this date</td></tr>
          ) : displayedSales.map((p, index) => (
            <tr key={p._id || p.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: isMob ? '10px 12px' : '14px 20px', color: '#64748b', fontSize: isMob ? '11px' : '13px', fontWeight: 600 }}>#{p.invoiceNumber || p.id || index + 1}</td>
              <td style={{ padding: isMob ? '10px 12px' : '14px 20px' }}>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: isMob ? '11px' : '13px' }}>{p.customer || p.name || p.customerName}</div>
                <div style={{ fontSize: isMob ? '9px' : '11px', color: '#64748b', marginTop: '2px' }}>{p.phone || 'Retail'}</div>
              </td>
              <td style={{ padding: isMob ? '10px 12px' : '14px 20px', color: '#334155', fontSize: isMob ? '11px' : '13px' }}>{p.products || p.variant || 'Mobile Item'}</td>
              <td style={{ textAlign: 'center', padding: isMob ? '10px 12px' : '14px 20px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', fontSize: isMob ? '10px' : '12px' }}>{p.mode || p.paymentMethod || p.paymentMode || 'CASH'}</td>
              <td style={{ textAlign: 'right', padding: isMob ? '10px 12px' : '14px 20px', fontWeight: 700, color: '#2563eb', fontSize: isMob ? '12px' : '14px' }}>₹{(p.amount || p.grandTotal || 0).toLocaleString('en-IN')}</td>
              <td style={{ textAlign: 'right', padding: isMob ? '10px 12px' : '14px 20px', color: '#64748b', fontFamily: 'monospace', fontSize: isMob ? '10px' : '12px' }}>
                {p.date ? (p.date.includes('T') ? new Date(p.date).toLocaleDateString('en-IN') : p.date) : p.time}
              </td>
              <td style={{ textAlign: 'center', padding: isMob ? '8px 10px' : '14px 20px', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <button
                    onClick={() => handleEditSale(p)}
                    title="Edit Sale"
                    style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteSale(p)}
                    title="Delete Sale"
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : activeView === 'expenses' ? (
          displayedExpenses.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: isMob ? '11px' : '13px' }}>No expenses found for this date</td></tr>
          ) : displayedExpenses.map((e, index) => (
            <tr key={e._id || e.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: isMob ? '10px 12px' : '14px 20px', color: '#64748b', fontSize: isMob ? '11px' : '13px' }}>{index + 1}</td>
              <td style={{ padding: isMob ? '10px 12px' : '14px 20px' }}>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: isMob ? '11px' : '13px' }}>{e.category}</div>
              </td>
              <td style={{ padding: isMob ? '10px 12px' : '14px 20px', color: '#334155', fontSize: isMob ? '11px' : '13px' }}>{e.description || '-'}</td>
              <td style={{ textAlign: 'right', padding: isMob ? '10px 12px' : '14px 20px', fontWeight: 700, color: '#dc2626', fontSize: isMob ? '12px' : '14px' }}>₹{(e.amount || 0).toLocaleString('en-IN')}</td>
              <td style={{ textAlign: 'right', padding: isMob ? '10px 12px' : '14px 20px', color: '#64748b', fontFamily: 'monospace', fontSize: isMob ? '10px' : '12px' }}>{e.time || e.date}</td>
              <td style={{ textAlign: 'center', padding: isMob ? '8px 10px' : '14px 20px', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <button
                    onClick={() => handleEditExpense(e)}
                    title="Edit Expense"
                    style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteExpense(e)}
                    title="Delete Expense"
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))
        ) : (
          displayedReturns.length === 0 ? (
            <tr><td colSpan="8" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: isMob ? '11px' : '13px' }}>No returns found for this date</td></tr>
          ) : displayedReturns.map((r, index) => (
            <tr key={r._id || r.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: isMob ? '10px 12px' : '14px 20px', color: '#64748b', fontSize: isMob ? '11px' : '13px' }}>{index + 1}</td>
              <td style={{ padding: isMob ? '10px 12px' : '14px 20px' }}>
                <div style={{ fontWeight: 600, color: '#0f172a', fontSize: isMob ? '11px' : '13px' }}>{r.name}</div>
              </td>
              <td style={{ padding: isMob ? '10px 12px' : '14px 20px', color: '#334155', fontSize: isMob ? '11px' : '13px' }}>{r.brand || '—'}</td>
              <td style={{ padding: isMob ? '10px 12px' : '14px 20px', color: '#334155', fontSize: isMob ? '11px' : '13px' }}>{r.variant || '—'}</td>
              <td style={{ padding: isMob ? '10px 12px' : '14px 20px', color: '#2563eb', fontFamily: 'monospace', fontSize: isMob ? '10px' : '12px', fontWeight: 600 }}>{r.imei || '—'}</td>
              <td style={{ textAlign: 'right', padding: isMob ? '10px 12px' : '14px 20px', fontWeight: 700, color: '#dc2626', fontSize: isMob ? '12px' : '14px' }}>₹{(r.price || 0).toLocaleString('en-IN')}</td>
              <td style={{ textAlign: 'right', padding: isMob ? '10px 12px' : '14px 20px', color: '#64748b', fontSize: isMob ? '10px' : '12px' }}>{r.date || '—'}</td>
              <td style={{ textAlign: 'center', padding: isMob ? '8px 10px' : '14px 20px', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <button
                    onClick={() => handleEditReturn(r)}
                    title="Edit Return"
                    style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteReturn(r)}
                    title="Delete Return"
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  )

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '4px 4px' : '16px' }}>
      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsExpenseModalOpen(false); setEditingExpenseId(null); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingExpenseId ? "Edit Expense" : "Add Today's Expense"}</h2>
              <button className="modal-close" onClick={() => { setIsExpenseModalOpen(false); setEditingExpenseId(null); }}>✕</button>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Expense Category / Name <span className="required">*</span></label>
                  <input 
                    type="text"
                    className="form-input" 
                    placeholder="e.g. Tea, Electricity Bill, Salary..."
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) <span className="required">*</span></label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="Enter amount" 
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter description" 
                    value={expenseForm.description}
                    onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => { setIsExpenseModalOpen(false); setEditingExpenseId(null); }} disabled={savingExpense}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddExpense} disabled={savingExpense}>
                {savingExpense ? 'Saving...' : (editingExpenseId ? 'Update Expense' : 'Add Expense')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {isReturnModalOpen && (
        <CreateReturnModal 
          onClose={() => setIsReturnModalOpen(false)} 
          onSaved={() => {
            setIsReturnModalOpen(false)
            loadDashboard()
          }} 
        />
      )}

      {/* Header - EXACT SAME ROW ON MOBILE MATCHING IMAGE 2 */}
      <div className="page-header" style={{ marginBottom: isMobile ? '10px' : '20px', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: isMobile ? '18px' : '24px', fontWeight: 800, margin: 0, color: '#0f172a' }}>Dashboard</h1>
          <p style={{ margin: '1px 0 0', color: '#64748b', fontSize: isMobile ? '10px' : '13px' }}>Welcome back, {user?.name || 'Maa Veshno Admin'}</p>
        </div>
        <div className="page-header-right" style={{ flexShrink: 0 }}>
          <input 
            type="date" 
            className="form-input" 
            style={{ width: 'auto', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: isMobile ? '4px 8px' : '6px 12px', fontSize: isMobile ? '11px' : '13px', fontWeight: 600 }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* MOBILE DASHBOARD VIEW (< 768px) */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* COMBINED CARD 1: Total & Today Sales */}
          <div 
            onClick={() => setActiveView('sales')}
            style={{
              background: '#f4f8ff',
              borderRadius: '16px',
              padding: '12px 14px',
              border: activeView === 'sales' ? '2px solid #3b82f6' : '1.5px solid #dbeafe',
              boxShadow: '0 2px 8px rgba(37,99,235,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Total &amp; Today Sales</h3>
                <p style={{ margin: '1px 0 0', fontSize: '9px', color: '#64748b' }}>All time sales and today's sales</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#ffffff', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Sales</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#2563eb' }}>
                  ₹{(dashboardData.totalSales || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Today's Sales</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#16a34a' }}>
                  ₹{(dashboardData.todayTotalSales || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* COMBINED CARD 2: All & Today Profit */}
          <div 
            onClick={() => setActiveView('sales')}
            style={{
              background: '#f0fdf4',
              borderRadius: '16px',
              padding: '12px 14px',
              border: activeView === 'sales' ? '2px solid #22c55e' : '1.5px solid #dcfce7',
              boxShadow: '0 2px 8px rgba(34,197,94,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>All &amp; Today Profit</h3>
                <p style={{ margin: '1px 0 0', fontSize: '9px', color: '#64748b' }}>All time profit and today's profit</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#ffffff', padding: '10px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Profit</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: dashboardData.totalProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                  ₹{(dashboardData.totalProfit || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Today's Profit</span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: dashboardData.todayProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                  ₹{(dashboardData.todayProfit || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* 3 SINGLE COMPACT CARDS FOR MOBILE */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {/* Card 1: Today's Shop Expense */}
            <div 
              onClick={() => setActiveView('expenses')}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '10px 8px',
                border: activeView === 'expenses' ? '2px solid #ef4444' : '1px solid #fee2e2',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>Expense</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingExpenseId(null); setExpenseForm({ category: '', amount: '', description: '' }); setIsExpenseModalOpen(true); }}
                  style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '4px', padding: '1px 5px', fontSize: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Add
                </button>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#dc2626', wordBreak: 'break-word' }}>
                ₹{(dashboardData.todayExpense || 0).toLocaleString('en-IN')}
              </div>
            </div>

            {/* Card 2: Today's Stock In */}
            <div 
              onClick={() => setActiveView('sales')}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '10px 8px',
                border: activeView === 'sales' ? '2px solid #2563eb' : '1px solid #dbeafe',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer'
              }}
            >
              <div style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>Stock In</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb' }}>
                {dashboardData.todayStockIn} Items
              </div>
            </div>

            {/* Card 3: Today's Stock Returns */}
            <div 
              onClick={() => setActiveView('returns')}
              style={{
                background: '#ffffff',
                borderRadius: '12px',
                padding: '10px 8px',
                border: activeView === 'returns' ? '2px solid #f97316' : '1px solid #ffedd5',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>Returns</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsReturnModalOpen(true); }}
                  style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: '4px', padding: '1px 5px', fontSize: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Add
                </button>
              </div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#ea580c', wordBreak: 'break-word' }}>
                {dashboardData.todayReturnsCount} — ₹{dashboardData.todayReturnsAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* MOBILE SCROLLABLE TABLE SECTION */}
          <div className="card" style={{ borderRadius: '16px', border: '1px solid #e2e8f0', background: '#ffffff', overflow: 'hidden', marginTop: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                {activeView === 'sales' ? "Today's Sold Products" : activeView === 'expenses' ? "Today's Shop Expenses" : "Today's Stock Returns"}
              </span>
              <button 
                onClick={() => setShowAllRecords(!showAllRecords)} 
                style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
              >
                {showAllRecords ? 'View Today' : 'View All'}
              </button>
            </div>

            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
              {renderTable(true)}
            </div>

            {activeView === 'sales' && (
              <div style={{ background: '#eff6ff', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a' }}>Total Items: {computedTotalItems}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>Total Sold:</span>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#2563eb' }}>{computedProductsSold}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* DESKTOP DASHBOARD VIEW (>= 769px) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Grid of Combined & Stat Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1.4fr 1fr 1fr 1fr',
            gap: '16px'
          }}>
            {/* COMBINED CARD 1: Total & Today Sales */}
            <div 
              onClick={() => setActiveView('sales')}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '20px',
                border: activeView === 'sales' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10"/>
                      <line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Total &amp; Today Sales</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>All time sales and today's sales</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Sales</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb' }}>
                      ₹{(dashboardData.totalSales || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today's Sales</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#16a34a' }}>
                      ₹{(dashboardData.todayTotalSales || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COMBINED CARD 2: All & Today Profit */}
            <div 
              onClick={() => setActiveView('sales')}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '20px',
                border: activeView === 'sales' ? '2px solid #22c55e' : '1px solid #e2e8f0',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="1" x2="12" y2="23"/>
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>All &amp; Today Profit</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>All time profit and today's profit</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Profit</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: dashboardData.totalProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                      ₹{(dashboardData.totalProfit || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today's Profit</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: dashboardData.todayProfit >= 0 ? '#16a34a' : '#dc2626' }}>
                      ₹{(dashboardData.todayProfit || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DESKTOP VERTICAL COMPACT CARD 3: Today's Shop Expense */}
            <div 
              onClick={() => setActiveView('expenses')}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '18px',
                border: activeView === 'expenses' ? '2px solid #ef4444' : '1px solid #e2e8f0',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="5" width="20" height="14" rx="2"/>
                      <line x1="2" y1="10" x2="22" y2="10"/>
                    </svg>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingExpenseId(null); setExpenseForm({ category: '', amount: '', description: '' }); setIsExpenseModalOpen(true); }}
                    style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Add Expense
                  </button>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Today's Shop Expense
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626', marginTop: '4px', wordBreak: 'break-word' }}>
                  ₹{(dashboardData.todayExpense || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* DESKTOP VERTICAL COMPACT CARD 4: Today's Stock In */}
            <div 
              onClick={() => setActiveView('sales')}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '18px',
                border: activeView === 'sales' ? '2px solid #2563eb' : '1px solid #e2e8f0',
                boxShadow: '0 2px 12px rgba(37,99,235,0.1)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Today's Stock In
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
                  {dashboardData.todayStockIn} Items
                </div>
              </div>
            </div>

            {/* DESKTOP VERTICAL COMPACT CARD 5: Today's Stock Returns */}
            <div 
              onClick={() => setActiveView('returns')}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '18px',
                border: activeView === 'returns' ? '2px solid #f97316' : '1px solid #e2e8f0',
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="1 4 1 10 7 10"/>
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                    </svg>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsReturnModalOpen(true); }}
                    style={{ background: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', padding: '3px 8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    + Add Return
                  </button>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Today's Stock Returns
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c', marginTop: '4px', wordBreak: 'break-word' }}>
                  {dashboardData.todayReturnsCount} Items — ₹{dashboardData.todayReturnsAmount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="card" style={{ borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', background: '#fff' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
              <span className="card-title" style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                {activeView === 'sales' ? "Today's Sold Products Details" : activeView === 'expenses' ? "Today's Shop Expenses" : "Today's Stock Returns"}
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={() => setShowAllRecords(!showAllRecords)} 
                  className="btn btn-sm btn-primary" 
                  style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}
                >
                  {showAllRecords ? 'View Today' : 'View All'}
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', width: '100%' }}>
              {renderTable(false)}
            </div>

            {/* Footer Summary Bar */}
            {activeView === 'sales' && (
              <div style={{ padding: '18px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                <span style={{ fontWeight: 700, color: '#334155', fontSize: '13px' }}>
                  Total Items: {computedTotalItems}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontWeight: 700, color: '#64748b', fontSize: '13px' }}>
                    Total Products Sold:
                  </span>
                  <span style={{ fontSize: '28px', fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>
                    {computedProductsSold}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
