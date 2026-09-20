import React, { useState } from 'react'
import { getFullBackup, exportSales, exportCustomers, exportSuppliers, exportProducts, exportStock } from '../../services/api'

const Backup = () => {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')

  const showStatus = (msg, isError = false) => {
    setStatus(isError ? `❌ ${msg}` : `✅ ${msg}`)
    setTimeout(() => setStatus(''), 4000)
  }

  // Convert array of objects to CSV string
  const toCSV = (rows) => {
    if (!rows || rows.length === 0) return ''
    const headers = Object.keys(rows[0])
    const escape = v => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }
    const lines = [headers.map(escape).join(','), ...rows.map(row => headers.map(h => escape(row[h])).join(','))]
    return '\uFEFF' + lines.join('\n')
  }

  const downloadCSV = (csvStr, filename) => {
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  // Download each sheet as a separate CSV file
  const handleFullBackup = async () => {
    try {
      setLoading(true)
      setStatus('Fetching full backup from database...')
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
        const csv = toCSV(rows)
        const safeName = sheetName.replace(/[^a-zA-Z0-9]/g, '_')
        downloadCSV(csv, `Maa_Veshno_${safeName}_${dateStr}.csv`)
        sheetsDownloaded++
        // Small delay to prevent browser blocking multiple downloads
        await new Promise(r => setTimeout(r, 200))
      }

      showStatus(`Full backup complete! ${sheetsDownloaded} sheets downloaded.`)
    } catch (err) {
      showStatus(err.response?.data?.message || 'Backup failed. Please try again.', true)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickExport = async (exportFn, label, filename) => {
    try {
      setLoading(true)
      setStatus(`Exporting ${label}...`)
      const res = await exportFn()
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      showStatus(`${label} exported successfully!`)
    } catch (err) {
      showStatus(`Failed to export ${label}`, true)
    } finally {
      setLoading(false)
    }
  }

  const cards = [
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
          <p>Export your complete business data to CSV files.</p>
        </div>
      </div>

      {status && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', background: status.startsWith('❌') ? '#fef2f2' : '#f0fdf4', color: status.startsWith('❌') ? '#b91c1c' : '#15803d', border: `1px solid ${status.startsWith('❌') ? '#fca5a5' : '#86efac'}`, fontWeight: 500 }}>
          {status}
        </div>
      )}

      {/* Full Backup Card */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', color: 'white', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px', color: 'white' }}>🗄️ Complete Maa Veshno Backup (ALL)</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1' }}>
              Downloads ALL data: Sales, Purchases, Customers, Suppliers, Products, IMEI, Loans, Receivables, Returns, Transactions, Expenses, P&L, GST Summary.
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8' }}>
              Each module is saved as a separate CSV file. Read-only operation — no data is modified.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleFullBackup}
            disabled={loading}
            style={{ minWidth: '180px', padding: '12px 24px', fontSize: '15px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', cursor: loading ? 'wait' : 'pointer', fontWeight: 600 }}
          >
            {loading ? '⏳ Downloading...' : '📥 Full Backup (ALL)'}
          </button>
        </div>
      </div>

      {/* Quick Export Cards */}
      <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Quick Exports</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {cards.map(card => (
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
    </div>
  )
}

export default Backup
