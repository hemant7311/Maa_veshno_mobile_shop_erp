import React, { useEffect, useState } from 'react'
import api from '../../services/api'

/* ── Add Category Modal ── */
const AddCategoryModal = ({ onClose, onSave }) => {
  const [form, setForm] = useState({ categoryName: '', description: '', status: 'active' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.categoryName.trim()) {
      setError('Category name is required.')
      return
    }

    try {
      setSaving(true)
      setError('')
      const response = await api.post('/categories', {
        categoryName: form.categoryName.trim(),
        description: form.description.trim(),
        status: form.status
      })
      if (response.data.success) {
        onSave(response.data.data)
        onClose()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save category.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Add Category</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Create a new category for products</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '14px', fontSize: '13px' }}>{error}</div>}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Category Name <span className="required">*</span></label>
                <input className="form-input" name="categoryName" value={form.categoryName} onChange={handleChange} placeholder="e.g. Vivo, Oppo, Samsung" />
              </div>
              
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} placeholder="Category description (optional)" rows={3} />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Categories Page ── */
const Categories = () => {
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const loadCategories = () => {
    setLoading(true)
    api.get('/categories')
      .then((response) => setCategories(response.data.data || []))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Could not load categories.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleAddCategory = (newCategory) => {
    setCategories(current => [...current, { ...newCategory, productCount: 0, stock: 0 }].sort((a, b) => a.categoryName.localeCompare(b.categoryName)))
  }

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return
    try {
      setError('')
      const response = await api.delete(`/categories/${id}`)
      if (response.data.success) {
        setCategories(current => current.filter(c => c._id !== id))
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete category.')
    }
  }

  const filtered = categories.filter((cat) => (cat.categoryName || cat.folderName || '').toLowerCase().includes(search.toLowerCase()))

  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  const renderPaginationButtons = () => {
    const buttons = []
    
    // Previous Button
    buttons.push(
      <button key="prev" className="pagination-btn" disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>
        ‹
      </button>
    )

    // Always show page 1
    buttons.push(
      <button key={1} className={`pagination-btn${currentPage === 1 ? ' active' : ''}`} onClick={() => handlePageChange(1)}>
        1
      </button>
    )

    if (currentPage > 3) {
      buttons.push(<span key="dots-left" style={{ display: 'flex', alignItems: 'center', padding: '0 8px', color: 'var(--text-muted)' }}>...</span>)
    }

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      buttons.push(
        <button key={i} className={`pagination-btn${currentPage === i ? ' active' : ''}`} onClick={() => handlePageChange(i)}>
          {i}
        </button>
      )
    }

    if (currentPage < totalPages - 2) {
      buttons.push(<span key="dots-right" style={{ display: 'flex', alignItems: 'center', padding: '0 8px', color: 'var(--text-muted)' }}>...</span>)
    }

    // Always show last page if it's not page 1
    if (totalPages > 1) {
      buttons.push(
        <button key={totalPages} className={`pagination-btn${currentPage === totalPages ? ' active' : ''}`} onClick={() => handlePageChange(totalPages)}>
          {totalPages}
        </button>
      )
    }

    // Next Button
    buttons.push(
      <button key="next" className="pagination-btn" disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>
        ›
      </button>
    )

    return buttons
  }

  return (
    <div>
      {showModal && <AddCategoryModal onClose={() => setShowModal(false)} onSave={handleAddCategory} />}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Categories</h1>
          <p>Product stock is calculated from available IMEIs.</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Category
          </button>
        </div>
      </div>

      {error && <div style={{ color: 'var(--danger)', background: 'var(--danger-light)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px' }}>{error}</div>}

      <div className="table-wrapper">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="search-bar">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input placeholder="Search categories..." value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1) }} />
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ maxWidth: '900px', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '60px', padding: '8px 12px' }}>#</th>
                <th style={{ padding: '8px 12px' }}>Category Name</th>
                <th style={{ width: '120px', padding: '8px 12px' }}>Stock</th>
                <th style={{ width: '80px', padding: '8px 12px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Loading categories...</td></tr>
              ) : currentItems.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No categories found.</td></tr>
              ) : currentItems.map((category, index) => (
                <tr key={category._id}>
                  <td style={{ color: 'var(--text-muted)', padding: '8px 12px' }}>{indexOfFirstItem + index + 1}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontWeight: 600 }}>{category.categoryName || category.folderName}</div>
                      <span className="badge badge-primary" style={{ fontSize: '11px', padding: '1px 6px' }}>
                        {category.productCount || 0} Products
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{category.description || '—'}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--success)', padding: '8px 12px' }}>{category.stock || 0}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <div className="action-btns" style={{ justifyContent: 'center' }}>
                      <button className="action-btn danger" title="Delete" onClick={() => handleDeleteCategory(category._id, category.categoryName)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                          <path d="M10 11v6M14 11v6"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <span>Showing {filtered.length === 0 ? 0 : indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filtered.length)} of {filtered.length} categories</span>
          {totalPages > 1 && (
            <div className="pagination">
              {renderPaginationButtons()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Categories
