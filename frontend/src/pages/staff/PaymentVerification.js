import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import PaymentSlipViewer from '../../components/payment/PaymentSlipViewer';
import './PaymentVerification.css';

const PaymentVerification = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    status: 'pending',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  // Fetch payments based on filters
  const fetchPayments = async () => {
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
      
      const response = await api.get(`/payments?${params.toString()}`);
      setPayments(response.data.payments || []);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message || 'ไม่สามารถโหลดข้อมูลการชำระเงินได้');
    } finally {
      setLoading(false);
    }
  };

  // Fetch payments on mount and when filters change
  useEffect(() => {
    fetchPayments();
  }, [filters.status, filters.dateFrom, filters.dateTo]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.search !== undefined) {
        fetchPayments();
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

  // Handle verify action
  const handleVerify = async (paymentId) => {
    try {
      await api.post(`/payments/${paymentId}/verify-slip`);
      setShowViewer(false);
      setSelectedPayment(null);
      fetchPayments(); // Refresh list
      alert('ยืนยันการชำระเงินสำเร็จ');
    } catch (err) {
      console.error('Error verifying payment:', err);
      throw err; // Let PaymentSlipViewer handle the error
    }
  };

  // Handle reject action
  const handleReject = async (paymentId, reason) => {
    try {
      await api.post(`/payments/${paymentId}/confirm`, {
        verified: false,
        rejection_reason: reason
      });
      setShowViewer(false);
      setSelectedPayment(null);
      fetchPayments(); // Refresh list
      alert('ปฏิเสธการชำระเงินสำเร็จ');
    } catch (err) {
      console.error('Error rejecting payment:', err);
      throw err; // Let PaymentSlipViewer handle the error
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
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

  // Check if payment is new (uploaded within last 24 hours)
  const isNewPayment = (uploadDate) => {
    const now = new Date();
    const uploaded = new Date(uploadDate);
    const hoursDiff = (now - uploaded) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  return (
    <div className="payment-verification">
      <div className="page-header">
        <h1>💳 ตรวจสอบสลิปการชำระเงิน</h1>
        <p>ตรวจสอบและยืนยันสลิปการโอนเงินจากลูกค้า</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
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
          <label>ค้นหา:</label>
          <input
            type="text"
            placeholder="เลขที่คำสั่งซื้อ หรือ ชื่อลูกค้า"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="filter-input"
          />
        </div>

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
            <button onClick={fetchPayments} className="retry-button">
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : payments.length === 0 ? (
          <div className="empty-state">
            <p>ไม่พบข้อมูลการชำระเงิน</p>
          </div>
        ) : (
          <div className="payments-grid">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className={`payment-card ${isNewPayment(payment.created_at) ? 'new-payment' : ''}`}
                onClick={() => handlePaymentClick(payment)}
              >
                <div className="payment-thumbnail">
                  {payment.slip_image_path ? (
                    <img
                      src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5050'}${payment.slip_image_path}`}
                      alt="Payment Slip"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="no-image">ไม่มีรูปภาพ</div>
                  )}
                  {isNewPayment(payment.created_at) && (
                    <span className="new-badge">ใหม่</span>
                  )}
                </div>

                <div className="payment-info">
                  <div className="payment-header">
                    <span className="order-number">
                      คำสั่งซื้อ #{payment.order_number || payment.order_id}
                    </span>
                    <span className={getStatusBadgeClass(payment.status)}>
                      {getStatusText(payment.status)}
                    </span>
                  </div>

                  <div className="payment-details">
                    <div className="detail-row">
                      <span className="label">ลูกค้า:</span>
                      <span className="value">{payment.customer_name || 'ไม่ระบุ'}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">จำนวนเงิน:</span>
                      <span className="value amount">{formatAmount(payment.amount)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">อัปโหลดเมื่อ:</span>
                      <span className="value">{formatDate(payment.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
          onVerify={handleVerify}
          onReject={handleReject}
          isStaff={true}
        />
      )}
    </div>
  );
};

export default PaymentVerification;
