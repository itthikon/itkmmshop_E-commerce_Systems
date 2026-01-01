import React, { useState } from 'react';
import axios from 'axios';
import '../../components/admin/AdminStyles.css';
import '../../components/admin/AnalyticsStyles.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

const FinancialReports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState('comprehensive');

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError('กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      let endpoint = '';
      switch (reportType) {
        case 'revenue':
          endpoint = '/financial/revenue/summary';
          break;
        case 'profit':
          endpoint = '/financial/profit/by-product';
          break;
        case 'comprehensive':
        default:
          endpoint = '/financial/report';
          break;
      }

      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { start_date: startDate, end_date: endDate }
      });

      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (err) {
      console.error('Error generating report:', err);
      setError('ไม่สามารถสร้างรายงานได้');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    if (!startDate || !endDate) {
      setError('กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      let endpoint = '';

      switch (format) {
        case 'csv':
          endpoint = '/financial/report/export/csv';
          break;
        case 'json':
          endpoint = '/financial/report/export/json';
          break;
        case 'excel':
          endpoint = '/financial/tax/report/export/excel';
          break;
        case 'pdf':
          endpoint = '/financial/tax/report/export/pdf';
          break;
        default:
          return;
      }

      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { start_date: startDate, end_date: endDate },
        responseType: format === 'csv' || format === 'json' ? 'blob' : 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial_report_${startDate}_to_${endDate}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting report:', err);
      setError('ไม่สามารถส่งออกรายงานได้');
    }
  };

  return (
    <div className="financial-reports">
      <h1>รายงานทางการเงิน</h1>

      {/* Report Controls */}
      <div className="report-controls">
        <div className="form-row">
          <div className="form-group">
            <label>ประเภทรายงาน:</label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              className="form-control"
            >
              <option value="comprehensive">รายงานครบถ้วน</option>
              <option value="revenue">รายได้</option>
              <option value="profit">กำไร</option>
            </select>
          </div>

          <div className="form-group">
            <label>วันที่เริ่มต้น:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label>วันที่สิ้นสุด:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <button 
              onClick={handleGenerateReport} 
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'กำลังสร้างรายงาน...' : 'สร้างรายงาน'}
            </button>
          </div>
        </div>

        {/* Export Buttons */}
        {reportData && (
          <div className="export-buttons">
            <h3>ส่งออกรายงาน:</h3>
            <button onClick={() => handleExport('csv')} className="btn btn-secondary">
              CSV
            </button>
            <button onClick={() => handleExport('json')} className="btn btn-secondary">
              JSON
            </button>
            <button onClick={() => handleExport('excel')} className="btn btn-secondary">
              Excel
            </button>
            <button onClick={() => handleExport('pdf')} className="btn btn-secondary">
              PDF
            </button>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Report Display */}
      {reportData && reportType === 'comprehensive' && (
        <div className="report-content">
          {/* Period Info */}
          <div className="report-section">
            <h2>ช่วงเวลา</h2>
            <p>{reportData.period.start_date} ถึง {reportData.period.end_date}</p>
          </div>

          {/* Revenue Summary */}
          <div className="report-section">
            <h2>สรุปรายได้</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">คำสั่งซื้อทั้งหมด:</span>
                <span className="value">{reportData.revenue.totals.total_orders}</span>
              </div>
              <div className="summary-item">
                <span className="label">รายได้ไม่รวม VAT:</span>
                <span className="value">฿{parseFloat(reportData.revenue.totals.total_revenue_excluding_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="summary-item">
                <span className="label">VAT ขาย:</span>
                <span className="value">฿{parseFloat(reportData.revenue.totals.total_output_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="summary-item">
                <span className="label">รายได้รวม VAT:</span>
                <span className="value">฿{parseFloat(reportData.revenue.totals.total_revenue_including_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Expense Summary */}
          <div className="report-section">
            <h2>สรุปค่าใช้จ่าย</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">รายการค่าใช้จ่าย:</span>
                <span className="value">{reportData.expenses.totals.total_expense_count}</span>
              </div>
              <div className="summary-item">
                <span className="label">ค่าใช้จ่ายไม่รวม VAT:</span>
                <span className="value">฿{parseFloat(reportData.expenses.totals.total_expenses_excluding_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="summary-item">
                <span className="label">VAT ซื้อ:</span>
                <span className="value">฿{parseFloat(reportData.expenses.totals.total_input_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="summary-item">
                <span className="label">ค่าใช้จ่ายรวม VAT:</span>
                <span className="value">฿{parseFloat(reportData.expenses.totals.total_expenses_including_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Profit Summary */}
          <div className="report-section">
            <h2>สรุปกำไร</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">กำไรขั้นต้น (ไม่รวม VAT):</span>
                <span className="value">฿{parseFloat(reportData.profit.net_profit.gross_profit_excluding_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="summary-item">
                <span className="label">ค่าใช้จ่าย (ไม่รวม VAT):</span>
                <span className="value">฿{parseFloat(reportData.profit.net_profit.total_expenses_excluding_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="summary-item">
                <span className="label">กำไรสุทธิ (ไม่รวม VAT):</span>
                <span className="value profit">฿{parseFloat(reportData.profit.net_profit.net_profit_excluding_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* VAT Summary */}
          <div className="report-section">
            <h2>สรุป VAT</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">VAT ขาย:</span>
                <span className="value">฿{parseFloat(reportData.vat.output_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="summary-item">
                <span className="label">VAT ซื้อ:</span>
                <span className="value">฿{parseFloat(reportData.vat.input_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="summary-item">
                <span className="label">VAT สุทธิที่ต้องชำระ:</span>
                <span className="value vat">฿{parseFloat(reportData.vat.net_vat_payable).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Top Products by Revenue */}
          {reportData.revenue.by_product && reportData.revenue.by_product.length > 0 && (
            <div className="report-section">
              <h2>รายได้ตามสินค้า (Top 10)</h2>
              <div className="table-responsive">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>ชื่อสินค้า</th>
                      <th>จำนวนขาย</th>
                      <th>รายได้ไม่รวม VAT</th>
                      <th>VAT</th>
                      <th>รายได้รวม VAT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.revenue.by_product.slice(0, 10).map((product, index) => (
                      <tr key={index}>
                        <td>{product.product_sku}</td>
                        <td>{product.product_name}</td>
                        <td>{product.total_quantity_sold}</td>
                        <td>฿{parseFloat(product.total_revenue_excluding_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td>฿{parseFloat(product.total_output_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td>฿{parseFloat(product.total_revenue_including_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {reportData && reportType === 'revenue' && (
        <div className="report-content">
          <div className="report-section">
            <h2>สรุปรายได้</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">คำสั่งซื้อทั้งหมด:</span>
                <span className="value">{reportData.totals.total_orders}</span>
              </div>
              <div className="summary-item">
                <span className="label">รายได้ไม่รวม VAT:</span>
                <span className="value">฿{parseFloat(reportData.totals.total_revenue_excluding_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="summary-item">
                <span className="label">VAT:</span>
                <span className="value">฿{parseFloat(reportData.totals.total_output_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="summary-item">
                <span className="label">รายได้รวม VAT:</span>
                <span className="value">฿{parseFloat(reportData.totals.total_revenue_including_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportData && reportType === 'profit' && (
        <div className="report-content">
          <div className="report-section">
            <h2>สรุปกำไร</h2>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="label">รายได้ไม่รวม VAT:</span>
                <span className="value">฿{parseFloat(reportData.totals.total_revenue_excluding_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="summary-item">
                <span className="label">ต้นทุน:</span>
                <span className="value">฿{parseFloat(reportData.totals.total_cost_excluding_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="summary-item">
                <span className="label">กำไร:</span>
                <span className="value profit">฿{parseFloat(reportData.totals.total_profit_excluding_vat).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="summary-item">
                <span className="label">อัตรากำไร:</span>
                <span className="value">{parseFloat(reportData.totals.profit_margin_percentage).toFixed(2)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialReports;
