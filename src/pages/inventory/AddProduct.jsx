import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../services/api'

const AddProduct = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const [form, setForm] = useState({
    productName: '', categoryId: '', variant: '', imeiNumber: '',
    buyingPrice: '', sellingPrice: '', wholesalePrice: '', status: 'Active',
    brand: '', model: '', displaySize: '', battery: '',
    processor: '', network: '', description: ''
  })
  const [summary, setSummary] = useState({
    productName: '-', categoryName: '-', variant: '-',
    imeiNumber: '-', sellingPrice: '₹ 0.00', wholesalePrice: '₹ 0.00', status: 'Active'
  })
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [suppliers, setSuppliers] = useState([])
  const [supplierType, setSupplierType] = useState('company') // 'company' | 'private'
  const [selectedCompanyCategoryId, setSelectedCompanyCategoryId] = useState('')
  const [amountPaidNow, setAmountPaidNow] = useState(0)
  const [totalPurchasePrice, setTotalPurchasePrice] = useState('')
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [successNotice, setSuccessNotice] = useState('')
  const [images, setImages] = useState([])
  const fileInputRef = React.useRef(null)

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    const newImages = await Promise.all(files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          resolve({ file, preview: reader.result })
        }
        reader.readAsDataURL(file)
      })
    }))

    setImages(prev => {
      const combined = [...prev, ...newImages]
      return combined.slice(0, 5)
    })
    
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeImage = (index) => {
    setImages(prev => {
      const updated = [...prev]
      updated.splice(index, 1)
      return updated
    })
  }

  useEffect(() => {
    const loadFormData = async () => {
      setLoading(true)
      
      // 1. Fetch categories
      let loadedCategories = []
      try {
        const categoriesResponse = await api.get('/categories')
        loadedCategories = categoriesResponse.data.data || []
        setCategories(loadedCategories)
      } catch (err) {
        console.error('Could not load categories:', err)
      }

      // 2. Fetch suppliers
      try {
        const suppliersResponse = await api.get('/suppliers')
        setSuppliers(suppliersResponse.data.data || [])
      } catch (err) {
        console.error('Could not load suppliers:', err)
      }

      // 3. Fetch product details if editing
      if (isEditing) {
        try {
          const productResponse = await api.get(`/products/${id}`)
          if (productResponse.data?.success) {
            const product = productResponse.data.data
            const categoryId = product.categoryId?._id || product.categoryId || ''
            const categoryName = product.categoryId?.categoryName || loadedCategories.find((cat) => cat._id === categoryId)?.categoryName || '-'
            const populatedForm = {
              productName: product.productName || '', categoryId, variant: product.variant || '', imeiNumber: product.imeiNumber || '',
              buyingPrice: product.purchasePrice ?? '', sellingPrice: product.salePrice ?? '', wholesalePrice: product.wholesalePrice ?? '',
              status: product.status === 'inactive' ? 'Inactive' : 'Active', brand: product.brand || '', model: product.model || '',
              displaySize: product.displaySize || '', battery: product.battery || '', processor: product.processor || '',
              network: product.network || '', description: product.description || '',
            }
            setForm(populatedForm)
            setSummary({
              productName: populatedForm.productName || '-', categoryName, variant: populatedForm.variant || '-',
              imeiNumber: populatedForm.imeiNumber || '-',
              sellingPrice: populatedForm.sellingPrice ? `₹ ${populatedForm.sellingPrice}` : '₹ 0.00',
              wholesalePrice: populatedForm.wholesalePrice ? `₹ ${populatedForm.wholesalePrice}` : '₹ 0.00',
              status: populatedForm.status,
            })
            if (product.image) {
              setImages([{ file: null, preview: product.image }])
            }
            
            const supplierId = product.supplierId?._id || product.supplierId || ''
            const stype = product.supplierType || 'company'
            setSupplierType(stype)
            setSelectedSupplierId(supplierId)
            
            if (supplierId && stype === 'company') {
              const matchedCategory = loadedCategories.find(c => c.categoryName.toLowerCase() === (product.brand || '').toLowerCase())
              if (matchedCategory) {
                setSelectedCompanyCategoryId(matchedCategory._id)
              }
            }
          }
        } catch (err) {
          setError('Could not load product details. Please try again.')
          console.error(err)
        }
      }
      
      setLoading(false)
    }
    loadFormData()
  }, [id, isEditing])

  const handleChange = (e) => {
    const { name, value } = e.target
    const categoryName = name === 'categoryId' ? categories.find((cat) => cat._id === value)?.categoryName : null
    
    // Auto-select company if they change the category select dropdown
    if (name === 'categoryId' && supplierType === 'company') {
      setSelectedCompanyCategoryId(value)
    }

    setForm(prev => ({ ...prev, [name]: value }))
    setSummary(prev => ({
      ...prev,
      productName: name === 'productName' ? (value || '-') : prev.productName,
      categoryName:  name === 'categoryId'  ? (categoryName || '-') : prev.categoryName,
      variant:     name === 'variant'     ? (value || '-') : prev.variant,
      imeiNumber:  name === 'imeiNumber'  ? (value || '-') : prev.imeiNumber,
      sellingPrice:name === 'sellingPrice'? (value ? `₹ ${value}` : '₹ 0.00') : prev.sellingPrice,
      wholesalePrice:name === 'wholesalePrice'? (value ? `₹ ${value}` : '₹ 0.00') : prev.wholesalePrice,
      status:      name === 'status'      ? value : prev.status,
    }))
  }

  const handleSubmit = async (event, isAddAnother = false) => {
    event?.preventDefault()
    setError('')
    setSuccessNotice('')
    if (!form.productName || !form.categoryId || !form.variant || !form.imeiNumber || !form.sellingPrice) {
      setError('Please complete all required product details before saving.')
      return
    }

    let finalSupplierId = ''
    let supplierName = form.brand.trim()
    let shopName = form.model.trim()
    let supplierPhone = form.displaySize.trim()

    if (supplierType === 'company') {
      if (!selectedCompanyCategoryId) {
        setError('Please select a Company.')
        return
      }
      const matchedCategory = categories.find(c => c._id === selectedCompanyCategoryId)
      if (!matchedCategory) {
        setError('Selected company brand not found.')
        return
      }
      supplierName = matchedCategory.categoryName.trim()
      shopName = ''
      supplierPhone = ''

      // Check if this company supplier already exists in DB
      const existingCompany = suppliers.find(s => s.type === 'company' && s.name.toLowerCase() === supplierName.toLowerCase())
      if (existingCompany) {
        finalSupplierId = existingCompany._id
      } else {
        // Create new company supplier inline
        try {
          setSaving(true)
          const res = await api.post('/suppliers', {
            name: supplierName,
            type: 'company',
            status: 'active'
          })
          if (res.data.success) {
            finalSupplierId = res.data.data._id
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Could not create Company record.')
          setSaving(false)
          return
        }
      }
    } else {
      // Private Supplier: validation and creation
      if (!supplierName) {
        setError('Please enter a Supplier Name.')
        return
      }
      if (!supplierPhone) {
        setError('Please enter a Supplier Phone Number.')
        return
      }

      // Check if this private supplier already exists
      const existingPrivate = suppliers.find(s => s.type === 'private' && s.name.toLowerCase() === supplierName.toLowerCase() && s.shopName?.toLowerCase() === shopName.toLowerCase())
      if (existingPrivate) {
        finalSupplierId = existingPrivate._id
      } else {
        try {
          setSaving(true)
          const res = await api.post('/suppliers', {
            name: supplierName,
            type: 'private',
            shopName: shopName,
            phone: supplierPhone,
            status: 'active'
          })
          if (res.data.success) {
            finalSupplierId = res.data.data._id
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Could not create Private Supplier record.')
          setSaving(false)
          return
        }
      }
    }

    const payload = {
      productName: form.productName.trim(), categoryId: form.categoryId, variant: form.variant, imeiNumber: form.imeiNumber.trim(),
      purchasePrice: Number(form.buyingPrice || 0), salePrice: Number(form.sellingPrice), wholesalePrice: Number(form.wholesalePrice || 0),
      status: form.status.toLowerCase(), brand: supplierName, model: shopName, displaySize: supplierPhone,
      battery: form.battery.trim(), processor: form.processor.trim(), network: form.network, description: form.description.trim(),
      supplierId: finalSupplierId,
      supplierType: supplierType,
      amountPaidNow: Number(amountPaidNow || 0),
      totalPurchasePrice: Number(totalPurchasePrice || form.buyingPrice || 0),
      image: images.length > 0 ? images[0].preview : ''
    }

    try {
      setSaving(true)
      if (isEditing) {
        await api.put(`/products/${id}`, payload)
        navigate('/products', { state: { notice: 'Product updated successfully.' } })
      } else {
        await api.post('/products', payload)
        if (isAddAnother) {
          setSuccessNotice(`Product "${form.productName}" saved successfully! Enter next device details below.`)
          // Reset basic inputs only
          setForm(prev => ({
            ...prev,
            productName: '',
            imeiNumber: '',
            buyingPrice: '',
            sellingPrice: ''
          }))
          setImages([])
          setSummary(prev => ({
            ...prev,
            productName: '-',
            imeiNumber: '-',
            sellingPrice: '₹ 0.00'
          }))
          
          // Refetch suppliers in background so newly created ones appear in lists
          api.get('/suppliers').then(res => setSuppliers(res.data.data || [])).catch(() => {})
        } else {
          navigate('/products', { state: { notice: 'Product added successfully.' } })
        }
      }
    } catch (requestError) {
      const errors = requestError.response?.data?.errors
      setError(Object.values(errors || {})[0] || requestError.response?.data?.message || 'Could not save the product. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const variants = ['2GB / 32GB', '4GB / 64GB', '4GB / 128GB', '6GB / 128GB', '8GB / 128GB', '8GB / 256GB', '12GB / 256GB', '16GB / 256GB']

  return (
    <div>
      {error && <div className="alert alert-danger" style={{ marginBottom: '16px' }}>{error}</div>}
      {successNotice && <div className="alert alert-success" style={{ marginBottom: '16px', background: 'var(--success-light)', color: 'var(--success)', border: '1px solid var(--success)', padding: '12px', borderRadius: 'var(--radius-md)' }}>{successNotice}</div>}
      {/* Back button */}
      <div style={{ marginBottom: '16px' }}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/products')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to Products
        </button>
      </div>

      {/* Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>{isEditing ? 'Edit Product' : 'Add Product'}</h1>
          <p>{isEditing ? 'Update this mobile product in your inventory' : 'Add a new mobile product to your inventory'}</p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-outline" onClick={() => navigate('/products')}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving || loading}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            {saving ? 'Saving...' : isEditing ? 'Update Product' : 'Save Product'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="form-layout-grid">
        {/* Left — Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Basic Information */}
          <div className="card">
            <div className="card-header"><span className="card-title">Basic Information</span></div>
            <div className="card-body">
              <div className="form-grid" style={{ gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Product Name <span className="required">*</span></label>
                  <input className="form-input" name="productName" value={form.productName} onChange={handleChange} placeholder="Enter product name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category Name <span className="required">*</span></label>
                  <select className="form-select" name="categoryId" value={form.categoryId} onChange={handleChange} disabled={loading}>
                    <option value="">Select category</option>
                    {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.categoryName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Variant (RAM &amp; GB) <span className="required">*</span></label>
                  <select className="form-select" name="variant" value={form.variant} onChange={handleChange}>
                    <option value="">Select RAM &amp; GB</option>
                    {variants.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">IMEI Number <span className="required">*</span></label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input className="form-input" name="imeiNumber" value={form.imeiNumber} onChange={handleChange} placeholder="Enter IMEI number" style={{ flex: 1 }} />
                    <button type="button" className="btn btn-outline btn-sm" style={{ whiteSpace: 'nowrap', gap: '4px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 5v14M7 5v14M13 5v14M17 5v14M21 5v14M10 5v6M10 13v6"/>
                      </svg>
                      Scan
                    </button>
                  </div>
                </div>
                <div className="form-group">
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Buying Price (₹)</label>
                      <input className="form-input" name="buyingPrice" value={form.buyingPrice} onChange={handleChange} placeholder="Enter buying price" type="number" min="0" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Retail Selling Price (₹) <span className="required">*</span></label>
                      <input className="form-input" name="sellingPrice" value={form.sellingPrice} onChange={handleChange} placeholder="Enter retail price" type="number" min="0" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Wholesale Price (₹)</label>
                      <input className="form-input" name="wholesalePrice" value={form.wholesalePrice} onChange={handleChange} placeholder="Enter wholesale price" type="number" min="0" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status <span className="required">*</span></label>
                      <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Supplier Information */}
          <div className="card">
            <div className="card-header"><span className="card-title">Supplier Information</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Type selector toggle */}
              <div className="form-grid" style={{ gap: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
                <div className="form-group form-grid-full">
                  <label className="form-label" style={{ fontWeight: 600 }}>Supplier Type</label>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
                      <input type="radio" name="supplierType" checked={supplierType === 'company'} onChange={() => { setSupplierType('company'); setSelectedCompanyCategoryId(form.categoryId) }} />
                      Company Mall (Direct)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
                      <input type="radio" name="supplierType" checked={supplierType === 'private'} onChange={() => { setSupplierType('private'); setSelectedCompanyCategoryId('') }} />
                      Private Supplier
                    </label>
                  </div>
                </div>
              </div>

              {/* Dynamic Inputs depending on Supplier Type */}
              {supplierType === 'company' ? (
                <div className="form-grid" style={{ gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Select Company (Categories) <span className="required">*</span></label>
                    <select 
                      className="form-select" 
                      value={selectedCompanyCategoryId} 
                      onChange={(e) => setSelectedCompanyCategoryId(e.target.value)}
                    >
                      <option value="">-- Choose Company --</option>
                      {categories.map(c => (
                        <option key={c._id} value={c._id}>
                          {c.categoryName}
                        </option>
                      ))}
                    </select>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Category names are used as company identifiers.</p>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Company Phone Number</label>
                    <input 
                      className="form-input" 
                      type="number" 
                      name="displaySize" 
                      value={form.displaySize} 
                      onChange={handleChange} 
                      placeholder="Enter company phone number" 
                    />
                  </div>
                </div>
              ) : (
                <div className="form-grid" style={{ gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Supplier Name <span className="required">*</span></label>
                    <input className="form-input" name="brand" value={form.brand} onChange={handleChange} placeholder="Enter supplier name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Shop Name <span className="required">*</span></label>
                    <input className="form-input" name="model" value={form.model} onChange={handleChange} placeholder="Enter shop name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Supplier Phone <span className="required">*</span></label>
                    <input className="form-input" type="number" name="displaySize" value={form.displaySize} onChange={handleChange} placeholder="Enter phone number" />
                  </div>
                </div>
              )}

              {/* Paid and Pending balance calculations */}
              <div className="form-grid" style={{ gap: '14px', borderTop: '1px solid var(--border)', paddingTop: '14px', marginTop: '6px' }}>
                <div className="form-group">
                  <label className="form-label">Total Purchase Amount (₹)</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    min="0" 
                    value={totalPurchasePrice} 
                    onChange={(e) => setTotalPurchasePrice(e.target.value)} 
                    placeholder={form.buyingPrice ? `Default: ₹ ${form.buyingPrice}` : "Enter total purchase amount"} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount Paid Now (₹)</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    min="0" 
                    max={totalPurchasePrice || form.buyingPrice || undefined}
                    value={amountPaidNow} 
                    onChange={(e) => setAmountPaidNow(Math.max(0, Number(e.target.value)))} 
                    placeholder="Enter amount paid" 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pending Amount (₹)</label>
                  <input 
                    className="form-input" 
                    type="text" 
                    disabled 
                    value={Math.max(0, Number(totalPurchasePrice || form.buyingPrice || 0) - amountPaidNow).toLocaleString('en-IN')} 
                    style={{ background: '#f8fafc', fontWeight: 600, color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

            </div>
          </div>


          {/* Product Images */}
          <div className="card">
            <div className="card-header"><span className="card-title">Product Images</span></div>
            <div className="card-body">
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>Upload product images (Max 5 images)</p>
              <input 
                type="file" 
                multiple 
                accept="image/png, image/jpeg, image/webp" 
                style={{ display: 'none' }} 
                ref={fileInputRef}
                onChange={handleImageChange}
              />
              {/* Upload area */}
              <div 
                style={{ border: '2px dashed var(--primary)', borderRadius: 'var(--radius-md)', padding: '32px', textAlign: 'center', background: 'var(--primary-light)', cursor: 'pointer', marginBottom: '12px' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 10px' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 500 }}>Click to upload or drag and drop</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>PNG, JPG, WEBP up to 5MB</p>
              </div>
              {/* Image previews and placeholders */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                {[0, 1, 2, 3, 4].map(index => {
                  const image = images[index]
                  return (
                    <div key={index} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', position: 'relative', overflow: 'hidden' }}>
                      {image ? (
                        <>
                          <img src={image.preview} alt={`Preview ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button type="button" onClick={() => removeImage(index)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'var(--danger-light)', border: 'none', color: 'var(--danger)', borderRadius: '50%', width: '18px', height: '18px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        </>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                        </svg>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right — Quick Summary */}
        <div className="card" style={{ position: 'sticky', top: '80px' }}>
          <div className="card-header"><span className="card-title">Quick Summary</span></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Product Name', value: summary.productName },
                { label: 'Category Name',  value: summary.categoryName },
                { label: 'Variant',      value: summary.variant },
                { label: 'IMEI Number',  value: summary.imeiNumber },
                { label: 'Retail Price', value: summary.sellingPrice },
                { label: 'Wholesale Price', value: summary.wholesalePrice },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', maxWidth: '150px', textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Status</span>
                <span className="badge badge-success">{summary.status}</span>
              </div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ justifyContent: 'center', width: '100%' }} 
                disabled={saving || loading}
                onClick={(e) => handleSubmit(e, false)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                {saving ? 'Saving...' : isEditing ? 'Update Product' : 'Save Product'}
              </button>
              
              {!isEditing && (
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  style={{ justifyContent: 'center', width: '100%', borderColor: 'var(--primary)', color: 'var(--primary)' }} 
                  disabled={saving || loading}
                  onClick={(e) => handleSubmit(e, true)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Save &amp; Add Another
                </button>
              )}
              
              <button type="button" className="btn btn-outline" style={{ justifyContent: 'center', width: '100%' }} onClick={() => navigate('/products')}>Cancel</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default AddProduct
