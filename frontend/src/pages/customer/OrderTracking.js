import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import PaymentSlipUpload from '../../components/payment/PaymentSlipUpload';
import PaymentSlipViewer from '../../components/payment/PaymentSlipViewer';
import './OrderTracking.css';

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Payment slip state
  const [payment, setPayment] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showSlipViewer, setShowSlipViewer] = useState(false);
  
  // For guest tracking
  const [trackingOrderNumber, setTrackingOrderNumber] = useState('');
  const [trackingContact, setTrackingContact] = useState('');
  const [trackingError, setTrackingError] = useState('');

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    } else {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (order && (order.payment_method === 'bank_transfer' || order.payment_method === 'promptpay')) {
      fetchPaymentData();
    }
  }, [order]);

  const fetchOrder = async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data.order);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ');
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentData = async () => {
    if (!order || !order.id) return;
    
    setPaymentLoading(true);
    try {
      const response = await api.get(`/payments/order/${order.id}`);
      if (response.data.success && response.data.payment) {
        setPayment(response.data.payment);
      }
    } catch (err) {
      console.error('Error fetching payment:', err);
      // Don't show error if payment doesn't exist yet
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleGuestTracking = async (e) => {
    e.preventDefault();
    setTrackingError('');
    
    if (!trackingOrderNumber || !trackingContact) {
      setTrackingError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/orders/track', {
        order_number: trackingOrderNumber,
        contact: trackingContact
      });
      
      setOrder(response.data.order);
    } catch (err) {
      setTrackingError(err.message || 'ไม่พบคำสั่งซื้อ กรุณาตรวจสอบข้อมูลอีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: 'รอชำระเงิน', color: '#ffc107', icon: '⏳' },
      paid: { label: 'ชำระเงินแล้ว', color: '#28a745', icon: '✓' },
      packing: { label: 'กำลังจัดเตรียม', color: '#17a2b8', icon: '📦' },
      packed: { label: 'จัดเตรียมเสร็จสิ้น', color: '#007bff', icon: '✓' },
      shipped: { label: 'จัดส่งแล้ว', color: '#6f42c1', icon: '🚚' },
      delivered: { label: 'จัดส่งสำเร็จ', color: '#28a745', icon: '✓' },
      cancelled: { label: 'ยกเลิก', color: '#dc3545', icon: '✕' }
    };
    
    return statusMap[status] || { label: status, color: '#6c757d', icon: '?' };
  };

  const getOrderTimeline = (status) => {
    const allStatuses = ['pending', 'paid', 'packing', 'packed', 'shipped', 'delivered'];
    const currentIndex = allStatuses.indexOf(status);
    
    return allStatuses.map((s, index) => ({
      status: s,
      ...getStatusInfo(s),
      completed: index <= currentIndex,
      current: index === currentIndex
    }));
  };

  const handleViewReceipt = () => {
    window.open(`/api/payments/${order.id}/receipt`, '_blank');
  };

  const handleUploadSuccess = (newPayment) => {
    setPayment(newPayment);
    fetchOrder(order.id); // Refresh order data
  };

  const handleUploadError = (error) => {
    console.error('Upload error:', error);
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      pending: { text: 'รอตรวจสอบ', class: 'payment-status-pending', icon: '⏳' },
      verified: { text: 'ยืนยันแล้ว', class: 'payment-status-verified', icon: '✓' },
      rejected: { text: 'ปฏิเสธ', class: 'payment-status-rejected', icon: '✕' }
    };
    return badges[status] || { text: status, class: 'payment-status-default', icon: '?' };
  };

  const shouldShowPaymentSection = () => {
    return order && (order.payment_method === 'bank_transfer' || order.payment_method === 'promptpay');
  };

  if (loading) {
    return <div className="loading">กำลังโหลด...</div>;
  }

  // Guest tracking form
  if (!order && !orderId) {
    return (
      <div className="order-tracking-page">
        <div className="tracking-form-container">
          <h1>ติดตามคำสั่งซื้อ</h1>
          <p className="tracking-subtitle">กรอกข้อมูลเพื่อตรวจสอบสถานะคำสั่งซื้อของคุณ</p>
          
          <form onSubmit={handleGuestTracking} className="tracking-form">
            <div className="form-group-tracking">
              <label>เลขที่คำสั่งซื้อ</label>
              <input
                type="text"
                value={trackingOrderNumber}
                onChange={(e) => setTrackingOrderNumber(e.target.value)}
                placeholder="ORD-XXXXXX"
                required
              />
            </div>
            
            <div className="form-group-tracking">
              <label>เบอร์โทรศัพท์หรืออีเมล</label>
              <input
                type="text"
                value={trackingContact}
                onChange={(e) => setTrackingContact(e.target.value)}
                placeholder="0812345678 หรือ email@example.com"
                required
              />
            </div>
            
            {trackingError && (
              <div className="tracking-error">{trackingError}</div>
            )}
            
            <button type="submit" className="tracking-submit-btn">
              ตรวจสอบสถานะ
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="error-message">
        <p>{error || 'ไม่พบคำสั่งซื้อ'}</p>
        <button onClick={() => navigate('/')} className="back-button">
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const timeline = getOrderTimeline(order.status);

  return (
    <div className="order-tracking-page">
      <div className="tracking-header">
        <h1>คำสั่งซื้อ #{order.order_number}</h1>
        <div className="order-status-badge" style={{ background: statusInfo.color }}>
          {statusInfo.icon} {statusInfo.label}
        </div>
      </div>

      <div className="tracking-content">
        <div className="tracking-main">
          {/* Timeline */}
          <div className="order-timeline-section">
            <h2>สถานะคำสั่งซื้อ</h2>
            <div className="order-timeline">
              {timeline.map((step, index) => (
                <div 
                  key={step.status}
                  className={`timeline-step ${step.completed ? 'completed' : ''} ${step.current ? 'current' : ''}`}
                >
                  <div className="timeline-icon" style={{ 
                    background: step.completed ? step.color : '#e9ecef',
                    color: step.completed ? 'white' : '#6c757d'
                  }}>
                    {step.icon}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-label">{step.label}</div>
                    {step.current && (
                      <div className="timeline-date">{formatDate(order.updated_at)}</div>
                    )}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className={`timeline-connector ${step.completed ? 'completed' : ''}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tracking Number */}
          {order.tracking_number && (
            <div className="tracking-number-section">
              <h3>เลขพัสดุ</h3>
              <div className="tracking-number-display">
                <span className="tracking-number">{order.tracking_number}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(order.tracking_number)}
                  className="copy-btn"
                  title="คัดลอก"
                >
                  📋
                </button>
              </div>
            </div>
          )}

          {/* Packing Media */}
          {order.packing_media_url && (
            <div className="packing-media-section">
              <h3>รูปภาพการจัดส่ง</h3>
              <img src={order.packing_media_url} alt="Packing" className="packing-image" />
            </div>
          )}

          {/* Order Items */}
          <div className="order-items-section">
            <h3>รายการสินค้า</h3>
            <div className="order-items-list">
              {order.items && order.items.map(item => (
                <div key={item.id} className="order-item-row">
                  <div className="item-info">
                    <span className="item-name">{item.product_name}</span>
                    <span className="item-qty">x {item.quantity}</span>
                  </div>
                  <div className="item-price">
                    ฿{formatPrice(item.line_total_including_vat)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Section */}
          {shouldShowPaymentSection() && (
            <div className="payment-section-tracking">
              <h3>การชำระเงิน</h3>
              
              {paymentLoading ? (
                <div className="payment-loading">
                  <div className="spinner-small"></div>
                  <span>กำลังโหลดข้อมูลการชำระเงิน...</span>
                </div>
              ) : payment && payment.slip_image_path ? (
                /* Has payment slip */
                <div className="payment-slip-display">
                  <div className="slip-thumbnail-container">
                    <img 
                      src={`${process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5050'}${payment.slip_image_path}`}
                      alt="Payment slip"
                      className="slip-thumbnail"
                      onClick={() => setShowSlipViewer(true)}
                    />
                    <button 
                      className="view-full-btn"
                      onClick={() => setShowSlipViewer(true)}
                    >
                      🔍 ดูเต็มขนาด
                    </button>
                  </div>
                  
                  <div className="payment-status-info">
                    <div className={`payment-status-badge ${getPaymentStatusBadge(payment.status).class}`}>
                      {getPaymentStatusBadge(payment.status).icon} {getPaymentStatusBadge(payment.status).text}
                    </div>
                    
                    {payment.status === 'verified' && payment.verified_at && (
                      <p className="payment-verified-info">
                        ✓ ยืนยันเมื่อ: {formatDate(payment.verified_at)}
                      </p>
                    )}
                    
                    {payment.status === 'rejected' && (
                      <div className="payment-rejected-info">
                        <p className="rejection-reason">
                          <strong>เหตุผลที่ปฏิเสธ:</strong> {payment.rejection_reason || 'ไม่ระบุ'}
                        </p>
                        <p className="reupload-instruction">
                          กรุณาอัปโหลดสลิปใหม่ด้านล่าง
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Allow re-upload if rejected */}
                  {payment.status === 'rejected' && (
                    <div className="reupload-section">
                      <PaymentSlipUpload
                        orderId={order.id}
                        orderAmount={order.total_amount}
                        onUploadSuccess={handleUploadSuccess}
                        onUploadError={handleUploadError}
                        showInstructions={false}
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* No payment slip yet */
                <div className="no-payment-slip">
                  <p className="no-slip-message">
                    📤 ยังไม่ได้อัปโหลดสลิปการโอนเงิน
                  </p>
                  <PaymentSlipUpload
                    orderId={order.id}
                    orderAmount={order.total_amount}
                    onUploadSuccess={handleUploadSuccess}
                    onUploadError={handleUploadError}
                    showInstructions={true}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="tracking-sidebar">
          {/* Order Summary */}
          <div className="order-summary-card">
            <h3>สรุปคำสั่งซื้อ</h3>
            
            <div className="summary-details-tracking">
              <div className="summary-row-tracking">
                <span>ยอดรวม (ไม่รวม VAT):</span>
                <span>฿{formatPrice(order.subtotal_excluding_vat)}</span>
              </div>
              
              <div className="summary-row-tracking vat-row-tracking">
                <span>VAT 7%:</span>
                <span>฿{formatPrice(order.total_vat_amount)}</span>
              </div>
              
              {order.discount_amount > 0 && (
                <div className="summary-row-tracking discount-row-tracking">
                  <span>ส่วนลด:</span>
                  <span>-฿{formatPrice(order.discount_amount)}</span>
                </div>
              )}
              
              {order.shipping_cost > 0 && (
                <div className="summary-row-tracking">
                  <span>ค่าจัดส่ง:</span>
                  <span>฿{formatPrice(order.shipping_cost)}</span>
                </div>
              )}
              
              <div className="summary-row-tracking total-row-tracking">
                <span>ยอดรวมทั้งหมด:</span>
                <span className="total-amount-tracking">
                  ฿{formatPrice(order.total_amount)}
                </span>
              </div>
            </div>

            {order.payment_status === 'paid' && (
              <button onClick={handleViewReceipt} className="view-receipt-btn">
                ดูใบเสร็จ
              </button>
            )}
          </div>

          {/* Shipping Address */}
          <div className="shipping-address-card">
            <h3>ที่อยู่จัดส่ง</h3>
            <div className="address-content">
              <p><strong>{order.guest_name || order.user_name}</strong></p>
              <p>{order.guest_phone || order.user_phone}</p>
              <p>{order.shipping_address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Slip Viewer Modal */}
      {showSlipViewer && payment && (
        <PaymentSlipViewer
          payment={payment}
          order={order}
          onClose={() => setShowSlipViewer(false)}
          isStaff={false}
        />
      )}
    </div>
  );
};

export default OrderTracking;
