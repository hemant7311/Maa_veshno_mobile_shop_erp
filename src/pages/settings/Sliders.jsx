import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Sliders = () => {
  const [sliders, setSliders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', subtitle: '', mediaUrl: '', mediaType: 'image', isActive: true, order: 0 });
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
    if (slider) {
      setEditId(slider._id);
      setFormData({
        title: slider.title || '',
        subtitle: slider.subtitle || '',
        mediaUrl: slider.mediaUrl || '',
        mediaType: slider.mediaType || 'image',
        isActive: slider.isActive ?? true,
        order: slider.order || 0
      });
    } else {
      setEditId(null);
      setFormData({ title: '', subtitle: '', mediaUrl: '', mediaType: 'image', isActive: true, order: 0 });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/sliders/${editId}`, formData);
      } else {
        await api.post('/sliders', formData);
      }
      setShowModal(false);
      fetchSliders();
    } catch (err) {
      console.error(err);
      alert('Error saving slider');
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
                    <option value="video">Video (MP4)</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Media Source</label>
                  <select className="input-field" value={formData.mediaSource || 'url'} onChange={e => setFormData({...formData, mediaSource: e.target.value, mediaUrl: ''})}>
                    <option value="url">External Link (URL)</option>
                    <option value="upload">Upload File (Base64)</option>
                  </select>
                </div>
                {(formData.mediaSource === 'upload') ? (
                  <div className="form-group">
                    <label>Upload File</label>
                    <input type="file" className="input-field" accept={formData.mediaType === 'video' ? 'video/mp4,video/webm' : 'image/*'} onChange={e => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.size > 10 * 1024 * 1024) {
                        alert('File is too large! Please select a file smaller than 10MB.');
                        e.target.value = '';
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({...formData, mediaUrl: reader.result});
                      };
                      reader.readAsDataURL(file);
                    }} />
                    {formData.mediaUrl && formData.mediaUrl.startsWith('data:') && (
                      <div style={{marginTop: '8px', fontSize: '12px', color: 'green'}}>File selected and ready to save.</div>
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
