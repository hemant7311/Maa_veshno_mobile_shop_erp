import React from 'react'
import PublicLayout from '../components/layout/PublicLayout'

const AboutUs = () => {
  return (
    <PublicLayout>
      <div className="portal-page-header">
        <div className="portal-container">
          <h1 className="portal-page-title">About Us</h1>
          <p className="portal-page-subtitle">Learn more about Maa Veshno Mobile and our values</p>
        </div>
      </div>

      <div className="portal-container portal-content-body" style={{ padding: '40px 16px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <section style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1.2, minWidth: '300px' }}>
            <h2 style={{ fontSize: '24px', color: '#0f172a', marginBottom: '14px', fontWeight: 700 }}>Our Journey & Commitment</h2>
            <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '12px' }}>
              Founded with a mission to deliver top-tier mobile devices and reliable retail customer care, <strong>Maa Veshno Mobile</strong> has grown into a trusted destination for mobile lovers.
            </p>
            <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '12px' }}>
              We specialize in offering high-quality smartphones, smart accessories, and repair support under one roof. Our primary goal is customer satisfaction, which we achieve through authentic warranties and competitive prices.
            </p>
          </div>
          <div style={{ flex: 1, minWidth: '300px', background: '#f8fafc', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '12px', fontWeight: 700 }}>Why Choose Us?</h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '20px', color: '#475569', lineHeight: 1.5 }}>
              <li><strong>100% Genuine Devices</strong> direct from official brand distributors.</li>
              <li><strong>Secure Payments</strong> and quick finance approval options (HDB, Bajaj Finserv).</li>
              <li><strong>Reliable Warranty Support</strong> and local post-sales query resolution.</li>
              <li><strong>Easy Return policies</strong> matching standard retail specifications.</li>
            </ul>
          </div>
        </section>

        <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '32px' }}>
          <h2 style={{ fontSize: '22px', color: '#0f172a', marginBottom: '16px', fontWeight: 700, textAlign: 'center' }}>Our Core Values</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginTop: '16px' }}>
            <div className="stat-card" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🤝</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Trust & Transparency</h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>We believe in clean pricing and explicit billing guidelines without hidden charges.</p>
            </div>
            <div className="stat-card" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🏆</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Quality Standards</h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>Every IMEI is authenticated and logged with strict physical inspection before customer delivery.</p>
            </div>
            <div className="stat-card" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🚀</div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Customer First</h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>Our dedicated support staff is available round-the-clock for retail query management.</p>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  )
}

export default AboutUs
