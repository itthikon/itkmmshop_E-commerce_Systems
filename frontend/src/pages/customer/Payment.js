import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import CheckoutStepper from '../../components/customer/CheckoutStepper';
import './Payment.css';

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [uploadingSlip, setUploadingSlip] = useState(false);
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    fetchOrder();
    generateQRCode();
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ');
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    try {
      const response = await api.post('/payments/generate-qr', {
        order_id: orderId
      });
      setQrCodeUrl(response.data.qr_code_url);
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }
      
      setSlipFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSlip = async () => {
    if (!slipFile) {
      alert('กรุณาเลือกไฟล์สลิปการโอนเงิน');
      return;
    }
    
    setUploadingSlip(true);
    setUploadMessage('');
    
    try {
      const formData = new FormData();
      formData.append('slip', slipFile);
      formData.append('order_id', orderId);
      
      const response = await api.post('/payments/upload-slip', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setUploadMessage('อัปโหลดสลิปเรียบร้อยแล้ว กำลังตรวจสอบการชำระเงิน...');
      
      // Wait a bit then navigate to order tracking
      setTimeout(() => {
        navigate(`/track-order/${orderId}`);
      }, 2000);
    } catch (err) {
      setUploadMessage(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดสลิป');
    } finally {
      setUploadingSlip(false);
    }
  };

  if (loading) {
    return <div className="loading">กำลังโหลด...</div>;
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

  return (
    <div className="payment-page">
      <CheckoutStepper currentStep={4} />

      <div className="payment-content">
        <div className="payment-main">
          <h2 className="payment-title">ชำระเงิน</h2>
          
          <div className="payment-info-card">
            <div className="info-row">
              <span className="info-label">เลขที่คำสั่งซื้อ:</span>
              <span className="info-value">{order.order_number}</span>
            </div>
            
            <div className="info-row total-row">
              <span className="info-label">ยอดที่ต้องชำระ:</span>
              <span className="info-value total-value">
                ฿{formatPrice(order.total_amount)}
              </span>
            </div>
          </div>

          <div className="payment-method-section">
            <h3>วิธีการชำระเงิน</h3>
            
            <div className="bank-transfer-section">
              <h4>โอนเงินผ่านธนาคาร</h4>
              
              <div className="bank-details">
                <div className="bank-info">
                  <p><strong>ธนาคาร:</strong> ธนาคารกสิกรไทย</p>
                  <p><strong>ชื่อบัญชี:</strong> itkmmshop</p>
                  <p><strong>เลขที่บัญชี:</strong> 123-4-56789-0</p>
                </div>
                
                {qrCodeUrl && (
                  <div className="qr-code-section">
                    <p className="qr-label">สแกน QR Code เพื่อชำระเงิน</p>
                    <div className="qr-code-container">
                      <img src={qrCodeUrl} alt="PromptPay QR Code" className="qr-code-image" />
                    </div>
                    <p className="qr-note">ใช้แอปธนาคารสแกน QR Code นี้</p>
                  </div>
                )}
              </div>
            </div>

            <div className="slip-upload-section">
              <h4>อัปโหลดสลิปการโอนเงิน</h4>
              
              <div className="upload-area">
                {slipPreview ? (
                  <div className="slip-preview">
                    <img src={slipPreview} alt="Slip Preview" />
                    <button 
                      onClick={() => {
                        setSlipFile(null);
                        setSlipPreview(null);
                      }}
                      className="remove-slip-btn"
                    >
                      ✕ เปลี่ยนรูป
                    </button>
                  </div>
                ) : (
                  <label className="upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="file-input"
                    />
                    <div className="upload-placeholder">
                      <span className="upload-icon">📷</span>
                      <span className="upload-text">คลิกเพื่อเลือกรูปสลิป</span>
                      <span className="upload-hint">รองรับไฟล์ JPG, PNG (ไม่เกิน 5MB)</span>
                    </div>
                  </label>
                )}
              </div>

              <button
                onClick={handleUploadSlip}
                disabled={!slipFile || uploadingSlip}
                className="upload-slip-btn"
              >
                {uploadingSlip ? 'กำลังอัปโหลด...' : 'อัปโหลดสลิป'}
              </button>

              {uploadMessage && (
                <div className={`upload-message ${uploadMessage.includes('เรียบร้อย') ? 'success' : 'error'}`}>
                  {uploadMessage}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="payment-summary">
          <h3>สรุปคำสั่งซื้อ</h3>
          
          <div className="summary-details-payment">
            <div className="summary-line-payment">
              <span>ยอดรวม (ไม่รวม VAT):</span>
              <span>฿{formatPrice(order.subtotal_excluding_vat)}</span>
            </div>
            
            <div className="summary-line-payment vat-line-payment">
              <span>VAT 7%:</span>
              <span>฿{formatPrice(order.total_vat_amount)}</span>
            </div>
            
            {order.discount_amount > 0 && (
              <div className="summary-line-payment discount-line-payment">
                <span>ส่วนลด:</span>
                <span>-฿{formatPrice(order.discount_amount)}</span>
              </div>
            )}
            
            {order.shipping_cost > 0 && (
              <div className="summary-line-payment">
                <span>ค่าจัดส่ง:</span>
                <span>฿{formatPrice(order.shipping_cost)}</span>
              </div>
            )}
            
            <div className="summary-line-payment total-line-payment">
              <span>ยอดรวมทั้งหมด:</span>
              <span className="total-amount-payment">
                ฿{formatPrice(order.total_amount)}
              </span>
            </div>
          </div>

          <div className="payment-instructions">
            <h4>ขั้นตอนการชำระเงิน</h4>
            <ol>
              <li>โอนเงินตามจำนวนที่ระบุ</li>
              <li>ถ่ายภาพหรือบันทึกสลิปการโอนเงิน</li>
              <li>อัปโหลดสลิปในหน้านี้</li>
              <li>รอการตรวจสอบจากระบบ</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
