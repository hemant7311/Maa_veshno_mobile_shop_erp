import React from 'react'
import PublicLayout from '../components/layout/PublicLayout'

const TermsConditions = () => {
  return (
    <PublicLayout>
      <div className="portal-page-header">
        <div className="portal-container">
          <h1 className="portal-page-title">Terms & Conditions</h1>
          <p className="portal-page-subtitle">Understand our service, retail, and sales terms of use</p>
        </div>
      </div>

      <div className="portal-container portal-content-body" style={{ padding: '40px 16px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>1. Agreement to Terms</h2>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          By accessing or making purchases from Maa Veshno Mobile store or website, you agree to comply with and be bound by these Terms and Conditions. Please review them carefully before placing an order.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>2. Product Pricing & Specifications</h2>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          We make every effort to display the colors, specifications, and prices of our mobile products accurately. However, we do not warrant that product descriptions or other content are error-free. In the event of a pricing error, we reserve the right to cancel any orders placed for the affected item.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>3. Sales & Invoice Terms</h2>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          Every sale is subject to physical verification of the product's IMEI numbers in our inventory database. A valid tax invoice will be generated at the time of purchase. Warranty claims must be routed through official brand service centers using this invoice.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>4. Payment & Finance Conditions</h2>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          Payments can be completed via Cash, Card, UPI or authorized retail Finance partners (e.g. HDB, TVS Credit, Bajaj Finserv). In case of financing, approval and down payment requirements are governed strictly by the respective finance provider's policies.
        </p>

        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>5. Limitation of Liability</h2>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.6 }}>
          Maa Veshno Mobile shall not be held liable for any direct, indirect, incidental, or consequential damages resulting from product usage or shipment delays.
        </p>

        <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '20px', textAlign: 'center' }}>
          Last updated: July 2026. For questions, contact support@maaveshnomobile.com
        </div>
      </div>
    </PublicLayout>
  )
}

export default TermsConditions
