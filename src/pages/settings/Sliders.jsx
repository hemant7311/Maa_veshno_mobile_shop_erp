import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Sliders = () => {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', subtitle: '', mediaUrl: '', mediaType: 'image', isActive: true, order: 0, mediaSource: 'upload' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchSliders();
  }, []);

  const fetchSliders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sliders/admin');
      if (res.data?.success) setSliders(res.data.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch sliders');
    }
    setLoading(false);
  };

  const handleOpen = (slider = null) => {
    setSelectedFile(null);
    if (slider) {
      setEditId(slider._id);
      setFormData({
        title: slider.title || '',
        subtitle: slider.subtitle || '',
        mediaUrl: slider.mediaUrl || '',
        mediaType: slider.mediaType || 'image',
        isActive: slider.isActive ?? true,
        order: slider.order || 0,
        mediaSource: slider.mediaUrl && slider.mediaUrl.startsWith('/uploads/') ? 'upload' : 'url'
      });
    } else {
      setEditId(null);
      setFormData({ title: '', subtitle: '', mediaUrl: '', mediaType: 'image', isActive: true, order: 0, mediaSource: 'upload' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedFile) {
        const payload = new FormData();
        payload.append('mediaFile', selectedFile);
        payload.append('title', formData.title);
        payload.append('subtitle', formData.subtitle || '');
        payload.append('mediaType', formData.mediaType || 'image');
        payload.append('isActive', formData.isActive);
        payload.append('order', formData.order || 0);

        const config = { headers: { 'Content-Type': 'multipart/form-data' } };
        if (editId) {
          await api.put(`/sliders/${editId}`, payload, config);
        } else {
          await api.post('/sliders', payload, config);
        }
      } else {
        if (!formData.mediaUrl && !editId) {
          alert('Please select a media file or provide a URL.');
          return;
        }
        if (editId) {
          await api.put(`/sliders/${editId}`, formData);
        } else {
          await api.post('/sliders', formData);
        }
      }
      setShowModal(false);
      setSelectedFile(null);
      fetchSliders();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Error saving slider');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this slider?')) return;
    try {
      await api.delete(`/sliders/${id}`);
      fetchSliders();
    } catch (err) {
      alert('Error deleting slider');
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h1>Manage Home Sliders</h1>
          <p>Control the hero section of the wholesaler landing page</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpen()}>+ Add New Slide</button>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Media</th>
                <th>Title & Subtitle</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : sliders.map(s => (
                <tr key={s._id}>
                  <td>{s.order}</td>
                  <td>
                    {s.mediaType === 'image' ? (
                      <img src={s.mediaUrl} alt="Slide" style={{ height: '40px', borderRadius: '4px' }} />
                    ) : (
                      <span className="badge">Video URL</span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.subtitle}</div>
                  </td>
                  <td>{s.mediaType.toUpperCase()}</td>
                  <td>
                    <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {s.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="action-btn" onClick={() => handleOpen(s)}>Edit</button>
                    <button className="action-btn danger" onClick={() => handleDelete(s._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2>{editId ? 'Edit Slide' : 'Add Slide'}</h2>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Close</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>Title (Heading Text)</label>
                  <input className="input-field" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Subtitle (Description)</label>
                  <input className="input-field" value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Media Type</label>
                  <select className="input-field" value={formData.mediaType} onChange={e => setFormData({...formData, mediaType: e.target.value})}>
                    <option value="image">Image</option>
                    <option value="video">Video (MP4/WebM)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Media Source</label>
                  <select className="input-field" value={formData.mediaSource || 'upload'} onChange={e => { setSelectedFile(null); setFormData({...formData, mediaSource: e.target.value}); }}>
                    <option value="upload">Upload File (Multer Storage)</option>
                    <option value="url">External Link (URL)</option>
                  </select>
                </div>
                {(formData.mediaSource === 'upload') ? (
                  <div className="form-group">
                    <label>Upload File {editId && '(Leave empty to keep current file)'}</label>
                    <input type="file" className="input-field" accept={formData.mediaType === 'video' ? 'video/mp4,video/webm' : 'image/*'} onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.size > 50 * 1024 * 1024) {
                        alert('File is too large! Maximum allowed size is 50MB.');
                        e.target.value = '';
                        return;
                      }
                      setSelectedFile(file);
                    }} />
                    {selectedFile && (
                      <div style={{marginTop: '8px', fontSize: '12px', color: 'green'}}>File selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</div>
                    )}
                    {formData.mediaUrl && !selectedFile && (
                      <div style={{marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)'}}>Current file: {formData.mediaUrl}</div>
                    )}
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Media URL</label>
                    <input className="input-field" placeholder="https://..." required={!formData.mediaUrl} value={formData.mediaUrl} onChange={e => setFormData({...formData, mediaUrl: e.target.value})} />
                  </div>
                )}

                <div className="form-group" style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                    Active (Show on Home Page)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Order:
                    <input type="number" className="input-field" style={{ width: '80px' }} value={formData.order} onChange={e => setFormData({...formData, order: Number(e.target.value)})} />
                  </label>
                </div>
                <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Save'} Slide</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sliders;
