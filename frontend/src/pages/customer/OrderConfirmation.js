import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import PaymentSlipUpload from '../../components/payment/PaymentSlipUpload';
import PaymentInstructions from '../../components/payment/PaymentInstructions';
import './OrderConfirmation.css';

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadStatus, setUploadStatus] = useState({
    uploaded: false,
    uploading: false,
    error: null
  });

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  useEffect(() => {
    // Debug: Log order data when it changes
    if (order) {
      console.log('=== ORDER DATA DEBUG ===');
      console.log('Order ID:', order.id);
      console.log('Payment Method:', order.payment_method);
      console.log('Payment Method Type:', typeof order.payment_method);
      console.log('Should Show Upload:', shouldShowUploadSection());
      console.log('========================');
    }
  }, [order]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${orderId}`);
      
      console.log('=== API RESPONSE DEBUG ===');
      console.log('Full Response:', response.data);
      console.log('Response.data.data:', response.data.data);
      console.log('Response.data:', response.data);
      console.log('==========================');
      
      if (response.data.success) {
        const orderData = response.data.data;
        console.log('Order Data:', orderData);
        console.log('Payment Method in data:', orderData?.payment_method);
        setOrder(orderData);
      } else if (response.data.order) {
        // Alternative structure
        console.log('Using alternative structure');
        setOrder(response.data.order);
      } else {
        // Fallback: use response.data directly
        console.log('Using response.data directly');
        setOrder(response.data);
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้');
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
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodText = (method) => {
    const methods = {
      credit_card: 'บัตรเครดิต/เดบิต',
      bank_transfer: 'โอนเงินผ่านธนาคาร',
      promptpay: 'พร้อมเพย์',
      cod: 'เก็บเงินปลายทาง'
    };
    return methods[method] || method;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'รอดำเนินการ', class: 'status-pending' },
      confirmed: { text: 'ยืนยันแล้ว', class: 'status-confirmed' },
      processing: { text: 'กำลังเตรียมสินค้า', class: 'status-processing' },
      shipped: { text: 'จัดส่งแล้ว', class: 'status-shipped' },
      delivered: { text: 'ส่งสำเร็จ', class: 'status-delivered' },
      cancelled: { text: 'ยกเลิก', class: 'status-cancelled' }
    };
    return badges[status] || { text: status, class: 'status-default' };
  };

  const handleUploadSuccess = (payment) => {
    setUploadStatus({
      uploaded: true,
      uploading: false,
      error: null
    });
    // Optionally refresh order data to get updated payment info
    fetchOrderDetails();
  };

  const handleUploadError = (error) => {
    setUploadStatus({
      uploaded: false,
      uploading: false,
      error: error.message || 'เกิดข้อผิดพลาดในการอัปโหลด'
    });
  };

  const shouldShowUploadSection = () => {
    if (!order || !order.payment_method) return false;
    
    const method = order.payment_method.toLowerCase();
    console.log('Payment method:', method); // Debug log
    
    return method === 'bank_transfer' || 
           method === 'bank transfer' || 
           method === 'promptpay' || 
           method === 'prompt_pay';
  };

  if (loading) {
    return (
      <div className="order-confirmation-page">
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>กำลังโหลดข้อมูลคำสั่งซื้อ...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-confirmation-page">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>เกิดข้อผิดพลาด</h2>
          <p>{error || 'ไม่พบข้อมูลคำสั่งซื้อ'}</p>
          <button onClick={() => navigate('/')} className="btn-home">
            กลับหน้าหลัก
          </button>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(order.status);

  return (
    <div className="order-confirmation-page">
      <div className="confirmation-container">
        {/* Success Header */}
        <div className="success-header">
          <div className="success-icon">✓</div>
          <h1>สั่งซื้อสำเร็จ!</h1>
          <p className="success-message">
            ขอบคุณสำหรับการสั่งซื้อ คำสั่งซื้อของคุณได้รับการยืนยันแล้ว
          </p>
        </div>

        {/* Order Info Card */}
        <div className="order-info-card">
          <div className="order-header">
            <div className="order-number">
              <span className="label">หมายเลขคำสั่งซื้อ:</span>
              <span className="value">#{order.id}</span>
            </div>
            <div className={`status-badge ${statusBadge.class}`}>
              {statusBadge.text}
            </div>
          </div>

          <div className="order-date">
            <span className="icon">📅</span>
            <span>วันที่สั่งซื้อ: {formatDate(order.created_at)}</span>
          </div>
        </div>

        {/* Order Details */}
        <div className="order-details-grid">
          {/* Shipping Address */}
          <div className="detail-card">
            <h3 className="card-title">
              <span className="icon">📦</span>
              ที่อยู่จัดส่ง
            </h3>
            <div className="card-content">
              <p className="recipient-name">{order.shipping_name}</p>
              <p>{order.shipping_phone}</p>
              <p>{order.shipping_address}</p>
              <p>
                {order.shipping_district} {order.shipping_province} {order.shipping_postal_code}
              </p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="detail-card">
            <h3 className="card-title">
              <span className="icon">💳</span>
              วิธีการชำระเงิน
            </h3>
            <div className="card-content">
              <p className="payment-method">
                {getPaymentMethodText(order.payment_method)}
              </p>
              {order.payment_method === 'bank_transfer' && (
                <div className="payment-instructions">
                  <p className="instruction-title">ข้อมูลการโอนเงิน:</p>
                  <p>ธนาคาร: ธนาคารกสิกรไทย</p>
                  <p>เลขที่บัญชี: 123-4-56789-0</p>
                  <p>ชื่อบัญชี: itkmmshop22 Co., Ltd.</p>
                </div>
              )}
              {order.payment_method === 'promptpay' && (
                <div className="payment-instructions">
                  <p className="instruction-title">พร้อมเพย์:</p>
                  <p>เบอร์โทร: 081-234-5678</p>
                  <p>หรือสแกน QR Code ที่ส่งไปทางอีเมล</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="order-items-card">
          <h3 className="card-title">
            <span className="icon">🛍️</span>
            รายการสินค้า
          </h3>
          
          <div className="items-list">
            {order.items?.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-details">
                  <p className="item-name">{item.product_name}</p>
                  <p className="item-quantity">จำนวน: {item.quantity} ชิ้น</p>
                  <p className="item-price">
                    ฿{formatPrice(item.unit_price_including_vat)} / ชิ้น
                  </p>
                </div>
                <div className="item-total">
                  ฿{formatPrice(item.line_total_including_vat)}
                </div>
              </div>
            ))}
          </div>

          <div className="order-summary">
            <div className="summary-row">
              <span>ยอดรวม (ไม่รวม VAT):</span>
              <span>฿{formatPrice(order.subtotal_excluding_vat)}</span>
            </div>

            <div className="summary-row vat-row">
              <span>VAT 7%:</span>
              <span>฿{formatPrice(order.total_vat)}</span>
            </div>

            {order.discount_amount > 0 && (
              <div className="summary-row discount-row">
                <span>ส่วนลด:</span>
                <span>-฿{formatPrice(order.discount_amount)}</span>
              </div>
            )}

            <div className="summary-divider"></div>

            <div className="summary-row total-row">
              <span>ยอดรวมทั้งหมด:</span>
              <span className="total-amount">
                ฿{formatPrice(order.total_amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="notes-card">
            <h3 className="card-title">
              <span className="icon">📝</span>
              หมายเหตุ
            </h3>
            <p className="notes-content">{order.notes}</p>
          </div>
        )}

        {/* Payment Instructions and Upload Section */}
        {shouldShowUploadSection() && (
          <div className="payment-section">
            <PaymentInstructions 
              paymentMethod={order.payment_method}
              orderAmount={order.total_amount}
            />
            
            <div className="upload-section">
              <PaymentSlipUpload
                orderId={order.id}
                orderAmount={order.total_amount}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                showInstructions={true}
              />
              
              {!uploadStatus.uploaded && (
                <div className="skip-upload-section">
                  <p className="skip-text">
                    💡 คุณสามารถข้ามขั้นตอนนี้และอัปโหลดสลิปทีหลังได้
                  </p>
                  <button
                    onClick={() => navigate(`/track-order?orderId=${order.id}`)}
                    className="btn btn-skip"
                  >
                    ข้ามไปก่อน อัปโหลดทีหลังได้
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Debug: Show payment method if upload section is not showing */}
        {!shouldShowUploadSection() && order.payment_method && (
          <div className="payment-info-notice">
            <p>
              💳 วิธีการชำระเงิน: {getPaymentMethodText(order.payment_method)}
            </p>
            {(order.payment_method === 'cod' || order.payment_method === 'cash') && (
              <p className="info-text">
                ✓ คุณเลือกชำระเงินปลายทาง ไม่จำเป็นต้องอัปโหลดสลิป
              </p>
            )}
            {order.payment_method !== 'cod' && order.payment_method !== 'cash' && (
              <div className="debug-info">
                <p className="error-text">
                  ⚠️ ช่องอัปโหลดสลิปไม่แสดง
                </p>
                <p className="debug-text">
                  Payment Method: "{order.payment_method}"
                </p>
                <p className="info-text">
                  💡 คุณสามารถอัปโหลดสลิปได้ที่หน้า "ติดตามคำสั่งซื้อ"
                </p>
                <button
                  onClick={() => navigate(`/track-order?orderId=${order.id}`)}
                  className="btn btn-primary"
                  style={{ marginTop: '1rem' }}
                >
                  ไปหน้าติดตามคำสั่งซื้อ
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            onClick={() => navigate('/track-order')}
            className="btn btn-primary"
          >
            ติดตามคำสั่งซื้อ
          </button>
          <button
            onClick={() => navigate('/products')}
            className="btn btn-secondary"
          >
            เลือกซื้อสินค้าต่อ
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn btn-outline"
          >
            กลับหน้าหลัก
          </button>
        </div>

        {/* Additional Info */}
        <div className="additional-info">
          <p>📧 ข้อมูลคำสั่งซื้อได้ถูกส่งไปยังอีเมลของคุณแล้ว</p>
          <p>📞 หากมีข้อสงสัย กรุณาติดต่อ: 02-123-4567</p>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
