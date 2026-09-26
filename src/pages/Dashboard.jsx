import React, { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { CreateReturnModal } from './inventory/CompanyReturns'

const Dashboard = () => {
  const { user } = useAuth()
  const todayStr = new Date().toLocaleDateString('en-CA')
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [activeView, setActiveView] = useState('sales')
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', description: '' })
  const [savingExpense, setSavingExpense] = useState(false)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [returnForm, setReturnForm] = useState({ imei: '', name: '', variant: '', problem: '', description: '', customerName: '', customerPhone: '' })
  const [allImeis, setAllImeis] = useState([])
  const [showAllRecords, setShowAllRecords] = useState(false)
  
  const [totalProfit, setTotalProfit] = useState(0)
  const [totalCashProfit, setTotalCashProfit] = useState(0)
  const [totalUpiProfit, setTotalUpiProfit] = useState(0)
  const [dashboardData, setDashboardData] = useState({
    todayProfit: 0,
    todayExpense: 0,
    todayStockIn: 0,
    returnedProducts: [],
    shopExpenses: [],
    soldProducts: []
  })

  const loadDashboard = useCallback(async () => {
    try {
      const dashRes = await api.get('/dashboard', { params: { date: selectedDate } })

      if (dashRes.data?.success && dashRes.data?.data) {
        const d = dashRes.data.data
        setDashboardData({
          todayProfit: d.todayProfit || 0,
          todayExpense: d.todayExpense || 0,
          todayStockIn: d.todayStockIn || 0,
          todayCashProfit: d.todayCashProfit || 0,
          todayUpiProfit: d.todayUpiProfit || 0,
          todayReturnsCount: d.todayReturnsCount || 0,
          todayReturnsAmount: d.todayReturnsAmount || 0,
          soldProducts: d.todaySoldProducts || d.soldProducts || [],
          allSales: d.allSales || [],
          returnedProducts: d.returnedProducts || [],
          allReturnedProducts: d.allReturnedProducts || d.returnedProducts || [],
          shopExpenses: d.todayExpenses || d.shopExpenses || [],
          allExpenses: d.allExpenses || []
        })
        if (d.totalProfit !== undefined) setTotalProfit(d.totalProfit)
        if (d.totalCashProfit !== undefined) setTotalCashProfit(d.totalCashProfit)
        if (d.totalUpiProfit !== undefined) setTotalUpiProfit(d.totalUpiProfit)
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err.message)
    }
  }, [selectedDate])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const computedExpense = dashboardData.todayExpense || 0
  const computedReturn = dashboardData.todayReturnsCount || 0
  const computedReturnAmount = dashboardData.todayReturnsAmount || 0
  const computedStockIn = dashboardData.todayStockIn || 0
  const computedProfit = dashboardData.todayProfit || 0
  const todayCashProfit = dashboardData.todayCashProfit || 0
  const todayUpiProfit = dashboardData.todayUpiProfit || 0

  const displayedSales = showAllRecords ? (dashboardData.allSales || []) : (dashboardData.soldProducts || [])
  const displayedExpenses = showAllRecords ? (dashboardData.allExpenses || []) : (dashboardData.shopExpenses || [])
  const displayedReturns = showAllRecords ? (dashboardData.allReturnedProducts || []) : (dashboardData.returnedProducts || [])

  const computedTotalItems = displayedSales.length
  const computedProductsSold = displayedSales.length

  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.category) {
      alert("Please enter both category and amount.")
      return
    }
    try {
      setSavingExpense(true)
      await api.post('/expenses', {
        category: expenseForm.category.trim(),
        description: expenseForm.description?.trim() || expenseForm.category.trim(),
        amount: Number(expenseForm.amount),
        date: selectedDate
      })
      setIsExpenseModalOpen(false)
      setExpenseForm({ category: '', amount: '', description: '' })
      setActiveView('expenses')
      await loadDashboard()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save expense')
    } finally {
      setSavingExpense(false)
    }
  }

  const cards = [
    {
      label: 'Total Profit',
      value: `₹${totalProfit.toLocaleString('en-IN')}`,
      color: 'green',
      filterValue: 'sales',
      details: { cash: `₹${totalCashProfit.toLocaleString('en-IN')}`, upi: `₹${totalUpiProfit.toLocaleString('en-IN')}` },
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      )
    },
    {
      label: "Today's Profit",
      value: `₹${computedProfit.toLocaleString('en-IN')}`,
      color: 'green',
      filterValue: 'sales',
      details: { cash: `₹${todayCashProfit.toLocaleString('en-IN')}`, upi: `₹${todayUpiProfit.toLocaleString('en-IN')}` },
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
          <polyline points="17 6 23 6 23 12"/>
        </svg>
      )
    },
    {
      label: "Today's Shop Expense",
      value: `₹${computedExpense.toLocaleString('en-IN')}`,
      color: 'red',
      filterValue: 'expenses',
      actionIcon: (
        <svg onClick={(e) => { e.stopPropagation(); setIsExpenseModalOpen(true); }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      ),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/>
          <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/>
          <path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6z"/>
        </svg>
      )
    },
    {
      label: "Today's Stock In",
      value: computedStockIn.toString(),
      color: 'blue',
      filterValue: 'sales',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      )
    },
    {
      label: "Today's Stock Returns",
      value: `${computedReturn} Items — ₹${computedReturnAmount.toLocaleString('en-IN')}`,
      color: 'orange',
      filterValue: 'returns',
      actionIcon: (
        <svg onClick={(e) => { e.stopPropagation(); setIsReturnModalOpen(true); }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      ),
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 4v6h-6"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
      )
    }
  ]

  return (
    <div>
      {/* Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsExpenseModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2 className="modal-title">Add Today's Expense</h2>
              <button className="modal-close" onClick={() => setIsExpenseModalOpen(false)}>✕</button>
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
              <button className="btn btn-outline" onClick={() => setIsExpenseModalOpen(false)} disabled={savingExpense}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddExpense} disabled={savingExpense}>
                {savingExpense ? 'Saving...' : 'Add Expense'}
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

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Welcome back, {user?.name || 'Admin User'}</p>
        </div>
        <div className="page-header-right">
          <input 
            type="date" 
            className="form-input" 
            style={{ width: 'auto', background: '#fff' }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="stat-cards-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(5, 1fr)' }}>
        {cards.map((c, i) => (
          <div 
            className="stat-card" 
            key={i} 
            onClick={() => setActiveView(c.filterValue || 'sales')}
            style={{ 
              display: 'flex', flexDirection: 'column', gap: '12px', cursor: 'pointer',
              border: activeView === c.filterValue ? `2px solid var(--${c.color})` : '1px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="stat-card-label" style={{ fontWeight: 600, fontSize: '13px' }}>{c.label}</span>
                {c.actionIcon && (
                  <div style={{ padding: '4px', background: 'var(--red-light)', color: 'var(--red)', borderRadius: '4px', display: 'flex' }}>
                    {c.actionIcon}
                  </div>
                )}
              </div>
              <div className={`stat-card-icon ${c.color}`} style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)' }}>
                {c.icon}
              </div>
            </div>
              <div>
                <div className={`stat-card-value ${c.color}`} style={{ fontSize: c.value.length > 14 ? '16px' : c.value.length > 9 ? '20px' : '26px', fontWeight: 700, lineHeight: 1.2, wordBreak: 'break-word' }}>
                  {c.value}
                </div>
                {c.details && (
                  <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>Cash: <strong style={{ color: 'var(--text-primary)' }}>{c.details.cash}</strong></span>
                    <span>Online: <strong style={{ color: 'var(--text-primary)' }}>{c.details.upi}</strong></span>
                  </div>
                )}
              </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px' }}>
            <span className="card-title" style={{ fontSize: '15px', fontWeight: 700 }}>
              {activeView === 'sales' ? "Today's Sold Products Details" : activeView === 'expenses' ? "Today's Shop Expenses" : "Today's Stock Returns"}
            </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setShowAllRecords(!showAllRecords)} className={`btn btn-sm ${showAllRecords ? 'btn-outline' : 'btn-primary'}`} style={{ padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>
              {showAllRecords ? 'View Today' : 'View All'}
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              {activeView === 'sales' ? (
                <tr>
                  <th style={{ width: '110px' }}>Invoice</th>
                  <th>Customer</th>
                  <th>Products</th>
                  <th style={{ textAlign: 'center' }}>Mode</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Date</th>
                </tr>
              ) : activeView === 'expenses' ? (
                <tr>
                  <th style={{ width: '60px' }}>#</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Time</th>
                </tr>
              ) : (
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Product Name</th>
                  <th>Brand</th>
                  <th>Variant</th>
                  <th>IMEI Number</th>
                  <th style={{ textAlign: 'right' }}>Price (₹)</th>
                  <th style={{ textAlign: 'right' }}>Date</th>
                </tr>
              )}
            </thead>
            <tbody>
              {activeView === 'sales' ? (
                displayedSales.map((p, index) => (
                  <tr key={p.id || index}>
                    <td style={{ color: 'var(--text-muted)' }}>{p.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.customer || p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.phone || 'Retail'}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.products || p.variant}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{p.mode || p.paymentMethod || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {p.date ? (p.date.includes('T') ? new Date(p.date).toLocaleDateString('en-IN') : p.date) : p.time}
                    </td>
                  </tr>
                ))
              ) : activeView === 'expenses' ? (
                displayedExpenses.map((e, index) => (
                  <tr key={e.id || index}>
                    <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.category}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{e.description || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--red)' }}>₹{(e.amount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{e.time || e.date}</td>
                  </tr>
                ))
              ) : (
                displayedReturns.map((r, index) => (
                  <tr key={r.id || index}>
                    <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.brand || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.variant || '—'}</td>
                    <td style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>{r.imei || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>₹{(r.price || 0).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '12px' }}>{r.date || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary Bar */}
        {activeView === 'sales' && (
          <div style={{ padding: '16px 20px', borderTop: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', borderBottomLeftRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
              Total Items: {computedTotalItems}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '13px' }}>
                Total Products Sold:
              </span>
              <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                {computedProductsSold}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
