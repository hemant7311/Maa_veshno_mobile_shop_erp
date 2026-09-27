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
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '12px 12px 100px 12px' }}>
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
      <div className="page-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div className="page-header-left">
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#0f172a' }}>Dashboard</h1>
          <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '12px' }}>Welcome back, {user?.name || 'Maa Veshno Admin'}</p>
        </div>
        <div className="page-header-right">
          <input 
            type="date" 
            className="form-input" 
            style={{ width: 'auto', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: 600 }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="dashboard-cards-container" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
        
        {/* COMBINED CARD 1: Total & Today Sales */}
        <div 
          onClick={() => setActiveView('sales')}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '16px',
            border: activeView === 'sales' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>Total &amp; Today Sales</h3>
              <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#64748b' }}>All time sales and today's sales</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Total Sales</span>
                <span style={{ fontSize: '9px', fontWeight: 700, background: '#dbeafe', color: '#1e40af', padding: '1px 5px', borderRadius: '8px' }}>All Time</span>
              </div>
              <div style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: 800, color: '#2563eb', whiteSpace: 'nowrap' }}>
                ₹{dashboardData.totalSales.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Today's Sales</span>
                <span style={{ fontSize: '9px', fontWeight: 700, background: '#dbeafe', color: '#1e40af', padding: '1px 5px', borderRadius: '8px' }}>Today</span>
              </div>
              <div style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: 800, color: '#2563eb', whiteSpace: 'nowrap' }}>
                ₹{dashboardData.todayTotalSales.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div style={{ background: '#eff6ff', padding: '7px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#1d4ed8' }}>
            <span>🛒 {todaySalesCount} Items sold today</span>
            <span>›</span>
          </div>
        </div>

        {/* COMBINED CARD 2: All & Today Profit */}
        <div 
          onClick={() => setActiveView('sales')}
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '16px',
            border: activeView === 'sales' ? '2px solid #22c55e' : '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f0fdf4', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>All &amp; Today Profit</h3>
              <p style={{ margin: '1px 0 0', fontSize: '11px', color: '#64748b' }}>Net profit after costs &amp; expenses</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '10px 12px', borderRadius: '12px', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Total Profit</span>
                <span style={{ fontSize: '9px', fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '1px 5px', borderRadius: '8px' }}>All Time</span>
              </div>
              <div style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: 800, color: dashboardData.totalProfit < 0 ? '#dc2626' : '#16a34a', whiteSpace: 'nowrap' }}>
                ₹{dashboardData.totalProfit.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Today's Profit</span>
                <span style={{ fontSize: '9px', fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '1px 5px', borderRadius: '8px' }}>Today</span>
              </div>
              <div style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: 800, color: dashboardData.todayProfit < 0 ? '#dc2626' : '#16a34a', whiteSpace: 'nowrap' }}>
                ₹{dashboardData.todayProfit.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div style={{ background: '#f0fdf4', padding: '7px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#15803d' }}>
            <span>💰 Profit margin: {profitMarginPercent}%</span>
            <span>›</span>
          </div>
        </div>

        {/* 2-COLUMN ROW ON MOBILE: Shop Expense & Stock In */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {/* COMPACT CARD 3: Shop Expense */}
          <div 
            onClick={() => setActiveView('expenses')}
            style={{
              background: '#fff5f5',
              borderRadius: '14px',
              padding: '12px 14px',
              border: activeView === 'expenses' ? '2px solid #ef4444' : '1px solid #ffe4e4',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/>
                  <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/>
                  <path d="M18 12a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h4v-6z"/>
                </svg>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpenseModalOpen(true); }}
                style={{ background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', width: '24px', height: '24px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Add Expense"
              >
                +
              </button>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '2px' }}>Shop Expense</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>
                ₹{dashboardData.todayExpense.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* COMPACT CARD 4: Stock In */}
          <div 
            onClick={() => setActiveView('sales')}
            style={{
              background: '#f0f7ff',
              borderRadius: '14px',
              padding: '12px 14px',
              border: activeView === 'sales' ? '2px solid #2563eb' : '1px solid #e0f2fe',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                </svg>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '2px' }}>Stock In</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#2563eb' }}>
                {dashboardData.todayStockIn}
              </div>
            </div>
          </div>
        </div>

        {/* FULL WIDTH CARD 5: Stock Returns */}
        <div 
          onClick={() => setActiveView('returns')}
          style={{
            background: '#fffaf5',
            borderRadius: '14px',
            padding: '12px 14px',
            border: activeView === 'returns' ? '2px solid #f97316' : '1px solid #ffedd5',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 4v6h-6"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Stock Returns</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#ea580c' }}>
                {dashboardData.todayReturnsCount} Items — ₹{dashboardData.todayReturnsAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); setIsReturnModalOpen(true); }}
            style={{ background: '#fff7ed', color: '#f97316', border: 'none', borderRadius: '6px', width: '24px', height: '24px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Add Return"
          >
            +
          </button>
        </div>
      </div>

      {/* Table Section / Card List for Mobile */}
      <div className="card" style={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', background: '#fff' }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
          <span className="card-title" style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
            {activeView === 'sales' ? "Today's Sold Products" : activeView === 'expenses' ? "Today's Shop Expenses" : "Today's Stock Returns"}
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button 
              onClick={() => setShowAllRecords(!showAllRecords)} 
              className="btn btn-sm btn-primary" 
              style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}
            >
              {showAllRecords ? 'View Today' : 'View All'}
            </button>
          </div>
        </div>

        {/* LIST VIEW FOR MOBILE & DESKTOP (Perfect Mobile Rows matching media_1790492066131.png) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {activeView === 'sales' ? (
            displayedSales.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>No sales found for this date</div>
            ) : displayedSales.map((p, index) => (
              <div 
                key={p.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  padding: '12px 14px',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: '12px',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600, minWidth: '22px' }}>#{p.id || index + 1}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.customer || p.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                      {p.phone || 'Retail'}
                    </div>
                  </div>
                </div>

                <div style={{ color: '#475569', fontSize: '11px', textAlign: 'center', minWidth: '50px' }}>
                  {p.products || p.variant}
                </div>

                <div style={{ minWidth: '40px', textAlign: 'center' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, background: '#f1f5f9', color: '#334155', padding: '2px 5px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {p.mode || p.paymentMethod || 'CASH'}
                  </span>
                </div>

                <div style={{ textAlign: 'right', minWidth: '75px' }}>
                  <div style={{ fontWeight: 700, color: '#2563eb', fontSize: '12px' }}>
                    ₹{(p.amount || 0).toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '1px' }}>
                    {p.date ? (p.date.includes('T') ? new Date(p.date).toLocaleDateString('en-IN') : p.date) : p.time}
                  </div>
                </div>

                <span style={{ color: '#cbd5e1', fontSize: '14px', paddingLeft: '4px' }}>›</span>
              </div>
            ))
          ) : activeView === 'expenses' ? (
            displayedExpenses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>No expenses found for this date</div>
            ) : displayedExpenses.map((e, index) => (
              <div 
                key={e.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  padding: '12px 14px',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: '12px',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>#{index + 1}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{e.category}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>{e.description || '-'}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '13px' }}>₹{(e.amount || 0).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '1px' }}>{e.time || e.date}</div>
                </div>
              </div>
            ))
          ) : (
            displayedReturns.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px' }}>No returns found for this date</div>
            ) : displayedReturns.map((r, index) => (
              <div 
                key={r.id || index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  padding: '12px 14px',
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: '12px',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>#{index + 1}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.name}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>{r.brand} | {r.imei || '—'}</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#ea580c', fontSize: '13px' }}>₹{(r.price || 0).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '1px' }}>{r.date || '—'}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary Bar */}
        {activeView === 'sales' && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <span style={{ fontWeight: 700, color: '#334155', fontSize: '12px' }}>
              Total Items: {computedTotalItems}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 700, color: '#64748b', fontSize: '12px' }}>
                Total Sold:
              </span>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#2563eb', lineHeight: 1 }}>
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
