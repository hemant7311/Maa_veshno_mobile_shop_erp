import React, { useState, useEffect, useRef } from 'react'
import { Eye, Pencil, Trash2, Play, UploadCloud, CheckCircle, X, Image as ImageIcon, Type, FileText, Users, Upload, Link, Hash, Video, Link2 } from 'lucide-react'
import api from '../../services/api'

const Sliders = () => {
  const [sliders, setSliders] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [previewSlide, setPreviewSlide] = useState(null)
  const [editId, setEditId] = useState(null)

  const modalBodyRef = useRef(null)
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    mediaUrl: '',
    mediaType: 'image',
    mediaSource: 'upload',
    targetAudience: 'both',
    buttonText: '',
    buttonLink: '',
    isActive: true,
    order: 0
  })

  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState('')

  useEffect(() => {
    fetchSliders()
  }, [])

  // Scroll to top when modal opens & handle Escape key
  useEffect(() => {
    if (showModal) {
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTop = 0
      }
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') setShowModal(false)
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showModal])

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (filePreviewUrl && filePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(filePreviewUrl)
      }
    }
  }, [filePreviewUrl])

  const fetchSliders = async () => {
    setLoading(true)
    try {
      const res = await api.get('/sliders/admin')
      if (res.data?.success) setSliders(res.data.data)
    } catch (err) {
      console.error(err)
      alert('Failed to fetch sliders list')
    }
    setLoading(false)
  }

  const handleOpen = (slider = null) => {
    setSelectedFile(null)
    if (filePreviewUrl && filePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(filePreviewUrl)
    }
    setFilePreviewUrl('')

    if (slider) {
      setEditId(slider._id)
      setFormData({
        title: slider.title || '',
        subtitle: slider.subtitle || '',
        mediaUrl: slider.mediaUrl || '',
        mediaType: slider.mediaType || 'image',
        mediaSource: slider.mediaUrl && slider.mediaUrl.startsWith('/uploads/') ? 'upload' : 'url',
        targetAudience: slider.targetAudience || 'both',
        buttonText: slider.buttonText || '',
        buttonLink: slider.buttonLink || '',
        isActive: slider.isActive ?? true,
        order: slider.order || 0
      })
    } else {
      setEditId(null)
      setFormData({
        title: '',
        subtitle: '',
        mediaUrl: '',
        mediaType: 'image',
        mediaSource: 'upload',
        targetAudience: 'both',
        buttonText: '',
        buttonLink: '',
        isActive: true,
        order: sliders.length ? Math.max(...sliders.map(s => s.order || 0)) + 1 : 0
      })
    }
    setShowModal(true)
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      alert('File is too large! Maximum allowed size is 50MB.')
      e.target.value = ''
      return
    }

    // Auto-detect media type
    const ext = file.name.split('.').pop().toLowerCase()
    const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(ext) || file.type.startsWith('video/')
    const detectedType = isVideo ? 'video' : 'image'

    setSelectedFile(file)
    setFormData(prev => ({ ...prev, mediaType: detectedType }))

    if (filePreviewUrl && filePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(filePreviewUrl)
    }
    const preview = URL.createObjectURL(file)
    setFilePreviewUrl(preview)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      alert('Please enter a title for the slide.')
      return
    }

    setSubmitting(true)
    try {
      if (selectedFile) {
        const payload = new FormData()
        payload.append('mediaFile', selectedFile)
        payload.append('title', formData.title)
        payload.append('subtitle', formData.subtitle || '')
        payload.append('mediaType', formData.mediaType || 'image')
        payload.append('targetAudience', formData.targetAudience || 'both')
        payload.append('buttonText', formData.buttonText || '')
        payload.append('buttonLink', formData.buttonLink || '')
        payload.append('isActive', formData.isActive)
        payload.append('order', formData.order || 0)

        const config = { headers: { 'Content-Type': 'multipart/form-data' } }
        if (editId) {
          await api.put(`/sliders/${editId}`, payload, config)
        } else {
          await api.post('/sliders', payload, config)
        }
      } else {
        if (!formData.mediaUrl && !editId) {
          alert('Please upload a file or provide a valid media URL.')
          setSubmitting(false)
          return
        }
        if (editId) {
          await api.put(`/sliders/${editId}`, formData)
        } else {
          await api.post('/sliders', formData)
        }
      }

      setShowModal(false)
      setSelectedFile(null)
      if (filePreviewUrl && filePreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(filePreviewUrl)
      }
      setFilePreviewUrl('')
      fetchSliders()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Error saving slider')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slide?')) return
    try {
      await api.delete(`/sliders/${id}`)
      fetchSliders()
    } catch (err) {
      alert('Error deleting slider')
    }
  }

  const getAudienceBadge = (audience) => {
    if (audience === 'retailer') return <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 600, fontSize: '11px', padding: '4px 8px' }}>Retailer</span>
    if (audience === 'wholesaler') return <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 600, fontSize: '11px', padding: '4px 8px' }}>Wholesaler</span>
    return <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 600, fontSize: '11px', padding: '4px 8px' }}>Both Storefronts</span>
  }

  const currentPreviewSource = filePreviewUrl || formData.mediaUrl

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Manage Home Sliders</h1>
          <p>Control hero banners & video slides across Retailer and Wholesaler storefronts</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpen()}>+ Add New Slide</button>
      </div>

      {/* Admin Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          <table className="data-table" style={{ width: '100%', minWidth: '850px', margin: 0, borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center', verticalAlign: 'middle' }}>Order</th>
                <th style={{ width: '120px', verticalAlign: 'middle' }}>Media</th>
                <th style={{ verticalAlign: 'middle' }}>Title & Subtitle</th>
                <th style={{ width: '90px', verticalAlign: 'middle' }}>Type</th>
                <th style={{ width: '140px', verticalAlign: 'middle' }}>Audience</th>
                <th style={{ width: '90px', verticalAlign: 'middle' }}>Status</th>
                <th style={{ width: '130px', textAlign: 'right', verticalAlign: 'middle' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px' }}>Loading sliders...</td></tr>
              ) : sliders.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No home sliders found. Click "+ Add New Slide" to create one.</td></tr>
              ) : sliders.map(s => (
                <tr key={s._id} style={{ verticalAlign: 'middle' }}>
                  <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {s.order ?? 0}
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <div 
                      onClick={() => setPreviewSlide(s)}
                      title="Click to preview media"
                      style={{
                        width: '100px',
                        height: '56px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid var(--border)',
                        position: 'relative',
                        cursor: 'pointer',
                        background: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      {s.mediaType === 'image' ? (
                        <img
                          src={s.mediaUrl}
                          alt={s.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/100x56?text=Image'; }}
                        />
                      ) : (
                        <>
                          <video 
                            src={s.mediaUrl} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} 
                            muted 
                            preload="metadata"
                          />
                          <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <div style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.9)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}>
                              <Play size={13} fill="#0f172a" color="#0f172a" style={{ marginLeft: '2px' }} />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                  <td style={{ verticalAlign: 'middle', maxWidth: '280px' }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={s.title}>
                      {s.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }} title={s.subtitle || ''}>
                      {s.subtitle || 'No description'}
                    </div>
                    {(s.buttonText || s.buttonLink) && (
                      <div style={{ fontSize: '11px', color: 'var(--primary)', marginTop: '2px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Button: "{s.buttonText || 'Shop Now'}" &rarr; {s.buttonLink || '/all-products'}
                      </div>
                    )}
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <span className="badge" style={{ 
                      background: s.mediaType === 'video' ? '#f3e8ff' : '#e0f2fe', 
                      color: s.mediaType === 'video' ? '#7e22ce' : '#0369a1', 
                      fontWeight: 600,
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}>
                      {s.mediaType ? s.mediaType.toUpperCase() : 'IMAGE'}
                    </span>
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    {getAudienceBadge(s.targetAudience)}
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`} style={{ padding: '4px 8px', fontSize: '11px' }}>
                      {s.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td style={{ verticalAlign: 'middle', textAlign: 'right' }}>
                    <div className="action-btns" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <button
                        type="button"
                        className="action-btn action-btn-preview"
                        onClick={() => setPreviewSlide(s)}
                        title="Preview"
                        aria-label="Preview"
                      >
                        <Eye size={16} strokeWidth={2} />
                      </button>

                      <button
                        type="button"
                        className="action-btn action-btn-edit"
                        onClick={() => handleOpen(s)}
                        title="Edit"
                        aria-label="Edit"
                      >
                        <Pencil size={16} strokeWidth={2} />
                      </button>

                      <button
                        type="button"
                        className="action-btn action-btn-delete danger"
                        onClick={() => handleDelete(s._id)}
                        title="Delete"
                        aria-label="Delete"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div 
            className="modal-box" 
            onClick={e => e.stopPropagation()} 
            style={{ 
              maxWidth: '850px', 
              width: '100%', 
              maxHeight: '90vh', 
              display: 'flex', 
              flexDirection: 'column', 
              overflow: 'hidden', 
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {/* Fixed Header */}
            <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--white)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageIcon size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {editId ? 'Edit Slide' : 'Add New Slide'}
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Configure hero slide banners and video promotions
                  </span>
                </div>
              </div>
              <button 
                type="button" 
                className="modal-close" 
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="modal-body" ref={modalBodyRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: 'var(--white)' }}>
              <form onSubmit={handleSubmit} className="premium-form-layout">
                
                {/* 1. Basic Information */}
                <div className="form-section-header">
                  <div className="form-section-number">1</div>
                  <div className="form-section-title">Basic Information</div>
                </div>

                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label htmlFor="slider-title" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Title (Heading Text) <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <div className="input-with-icon-wrapper">
                    <div className="input-prefix-icon"><Type size={16} /></div>
                    <input
                      id="slider-title"
                      className="input-field input-field-with-icon form-input-custom"
                      required
                      placeholder="E.g., Mega Mobile Sale 50% Off"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label htmlFor="slider-subtitle" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    Subtitle (Description Text)
                  </label>
                  <div className="input-with-icon-wrapper">
                    <div className="input-prefix-icon"><FileText size={16} /></div>
                    <input
                      id="slider-subtitle"
                      className="input-field input-field-with-icon form-input-custom"
                      placeholder="E.g., Best deals on iPhone, Samsung, Realme and accessories"
                      value={formData.subtitle}
                      onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                    />
                  </div>
                </div>

                <div className="slider-form-grid-2" style={{ marginBottom: '24px' }}>
                  <div className="form-group">
                    <label htmlFor="slider-media-type" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Media Type
                    </label>
                    <div className="input-with-icon-wrapper">
                      <div className="input-prefix-icon">
                        {formData.mediaType === 'video' ? <Video size={16} /> : <ImageIcon size={16} />}
                      </div>
                      <select
                        id="slider-media-type"
                        className="input-field input-field-with-icon form-input-custom"
                        value={formData.mediaType}
                        onChange={e => setFormData({ ...formData, mediaType: e.target.value })}
                      >
                        <option value="image">Image (JPG, PNG, WEBP)</option>
                        <option value="video">Video (MP4, WEBM)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="slider-target-audience" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Target Audience
                    </label>
                    <div className="input-with-icon-wrapper">
                      <div className="input-prefix-icon"><Users size={16} /></div>
                      <select
                        id="slider-target-audience"
                        className="input-field input-field-with-icon form-input-custom"
                        value={formData.targetAudience}
                        onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                      >
                        <option value="both">Both Storefronts (Retailer & Wholesaler)</option>
                        <option value="retailer">Retailer Only</option>
                        <option value="wholesaler">Wholesaler Only</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Media Configuration */}
                <div className="form-section-header">
                  <div className="form-section-number">2</div>
                  <div className="form-section-title">Media Configuration</div>
                </div>

                <div style={{ padding: '20px', border: '1px solid var(--border)', borderRadius: '12px', background: '#f8fafc', marginBottom: '24px' }}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label htmlFor="slider-media-source" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Media Input Source
                    </label>
                    <div className="input-with-icon-wrapper">
                      <div className="input-prefix-icon"><Upload size={16} /></div>
                      <select
                        id="slider-media-source"
                        className="input-field input-field-with-icon form-input-custom"
                        style={{ background: 'var(--white)' }}
                        value={formData.mediaSource}
                        onChange={e => {
                          setSelectedFile(null)
                          if (filePreviewUrl && filePreviewUrl.startsWith('blob:')) URL.revokeObjectURL(filePreviewUrl)
                          setFilePreviewUrl('')
                          setFormData({ ...formData, mediaSource: e.target.value })
                        }}
                      >
                        <option value="upload">Upload File (Local Storage)</option>
                        <option value="url">External Link (Direct Media URL)</option>
                      </select>
                    </div>
                  </div>

                  {formData.mediaSource === 'upload' ? (
                    <div className="premium-upload-container">
                      <div className="form-group">
                        <label htmlFor="slider-file-input" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                          Upload {formData.mediaType === 'image' ? 'Image' : 'Video'} File
                        </label>
                        <input
                          ref={fileInputRef}
                          id="slider-file-input"
                          type="file"
                          style={{ display: 'none' }}
                          accept={formData.mediaType === 'video' ? 'video/mp4,video/webm,video/ogg' : 'image/jpeg,image/png,image/webp,image/gif'}
                          onChange={handleFileChange}
                        />
                        <div 
                          className={`file-upload-dropzone ${selectedFile ? 'has-file' : ''}`}
                          style={{ height: '140px', background: 'var(--white)', justifyContent: 'center' }}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {selectedFile ? (
                            <>
                              <CheckCircle size={28} color="var(--success)" />
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success)' }}>
                                {selectedFile.name}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click to replace file
                              </div>
                            </>
                          ) : (
                            <>
                              <UploadCloud size={28} color="var(--primary)" />
                              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Click to upload {formData.mediaType === 'video' ? 'video' : 'image'}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                or drag and drop<br />
                                Supports {formData.mediaType === 'video' ? 'MP4, WEBM, OGG (Max 50MB)' : 'JPG, PNG, WEBP (Max 50MB)'}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Preview</label>
                        <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px dashed var(--border)', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {currentPreviewSource ? (
                            formData.mediaType === 'video' ? (
                              <video
                                src={currentPreviewSource}
                                autoPlay
                                muted
                                loop
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <img
                                src={currentPreviewSource}
                                alt="Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x140?text=Invalid+Image+URL'; }}
                              />
                            )
                          ) : (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No media selected</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label htmlFor="slider-external-url" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        External Media URL <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <div className="input-with-icon-wrapper">
                        <div className="input-prefix-icon"><Link size={16} /></div>
                        <input
                          id="slider-external-url"
                          className="input-field input-field-with-icon form-input-custom"
                          style={{ background: 'var(--white)' }}
                          placeholder="https://example.com/banner.jpg"
                          required={!formData.mediaUrl && !editId}
                          value={formData.mediaUrl}
                          onChange={e => setFormData({ ...formData, mediaUrl: e.target.value })}
                        />
                      </div>
                      
                      {currentPreviewSource && (
                        <div style={{ width: '100%', height: '160px', marginTop: '16px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           {formData.mediaType === 'video' ? (
                              <video
                                src={currentPreviewSource}
                                autoPlay
                                muted
                                loop
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              <img
                                src={currentPreviewSource}
                                alt="Preview"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400x140?text=Invalid+Image+URL'; }}
                              />
                            )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Call to Action */}
                <div className="form-section-header">
                  <div className="form-section-number">3</div>
                  <div className="form-section-title">Call to Action</div>
                </div>

                <div className="slider-form-grid-2" style={{ marginBottom: '24px' }}>
                  <div className="form-group">
                    <label htmlFor="slider-button-text" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Button Text <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span>
                    </label>
                    <div className="input-with-icon-wrapper">
                      <div className="input-prefix-icon"><Link2 size={16} /></div>
                      <input
                        id="slider-button-text"
                        className="input-field input-field-with-icon form-input-custom"
                        placeholder="E.g., Shop Now, Explore Catalog"
                        value={formData.buttonText}
                        onChange={e => setFormData({ ...formData, buttonText: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="slider-button-link" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                      Button Link <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span>
                    </label>
                    <div className="input-with-icon-wrapper">
                      <div className="input-prefix-icon"><Link2 size={16} /></div>
                      <input
                        id="slider-button-link"
                        className="input-field input-field-with-icon form-input-custom"
                        placeholder="E.g., /all-products or https://..."
                        value={formData.buttonLink}
                        onChange={e => setFormData({ ...formData, buttonLink: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Display Settings */}
                <div className="form-section-header">
                  <div className="form-section-number">4</div>
                  <div className="form-section-title">Display Settings</div>
                </div>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', background: 'var(--white)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '24px' }}>
                  <label htmlFor="slider-is-active" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <label className="custom-toggle-switch">
                      <input 
                        id="slider-is-active" 
                        type="checkbox" 
                        checked={formData.isActive}
                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                      <span className="custom-toggle-slider"></span>
                    </label>
                    Active <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Visible on public storefront)</span>
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                    <label htmlFor="slider-order" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Display Order
                    </label>
                    <div className="input-with-icon-wrapper" style={{ width: '100px' }}>
                      <div className="input-prefix-icon"><Hash size={16} /></div>
                      <input
                        id="slider-order"
                        type="number"
                        className="input-field input-field-with-icon form-input-custom"
                        style={{ textAlign: 'center' }}
                        value={formData.order}
                        onChange={e => setFormData({ ...formData, order: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    onClick={() => setShowModal(false)}
                    style={{ height: '44px', padding: '0 24px', fontSize: '14px', borderRadius: '8px' }}
                  >
                    <X size={16} style={{ marginRight: '6px' }} /> Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={submitting}
                    style={{ height: '44px', padding: '0 24px', fontSize: '14px', fontWeight: 600, borderRadius: '8px' }}
                  >
                    {submitting ? 'Saving Slide...' : (editId ? 'Update Slide' : 'Save & Publish Slide')}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* STANDALONE SLIDE PREVIEW MODAL */}
      {previewSlide && (
        <div className="modal-overlay" onClick={() => setPreviewSlide(null)}>
          <div className="modal-box" style={{ maxWidth: '720px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Slide Preview — {previewSlide.title}</h2>
              <button className="btn btn-outline" onClick={() => setPreviewSlide(null)}>Close</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '24px', background: 'linear-gradient(135deg, #f8fafc, #edf2f7)', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: '1 1 280px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#2563eb', fontWeight: 700 }}>
                      {previewSlide.targetAudience.toUpperCase()} STOREFRONT
                    </span>
                    <h2 style={{ fontSize: '24px', margin: '8px 0', color: '#0f172a' }}>{previewSlide.title}</h2>
                    <p style={{ color: '#475569', fontSize: '14px', margin: '0 0 16px' }}>{previewSlide.subtitle}</p>
                    <button className="btn btn-primary" style={{ padding: '8px 20px' }}>
                      {previewSlide.buttonText || 'Shop Now >'}
                    </button>
                  </div>
                  <div style={{ flex: '1 1 280px', display: 'flex', justifyContent: 'center' }}>
                    {previewSlide.mediaType === 'video' ? (
                      <video
                        src={previewSlide.mediaUrl}
                        controls
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{ width: '100%', maxHeight: '220px', borderRadius: '10px', objectFit: 'cover' }}
                      />
                    ) : (
                      <img
                        src={previewSlide.mediaUrl}
                        alt={previewSlide.title}
                        style={{ width: '100%', maxHeight: '220px', borderRadius: '10px', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sliders
