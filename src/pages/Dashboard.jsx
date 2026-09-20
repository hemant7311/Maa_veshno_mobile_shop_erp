import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const Dashboard = () => {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'))
  const realToday = new Date().toLocaleDateString('en-CA')
  const [activeView, setActiveView] = useState('sales')
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [expenseForm, setExpenseForm] = useState({ category: '', amount: '', description: '' })
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false)
  const [returnForm, setReturnForm] = useState({ imei: '', name: '', variant: '', problem: '', description: '', customerName: '', customerPhone: '' })
  const [allImeis, setAllImeis] = useState([])
  const [showAllRecords, setShowAllRecords] = useState(false)
  const [totalProfit, setTotalProfit] = useState(0)
  const [totalCashProfit, setTotalCashProfit] = useState(0)
  const [totalUpiProfit, setTotalUpiProfit] = useState(0)
  const [data, setData] = useState({
    todayProfit: 0,
    todayExpense: 0,
    todayStockIn: 0,
    todayStockReturn: 0,
    returnedProducts: [],
    shopExpenses: [],
    soldProducts: []
  })

  useEffect(() => {
    api.get('/imeis')
      .then(res => { if (res.data?.success) setAllImeis(res.data.data) })
      .catch(() => {})

    api.get('/dashboard')
      .then((response) => {
        if (response.data.success && response.data.data) {
          const d = response.data.data
          setData(prev => ({
            ...prev,
            todayProfit: d.todayProfit || 0,
            todayStockIn: d.todayStockIn || 0,
            soldProducts: d.recentSales || [],
          }))
          if (d.totalProfit !== undefined) setTotalProfit(d.totalProfit)
          if (d.totalCashProfit !== undefined) setTotalCashProfit(d.totalCashProfit)
          if (d.totalUpiProfit !== undefined) setTotalUpiProfit(d.totalUpiProfit)
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err.message)
      })
  }, [])
  const todayExpensesArr = data.shopExpenses.filter(i => i.date === selectedDate)
  const computedExpense = todayExpensesArr.reduce((sum, item) => sum + item.amount, 0)
  
  const todayReturnsArr = data.returnedProducts.filter(i => i.date === selectedDate)
  const computedReturn = todayReturnsArr.length
  const computedReturnAmount = todayReturnsArr.reduce((sum, r) => sum + (r.price || 0), 0)
  
  const todaySalesArr = data.soldProducts.filter(i => i.date && i.date.startsWith(selectedDate))
  const computedTotalItems = todaySalesArr.length
  const computedProductsSold = todaySalesArr.length
  
  const computedProfit = data.todayProfit - computedExpense
  const todayCashProfit = todaySalesArr.filter(p => p.mode === 'cash').reduce((sum, p) => sum + (p.profit || 1500) * (p.qty || 1), 0) - computedExpense
  const todayUpiProfit = todaySalesArr.filter(p => p.mode !== 'cash').reduce((sum, p) => sum + (p.profit || 1500) * (p.qty || 1), 0)

  const todayStockInArr = allImeis.filter(item => item.createdAt && item.createdAt.startsWith(selectedDate))
  const computedStockIn = todayStockInArr.length > 0 ? todayStockInArr.length : (allImeis.length > 0 ? 0 : data.todayStockIn)

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
      value: `₹${Math.max(0, computedProfit).toLocaleString('en-IN')}`,
      color: 'green',
      filterValue: 'sales',
      details: { cash: `₹${Math.max(0, todayCashProfit).toLocaleString('en-IN')}`, upi: `₹${Math.max(0, todayUpiProfit).toLocaleString('en-IN')}` },
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

  const handleImeiChange = async (e) => {
    const val = e.target.value
    // Always update IMEI field first, clear other fields
    setReturnForm(prev => ({ ...prev, imei: val, name: '', variant: '', price: 0, brand: '' }))

    // Only search when IMEI is fully entered (14-15 digits)
    if (val.length >= 14) {
      try {
        // First try from already-loaded allImeis state
        const matched = allImeis.find(i => i.imeiNumber === val)
        if (matched && matched.productId) {
          setReturnForm(prev => ({
            ...prev,
            imei: val,
            name: matched.productId.productName || '',
            variant: matched.productId.variant || '',
            price: matched.productId.salePrice || 0,
            brand: matched.productId.brand || ''
          }))
          return
        }
        // Fallback: fresh API call with exact IMEI
        const res = await api.get(`/imeis?search=${val}`)
        if (res.data?.success && res.data?.data?.length > 0) {
          const apiMatch = res.data.data.find(i => i.imeiNumber === val)
          if (apiMatch && apiMatch.productId) {
            setReturnForm(prev => ({
              ...prev,
              imei: val,
              name: apiMatch.productId.productName || '',
              variant: apiMatch.productId.variant || '',
              price: apiMatch.productId.salePrice || 0,
              brand: apiMatch.productId.brand || ''
            }))
          }
        }
      } catch {
        // API failed — leave name/variant blank, user must type manually
      }
    }
  }

  const downloadReturnsExcel = () => {
    const returnsData = showAllRecords ? data.returnedProducts : todayReturnsArr
    const headers = ['#', 'Product Name', 'Brand', 'Variant', 'IMEI Number', 'Price (₹)', 'Date', 'Time']
    const rows = returnsData.map((r, i) => [
      i + 1,
      r.name || '',
      r.brand || '',
      r.variant || '',
      r.imei || '',
      r.price || 0,
      r.date || '',
      r.time || ''
    ])
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `returns_${selectedDate}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {isReturnModalOpen && (
        <div className="modal-overlay" onClick={() => setIsReturnModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', width: '100%', background: '#fff', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Register Complaint</h2>
              <button onClick={() => setIsReturnModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>IMEI Number</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    id="imei-input-dashboard"
                    className="form-input" 
                    style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    placeholder="Enter 15-digit IMEI" 
                    value={returnForm.imei}
                    onChange={handleImeiChange}
                    maxLength="15"
                    autoFocus
                  />
                  <button type="button" onClick={() => document.getElementById('imei-input-dashboard').focus()} className="btn btn-outline" title="Scan barcode" style={{ flexShrink: 0, padding: '0 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', height: '42px' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 5v14M7 5v14M13 5v14M17 5v14M21 5v14M10 5v6M10 13v6"/>
                    </svg>
                    Scan
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Product Name</label>
                  <input type="text" className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a' }} value={returnForm.name} onChange={e => setReturnForm({...returnForm, name: e.target.value})} placeholder="Product Name" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Variant</label>
                  <input type="text" className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a' }} value={returnForm.variant} onChange={e => setReturnForm({...returnForm, variant: e.target.value})} placeholder="Variant" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Customer Name</label>
                  <input type="text" className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={returnForm.customerName} onChange={e => setReturnForm({...returnForm, customerName: e.target.value})} placeholder="Customer Name" />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Phone Number</label>
                  <input type="text" className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={returnForm.customerPhone} onChange={e => setReturnForm({...returnForm, customerPhone: e.target.value})} placeholder="Phone Number" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Problem Type</label>
                <select className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} value={returnForm.problem} onChange={e => setReturnForm({...returnForm, problem: e.target.value})}>
                  <option value="">Select Problem</option>
                  <option value="Hardware Issue">Hardware Issue</option>
                  <option value="Software Issue">Software Issue</option>
                  <option value="Physical Damage">Physical Damage</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Description</label>
                <textarea className="form-input" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', minHeight: '80px' }} value={returnForm.description} onChange={e => setReturnForm({...returnForm, description: e.target.value})} placeholder="Describe the issue..."></textarea>
              </div>


            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setIsReturnModalOpen(false)} style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '8px 24px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}>Cancel</button>
              <button 
                onClick={async () => {
                  if (!returnForm.name && !returnForm.customerName) {
                    alert("Please enter at least a Product Name or Customer Name.");
                    return;
                  }

                  try {
                    const res = await api.get('/imeis');
                    if (res.data?.success && res.data?.data) {
                      const matched = res.data.data.find(i => i.imeiNumber === returnForm.imei);
                      if (matched) {
                        await api.patch(`/imeis/${matched._id}`, { status: 'returned' });
                      }
                    }
                  } catch (e) {
                    console.log('Skipping backend update in mock env', e);
                  }

                  const newReturn = {
                    id: Date.now(),
                    name: returnForm.name,
                    brand: returnForm.brand || '',
                    variant: returnForm.variant,
                    imei: returnForm.imei,
                    price: returnForm.price || 0,
                    customerName: returnForm.customerName,
                    customerPhone: returnForm.customerPhone,
                    problem: returnForm.problem,
                    description: returnForm.description,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    date: realToday
                  };
                  setData(prev => {
                    const updatedReturns = [newReturn, ...prev.returnedProducts]
                    localStorage.setItem('mock_returned_products', JSON.stringify(updatedReturns))
                    return {
                      ...prev,
                      returnedProducts: updatedReturns,
                      todayStockReturn: updatedReturns.length,
                      soldProducts: prev.soldProducts.filter(p => p.name !== returnForm.name)
                    }
                  });
                  setIsReturnModalOpen(false);
                  setReturnForm({ imei: '', name: '', brand: '', variant: '', price: 0, problem: '', description: '', customerName: '', customerPhone: '' });
                  setActiveView('returns');
                }}
                style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                Submit Complaint
              </button>
            </div>
          </div>
        </div>
      )}

      {isExpenseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsExpenseModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '100%', background: '#fff', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Add Today's Expense</h2>
              <button onClick={() => setIsExpenseModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Expense Name</label>
                <input 
                  type="text"
                  className="form-input" 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="e.g. Tea, Electricity Bill, Salary..."
                  value={expenseForm.category}
                  onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Amount (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="Enter amount" 
                  value={expenseForm.amount}
                  onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Description (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  placeholder="Enter description" 
                  value={expenseForm.description}
                  onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setIsExpenseModalOpen(false)}
                style={{ background: '#fff', border: '1px solid #cbd5e1', padding: '8px 24px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', color: '#475569' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (!expenseForm.amount || !expenseForm.category) {
                    alert("Please enter both category and amount.");
                    return;
                  }
                  const newExpense = {
                    id: Date.now(),
                    category: expenseForm.category,
                    amount: Number(expenseForm.amount),
                    description: expenseForm.description,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    date: realToday
                  };
                  setData(prev => {
                    const updatedExpenses = [newExpense, ...prev.shopExpenses];
                    localStorage.setItem('mock_shop_expenses', JSON.stringify(updatedExpenses));
                    return {
                      ...prev,
                      shopExpenses: updatedExpenses,
                      todayExpense: prev.todayExpense + newExpense.amount
                    };
                  });
                  setIsExpenseModalOpen(false);
                  setExpenseForm({ category: '', amount: '', description: '' });
                  setActiveView('expenses');
                }}
                style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Dashboard</h1>
          <p>Welcome back, Admin User</p>
        </div>
        <div className="page-header-right">
          <input 
            type="date" 
            className="date-picker-btn" 
            style={{ 
              cursor: 'pointer', 
              fontFamily: 'inherit', 
              color: 'var(--text-primary)', 
              fontWeight: 600,
              padding: '8px 16px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              background: '#fff'
            }}
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
            {activeView === 'returns' && (
              <button
                onClick={downloadReturnsExcel}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 600, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Excel
              </button>
            )}
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
                  <th style={{ textAlign: 'right' }}>Time</th>
                </tr>
              )}
            </thead>
            <tbody>
              {activeView === 'sales' ? (
                (showAllRecords ? data.soldProducts : todaySalesArr).map((p, index) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{p.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.customer || p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{p.phone || 'Retail'}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.products || p.variant}</td>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{p.mode || p.paymentMethod || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {p.date ? new Date(p.date).toLocaleDateString('en-IN') : p.time}
                    </td>
                  </tr>
                ))
              ) : activeView === 'expenses' ? (
                (showAllRecords ? data.shopExpenses : todayExpensesArr).map((e, index) => (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.category}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{e.description || '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--red)' }}>₹{e.amount.toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{e.time}</td>
                  </tr>
                ))
              ) : (
                (showAllRecords ? data.returnedProducts : todayReturnsArr).map((r, index) => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{r.variant}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.brand || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.variant || '—'}</td>
                    <td style={{ color: 'var(--primary)', fontFamily: 'monospace', fontSize: '12px', fontWeight: 600 }}>{r.imei || '—'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger)' }}>₹{(r.price || 0).toLocaleString('en-IN')}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontSize: '12px' }}>{r.date || '—'}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{r.time}</td>
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
