import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const BalanceSheet = () => {
  const [activeTab, setActiveTab] = useState('gst');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState({
    gst: { ledger: [], totalSales: 0, totalTax: 0 },
    stock: { ledger: [], totalSold: 0 },
    finance: { ledger: [], totalAmount: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBalanceSheet();
  }, []);

  const fetchBalanceSheet = async (overrideStart = startDate, overrideEnd = endDate) => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (overrideStart) params.startDate = overrideStart;
      if (overrideEnd) params.endDate = overrideEnd;

      const res = await api.get('/sales/balance-sheet', { params });
      if (res.data?.success && res.data?.data) {
        setData(res.data.data);
      } else {
        setError('Unable to load Balance Sheet data.');
      }
    } catch (err) {
      console.error('Failed to fetch balance sheet', err);
      setError(err.response?.data?.message || err.message || 'Unable to load Balance Sheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchBalanceSheet(startDate, endDate);
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    fetchBalanceSheet('', '');
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid var(--border)' }}>
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

        <form onSubmit={handleFilter} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="date"
            className="form-input"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            style={{ width: 'auto', height: '36px', fontSize: '13px' }}
          />
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>to</span>
          <input
            type="date"
            className="form-input"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            style={{ width: 'auto', height: '36px', fontSize: '13px' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '6px 14px', height: '36px', fontSize: '13px' }}>
            Filter
          </button>
          {(startDate || endDate) && (
            <button type="button" className="btn btn-outline" onClick={handleReset} style={{ padding: '6px 14px', height: '36px', fontSize: '13px' }}>
              Reset
            </button>
          )}
        </form>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading ledger data...</div>
      ) : error ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center' }}>
          <h3 style={{ color: 'var(--danger)', marginBottom: '8px' }}>Error Loading Balance Sheet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => fetchBalanceSheet(startDate, endDate)}>
            Retry
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: '20px' }}>
          {activeTab === 'gst' && (
            <div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ padding: '15px', background: 'var(--primary-light)', borderRadius: '8px', border: '1px solid var(--primary)', minWidth: '200px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--primary)' }}>Total GST Sales</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{Number(data.gst?.totalSales || 0).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ padding: '15px', background: 'var(--warning-light)', borderRadius: '8px', border: '1px solid var(--warning)', minWidth: '200px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--warning)' }}>Total Tax Collected</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{Number(data.gst?.totalTax || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Invoice No</th>
                      <th>Customer Name</th>
                      <th>Party GSTIN</th>
                      <th style={{ textAlign: 'center' }}>GST Rate</th>
                      <th style={{ textAlign: 'right' }}>Taxable Val (₹)</th>
                      <th style={{ textAlign: 'right' }}>Tax (₹)</th>
                      <th style={{ textAlign: 'right' }}>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!data.gst?.ledger || data.gst.ledger.length === 0) ? (
                      <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No GST Bills found.</td></tr>
                    ) : data.gst.ledger.map((row, i) => (
                      <tr key={row._id || i}>
                        <td>{row.date ? new Date(row.date).toLocaleDateString('en-IN') : '—'}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary)' }}>{row.invoiceNumber}</td>
                        <td style={{ fontWeight: 600 }}>{row.customerName}</td>
                        <td style={{ fontFamily: 'monospace' }}>{row.partyGst}</td>
                        <td style={{ textAlign: 'center', fontWeight: '600' }}>{row.gstRate}%</td>
                        <td style={{ textAlign: 'right' }}>{Number(row.taxableValue || 0).toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right' }}>{Number(row.taxAmount || 0).toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{Number(row.totalAmount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ padding: '15px', background: 'var(--success-light)', borderRadius: '8px', border: '1px solid var(--success)', minWidth: '200px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--success)' }}>Total Goods Sold (Value)</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{Number(data.stock?.totalSold || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
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
                    {(!data.stock?.ledger || data.stock.ledger.length === 0) ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No stock movements found.</td></tr>
                    ) : data.stock.ledger.map((row, i) => (
                      <tr key={row._id || i}>
                        <td>{row.date ? new Date(row.date).toLocaleDateString('en-IN') : '—'}</td>
                        <td>
                          <span style={{ background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                            OUT ({row.type || 'Sale'})
                          </span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary)' }}>{row.invoiceNumber}</td>
                        <td>{row.items}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{Number(row.amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                <div style={{ padding: '15px', background: 'var(--info-light)', borderRadius: '8px', border: '1px solid var(--info)', minWidth: '200px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--info)' }}>Total Financed Amount</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{Number(data.finance?.totalAmount || 0).toLocaleString('en-IN')}</div>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Invoice No</th>
                      <th>Customer Name</th>
                      <th>Finance Type</th>
                      <th>Company/Financier</th>
                      <th>Loan ID / File No</th>
                      <th style={{ textAlign: 'right' }}>Down Payment (₹)</th>
                      <th style={{ textAlign: 'right' }}>Financed Amt (₹)</th>
                      <th>EMI Amount</th>
                      <th style={{ textAlign: 'right' }}>Grand Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!data.finance?.ledger || data.finance.ledger.length === 0) ? (
                      <tr><td colSpan="10" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No finance records found.</td></tr>
                    ) : data.finance.ledger.map((row, i) => (
                      <tr key={row._id || i}>
                        <td>{row.date ? new Date(row.date).toLocaleDateString('en-IN') : '—'}</td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--primary)' }}>{row.invoiceNumber}</td>
                        <td style={{ fontWeight: 600 }}>{row.customerName}</td>
                        <td><span className={`badge badge-${row.financeType === 'Company' ? 'primary' : 'warning'}`}>{row.financeType}</span></td>
                        <td>{row.company}</td>
                        <td style={{ fontFamily: 'monospace' }}>{row.loanId}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(row.downPayment || 0).toLocaleString('en-IN')}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--success)' }}>₹{Number(row.financedAmount || row.amount || 0).toLocaleString('en-IN')}</td>
                        <td>₹{Number(row.emiAmount || 0).toLocaleString('en-IN')} x {row.tenure}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>₹{Number(row.grandTotal || row.amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BalanceSheet;
