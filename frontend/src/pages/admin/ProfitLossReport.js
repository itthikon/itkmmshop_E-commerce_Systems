import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProfitLossReport.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

const ProfitLossReport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: getFirstDayOfMonth(),
    endDate: getLastDayOfMonth()
  });

  // Period comparison state
  const [showComparison, setShowComparison] = useState(true);
  const [comparisonData, setComparisonData] = useState(null);

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchReport();
    }
  }, [dateRange]);

  function getFirstDayOfMonth() {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  }

  function getLastDayOfMonth() {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
  }

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const params = new URLSearchParams({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate
      });

      const response = await axios.get(
        `${API_URL}/accounting/reports/profit-loss?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const data = response.data.data;
        // Map backend structure to frontend expectations
        setReportData({
          incomeByCategory: data.income?.by_category || [],
          totalIncome: data.income?.total || 0,
          expenseByCategory: data.expenses?.by_category || [],
          totalExpenses: data.expenses?.total || 0,
          netProfit: data.net_profit || 0,
          period: data.period
        });
        
        // Fetch comparison data if enabled
        if (showComparison) {
          fetchComparisonData();
        }
      }
    } catch (err) {
      console.error('Error fetching profit-loss report:', err);
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.error || 'ไม่สามารถโหลดรายงานได้';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisonData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Calculate previous period dates
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - daysDiff);

      const params = new URLSearchParams({
        start_date: prevStart.toISOString().split('T')[0],
        end_date: prevEnd.toISOString().split('T')[0]
      });

      const response = await axios.get(
        `${API_URL}/accounting/reports/profit-loss?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const data = response.data.data;
        // Map backend structure to frontend expectations
        setComparisonData({
          incomeByCategory: data.income?.by_category || [],
          totalIncome: data.income?.total || 0,
          expenseByCategory: data.expenses?.by_category || [],
          totalExpenses: data.expenses?.total || 0,
          netProfit: data.net_profit || 0,
          period: data.period
        });
      }
    } catch (err) {
      console.error('Error fetching comparison data:', err);
      // Don't show error for comparison, just disable it
      setComparisonData(null);
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleQuickDateRange = (range) => {
    const today = new Date();
    let startDate, endDate;

    switch (range) {
      case 'today':
        startDate = endDate = today.toISOString().split('T')[0];
        break;
      case 'week':
        endDate = today.toISOString().split('T')[0];
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
        startDate = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        startDate = getFirstDayOfMonth();
        endDate = getLastDayOfMonth();
        break;
      case 'quarter':
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        startDate = quarterStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      default:
        return;
    }

    setDateRange({ startDate, endDate });
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');

      const response = await axios.post(
        `${API_URL}/accounting/export/report`,
        {
          reportType: 'profit-loss',
          format: format,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          data: reportData
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const extension = format === 'pdf' ? 'pdf' : 'xlsx';
      link.setAttribute('download', `profit-loss-report-${dateRange.startDate}-${dateRange.endDate}.${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('ไม่สามารถ export รายงานได้');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous) * 100).toFixed(1);
  };

  const renderComparisonBadge = (current, previous) => {
    if (!comparisonData || !previous) return null;
    
    const change = calculatePercentageChange(current, previous);
    const isPositive = change >= 0;
    
    return (
      <span className={`comparison-badge ${isPositive ? 'positive' : 'negative'}`}>
        {isPositive ? '↑' : '↓'} {Math.abs(change)}%
      </span>
    );
  };

  if (loading && !reportData) {
    return <div className="loading">กำลังโหลดรายงาน...</div>;
  }

  return (
    <div className="profit-loss-report">
      <div className="report-header">
        <h1>รายงานกำไร-ขาดทุน</h1>
        <p className="report-subtitle">Profit & Loss Statement</p>
      </div>

      {/* Date Range Selector */}
      <div className="date-range-section">
        <div className="date-inputs">
          <div className="date-input-group">
            <label>วันที่เริ่มต้น</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className="date-input"
            />
          </div>
          <div className="date-input-group">
            <label>วันที่สิ้นสุด</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className="date-input"
            />
          </div>
        </div>

        <div className="quick-date-buttons">
          <button onClick={() => handleQuickDateRange('today')} className="btn btn-sm">วันนี้</button>
          <button onClick={() => handleQuickDateRange('week')} className="btn btn-sm">7 วันที่แล้ว</button>
          <button onClick={() => handleQuickDateRange('month')} className="btn btn-sm">เดือนนี้</button>
          <button onClick={() => handleQuickDateRange('quarter')} className="btn btn-sm">ไตรมาสนี้</button>
          <button onClick={() => handleQuickDateRange('year')} className="btn btn-sm">ปีนี้</button>
        </div>

        <div className="report-actions">
          <label className="comparison-toggle">
            <input
              type="checkbox"
              checked={showComparison}
              onChange={(e) => {
                setShowComparison(e.target.checked);
                if (e.target.checked && reportData) {
                  fetchComparisonData();
                }
              }}
            />
            <span>แสดงการเปรียบเทียบ</span>
          </label>
          
          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting || !reportData}
            className="btn btn-secondary"
          >
            {exporting ? 'กำลัง Export...' : '📄 Export PDF'}
          </button>
          <button
            onClick={() => handleExport('excel')}
            disabled={exporting || !reportData}
            className="btn btn-secondary"
          >
            {exporting ? 'กำลัง Export...' : '📊 Export Excel'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button onClick={fetchReport} className="btn btn-primary">
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {reportData && (
        <div className="report-content">
          <div className="report-period">
            <p>ระยะเวลา: {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}</p>
          </div>

          {/* Income Section */}
          <div className="report-section">
            <h2 className="section-title income-title">รายรับ (Income)</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th>หมวดหมู่</th>
                  <th className="text-right">จำนวนเงิน</th>
                  {showComparison && comparisonData && (
                    <th className="text-right">เปรียบเทียบ</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {reportData.incomeByCategory && reportData.incomeByCategory.length > 0 ? (
                  reportData.incomeByCategory.map((item, index) => {
                    const prevItem = comparisonData?.incomeByCategory?.find(
                      prev => prev.category_name === item.category_name
                    );
                    return (
                      <tr key={index}>
                        <td>{item.category_name}</td>
                        <td className="text-right amount">{formatCurrency(item.total_amount)}</td>
                        {showComparison && comparisonData && (
                          <td className="text-right">
                            {renderComparisonBadge(item.total_amount, prevItem?.total_amount)}
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={showComparison && comparisonData ? 3 : 2} className="text-center empty-state">
                      ไม่มีรายรับในช่วงเวลานี้
                    </td>
                  </tr>
                )}
                <tr className="total-row">
                  <td><strong>รวมรายรับ</strong></td>
                  <td className="text-right amount"><strong>{formatCurrency(reportData.totalIncome)}</strong></td>
                  {showComparison && comparisonData && (
                    <td className="text-right">
                      {renderComparisonBadge(reportData.totalIncome, comparisonData.totalIncome)}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Expense Section */}
          <div className="report-section">
            <h2 className="section-title expense-title">รายจ่าย (Expenses)</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th>หมวดหมู่</th>
                  <th className="text-right">จำนวนเงิน</th>
                  {showComparison && comparisonData && (
                    <th className="text-right">เปรียบเทียบ</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {reportData.expenseByCategory && reportData.expenseByCategory.length > 0 ? (
                  reportData.expenseByCategory.map((item, index) => {
                    const prevItem = comparisonData?.expenseByCategory?.find(
                      prev => prev.category_name === item.category_name
                    );
                    return (
                      <tr key={index}>
                        <td>{item.category_name}</td>
                        <td className="text-right amount">{formatCurrency(item.total_amount)}</td>
                        {showComparison && comparisonData && (
                          <td className="text-right">
                            {renderComparisonBadge(item.total_amount, prevItem?.total_amount)}
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={showComparison && comparisonData ? 3 : 2} className="text-center empty-state">
                      ไม่มีรายจ่ายในช่วงเวลานี้
                    </td>
                  </tr>
                )}
                <tr className="total-row">
                  <td><strong>รวมรายจ่าย</strong></td>
                  <td className="text-right amount"><strong>{formatCurrency(reportData.totalExpenses)}</strong></td>
                  {showComparison && comparisonData && (
                    <td className="text-right">
                      {renderComparisonBadge(reportData.totalExpenses, comparisonData.totalExpenses)}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Profit Section */}
          <div className="report-section net-profit-section">
            <table className="report-table">
              <tbody>
                <tr className={`net-profit-row ${reportData.netProfit >= 0 ? 'profit' : 'loss'}`}>
                  <td><strong>กำไร(ขาดทุน)สุทธิ (Net Profit/Loss)</strong></td>
                  <td className="text-right amount">
                    <strong>{formatCurrency(reportData.netProfit)}</strong>
                  </td>
                  {showComparison && comparisonData && (
                    <td className="text-right">
                      {renderComparisonBadge(reportData.netProfit, comparisonData.netProfit)}
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary Cards */}
          <div className="report-summary">
            <div className="summary-card">
              <div className="summary-label">รายรับรวม</div>
              <div className="summary-value income">{formatCurrency(reportData.totalIncome)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">รายจ่ายรวม</div>
              <div className="summary-value expense">{formatCurrency(reportData.totalExpenses)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">กำไรสุทธิ</div>
              <div className={`summary-value ${reportData.netProfit >= 0 ? 'profit' : 'loss'}`}>
                {formatCurrency(reportData.netProfit)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitLossReport;
