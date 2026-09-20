import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const BalanceSheet = () => {
  const [activeTab, setActiveTab] = useState('gst');
  const [data, setData] = useState({
    gst: { ledger: [], totalSales: 0, totalTax: 0 },
    stock: { ledger: [], totalSold: 0 },
    finance: { ledger: [], totalAmount: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalanceSheet();
  }, []);

  const fetchBalanceSheet = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sales/balance-sheet');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch balance sheet', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'gst', label: 'GST Balance Sheet' },
    { id: 'stock', label: 'Maal Aaye/Jaye (Stock Ledger)' },
    { id: 'finance', label: 'Finance Ledger' }
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Balance Sheet & Ledgers</h1>
          <p>Real-time accounting data and ledgers</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid var(--border)', marginBottom: '20px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              fontSize: '15px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading ledger data...</div>
      ) : (
        <div className="card" style={{ padding: '20px' }}>
          {activeTab === 'gst' && (
            <div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ padding: '15px', background: 'var(--primary-light)', borderRadius: '8px', border: '1px solid var(--primary)' }}>
                  <div style={{ fontSize: '13px', color: 'var(--primary)' }}>Total GST Sales</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{data.gst.totalSales.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ padding: '15px', background: 'var(--warning-light)', borderRadius: '8px', border: '1px solid var(--warning)' }}>
                  <div style={{ fontSize: '13px', color: 'var(--warning)' }}>Total Tax Collected</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{data.gst.totalTax.toLocaleString('en-IN')}</div>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoice No</th>
                    <th>Customer Name</th>
                    <th>Party GSTIN</th>
                    <th style={{ textAlign: 'right' }}>Taxable Val (₹)</th>
                    <th style={{ textAlign: 'right' }}>Tax (₹)</th>
                    <th style={{ textAlign: 'right' }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.gst.ledger.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center' }}>No GST Bills found.</td></tr>
                  ) : data.gst.ledger.map((row, i) => (
                    <tr key={i}>
                      <td>{new Date(row.date).toLocaleDateString('en-IN')}</td>
                      <td>{row.invoiceNumber}</td>
                      <td style={{ fontWeight: 600 }}>{row.customerName}</td>
                      <td style={{ fontFamily: 'monospace' }}>{row.partyGst}</td>
                      <td style={{ textAlign: 'right' }}>{row.taxableValue.toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right' }}>{row.taxAmount.toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{row.totalAmount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'stock' && (
            <div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ padding: '15px', background: 'var(--success-light)', borderRadius: '8px', border: '1px solid var(--success)' }}>
                  <div style={{ fontSize: '13px', color: 'var(--success)' }}>Total Goods Sold (Value)</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{data.stock.totalSold.toLocaleString('en-IN')}</div>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Ref / Invoice</th>
                    <th>Items (Qty)</th>
                    <th style={{ textAlign: 'right' }}>Value (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.stock.ledger.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center' }}>No stock movements found.</td></tr>
                  ) : data.stock.ledger.map((row, i) => (
                    <tr key={i}>
                      <td>{new Date(row.date).toLocaleDateString('en-IN')}</td>
                      <td>
                        <span style={{ background: row.type === 'Sale' ? '#fee2e2' : '#dcfce7', color: row.type === 'Sale' ? '#ef4444' : '#22c55e', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          {row.type === 'Sale' ? 'OUT' : 'IN'}
                        </span>
                      </td>
                      <td>{row.invoiceNumber}</td>
                      <td>{row.items}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{row.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'finance' && (
            <div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ padding: '15px', background: 'var(--info-light)', borderRadius: '8px', border: '1px solid var(--info)' }}>
                  <div style={{ fontSize: '13px', color: 'var(--info)' }}>Total Financed Amount</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{data.finance.totalAmount.toLocaleString('en-IN')}</div>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Invoice No</th>
                    <th>Customer Name</th>
                    <th>Finance Type</th>
                    <th>Company/Financier</th>
                    <th>Loan ID / File No</th>
                    <th>EMI Amount</th>
                    <th style={{ textAlign: 'right' }}>Total Financed (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.finance.ledger.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center' }}>No finance records found.</td></tr>
                  ) : data.finance.ledger.map((row, i) => (
                    <tr key={i}>
                      <td>{new Date(row.date).toLocaleDateString('en-IN')}</td>
                      <td>{row.invoiceNumber}</td>
                      <td style={{ fontWeight: 600 }}>{row.customerName}</td>
                      <td><span className={`badge badge-${row.financeType === 'Company' ? 'primary' : 'warning'}`}>{row.financeType}</span></td>
                      <td>{row.company}</td>
                      <td style={{ fontFamily: 'monospace' }}>{row.loanId}</td>
                      <td>₹{row.emiAmount.toLocaleString('en-IN')} x {row.tenure}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{row.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BalanceSheet;
