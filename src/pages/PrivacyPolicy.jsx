import React from 'react'
import PublicLayout from '../components/layout/PublicLayout'

const PrivacyPolicy = () => {
  return (
    <PublicLayout>
      <div className="portal-page-header">
        <div className="portal-container">
          <h1 className="portal-page-title">Privacy Policy</h1>
          <p className="portal-page-subtitle">Learn how we collect, use, and protect your personal information</p>
        </div>
      </div>

      <div className="portal-container portal-content-body" style={{ padding: '40px 16px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>1. Information We Collect</h2>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          We collect personal information that you voluntarily provide to us when registering, making purchases, applying for mobile finance, or contacting us. This includes your name, phone number, email address, physical shipping address, and financing details.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>2. How We Use Your Information</h2>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          Your data is used to process your orders, generate valid tax invoices, manage finance applications, send transaction updates, and address support inquiries. We do not sell your personal information to third-party marketing companies.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>3. Information Sharing & Disclosure</h2>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          We share your information only with authorized service providers, finance companies, and shipping agents strictly as required to complete your transactions (e.g. sharing details with Bajaj Finserv or HDB Financial Services for loan processing).
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>4. Data Security</h2>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          We implement standard security measures to safeguard your personal data. However, please note that no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>5. Cookies and Logs</h2>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          Our portal uses cookies to enhance user navigation experience, store cart item counts, and keep track of selected session variables. You can disable cookies in your browser settings if desired.
        </p>

        <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '20px', textAlign: 'center' }}>
          Last updated: July 2026. For questions, contact privacy@maaveshnomobile.com
        </div>
      </div>
    </PublicLayout>
  )
}

export default PrivacyPolicy
