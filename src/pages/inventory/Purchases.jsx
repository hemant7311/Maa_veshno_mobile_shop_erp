import React, { useState, useEffect } from 'react'
import { getAllPurchases, createPurchase, getAllSuppliers, getAllProducts } from '../../services/api'
import { subscribeSuppliersChanged } from '../../utils/supplierEvents'

const Purchases = () => {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [saving, setSaving] = useState(false)
  
  const [form, setForm] = useState({
    supplier: '',
    supplierName: '',
    supplierMobile: '',
    items: [],
    subtotal: 0,
    discountAmount: 0,
    gstAmount: 0,
    totalAmount: 0,
    paidAmount: 0,
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    invoiceNumber: ''
  })
  
  const [currentItem, setCurrentItem] = useState({
    product: '',
    productName: '',
    imei: '',
    quantity: 1,
    costPrice: 0
  })

  useEffect(() => {
    loadData()
    const unsubscribe = subscribeSuppliersChanged(() => {
      getAllSuppliers().then(res => {
        if (res.data?.success) setSuppliers(res.data.data)
      }).catch(console.error)
    })
    return unsubscribe
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [purRes, supRes, prodRes] = await Promise.all([
        getAllPurchases(),
        getAllSuppliers(),
        getAllProducts()
      ])
      if (purRes.data?.success) setPurchases(purRes.data.data)
      if (supRes.data?.success) setSuppliers(supRes.data.data)
      if (prodRes.data?.success) setProducts(prodRes.data.data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = () => {
    if (!currentItem.product) return alert('Select product')
    if (currentItem.quantity <= 0) return alert('Invalid quantity')
    
    const prod = products.find(p => p._id === currentItem.product)
    
    const newItem = {
      product: currentItem.product,
      productName: prod ? prod.productName : currentItem.productName,
      imei: currentItem.imei,
      quantity: Number(currentItem.quantity),
      costPrice: Number(currentItem.costPrice),
      total: Number(currentItem.quantity) * Number(currentItem.costPrice)
    }
    
    const updatedItems = [...form.items, newItem]
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0)
    const totalAmount = subtotal - Number(form.discountAmount) + Number(form.gstAmount)
    
    setForm({ ...form, items: updatedItems, subtotal, totalAmount })
    setCurrentItem({ product: '', productName: '', imei: '', quantity: 1, costPrice: 0 })
  }

  const handleRemoveItem = (index) => {
    const updatedItems = form.items.filter((_, i) => i !== index)
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0)
    const totalAmount = subtotal - Number(form.discountAmount) + Number(form.gstAmount)
    setForm({ ...form, items: updatedItems, subtotal, totalAmount })
  }

  const handleSubmit = async () => {
    if (form.items.length === 0) return alert('Add at least one item')
    if (!form.supplier && !form.supplierName) return alert('Supplier is required')
    
    try {
      setSaving(true)
      await createPurchase(form)
      setShowModal(false)
      setForm({
        supplier: '', supplierName: '', supplierMobile: '', items: [],
        subtotal: 0, discountAmount: 0, gstAmount: 0, totalAmount: 0,
        paidAmount: 0, paymentMethod: 'cash', date: new Date().toISOString().split('T')[0],
        notes: '', invoiceNumber: ''
      })
      loadData()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save purchase')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchases</h1>
          <p className="page-subtitle">Manage supplier purchases and stock intake</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Purchase</button>
      </div>
      
      <div className="card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Supplier</th>
                <th>Items</th>
                <th>Total Amount</th>
                <th>Paid</th>
                <th>Due</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{textAlign: 'center'}}>Loading...</td></tr>
              ) : purchases.map(p => (
                <tr key={p._id}>
                  <td>{new Date(p.date || p.createdAt).toLocaleDateString()}</td>
                  <td>{p.supplier?.name || p.supplierName || '-'}</td>
                  <td>{p.items?.length || 0} items</td>
                  <td>₹{(p.totalAmount || 0).toLocaleString()}</td>
                  <td><span className="text-success">₹{(p.paidAmount || 0).toLocaleString()}</span></td>
                  <td><span className="text-danger">₹{((p.totalAmount || 0) - (p.paidAmount || 0)).toLocaleString()}</span></td>
                  <td>
                    <span className={`badge badge-${p.status === 'completed' ? 'success' : 'warning'}`}>
                      {p.status || 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h2 className="modal-title">New Purchase</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>x</button>
            </div>
            
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label className="form-label">Select Supplier</label>
                  <select className="form-select" value={form.supplier} onChange={e => {
                    const sup = suppliers.find(s => s._id === e.target.value)
                    setForm({ ...form, supplier: e.target.value, supplierName: sup?.name || '' })
                  }}>
                    <option value="">-- Custom Supplier --</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.name} ({s.shopName})</option>)}
                  </select>
                </div>
                {!form.supplier && (
                  <div>
                    <label className="form-label">Supplier Name</label>
                    <input className="form-input" value={form.supplierName} onChange={e => setForm({...form, supplierName: e.target.value})} placeholder="Enter name" />
                  </div>
                )}
                <div>
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                </div>
                <div>
                  <label className="form-label">Invoice Number</label>
                  <input className="form-input" value={form.invoiceNumber} onChange={e => setForm({...form, invoiceNumber: e.target.value})} placeholder="Bill/Invoice No." />
                </div>
              </div>

              <div style={{ padding: '15px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--bg)' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Add Items</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
                  <div>
                    <label className="form-label">Product</label>
                    <select className="form-select" value={currentItem.product} onChange={e => setCurrentItem({...currentItem, product: e.target.value})}>
                      <option value="">Select Product</option>
                      {products.map(p => <option key={p._id} value={p._id}>{p.productName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">IMEI (optional)</label>
                    <input className="form-input" value={currentItem.imei} onChange={e => setCurrentItem({...currentItem, imei: e.target.value})} placeholder="IMEI" />
                  </div>
                  <div>
                    <label className="form-label">Qty</label>
                    <input type="number" className="form-input" value={currentItem.quantity} onChange={e => setCurrentItem({...currentItem, quantity: e.target.value})} min="1" />
                  </div>
                  <div>
                    <label className="form-label">Cost/Unit (₹)</label>
                    <input type="number" className="form-input" value={currentItem.costPrice} onChange={e => setCurrentItem({...currentItem, costPrice: e.target.value})} min="0" />
                  </div>
                  <button className="btn btn-secondary" onClick={handleAddItem}>Add</button>
                </div>
              </div>

              {form.items.length > 0 && (
                <table className="data-table" style={{ margin: '10px 0' }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>IMEI</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((it, idx) => (
                      <tr key={idx}>
                        <td>{it.productName}</td>
                        <td>{it.imei || '-'}</td>
                        <td>{it.quantity}</td>
                        <td>₹{it.costPrice}</td>
                        <td>₹{it.total}</td>
                        <td><button className="btn btn-danger" style={{padding: '2px 8px'}} onClick={() => handleRemoveItem(idx)}>X</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" rows="4" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes..."></textarea>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal:</span> <strong>₹{form.subtotal}</strong></div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Discount (₹):</span> 
                    <input type="number" className="form-input" style={{ width: '100px' }} value={form.discountAmount} onChange={e => {
                      const d = Number(e.target.value);
                      setForm({...form, discountAmount: d, totalAmount: form.subtotal - d + Number(form.gstAmount)})
                    }} />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>GST (₹):</span> 
                    <input type="number" className="form-input" style={{ width: '100px' }} value={form.gstAmount} onChange={e => {
                      const g = Number(e.target.value);
                      setForm({...form, gstAmount: g, totalAmount: form.subtotal - Number(form.discountAmount) + g})
                    }} />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <strong>Grand Total:</strong> <strong className="text-success">₹{form.totalAmount}</strong>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span>Paid Amount (₹):</span> 
                    <input type="number" className="form-input" style={{ width: '100px' }} value={form.paidAmount} onChange={e => setForm({...form, paidAmount: Number(e.target.value)})} />
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Payment Mode:</span> 
                    <select className="form-select" style={{ width: '100px' }} value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})}>
                      <option value="cash">Cash</option>
                      <option value="upi">UPI</option>
                      <option value="bank">Bank</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : 'Save Purchase'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Purchases
