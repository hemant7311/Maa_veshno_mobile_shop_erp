import React, { useEffect, useState } from 'react'
import api from '../../services/api'

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  
  // Modal & ledger states
  const [suppliedProducts, setSuppliedProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paying, setPaying] = useState(false)
  const [returningId, setReturningId] = useState(null)
  const [filterType, setFilterType] = useState('all') // 'all' | 'company' | 'private'
  
  // Edit supplier states
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', shopName: '', phone: '', type: 'company', status: 'active' })
  const [savingEdit, setSavingEdit] = useState(false)

  // Stats calculation
  const totalSuppliersCount = suppliers.length
  const activeCount = suppliers.filter(s => s.status === 'active').length
  const inactiveCount = suppliers.filter(s => s.status === 'inactive').length
  const totalPurchasesSum = suppliers.reduce((sum, s) => sum + (s.totalAmount || 0), 0)

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/suppliers')
      if (res.data.success) {
        setSuppliers(res.data.data || [])
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load suppliers data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
  }, [])

  const handleOpenDetails = async (supplier) => {
    setSelectedSupplier(supplier)
    setSuppliedProducts([])
    setLoadingProducts(true)
    try {
      const res = await api.get(`/suppliers/${supplier._id}/products`)
      if (res.data.success) {
        setSuppliedProducts(res.data.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingProducts(false)
    }
  }

  const handleRecordPayment = async (e) => {
    e.preventDefault()
    if (!paymentAmount || Number(paymentAmount) <= 0) return
    
    try {
      setPaying(true)
      const res = await api.post(`/suppliers/${selectedSupplier._id}/pay`, { amount: Number(paymentAmount) })
      if (res.data.success) {
        setPaymentAmount('')
        // Refresh selected supplier details in modal
        setSelectedSupplier(res.data.data)
        // Refresh supplier list
        loadSuppliers()
        alert('Payment recorded successfully!')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment recording failed.')
    } finally {
      setPaying(false)
    }
  }

  const handleReturnProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to return this product/device to the supplier? This will mark it as returned and deduct the purchase price from the supplier ledger.')) return

    try {
      setReturningId(productId)
      const res = await api.post(`/suppliers/products/${productId}/return`)
      if (res.data.success) {
        // Refresh supplied products in modal
        const refreshedProducts = suppliedProducts.map(p => {
          if (p._id === productId) {
            return { ...p, status: 'returned' }
          }
          return p
        })
        setSuppliedProducts(refreshedProducts)
        
        // Refresh supplier list to update ledger balances
        const suppliersRes = await api.get('/suppliers')
        if (suppliersRes.data.success) {
          const updatedSuppliers = suppliersRes.data.data || []
          setSuppliers(updatedSuppliers)
          // Also update the selected supplier object in modal state
          const updatedSelected = updatedSuppliers.find(s => s._id === selectedSupplier._id)
          if (updatedSelected) {
            setSelectedSupplier(updatedSelected)
          }
        }
        alert('Product returned successfully!')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Product return failed.')
    } finally {
      setReturningId(null)
    }
  }

  const handleEditClick = (supplier) => {
    setEditingSupplier(supplier)
    setEditForm({
      name: supplier.name || '',
      shopName: supplier.shopName || '',
      phone: supplier.phone || '',
      type: supplier.type || 'company',
      status: supplier.status || 'active'
    })
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editForm.name.trim()) return alert('Name is required.')
    
    try {
      setSavingEdit(true)
      const res = await api.put(`/suppliers/${editingSupplier._id}`, editForm)
      if (res.data.success) {
        setEditingSupplier(null)
        loadSuppliers()
        alert('Supplier details updated successfully!')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update supplier.')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDeleteSupplier = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete supplier "${name}"? This will also unlink all associated products.`)) return

    try {
      const res = await api.delete(`/suppliers/${id}`)
      if (res.data.success) {
        loadSuppliers()
        alert('Supplier deleted successfully!')
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete supplier.')
    }
  }

  const filtered = suppliers.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search)) ||
      (s.shopName && s.shopName.toLowerCase().includes(search.toLowerCase()))
    const matchesType = filterType === 'all' || s.type === filterType
    return matchesSearch && matchesType
  })

  const stats = [
    { label: 'Total Suppliers / Companies', value: totalSuppliersCount, sub: 'All Registered', color: 'blue', icon: '🏭' },
    { label: 'Active Sources', value: activeCount, sub: 'Currently Active', color: 'green', icon: '✅' },
    { label: 'Inactive Sources', value: inactiveCount, sub: 'Currently Inactive', color: 'red', icon: '❌' },
    { label: 'Total Purchases (Kul Amount)', value: `₹${totalPurchasesSum.toLocaleString('en-IN')}`, sub: 'Cumulative Purchases', color: 'purple', icon: '🛒' },
  ]

  return (
    <div>
      {error && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{error}</div>}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Suppliers & Companies</h1>
          <p>Manage direct companies, private suppliers, invoices, and ledger returns</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stat-cards-grid" style={{ marginBottom: '20px' }}>
        {stats.map((s, i) => (
          <div className="stat-card" key={i}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="stat-card-label">{s.label}</div>
                <div className={`stat-card-value ${s.color}`} style={{ fontSize: '22px', marginTop: '4px', fontWeight: 800 }}>{s.value}</div>
                <div className="stat-card-sub" style={{ marginTop: '4px' }}>{s.sub}</div>
              </div>
              <div className={`stat-card-icon ${s.color}`} style={{ fontSize: '20px' }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ minWidth: '280px' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input placeholder="Search by name, phone or shop name..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`btn btn-sm ${filterType === 'all' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 14px', fontSize: '12px' }}
                onClick={() => setFilterType('all')}
              >
                All
              </button>
              <button 
                className={`btn btn-sm ${filterType === 'company' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 14px', fontSize: '12px' }}
                onClick={() => setFilterType('company')}
              >
                Company Mall
              </button>
              <button 
                className={`btn btn-sm ${filterType === 'private' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '6px 14px', fontSize: '12px' }}
                onClick={() => setFilterType('private')}
              >
                Private Supplier
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>No suppliers or companies found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Supplier / Company Name</th>
                  <th>Type</th>
                  <th>Shop Name</th>
                  <th>Phone</th>
                  <th style={{ textAlign: 'center' }}>Total Products</th>
                  <th>Kul Amount (₹)</th>
                  <th>Paid Amount (₹)</th>
                  <th>Pending Amount (₹)</th>
                  <th>Status</th>
                  <th style={{ minWidth: '220px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s._id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>
                      <span className={`badge ${s.type === 'company' ? 'badge-primary' : 'badge-outline'}`} style={{ textTransform: 'capitalize' }}>
                        {s.type === 'company' ? 'Company' : 'Private'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{s.shopName || '—'}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{s.phone || '—'}</td>
                    <td style={{ fontWeight: 600, textAlign: 'center' }}>{s.totalProducts || 0}</td>
                    <td style={{ fontWeight: 700 }}>₹{(s.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 600, color: 'var(--success)' }}>₹{(s.paidAmount || 0).toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 700, color: (s.pendingAmount || 0) > 0 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                      ₹{(s.pendingAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td>
                      {s.status === 'active'
                        ? <span className="badge badge-success">Active</span>
                        : <span className="badge badge-danger">Inactive</span>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button className="btn btn-outline btn-sm" style={{ padding: '4px 10px', height: '32px' }} onClick={() => handleOpenDetails(s)}>
                          Ledger
                        </button>
                        
                        <button 
                          className="btn btn-outline btn-sm" 
                          style={{ 
                            borderColor: 'var(--primary-light)', 
                            color: 'var(--primary)', 
                            padding: '0', 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--primary-light)'
                          }} 
                          onClick={() => handleEditClick(s)}
                          title="Edit Supplier"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                          </svg>
                        </button>

                        <button 
                          className="btn btn-outline btn-sm" 
                          style={{ 
                            borderColor: 'var(--danger-light)', 
                            color: 'var(--danger)', 
                            padding: '0', 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--danger-light)'
                          }} 
                          onClick={() => handleDeleteSupplier(s._id, s.name)}
                          title="Delete Supplier"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <line x1="10" y1="11" x2="10" y2="17"/>
                            <line x1="14" y1="11" x2="14" y2="17"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details & Return Ledger Modal */}
      {selectedSupplier && (
        <div className="modal-overlay" onClick={() => setSelectedSupplier(null)}>
          <div className="modal-box" style={{ maxWidth: '800px', width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedSupplier.name} {selectedSupplier.shopName ? `- ${selectedSupplier.shopName}` : ''}
              </h2>
              <button className="modal-close" onClick={() => setSelectedSupplier(null)}>×</button>
            </div>
            
            <div className="modal-body" style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Account Balances Summary Card */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Kul Amount (Total)</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>₹{selectedSupplier.totalAmount.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Paid Amount</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>₹{selectedSupplier.paidAmount.toLocaleString('en-IN')}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Pending Amount</span>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: selectedSupplier.pendingAmount > 0 ? 'var(--danger)' : '#64748b', marginTop: '2px' }}>₹{selectedSupplier.pendingAmount.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Record Payment Section */}
              {selectedSupplier.pendingAmount > 0 && (
                <form onSubmit={handleRecordPayment} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#b45309', display: 'block', marginBottom: '4px' }}>Pay Pending Balance (₹)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max={selectedSupplier.pendingAmount} 
                      value={paymentAmount} 
                      onChange={e => setPaymentAmount(e.target.value)} 
                      placeholder="Enter amount to pay" 
                      className="form-input" 
                      style={{ height: '36px' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ height: '36px', background: '#d97706', border: 'none' }} disabled={paying}>
                    {paying ? 'Recording...' : 'Record Payment'}
                  </button>
                </form>
              )}

              {/* Supplied Items List ("Kya-Kya Maal Aaya") */}
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Supplied Items List (Stock History)</h3>
                {loadingProducts ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><div className="spinner" /></div>
                ) : suppliedProducts.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#64748b' }}>No items recorded for this supplier.</p>
                ) : (
                  <div style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <table className="data-table" style={{ fontSize: '12.5px', margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Product Name</th>
                          <th>Variant</th>
                          <th>IMEI Number</th>
                          <th>Purchase Price</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {suppliedProducts.map(p => (
                          <tr key={p._id} style={{ background: p.status === 'returned' ? '#f8fafc' : 'white' }}>
                            <td style={{ color: 'var(--text-secondary)' }}>{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                            <td style={{ fontWeight: 600 }}>{p.productName}</td>
                            <td>{p.variant || '—'}</td>
                            <td style={{ fontFamily: 'monospace' }}>{p.imeiNumber || '—'}</td>
                            <td style={{ fontWeight: 600 }}>₹{(p.purchasePrice || 0).toLocaleString('en-IN')}</td>
                            <td>
                              {p.status === 'returned' ? (
                                <span className="badge badge-danger" style={{ fontSize: '10px', padding: '1px 6px' }}>Returned</span>
                              ) : (
                                <span className="badge badge-success" style={{ fontSize: '10px', padding: '1px 6px' }}>In Stock</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {p.status !== 'returned' && (
                                <button 
                                  className="btn btn-outline btn-sm" 
                                  style={{ color: 'var(--danger)', borderColor: 'var(--danger-light)', padding: '2px 8px', fontSize: '11px' }}
                                  disabled={returningId === p._id}
                                  onClick={() => handleReturnProduct(p._id)}
                                >
                                  {returningId === p._id ? 'Returning...' : 'Return'}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedSupplier(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <div className="modal-overlay" onClick={() => setEditingSupplier(null)}>
          <div className="modal-box" style={{ maxWidth: '480px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Supplier / Company</h2>
              <button className="modal-close" onClick={() => setEditingSupplier(null)}>×</button>
            </div>
            
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Name <span className="required">*</span></label>
                  <input 
                    className="form-input" 
                    value={editForm.name} 
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
                    placeholder="Enter name"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Supplier Type</label>
                  <select 
                    className="form-select" 
                    value={editForm.type} 
                    onChange={e => setEditForm({ ...editForm, type: e.target.value })}
                  >
                    <option value="company">Company Mall (Direct)</option>
                    <option value="private">Private Supplier</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Shop Name</label>
                  <input 
                    className="form-input" 
                    value={editForm.shopName} 
                    onChange={e => setEditForm({ ...editForm, shopName: e.target.value })} 
                    placeholder="Enter shop name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    className="form-input" 
                    type="number"
                    value={editForm.phone} 
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })} 
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    className="form-select" 
                    value={editForm.status} 
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditingSupplier(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Suppliers
