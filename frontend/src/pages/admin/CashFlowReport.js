import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CashFlowReport.css';
import CashFlowChart from '../../components/charts/CashFlowChart';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

const CashFlowReport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: getFirstDayOfMonth(),
    endDate: getLastDayOfMonth()
  });

  // View toggle state (daily/weekly/monthly)
  const [viewMode, setViewMode] = useState('daily');

  useEffect(() => {
    if (dateRange.startDate && dateRange.endDate) {
      fetchReport();
    }
  }, [dateRange, viewMode]);

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
        end_date: dateRange.endDate,
        group_by: viewMode
      });

      const response = await axios.get(
        `${API_URL}/accounting/reports/cash-flow?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching cash flow report:', err);
      const errorMessage = err.response?.data?.error?.message || err.response?.data?.error || 'ไม่สามารถโหลดรายงานได้';
      setError(errorMessage);
    } finally {
      setLoading(false);
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
        setViewMode('daily');
        break;
      case 'week':
        endDate = today.toISOString().split('T')[0];
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - 7);
        startDate = weekStart.toISOString().split('T')[0];
        setViewMode('daily');
        break;
      case 'month':
        startDate = getFirstDayOfMonth();
        endDate = getLastDayOfMonth();
        setViewMode('daily');
        break;
      case 'quarter':
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
        startDate = quarterStart.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        setViewMode('weekly');
        break;
      case 'year':
        startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        setViewMode('monthly');
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
          reportType: 'cash-flow',
          format: format,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          groupBy: viewMode,
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
      link.setAttribute('download', `cash-flow-report-${dateRange.startDate}-${dateRange.endDate}.${extension}`);
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

  const getViewModeLabel = (mode) => {
    const labels = {
      daily: 'รายวัน',
      weekly: 'รายสัปดาห์',
      monthly: 'รายเดือน'
    };
    return labels[mode] || mode;
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!reportData || !reportData.cashFlowByPeriod) return null;

    const periods = reportData.cashFlowByPeriod;
    const maxValue = Math.max(
      ...periods.map(p => Math.max(p.total_inflow, p.total_outflow))
    );

    return { periods, maxValue };
  };

  const chartData = prepareChartData();

  if (loading && !reportData) {
    return <div className="loading">กำลังโหลดรายงาน...</div>;
  }

  return (
    <div className="cash-flow-report">
      <div className="report-header">
        <h1>รายงานกระแสเงินสด</h1>
        <p className="report-subtitle">Cash Flow Statement</p>
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

        <div className="view-mode-section">
          <label>มุมมอง:</label>
          <div className="view-mode-buttons">
            <button
              onClick={() => setViewMode('daily')}
              className={`btn btn-sm ${viewMode === 'daily' ? 'active' : ''}`}
            >
              รายวัน
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`btn btn-sm ${viewMode === 'weekly' ? 'active' : ''}`}
            >
              รายสัปดาห์
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`btn btn-sm ${viewMode === 'monthly' ? 'active' : ''}`}
            >
              รายเดือน
            </button>
          </div>
        </div>

        <div className="report-actions">
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
            <p>มุมมอง: {getViewModeLabel(viewMode)}</p>
          </div>

          {/* Summary Section */}
          <div className="cash-flow-summary">
            <div className="summary-card opening">
              <div className="summary-label">ยอดเงินต้นงวด</div>
              <div className="summary-value">{formatCurrency(reportData.openingBalance)}</div>
            </div>
            <div className="summary-card inflow">
              <div className="summary-label">เงินเข้า</div>
              <div className="summary-value income">+{formatCurrency(reportData.totalInflow)}</div>
            </div>
            <div className="summary-card outflow">
              <div className="summary-label">เงินออก</div>
              <div className="summary-value expense">-{formatCurrency(reportData.totalOutflow)}</div>
            </div>
            <div className="summary-card closing">
              <div className="summary-label">ยอดเงินปลายงวด</div>
              <div className={`summary-value ${reportData.closingBalance >= 0 ? 'profit' : 'loss'}`}>
                {formatCurrency(reportData.closingBalance)}
              </div>
            </div>
          </div>

          {/* Chart Visualization */}
          {chartData && chartData.periods.length > 0 && (
            <div className="report-section">
              <h2 className="section-title">กราฟกระแสเงินสด</h2>
              <CashFlowChart data={reportData} />
            </div>
          )}

          {/* Cash Inflows by Category */}
          <div className="report-section">
            <h2 className="section-title income-title">เงินเข้าตามหมวดหมู่ (Cash Inflows)</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th>หมวดหมู่</th>
                  <th className="text-right">จำนวนเงิน</th>
                  <th className="text-right">% ของเงินเข้าทั้งหมด</th>
                </tr>
              </thead>
              <tbody>
                {reportData.inflowByCategory && reportData.inflowByCategory.length > 0 ? (
                  reportData.inflowByCategory.map((item, index) => {
                    const percentage = reportData.totalInflow > 0
                      ? ((item.total_amount / reportData.totalInflow) * 100).toFixed(1)
                      : 0;
                    return (
                      <tr key={index}>
                        <td>{item.category_name}</td>
                        <td className="text-right amount">{formatCurrency(item.total_amount)}</td>
                        <td className="text-right">{percentage}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center empty-state">
                      ไม่มีเงินเข้าในช่วงเวลานี้
                    </td>
                  </tr>
                )}
                <tr className="total-row">
                  <td><strong>รวมเงินเข้า</strong></td>
                  <td className="text-right amount"><strong>{formatCurrency(reportData.totalInflow)}</strong></td>
                  <td className="text-right"><strong>100%</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Cash Outflows by Category */}
          <div className="report-section">
            <h2 className="section-title expense-title">เงินออกตามหมวดหมู่ (Cash Outflows)</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th>หมวดหมู่</th>
                  <th className="text-right">จำนวนเงิน</th>
                  <th className="text-right">% ของเงินออกทั้งหมด</th>
                </tr>
              </thead>
              <tbody>
                {reportData.outflowByCategory && reportData.outflowByCategory.length > 0 ? (
                  reportData.outflowByCategory.map((item, index) => {
                    const percentage = reportData.totalOutflow > 0
                      ? ((item.total_amount / reportData.totalOutflow) * 100).toFixed(1)
                      : 0;
                    return (
                      <tr key={index}>
                        <td>{item.category_name}</td>
                        <td className="text-right amount">{formatCurrency(item.total_amount)}</td>
                        <td className="text-right">{percentage}%</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="text-center empty-state">
                      ไม่มีเงินออกในช่วงเวลานี้
                    </td>
                  </tr>
                )}
                <tr className="total-row">
                  <td><strong>รวมเงินออก</strong></td>
                  <td className="text-right amount"><strong>{formatCurrency(reportData.totalOutflow)}</strong></td>
                  <td className="text-right"><strong>100%</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Cash Flow */}
          <div className="report-section net-cash-flow-section">
            <table className="report-table">
              <tbody>
                <tr className="highlight-row">
                  <td><strong>กระแสเงินสดสุทธิ (Net Cash Flow)</strong></td>
                  <td className="text-right amount">
                    <strong>{formatCurrency(reportData.totalInflow - reportData.totalOutflow)}</strong>
                  </td>
                  <td className="text-right"></td>
                </tr>
                <tr className={`closing-balance-row ${reportData.closingBalance >= 0 ? 'positive' : 'negative'}`}>
                  <td><strong>ยอดเงินปลายงวด (Closing Balance)</strong></td>
                  <td className="text-right amount">
                    <strong>{formatCurrency(reportData.closingBalance)}</strong>
                  </td>
                  <td className="text-right"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlowReport;
