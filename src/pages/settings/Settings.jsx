import React, { useState } from 'react'

const Settings = () => {
  const [form, setForm] = useState({
    shopName: 'Maa Veshno Mobile',
    ownerName: 'Admin User',
    gstNumber: '07ABCDE1234F1Z5',
    phone: '9876543210',
    email: 'admin@maaveshno.com',
    address: 'Shop No. 12, Main Market, Delhi',
    invoicePrefix: 'MVM',
    taxPercentage: '18',
  })

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Manage your shop settings and preferences</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary">💾 Save Settings</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Shop Info */}
        <div className="card">
          <div className="card-header"><span className="card-title">🏪 Shop Information</span></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Shop Name</label>
                <input className="form-input" name="shopName" value={form.shopName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Owner Name</label>
                <input className="form-input" name="ownerName" value={form.ownerName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input className="form-input" name="gstNumber" value={form.gstNumber} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" name="phone" value={form.phone} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" name="email" value={form.email} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-textarea" name="address" value={form.address} onChange={handleChange} rows={3} />
              </div>
            </div>
          </div>
        </div>

        {/* Invoice & Tax */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div className="card-header"><span className="card-title">🧾 Invoice Settings</span></div>
            <div className="card-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Invoice Prefix</label>
                  <input className="form-input" name="invoicePrefix" value={form.invoicePrefix} onChange={handleChange} placeholder="e.g. MVM" />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Preview: {form.invoicePrefix}-001</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Tax Percentage (%)</label>
                  <input className="form-input" name="taxPercentage" value={form.taxPercentage} onChange={handleChange} placeholder="18" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">🖼 Shop Logo</span></div>
            <div className="card-body">
              <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '32px', textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Click to upload logo</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
