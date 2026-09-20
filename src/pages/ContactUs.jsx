import React, { useState } from 'react'
import PublicLayout from '../components/layout/PublicLayout'

const ContactUs = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' })
  const [success, setSuccess] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    alert('Thank you for contacting Maa Veshno Mobile. We will get back to you shortly!')
    setSuccess(true)
    setFormData({ name: '', email: '', phone: '', message: '' })
  }

  return (
    <PublicLayout>
      <div className="portal-page-header">
        <div className="portal-container">
          <h1 className="portal-page-title">Contact Us</h1>
          <p className="portal-page-subtitle">Get in touch with us for inquiries, support, or wholesale queries</p>
        </div>
      </div>

      <div className="portal-container portal-content-body" style={{ padding: '40px 16px', display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        {/* Contact details */}
        <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Store Information</h2>
            <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '6px' }}>
              Feel free to visit our retail outlet for live demonstrations, product hands-on and finance setups.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px' }}>📍</span>
              <div>
                <strong style={{ display: 'block', color: '#0f172a', fontSize: '14px' }}>Main Address</strong>
                <span style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.4 }}>Maa Veshno Mobile, Shop No. 5, Ground Floor, Central Market, New Delhi, India</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px' }}>📞</span>
              <div>
                <strong style={{ display: 'block', color: '#0f172a', fontSize: '14px' }}>Helpline Numbers</strong>
                <span style={{ fontSize: '13.5px', color: '#64748b' }}>+91 98765 43210 / +91 91234 56789</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px' }}>✉️</span>
              <div>
                <strong style={{ display: 'block', color: '#0f172a', fontSize: '14px' }}>Email Queries</strong>
                <span style={{ fontSize: '13.5px', color: '#64748b' }}>support@maaveshnomobile.com / wholesale@maaveshnomobile.com</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '20px' }}>🕒</span>
              <div>
                <strong style={{ display: 'block', color: '#0f172a', fontSize: '14px' }}>Business Hours</strong>
                <span style={{ fontSize: '13.5px', color: '#64748b' }}>Monday - Saturday: 10:00 AM - 08:00 PM (Sunday Closed)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form panel */}
        <div style={{ flex: 1.2, minWidth: '300px', background: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Send Us a Message</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Our technical representative will contact you back within 24 working hours.</p>
          
          {success && <div style={{ color: 'var(--success)', background: 'var(--success-light)', padding: '10px 14px', borderRadius: '6px', fontSize: '13.5px', fontWeight: 550, marginBottom: '16px' }}>Message sent successfully!</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>Your Name *</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ height: '38px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13.5px' }} />
              </div>
              <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>Email Address *</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ height: '38px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13.5px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>Contact Phone</label>
              <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ height: '38px', borderRadius: '6px', border: '1px solid #cbd5e1', padding: '0 10px', fontSize: '13.5px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>Your Message *</label>
              <textarea required rows="4" value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} style={{ borderRadius: '6px', border: '1px solid #cbd5e1', padding: '10px', fontSize: '13.5px', resize: 'vertical' }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ height: '40px', fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>Send Message</button>
          </form>
        </div>
      </div>
    </PublicLayout>
  )
}

export default ContactUs
