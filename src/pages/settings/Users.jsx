import React, { useState, useEffect } from 'react'
import api from '../../services/api'

const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'products', label: 'Products' },
  { id: 'categories', label: 'Categories' },
  { id: 'imeis', label: 'IMEI Management' },
  { id: 'customers', label: 'Customers' },
  { id: 'suppliers', label: 'Wholesaler & Suppliers' },
  { id: 'billing', label: 'Billing' },
  { id: 'finance', label: 'Finance' },
  { id: 'reports', label: 'Reports' },
]

const UserModal = ({ initialData, onClose, onSuccess }) => {
  const isEdit = !!initialData
  const [form, setForm] = useState(
    initialData || { name: '', username: '', password: '', role: 'finance_agent', permissions: [] }
  )
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handlePermissionChange = (permId) => {
    setForm(prev => {
      const perms = prev.permissions || []
      if (perms.includes(permId)) {
        return { ...prev, permissions: perms.filter(p => p !== permId) }
      } else {
        return { ...prev, permissions: [...perms, permId] }
      }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/auth/users/${initialData._id}`, form)
        alert('Staff updated successfully!')
      } else {
        await api.post('/auth/register', form)
        alert('Staff created successfully!')
      }
      onSuccess()
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} staff`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Staff' : 'Add New Staff'}</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input required className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Rahul Kumar" />
            </div>
            <div className="form-group">
              <label className="form-label">Username (Login ID)</label>
              <input required className="form-input" name="username" value={form.username} onChange={handleChange} placeholder="e.g. rahul_staff" />
            </div>
            <div className="form-group">
              <label className="form-label">Password {isEdit && '(Leave blank to keep current)'}</label>
              <input type="password" required={!isEdit} className="form-input" name="password" value={form.password} onChange={handleChange} placeholder={isEdit ? 'Enter new password or leave blank' : 'Enter secure password'} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" name="role" value={form.role} onChange={handleChange}>
                <option value="finance_agent">Staff</option>
                <option value="wholesaler">Wholesaler</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            {form.role === 'finance_agent' && (
              <div className="form-group">
                <label className="form-label">Tab Access Permissions</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--border)', padding: '12px', borderRadius: '6px', background: 'var(--bg)' }}>
                  {AVAILABLE_PERMISSIONS.map(p => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                      <input 
                        type="checkbox" 
                        checked={(form.permissions || []).includes(p.id)} 
                        onChange={() => handlePermissionChange(p.id)}
                        style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : '💾 Save Staff'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/auth/users')
      console.log('Fetched users:', res.data.data)
      setUsers(res.data.data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete staff: ${name}?`)) return
    try {
      await api.delete(`/auth/users/${id}`)
      setUsers(users.filter(u => u._id !== id))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete staff')
    }
  }

  return (
    <div>
      {showModal && (
        <UserModal 
          initialData={editingUser}
          onClose={() => { setShowModal(false); setEditingUser(null); }} 
          onSuccess={() => { setShowModal(false); setEditingUser(null); fetchUsers(); }} 
        />
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Staff Management</h1>
          <p>Manage staff, finance agents, and admin accounts</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => { setEditingUser(null); setShowModal(true); }}>
            + Add New Staff
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <p style={{ padding: '20px', color: 'var(--text-muted)' }}>Loading staff...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Password</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        No staff found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u, i) => (
                      <tr key={u._id}>
                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                        <td style={{ fontWeight: 500 }}>{u.name}</td>
                        <td style={{ color: 'var(--primary)' }}>{u.username}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {u.initialPassword ? (
                            <span style={{ background: '#f1f5f9', padding: '3px 6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px', fontFamily: 'monospace' }}>
                              {u.initialPassword}
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Hidden (Hash)</span>
                          )}
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                            background: u.role === 'admin' ? 'var(--danger-light)' : 'var(--orange-light)',
                            color: u.role === 'admin' ? 'var(--danger)' : 'var(--orange)'
                          }}>
                            {u.role === 'finance_agent' ? 'STAFF' : u.role.toUpperCase()}
                          </span>
                        </td>
                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px', color: 'var(--primary)' }}
                            onClick={() => { setEditingUser(u); setShowModal(true); }}
                            title="Edit"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button 
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                            onClick={() => handleDelete(u._id, u.name)}
                            title="Delete"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Users
