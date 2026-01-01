import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import PaymentSlipViewer from '../../components/payment/PaymentSlipViewer';
import './PaymentHistory.css';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    dateFrom: '',
    dateTo: '',
    paymentMethod: 'all',
    amountMin: '',
    amountMax: ''
  });

  // Statistics state
  const [statistics, setStatistics] = useState({
    totalVerified: 0,
    totalRejected: 0,
    totalPending: 0,
    totalAmount: 0
  });

  // Fetch payments based on filters
  const fetchPayments = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.dateFrom) {
        params.append('dateFrom', filters.dateFrom);
      }
      if (filters.dateTo) {
        params.append('dateTo', filters.dateTo);
      }
      if (filters.paymentMethod && filters.paymentMethod !== 'all') {
        params.append('paymentMethod', filters.paymentMethod);
      }
      if (filters.amountMin) {
        params.append('amountMin', filters.amountMin);
      }
      if (filters.amountMax) {
        params.append('amountMax', filters.amountMax);
      }
      params.append('page', page);
      params.append('limit', itemsPerPage);
      
      const response = await api.get(`/payments?${params.toString()}`);
      const paymentsData = response.data.payments || [];
      setPayments(paymentsData);
      
      // Calculate pagination
      const total = response.data.total || paymentsData.length;
      setTotalCount(total);
      setTotalPages(Math.ceil(total / itemsPerPage));
      setCurrentPage(page);
      
      // Calculate statistics
      calculateStatistics(paymentsData);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'ไม่สามารถโหลดข้อมูลการชำระเงินได้');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics from payments
  const calculateStatistics = (paymentsData) => {
    const stats = {
      totalVerified: 0,
      totalRejected: 0,
      totalPending: 0,
      totalAmount: 0
    };

    paymentsData.forEach(payment => {
      if (payment.status === 'verified') {
        stats.totalVerified++;
        stats.totalAmount += parseFloat(payment.amount || 0);
      } else if (payment.status === 'rejected') {
        stats.totalRejected++;
      } else if (payment.status === 'pending') {
        stats.totalPending++;
      }
    });

    setStatistics(stats);
  };

  // Fetch payments on mount and when filters change
  useEffect(() => {
    fetchPayments(1);
  }, [filters.status, filters.dateFrom, filters.dateTo, filters.paymentMethod, filters.amountMin, filters.amountMax]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== undefined) {
        fetchPayments(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.search]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchPayments(newPage);
    }
  };

  // Handle payment item click
  const handlePaymentClick = async (payment) => {
    try {
      // Fetch full payment details including order info
      const response = await api.get(`/payments/${payment.id}`);
      setSelectedPayment(response.data);
      setShowViewer(true);
    } catch (err) {
      console.error('Error fetching payment details:', err);
      alert('ไม่สามารถโหลดรายละเอียดการชำระเงินได้');
    }
  };

  // Export to CSV function
  const exportToCSV = () => {
    try {
      setExporting(true);
      
      // Define CSV headers
      const headers = [
        'เลขที่คำสั่งซื้อ',
        'ชื่อลูกค้า',
        'จำนวนเงิน',
        'สถานะ',
        'วิธีการชำระเงิน',
        'วันที่อัปโหลด',
        'วันที่ยืนยัน',
        'ผู้ยืนยัน',
        'หมายเหตุ'
      ];
      
      // Convert payments to CSV rows
      const rows = payments.map(payment => [
        payment.order_number || payment.order_id,
        payment.customer_name || 'ไม่ระบุ',
        payment.amount,
        getStatusText(payment.status),
        getPaymentMethodText(payment.payment_method),
        formatDateForCSV(payment.created_at),
        payment.verified_at ? formatDateForCSV(payment.verified_at) : '-',
        payment.verifier_name || '-',
        payment.rejection_reason || payment.notes || '-'
      ]);
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Add BOM for UTF-8 encoding (for Excel compatibility)
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      link.setAttribute('href', url);
      link.setAttribute('download', `payments_export_${today}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('ส่งออกข้อมูลสำเร็จ');
    } catch (err) {
      console.error('Error exporting CSV:', err);
      alert('ไม่สามารถส่งออกข้อมูลได้');
    } finally {
      setExporting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date for CSV
  const formatDateForCSV = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format amount
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-badge status-pending';
      case 'verified':
        return 'status-badge status-verified';
      case 'rejected':
        return 'status-badge status-rejected';
      default:
        return 'status-badge';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'รอตรวจสอบ';
      case 'verified':
        return 'ยืนยันแล้ว';
      case 'rejected':
        return 'ปฏิเสธ';
      default:
        return status;
    }
  };

  // Get payment method text
  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'bank_transfer':
        return 'โอนเงินผ่านธนาคาร';
      case 'promptpay':
        return 'พร้อมเพย์';
      case 'cash':
        return 'เงินสด';
      case 'cod':
        return 'เก็บเงินปลายทาง';
      default:
        return method || '-';
    }
  };

  return (
    <div className="payment-history">
      <div className="page-header">
        <h1>📊 ประวัติการชำระเงิน</h1>
        <p>ดูประวัติและรายงานการชำระเงินทั้งหมด</p>
      </div>

      {/* Statistics Dashboard */}
      <div className="statistics-dashboard">
        <div className="stat-card stat-verified">
          <div className="stat-icon">✓</div>
          <div className="stat-content">
            <div className="stat-label">ยืนยันแล้ว</div>
            <div className="stat-value">{statistics.totalVerified}</div>
          </div>
        </div>

        <div className="stat-card stat-rejected">
          <div className="stat-icon">✕</div>
          <div className="stat-content">
            <div className="stat-label">ปฏิเสธ</div>
            <div className="stat-value">{statistics.totalRejected}</div>
          </div>
        </div>

        <div className="stat-card stat-pending">
          <div className="stat-icon">⏱</div>
          <div className="stat-content">
            <div className="stat-label">รอตรวจสอบ</div>
            <div className="stat-value">{statistics.totalPending}</div>
          </div>
        </div>

        <div className="stat-card stat-amount">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">ยอดรวมที่ยืนยัน</div>
            <div className="stat-value">{formatAmount(statistics.totalAmount)}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>สถานะ:</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="all">ทั้งหมด</option>
              <option value="pending">รอตรวจสอบ</option>
              <option value="verified">ยืนยันแล้ว</option>
              <option value="rejected">ปฏิเสธ</option>
            </select>
          </div>

          <div className="filter-group">
            <label>วิธีการชำระเงิน:</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="filter-select"
            >
              <option value="all">ทั้งหมด</option>
              <option value="bank_transfer">โอนเงินผ่านธนาคาร</option>
              <option value="promptpay">พร้อมเพย์</option>
              <option value="cash">เงินสด</option>
              <option value="cod">เก็บเงินปลายทาง</option>
            </select>
          </div>

          <div className="filter-group">
            <label>ค้นหา:</label>
            <input
              type="text"
              placeholder="เลขที่คำสั่งซื้อ หรือ ชื่อลูกค้า"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="filter-input"
            />
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label>วันที่เริ่มต้น:</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>วันที่สิ้นสุด:</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>จำนวนเงินต่ำสุด:</label>
            <input
              type="number"
              placeholder="0"
              value={filters.amountMin}
              onChange={(e) => handleFilterChange('amountMin', e.target.value)}
              className="filter-input"
              min="0"
            />
          </div>

          <div className="filter-group">
            <label>จำนวนเงินสูงสุด:</label>
            <input
              type="number"
              placeholder="ไม่จำกัด"
              value={filters.amountMax}
              onChange={(e) => handleFilterChange('amountMax', e.target.value)}
              className="filter-input"
              min="0"
            />
          </div>
        </div>

        <div className="filters-actions">
          <button
            onClick={exportToCSV}
            className="export-button"
            disabled={exporting || payments.length === 0}
          >
            {exporting ? '⏳ กำลังส่งออก...' : '📥 Export to CSV'}
          </button>
        </div>
      </div>

      {/* Payment List */}
      <div className="payments-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button onClick={() => fetchPayments(currentPage)} className="retry-button">
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <p>ไม่พบข้อมูลการชำระเงิน</p>
          </div>
        ) : (
          <>
            <div className="payments-table-container">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>เลขที่คำสั่งซื้อ</th>
                    <th>ลูกค้า</th>
                    <th>จำนวนเงิน</th>
                    <th>วิธีการชำระเงิน</th>
                    <th>สถานะ</th>
                    <th>วันที่อัปโหลด</th>
                    <th>วันที่ยืนยัน</th>
                    <th>ผู้ยืนยัน</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="order-number">
                        #{payment.order_number || payment.order_id}
                      </td>
                      <td>{payment.customer_name || 'ไม่ระบุ'}</td>
                      <td className="amount">{formatAmount(payment.amount)}</td>
                      <td>{getPaymentMethodText(payment.payment_method)}</td>
                      <td>
                        <span className={getStatusBadgeClass(payment.status)}>
                          {getStatusText(payment.status)}
                        </span>
                      </td>
                      <td>{formatDate(payment.created_at)}</td>
                      <td>{formatDate(payment.verified_at)}</td>
                      <td>{payment.verifier_name || '-'}</td>
                      <td>
                        <button
                          onClick={() => handlePaymentClick(payment)}
                          className="view-button"
                        >
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  ← ก่อนหน้า
                </button>
                
                <div className="pagination-info">
                  หน้า {currentPage} จาก {totalPages} ({totalCount} รายการ)
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  ถัดไป →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment Slip Viewer Modal */}
      {showViewer && selectedPayment && (
        <PaymentSlipViewer
          payment={selectedPayment}
          order={selectedPayment.order}
          onClose={() => {
            setShowViewer(false);
            setSelectedPayment(null);
          }}
          isStaff={false}
        />
      )}
    </div>
  );
};

export default PaymentHistory;
