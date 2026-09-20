import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../services/api'
import '../../styles/globals.css' // Import for basic styling if needed

const TrackEmi = () => {
  const { phone } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchFinanceDetails = async () => {
      try {
        const res = await api.get(`/finance/customer/${phone}`)
        if (res.data.success) {
          setData(res.data.data)
        } else {
          setError(res.data.message || 'Details not found.')
        }
      } catch (err) {
        console.error(err)
        setError(err.response?.data?.message || 'Unable to fetch details. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchFinanceDetails()
  }, [phone])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', padding: '20px' }}>
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '12px', fontSize: '18px' }}>Error</h2>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>{error || 'Record not found.'}</p>
        </div>
      </div>
    )
  }

  // Calculate EMI status
  const tenureMatch = data.tenure ? data.tenure.match(/\d+/) : null
  const totalEmis = tenureMatch ? parseInt(tenureMatch[0], 10) : 0
  const paidEmisCount = data.paidEmis ? data.paidEmis.length : 0
  const remainingEmis = Math.max(0, totalEmis - paidEmisCount)
  const isCompleted = totalEmis > 0 && remainingEmis === 0

  let nextDateDisplay = 'N/A'
  if (isCompleted) {
    nextDateDisplay = '—'
  } else if (data.paymentDate) {
    const nextDate = new Date(data.paymentDate)
    nextDate.setMonth(nextDate.getMonth() + paidEmisCount)
    nextDateDisplay = nextDate.toLocaleDateString('en-IN')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', padding: '0 0 40px 0', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header */}
      <div style={{ background: '#1e3a8a', color: '#fff', padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', letterSpacing: '0.5px' }}>FINANCE DETAILS</h1>
          <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '2px' }}>Customer EMI Portal</div>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '20px auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Customer Profile Card */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#475569', fontSize: '20px', fontWeight: 'bold' }}>
            {data.customerName ? data.customerName.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Customer</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{data.customerName}</div>
            <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>{data.productDetails}</div>
          </div>
        </div>

        {/* EMI Summary Card */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#334155' }}>EMI Status</h3>
            {isCompleted ? (
              <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>COMPLETED</span>
            ) : (
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>ACTIVE</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>EMI Amount</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0f172a' }}>₹{data.emiAmount}</div>
            </div>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Next Date</div>
              <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a' }}>
                {nextDateDisplay}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#334155' }}>Payment Progress</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
            <span style={{ color: '#64748b' }}>Paid: <strong style={{ color: '#16a34a' }}>{paidEmisCount}</strong></span>
            <span style={{ color: '#64748b' }}>Remaining: <strong style={{ color: '#ef4444' }}>{remainingEmis}</strong></span>
          </div>

          {/* Progress Bar */}
          <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${totalEmis > 0 ? (paidEmisCount / totalEmis) * 100 : 0}%`, 
              height: '100%', 
              background: '#2563eb',
              transition: 'width 0.5s ease'
            }}></div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
            Total Tenure: {data.tenure}
          </div>
        </div>

      </div>
    </div>
  )
}

export default TrackEmi
