import React from 'react'
import PublicLayout from '../components/layout/PublicLayout'

const RefundPolicy = () => {
  return (
    <PublicLayout>
      <div className="portal-page-header">
        <div className="portal-container">
          <h1 className="portal-page-title">Return & Refund Policy</h1>
          <p className="portal-page-subtitle">Understand our device return, refund timelines, and exchange rules</p>
        </div>
      </div>

      <div className="portal-container portal-content-body" style={{ padding: '40px 16px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>1. Return Eligibility</h2>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          Devices purchased from Maa Veshno Mobile are eligible for return or exchange within <strong>7 days</strong> of purchase or delivery. To be eligible for a return, the item must be unused, in the same physical condition that you received it, and in its original brand packaging with all tags, manuals, and accessories intact.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>2. Exclusions from Return</h2>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          The following products are strictly non-returnable:
        </p>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '20px', color: '#475569', fontSize: '13.5px', lineHeight: 1.5 }}>
          <li>Devices with physical damage, scratches, liquid logs, or missing serial/IMEI numbers.</li>
          <li>Products that have been activated or customized with user software logs/locks.</li>
          <li>Customized screen protectors or cases that have already been applied/opened.</li>
        </ul>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>3. Warranty & Brand Claims</h2>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          For any hardware or software defects discovered after the initial 7-day return period, claims must be directed to the respective manufacturer's official authorized service center (e.g. Apple Care, Samsung Service) under their standard 1-year brand warranty.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>4. Refund Processing</h2>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          Once your returned device is inspected and approved by our inventory team, refunds will be initiated. Cash refunds are completed instantly at our retail outlet. Online payments and finance refunds will be credited back to your original payment source or bank account within 5-7 working days.
        </p>

        <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '20px', textAlign: 'center' }}>
          Last updated: July 2026. For questions, contact support@maaveshnomobile.com
        </div>
      </div>
    </PublicLayout>
  )
}

export default RefundPolicy
