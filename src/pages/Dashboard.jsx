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

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '8px' : '16px' }}>
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
      <div className="page-header" style={{ marginBottom: isMobile ? '12px' : '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, margin: 0 }}>Dashboard</h1>
          <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: isMobile ? '11px' : '13px' }}>Welcome back, {user?.name || 'Maa Veshno Admin'}</p>
        </div>
        <div className="page-header-right">
          <input 
            type="date" 
            className="form-input" 
            style={{ width: 'auto', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '6px 12px', fontSize: '13px', fontWeight: 600 }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* MOBILE DASHBOARD VIEW (< 768px) - MATCHING SCREENSHOT EXACTLY */}
      {isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* COMBINED CARD 1: Total & Today Sales */}
          <div 
            onClick={() => setActiveView('sales')}
            style={{
              background: '#f4f8ff',
              borderRadius: '20px',
              padding: '16px',
              border: activeView === 'sales' ? '2px solid #3b82f6' : '1.5px solid #dbeafe',
              boxShadow: '0 2px 8px rgba(37,99,235,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>Total &amp; Today Sales</h3>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>All time sales and today's sales</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#ffffff', padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Total Sales</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '10px' }}>All Time</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#2563eb' }}>
                  ₹{dashboardData.totalSales.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Today's Sales</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '10px' }}>Today</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#2563eb' }}>
                  ₹{dashboardData.todayTotalSales.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div style={{ background: '#e0edff', padding: '10px 14px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#1d4ed8' }}>
              <span>🛒 {todaySalesCount} Items sold today</span>
              <span style={{ fontSize: '14px' }}>›</span>
            </div>
          </div>

          {/* COMBINED CARD 2: All & Today Profit */}
          <div 
            onClick={() => setActiveView('sales')}
            style={{
              background: '#f0fdf4',
              borderRadius: '20px',
              padding: '16px',
              border: activeView === 'sales' ? '2px solid #22c55e' : '1.5px solid #dcfce7',
              boxShadow: '0 2px 8px rgba(34,197,94,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#dcfce7', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>All &amp; Today Profit</h3>
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>Net profit after deducting costs &amp; expenses</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#ffffff', padding: '12px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Total Profit</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '10px' }}>All Time</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: dashboardData.totalProfit < 0 ? '#dc2626' : '#16a34a' }}>
                  ₹{dashboardData.totalProfit.toLocaleString('en-IN')}
                </div>
              </div>

              <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Today's Profit</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '10px' }}>Today</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: dashboardData.todayProfit < 0 ? '#dc2626' : '#16a34a' }}>
                  ₹{dashboardData.todayProfit.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div style={{ background: '#dcfce7', padding: '10px 14px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#15803d' }}>
              <span>💰 Profit margin: {profitMarginPercent}%</span>
              <span style={{ fontSize: '14px' }}>›</span>
            </div>
          </div>

          {/* COMPACT CARDS ROW 1: Shop Expense & Stock In (2 columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* Shop Expense */}
            <div 
              onClick={() => setActiveView('expenses')}
              style={{
                background: '#fff5f5',
                border: activeView === 'expenses' ? '2px solid #ef4444' : '1px solid #fee2e2',
                borderRadius: '16px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer'
              }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/>
                  <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/>
                  <path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Shop Expense</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>
                  ₹{dashboardData.todayExpense.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Stock In */}
            <div 
              onClick={() => setActiveView('sales')}
              style={{
                background: '#f4f8ff',
                border: activeView === 'sales' ? '2px solid #2563eb' : '1px solid #dbeafe',
                borderRadius: '16px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer'
              }}
            >
              <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Stock In</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#2563eb' }}>
                  {dashboardData.todayStockIn}
                </div>
              </div>
            </div>
          </div>

          {/* COMPACT CARD ROW 2: Stock Returns (Full Width) */}
          <div 
            onClick={() => setActiveView('returns')}
            style={{
              background: '#fff7ed',
              border: activeView === 'returns' ? '2px solid #f97316' : '1px solid #ffedd5',
              borderRadius: '16px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}
          >
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#ffedd5', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Stock Returns</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#ea580c' }}>
                {dashboardData.todayReturnsCount} Items — ₹{dashboardData.todayReturnsAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* MOBILE LIST VIEW SECTION */}
          <div style={{ borderRadius: '20px', border: '1px solid #e2e8f0', background: '#ffffff', overflow: 'hidden', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                {activeView === 'sales' ? "Today's Sold Products" : activeView === 'expenses' ? "Today's Shop Expenses" : "Today's Stock Returns"}
              </span>
              <button 
                onClick={() => setShowAllRecords(!showAllRecords)} 
                style={{ background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                {showAllRecords ? 'View Today' : 'View All'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activeView === 'sales' ? (
                displayedSales.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>No sales found for this date</div>
                ) : (
                  displayedSales.map((p, index) => (
                    <div key={p.id || index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, width: '26px' }}>#{p.id || index + 1}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{p.customer || p.name}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>{p.phone || 'Retail'}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px' }}>{p.products || 'Item'}</span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a' }}>{(p.mode || 'CASH').toUpperCase()}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#2563eb' }}>₹{(p.amount || 0).toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>
                            {p.date ? (p.date.includes('T') ? new Date(p.date).toLocaleDateString('en-IN') : p.date) : p.time}
                          </div>
                        </div>
                        <span style={{ color: '#2563eb', fontWeight: 800, fontSize: '14px' }}>›</span>
                      </div>
                    </div>
                  ))
                )
              ) : activeView === 'expenses' ? (
                displayedExpenses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>No expenses found for this date</div>
                ) : (
                  displayedExpenses.map((e, index) => (
                    <div key={e.id || index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{e.category}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{e.description || '-'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#dc2626' }}>₹{(e.amount || 0).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>{e.time || e.date}</div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                displayedReturns.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>No returns found for this date</div>
                ) : (
                  displayedReturns.map((r, index) => (
                    <div key={r.id || index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{r.name}</div>
                        <div style={{ fontSize: '10px', color: '#2563eb', fontFamily: 'monospace', marginTop: '1px' }}>{r.imei || '—'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#dc2626' }}>₹{(r.price || 0).toLocaleString('en-IN')}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>{r.date || '—'}</div>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

            {activeView === 'sales' && (
              <div style={{ background: '#eff6ff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>Total Items: {computedTotalItems}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>Total Sold:</span>
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#2563eb' }}>{computedProductsSold}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* DESKTOP DASHBOARD VIEW (>= 769px) - MATCHING IMAGE 4 EXACTLY */
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
                justify: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10"/>
                      <line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Total &amp; Today Sales</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>All time sales and today's sales</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Total Sales</span>
                      <span style={{ fontSize: '9px', fontWeight: 700, background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '10px' }}>All Time</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb', wordBreak: 'break-word' }}>
                      ₹{dashboardData.totalSales.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Today's Sales</span>
                      <span style={{ fontSize: '9px', fontWeight: 700, background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '10px' }}>Today</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb', wordBreak: 'break-word' }}>
                      ₹{dashboardData.todayTotalSales.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#eff6ff', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#1d4ed8' }}>
                <span>🛒 {todaySalesCount} Items sold today</span>
                <span style={{ fontSize: '14px' }}>›</span>
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
                justify: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f0fdf4', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                      <polyline points="17 6 23 6 23 12"/>
                    </svg>
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>All &amp; Today Profit</h3>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>Net profit after costs &amp; expenses</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Total Profit</span>
                      <span style={{ fontSize: '9px', fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '10px' }}>All Time</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: dashboardData.totalProfit < 0 ? '#dc2626' : '#16a34a', wordBreak: 'break-word' }}>
                      ₹{dashboardData.totalProfit.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Today's Profit</span>
                      <span style={{ fontSize: '9px', fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: '10px' }}>Today</span>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: dashboardData.todayProfit < 0 ? '#dc2626' : '#16a34a', wordBreak: 'break-word' }}>
                      ₹{dashboardData.todayProfit.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#f0fdf4', padding: '10px 14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: '#15803d' }}>
                <span>💰 Profit margin: {profitMarginPercent}%</span>
                <span style={{ fontSize: '14px' }}>›</span>
              </div>
            </div>

            {/* DESKTOP VERTICAL COMPACT CARD 3: Today's Shop Expense (MATCHING IMAGE 4 EXACTLY) */}
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
                justify: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/>
                    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/>
                    <path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6z"/>
                  </svg>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsExpenseModalOpen(true); }}
                  style={{ width: '28px', height: '28px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Add Expense"
                >
                  +
                </button>
              </div>

              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px', lineHeight: '1.3' }}>
                  Today's Shop Expense
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#dc2626', wordBreak: 'break-word' }}>
                  ₹{dashboardData.todayExpense.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* DESKTOP VERTICAL COMPACT CARD 4: Today's Stock In (MATCHING IMAGE 4 WITH BLUE BORDER OUTLINE) */}
            <div 
              onClick={() => setActiveView('sales')}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                padding: '18px',
                border: '2px solid #2563eb', // Blue border outline as shown in Image 4
                boxShadow: '0 2px 12px rgba(37,99,235,0.1)',
                display: 'flex',
                flexDirection: 'column',
                justify: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                  </svg>
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px', lineHeight: '1.3' }}>
                  Today's Stock In
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#2563eb', wordBreak: 'break-word' }}>
                  {dashboardData.todayStockIn}
                </div>
              </div>
            </div>

            {/* DESKTOP VERTICAL COMPACT CARD 5: Today's Stock Returns (MATCHING IMAGE 4 EXACTLY) */}
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
                justify: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '14px', background: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 4v6h-6"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsReturnModalOpen(true); }}
                  style={{ width: '28px', height: '28px', background: '#fff7ed', color: '#f97316', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Add Return"
                >
                  +
                </button>
              </div>

              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px', lineHeight: '1.3' }}>
                  Today's Stock Returns
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ea580c', wordBreak: 'break-word' }}>
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

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  {activeView === 'sales' ? (
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ width: '110px', padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Invoice</th>
                      <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Customer</th>
                      <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Products</th>
                      <th style={{ textAlign: 'center', padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Mode</th>
                      <th style={{ textAlign: 'right', padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Amount</th>
                      <th style={{ textAlign: 'right', padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Date</th>
                    </tr>
                  ) : activeView === 'expenses' ? (
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ width: '60px', padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>#</th>
                      <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Category</th>
                      <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Description</th>
                      <th style={{ textAlign: 'right', padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Amount</th>
                      <th style={{ textAlign: 'right', padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Time</th>
                    </tr>
                  ) : (
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ width: '50px', padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>#</th>
                      <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Product Name</th>
                      <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Brand</th>
                      <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Variant</th>
                      <th style={{ padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>IMEI Number</th>
                      <th style={{ textAlign: 'right', padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Price (₹)</th>
                      <th style={{ textAlign: 'right', padding: '14px 20px', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Date</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {activeView === 'sales' ? (
                    displayedSales.length === 0 ? (
                      <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No sales found for this date</td></tr>
                    ) : displayedSales.map((p, index) => (
                      <tr key={p.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '13px' }}>{p.id}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{p.customer || p.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{p.phone || 'Retail'}</div>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#334155', fontSize: '13px' }}>{p.products || p.variant}</td>
                        <td style={{ textAlign: 'center', padding: '14px 20px', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', fontSize: '12px' }}>{p.mode || p.paymentMethod || '-'}</td>
                        <td style={{ textAlign: 'right', padding: '14px 20px', fontWeight: 700, color: '#2563eb', fontSize: '14px' }}>₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right', padding: '14px 20px', color: '#64748b', fontFamily: 'monospace', fontSize: '12px' }}>
                          {p.date ? (p.date.includes('T') ? new Date(p.date).toLocaleDateString('en-IN') : p.date) : p.time}
                        </td>
                      </tr>
                    ))
                  ) : activeView === 'expenses' ? (
                    displayedExpenses.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No expenses found for this date</td></tr>
                    ) : displayedExpenses.map((e, index) => (
                      <tr key={e.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '13px' }}>{index + 1}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{e.category}</div>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#334155', fontSize: '13px' }}>{e.description || '-'}</td>
                        <td style={{ textAlign: 'right', padding: '14px 20px', fontWeight: 700, color: '#dc2626', fontSize: '14px' }}>₹{(e.amount || 0).toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right', padding: '14px 20px', color: '#64748b', fontFamily: 'monospace', fontSize: '12px' }}>{e.time || e.date}</td>
                      </tr>
                    ))
                  ) : (
                    displayedReturns.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>No returns found for this date</td></tr>
                    ) : displayedReturns.map((r, index) => (
                      <tr key={r.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 20px', color: '#64748b', fontSize: '13px' }}>{index + 1}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{r.name}</div>
                        </td>
                        <td style={{ padding: '14px 20px', color: '#334155', fontSize: '13px' }}>{r.brand || '—'}</td>
                        <td style={{ padding: '14px 20px', color: '#334155', fontSize: '13px' }}>{r.variant || '—'}</td>
                        <td style={{ padding: '14px 20px', color: '#2563eb', fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>{r.imei || '—'}</td>
                        <td style={{ textAlign: 'right', padding: '14px 20px', fontWeight: 700, color: '#dc2626', fontSize: '14px' }}>₹{(r.price || 0).toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right', padding: '14px 20px', color: '#64748b', fontSize: '12px' }}>{r.date || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
