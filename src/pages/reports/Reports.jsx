import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateRange, setDateRange] = useState('all'); // today, week, month, all
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, prodRes] = await Promise.all([
        api.get('/sales'),
        api.get('/products')
      ]);
      setSales(salesRes.data?.data || []);
      setProducts(prodRes.data?.data || []);
    } catch (error) {
      console.error('Error fetching report data', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredSales = () => {
    if (dateRange === 'all') return sales;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return sales.filter(s => {
      const d = new Date(s.createdAt);
      if (dateRange === 'today') return d >= today;
      if (dateRange === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return d >= weekAgo;
      }
      if (dateRange === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return d >= monthAgo;
      }
      return true;
    });
  };

  const filteredSales = getFilteredSales();

  const totalSalesVal = filteredSales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  const retailSalesVal = filteredSales.filter(s => s.saleType === 'retail').reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  const wholesaleSalesVal = filteredSales.filter(s => s.saleType === 'wholesale').reduce((acc, s) => acc + (s.grandTotal || 0), 0);
  const totalTax = filteredSales.reduce((acc, s) => acc + (s.totalTax || 0), 0);
  
  const totalStockInVal = products.reduce((acc, p) => acc + ((p.purchasePrice || 0) * (p.stock || 1)), 0);
  const totalStockCount = products.reduce((acc, p) => acc + (p.stock || 1), 0);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-header-left">
          <h1>Master Reports</h1>
          <p>Generate sales, stock and finance reports.</p>
        </div>
        <div>
          <select 
            className="input-field" 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            style={{ width: '200px', fontWeight: 'bold' }}
          >
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading reports...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          
          <div className="card" style={{ padding: '24px', borderTop: '4px solid var(--primary)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase' }}>Total Revenue</h3>
            <h2 style={{ margin: 0, fontSize: '32px', color: 'var(--text)' }}>?{totalSalesVal.toLocaleString('en-IN')}</h2>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>From {filteredSales.length} bills</p>
          </div>

          <div className="card" style={{ padding: '24px', borderTop: '4px solid #10b981' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase' }}>Retail Sales</h3>
            <h2 style={{ margin: 0, fontSize: '32px', color: 'var(--text)' }}>?{retailSalesVal.toLocaleString('en-IN')}</h2>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Retail Counter Output</p>
          </div>

          <div className="card" style={{ padding: '24px', borderTop: '4px solid #f59e0b' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase' }}>Wholesale Sales</h3>
            <h2 style={{ margin: 0, fontSize: '32px', color: 'var(--text)' }}>?{wholesaleSalesVal.toLocaleString('en-IN')}</h2>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Wholesaler Deliveries</p>
          </div>

          <div className="card" style={{ padding: '24px', borderTop: '4px solid #6366f1' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '14px', textTransform: 'uppercase' }}>Tax (GST) Collected</h3>
            <h2 style={{ margin: 0, fontSize: '32px', color: 'var(--text)' }}>?{totalTax.toLocaleString('en-IN')}</h2>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Based on selected time</p>
          </div>

          <div className="card" style={{ padding: '24px', gridColumn: '1 / -1', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#334155', fontSize: '16px' }}>Current Stock Valuation (Live)</h3>
            <div style={{ display: 'flex', gap: '40px', marginTop: '16px' }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>Total Items in Stock</p>
                <h2 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>{totalStockCount.toLocaleString('en-IN')} units</h2>
              </div>
              <div>
                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b' }}>Approx Stock Value</p>
                <h2 style={{ margin: 0, fontSize: '28px', color: '#0f172a' }}>?{totalStockInVal.toLocaleString('en-IN')}</h2>
              </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default Reports;
