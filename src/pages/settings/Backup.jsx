import React, { useState } from 'react'
import {
  exportSales,
  exportCustomers,
  exportSuppliers,
  exportProducts,
  exportStock,
  exportFullBackupZip,
  exportCustomBackup,
  exportDatabaseDump,
  getFullBackup,
  downloadBlob
} from '../../services/api'

const ALL_MODULES = [
  { id: 'sales', label: 'Sales (Raw Invoices)' },
  { id: 'sale_items', label: 'Sale Items (Item Details)' },
  { id: 'customers', label: 'Customers' },
  { id: 'products', label: 'Products Catalog' },
  { id: 'imei', label: 'IMEI Registry' },
  { id: 'categories', label: 'Categories' },
  { id: 'suppliers', label: 'Suppliers' },
  { id: 'purchases', label: 'Purchases (Raw Purchases)' },
  { id: 'purchase_items', label: 'Purchase Items' },
  { id: 'finance_records', label: 'Finance Records' },
  { id: 'finance_installments', label: 'Finance Installments' },
  { id: 'loans', label: 'Loans' },
  { id: 'loan_payments', label: 'Loan Payments' },
  { id: 'receivables', label: 'Customer Receivables' },
  { id: 'receivable_payments', label: 'Receivable Payments' },
  { id: 'company_returns', label: 'Company Returns' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'stock_detail', label: 'Stock Detail' },
  { id: 'stock_valuation', label: 'Stock Valuation Summary' },
  { id: 'gst_sales', label: 'GST Sales' },
  { id: 'gst_summary', label: 'GST Summary' },
  { id: 'nongst_sales', label: 'Non-GST Sales' },
  { id: 'nongst_summary', label: 'Non-GST Summary' },
  { id: 'profitloss_detail', label: 'Profit & Loss Detail' },
  { id: 'profitloss_summary', label: 'Profit & Loss Summary' },
  { id: 'company_finance', label: 'Company Finance' },
  { id: 'private_finance', label: 'Private Finance' },
  { id: 'emi_records', label: 'EMI Records' },
  { id: 'users', label: 'Users Metadata (No Passwords)' }
]

const Backup = () => {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  // Custom Backup State
  const [selectedModules, setSelectedModules] = useState(ALL_MODULES.map(m => m.id))
  const [datePreset, setDatePreset] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saleType, setSaleType] = useState('all')
  const [gstFilter, setGstFilter] = useState('all')
  const [financeTypeFilter, setFinanceTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const showStatus = (msg, isError = false) => {
    setStatus(isError ? `❌ ${msg}` : `✅ ${msg}`)
    setTimeout(() => setStatus(''), 5000)
  }

  // Handle Preset Date selection
  const handleDatePresetChange = (preset) => {
    setDatePreset(preset)
    const today = new Date()
    if (preset === 'today') {
      const yyyyMmDd = today.toISOString().split('T')[0]
      setStartDate(yyyyMmDd)
      setEndDate(yyyyMmDd)
    } else if (preset === '7days') {
      const past = new Date(today)
      past.setDate(past.getDate() - 7)
      setStartDate(past.toISOString().split('T')[0])
      setEndDate(today.toISOString().split('T')[0])
    } else if (preset === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      setStartDate(firstDay.toISOString().split('T')[0])
      setEndDate(today.toISOString().split('T')[0])
    } else if (preset === 'last_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)
      setStartDate(firstDay.toISOString().split('T')[0])
      setEndDate(lastDay.toISOString().split('T')[0])
    } else {
      setStartDate('')
      setEndDate('')
    }
  }

  // 1. Single ZIP Full Business Backup
  const handleFullBackupZip = async () => {
    try {
      setLoading(true)
      setStatus('Generating complete ZIP backup bundle...')
      const res = await exportFullBackupZip()
      const dateStr = new Date().toISOString().split('T')[0]
      downloadBlob(res, `Maa_Veshno_ERP_Full_Backup_${dateStr}.zip`)
      showStatus('Complete ERP business backup ZIP downloaded successfully!')
    } catch (err) {
      showStatus(err.response?.data?.message || 'Full backup ZIP failed. Please try again.', true)
    } finally {
      setLoading(false)
    }
  }

  // Fallback / Separate CSV Full Backup (Multi-file)
  const handleFullBackupCSV = async () => {
    try {
      setLoading(true)
      setStatus('Fetching multi-file CSV backup from database...')
      const res = await getFullBackup()
      if (!res.data?.success) {
        showStatus('Backup failed: ' + (res.data?.message || 'Unknown error'), true)
        return
      }
      const sheets = res.data.data
      const dateStr = new Date().toISOString().split('T')[0]
      let sheetsDownloaded = 0

      for (const [sheetName, rows] of Object.entries(sheets)) {
        if (!rows || rows.length === 0) continue
        const headers = Object.keys(rows[0])
        const escapeVal = v => {
          if (v === null || v === undefined) return ''
          const s = String(v)
          return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
        }
        const lines = [headers.map(escapeVal).join(','), ...rows.map(row => headers.map(h => escapeVal(row[h])).join(','))]
        const csvStr = '\uFEFF' + lines.join('\n')

        const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Maa_Veshno_${sheetName.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.csv`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)

        sheetsDownloaded++
        await new Promise(r => setTimeout(r, 200))
      }

      showStatus(`Multi-file backup complete! ${sheetsDownloaded} sheets downloaded.`)
    } catch (err) {
      showStatus(err.response?.data?.message || 'Multi-file backup failed. Please try again.', true)
    } finally {
      setLoading(false)
    }
  }

  // 2. Quick Export
  const handleQuickExport = async (exportFn, label, filename) => {
    try {
      setLoading(true)
      setStatus(`Exporting ${label}...`)
      const res = await exportFn()
      const dateStr = new Date().toISOString().split('T')[0]
      downloadBlob(res, `${filename}_${dateStr}.csv`)
      showStatus(`${label} exported successfully!`)
    } catch (err) {
      showStatus(`Failed to export ${label}`, true)
    } finally {
      setLoading(false)
    }
  }

  // 3. Custom Backup Export
  const handleExportCustomBackup = async () => {
    if (selectedModules.length === 0) {
      showStatus('Please select at least one module for custom backup.', true)
      return
    }

    try {
      setLoading(true)
      setStatus('Generating custom backup ZIP...')
      const payload = {
        modules: selectedModules,
        startDate: datePreset === 'custom' || startDate ? startDate : (startDate || undefined),
        endDate: datePreset === 'custom' || endDate ? endDate : (endDate || undefined),
        saleType,
        gstFilter,
        financeTypeFilter,
        statusFilter
      }

      const res = await exportCustomBackup(payload)
      const dateStr = new Date().toISOString().split('T')[0]
      downloadBlob(res, `Maa_Veshno_ERP_Custom_Backup_${dateStr}.zip`)
      showStatus('Custom backup ZIP downloaded successfully!')
    } catch (err) {
      showStatus(err.response?.data?.message || 'Custom backup failed.', true)
    } finally {
      setLoading(false)
    }
  }

  // 4. Database Dump (BSON / mongodump Archive)
  const handleDatabaseDump = async () => {
    try {
      setLoading(true)
      setStatus('Creating server database BSON dump (mongodump)...')
      const res = await exportDatabaseDump()
      
      // Check if response returned JSON warning instead of binary blob
      if (res.data?.type === 'application/json' || (res.data instanceof Blob && res.data.type === 'application/json')) {
        const text = await res.data.text()
        const json = JSON.parse(text)
        showStatus(json.message || 'Database dump tool is not available on this server.', true)
        return
      }

      const dateStr = new Date().toISOString().split('T')[0]
      downloadBlob(res, `Maa_Veshno_ERP_DB_Backup_${dateStr}.archive.gz`)
      showStatus('Database BSON archive (.archive.gz) downloaded successfully!')
    } catch (err) {
      showStatus(err.response?.data?.message || 'Database dump operation failed.', true)
    } finally {
      setLoading(false)
    }
  }

  const toggleSelectAllModules = () => {
    if (selectedModules.length === ALL_MODULES.length) {
      setSelectedModules([])
    } else {
      setSelectedModules(ALL_MODULES.map(m => m.id))
    }
  }

  const toggleModule = (id) => {
    if (selectedModules.includes(id)) {
      setSelectedModules(selectedModules.filter(m => m !== id))
    } else {
      setSelectedModules([...selectedModules, id])
    }
  }

  const quickExportCards = [
    { label: 'Sales Export', desc: 'Download all sales/bills with payment details', color: 'var(--primary)', fn: () => handleQuickExport(exportSales, 'Sales', 'Sales') },
    { label: 'Customers Export', desc: 'Export all customer records with balances', color: 'var(--warning)', fn: () => handleQuickExport(exportCustomers, 'Customers', 'Customers') },
    { label: 'Suppliers Export', desc: 'Export all supplier records with dues', color: 'var(--info, #0ea5e9)', fn: () => handleQuickExport(exportSuppliers, 'Suppliers', 'Suppliers') },
    { label: 'Products Export', desc: 'Download full product catalog', color: 'var(--secondary, #8b5cf6)', fn: () => handleQuickExport(exportProducts, 'Products', 'Products') },
    { label: 'Stock Report', desc: 'Export current stock levels with values', color: 'var(--text-secondary)', fn: () => handleQuickExport(exportStock, 'Stock', 'Stock') },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Maa Veshno Data Backup</h1>
          <p>Export your complete business data to CSV & ZIP backup files.</p>
        </div>
      </div>

      {status && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', background: status.startsWith('❌') ? '#fef2f2' : '#f0fdf4', color: status.startsWith('❌') ? '#b91c1c' : '#15803d', border: `1px solid ${status.startsWith('❌') ? '#fca5a5' : '#86efac'}`, fontWeight: 500 }}>
          {status}
        </div>
      )}

      {/* Full Backup Card (ALL) */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', color: 'white', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px', color: 'white' }}>🗄️ Complete Maa Veshno Backup (ALL)</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1' }}>
              Downloads ALL business data: Sales, Sale Items, Customers, Products, IMEI, Categories, Suppliers, Purchases, Purchase Items, Finance Records, Finance Installments, Loans, Receivables, Returns, Transactions, Expenses, P&L, Stock & Users Metadata.
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8' }}>
              Saved as a single ZIP bundle containing 35+ CSV files + BACKUP_MANIFEST.json. Read-only operation — no data is modified.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={handleFullBackupZip}
              disabled={loading}
              style={{ minWidth: '180px', padding: '12px 20px', fontSize: '15px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', cursor: loading ? 'wait' : 'pointer', fontWeight: 600 }}
            >
              {loading ? '⏳ Bundling...' : '📦 Full Backup (ZIP)'}
            </button>
            <button
              className="btn btn-outline"
              onClick={handleFullBackupCSV}
              disabled={loading}
              style={{ padding: '12px 16px', fontSize: '13px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: '8px', cursor: loading ? 'wait' : 'pointer' }}
            >
              📄 Separate CSVs
            </button>
          </div>
        </div>
      </div>

      {/* Quick Export Cards */}
      <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Quick Exports</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {quickExportCards.map(card => (
          <div key={card.label} className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${card.color}` }}>
            <div>
              <h4 style={{ margin: '0 0 4px', color: card.color }}>{card.label}</h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{card.desc}</p>
            </div>
            <button className="btn btn-outline" onClick={card.fn} disabled={loading} style={{ minWidth: '90px', marginLeft: '12px' }}>
              {loading ? '...' : 'Export'}
            </button>
          </div>
        ))}
      </div>

      {/* Custom Backup Section */}
      <div className="card" style={{ padding: '24px', marginBottom: '32px', borderRadius: '12px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '8px', color: 'var(--text-primary)' }}>🎯 Custom Backup Builder</h3>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Filter specific business modules, date ranges, and transaction criteria to create a targeted custom ZIP backup file.
        </p>

        {/* Date Range & Filter Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', padding: '16px', background: 'var(--bg-secondary, #f8fafc)', borderRadius: '8px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Date Range Preset</label>
            <select className="form-control" value={datePreset} onChange={e => handleDatePresetChange(e.target.value)}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {(datePreset === 'custom' || startDate || endDate) && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Start Date</label>
                <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>End Date</label>
                <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Sale Type</label>
            <select className="form-control" value={saleType} onChange={e => setSaleType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="retail">Retail Only</option>
              <option value="wholesale">Wholesale Only</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>GST Filter</label>
            <select className="form-control" value={gstFilter} onChange={e => setGstFilter(e.target.value)}>
              <option value="all">All Invoices</option>
              <option value="gst">GST Invoices Only</option>
              <option value="nongst">Non-GST Invoices Only</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Finance Type</label>
            <select className="form-control" value={financeTypeFilter} onChange={e => setFinanceTypeFilter(e.target.value)}>
              <option value="all">All Finance</option>
              <option value="company">Company Finance</option>
              <option value="private">Private Finance</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>Record Status</label>
            <select className="form-control" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses (Include Drafts)</option>
              <option value="completed">Completed Only</option>
              <option value="draft">Drafts Only</option>
              <option value="cancelled">Cancelled Only</option>
            </select>
          </div>
        </div>

        {/* Modules Selection Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontWeight: 600, fontSize: '14px' }}>Select Modules ({selectedModules.length} / {ALL_MODULES.length})</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-outline" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={toggleSelectAllModules}>
              {selectedModules.length === ALL_MODULES.length ? 'Clear All' : 'Select All'}
            </button>
          </div>
        </div>

        {/* Modules Checkboxes Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', maxHeight: '280px', overflowY: 'auto', padding: '12px', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '8px', marginBottom: '20px' }}>
          {ALL_MODULES.map(m => (
            <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={selectedModules.includes(m.id)}
                onChange={() => toggleModule(m.id)}
              />
              <span>{m.label}</span>
            </label>
          ))}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleExportCustomBackup}
          disabled={loading || selectedModules.length === 0}
          style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 600 }}
        >
          {loading ? '⏳ Generating Custom Backup...' : '📦 Export Custom Backup (ZIP)'}
        </button>
      </div>

      {/* Database Dump (BSON / mongodump Archive) */}
      <div className="card" style={{ padding: '24px', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px', color: 'var(--text-primary)' }}>💾 Full Database BSON Backup (mongodump)</h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
              Generates a raw compressed MongoDB BSON archive (.archive.gz) for database-level disaster recovery and restoration.
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#64748b' }}>
              Restoration command: <code>mongorestore --uri="your_mongodb_uri" --archive=Maa_Veshno_ERP_DB_Backup.archive.gz --gzip</code>
            </p>
          </div>
          <button
            className="btn btn-outline"
            onClick={handleDatabaseDump}
            disabled={loading}
            style={{ padding: '10px 20px', fontSize: '14px', fontWeight: 600, borderColor: '#3b82f6', color: '#2563eb' }}
          >
            {loading ? '⏳ Creating Dump...' : '📥 Download DB Dump (.archive.gz)'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Backup
