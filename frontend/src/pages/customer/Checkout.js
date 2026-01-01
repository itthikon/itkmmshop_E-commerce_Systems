import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import api from '../../config/api';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartData, cartCount, clearCart } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    // Shipping address
    shipping_name: '',
    shipping_phone: '',
    shipping_address: '',
    shipping_district: '',
    shipping_province: '',
    shipping_postal_code: '',
    
    // Payment method
    payment_method: 'bank_transfer',
    
    // Voucher
    voucher_code: '',
    
    // Notes
    notes: ''
  });

  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState(null);

  useEffect(() => {
    // Redirect if cart is empty
    if (cartCount === 0) {
      navigate('/cart');
    }
  }, [cartCount, navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyVoucher = async () => {
    if (!formData.voucher_code.trim()) {
      setVoucherError('กรุณากรอกรหัสคูปอง');
      return;
    }

    setVoucherLoading(true);
    setVoucherError(null);

    try {
      const response = await api.post('/cart/voucher/apply', {
        voucher_code: formData.voucher_code
      });

      if (response.data.success) {
        setVoucherApplied(true);
        alert('ใช้คูปองสำเร็จ!');
      }
    } catch (err) {
      setVoucherError(err.response?.data?.error || 'ไม่สามารถใช้คูปองได้');
    } finally {
      setVoucherLoading(false);
    }
  };

  const handleRemoveVoucher = async () => {
    try {
      await api.delete('/cart/voucher/remove');
      setVoucherApplied(false);
      setFormData(prev => ({ ...prev, voucher_code: '' }));
      alert('ลบคูปองสำเร็จ');
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบคูปอง');
    }
  };

  const validateForm = () => {
    const required = [
      'shipping_name',
      'shipping_phone',
      'shipping_address',
      'shipping_district',
      'shipping_province',
      'shipping_postal_code'
    ];

    for (const field of required) {
      if (!formData[field].trim()) {
        return false;
      }
    }

    // Validate phone number (10 digits)
    if (!/^\d{10}$/.test(formData.shipping_phone)) {
      setError('เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก');
      return false;
    }

    // Validate postal code (5 digits)
    if (!/^\d{5}$/.test(formData.shipping_postal_code)) {
      setError('รหัสไปรษณีย์ต้องเป็นตัวเลข 5 หลัก');
      return false;
    }

    return true;
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setLoading(true);

    try {
      // Get cart ID from cartData
      if (!cartData || !cartData.id) {
        setError('ไม่พบข้อมูลตะกร้าสินค้า');
        setLoading(false);
        return;
      }

      // Format shipping address as single string
      const fullAddress = `${formData.shipping_address}, ${formData.shipping_district}, ${formData.shipping_province} ${formData.shipping_postal_code}`;

      // Create order
      const orderResponse = await api.post('/orders', {
        cart_id: cartData.id,
        payment_method: formData.payment_method,
        guest_name: formData.shipping_name,
        guest_phone: formData.shipping_phone,
        shipping_address: fullAddress,
        shipping_district: formData.shipping_district,
        shipping_province: formData.shipping_province,
        shipping_postal_code: formData.shipping_postal_code,
        notes: formData.notes.trim() || null
      });

      if (orderResponse.data.success) {
        const orderId = orderResponse.data.data.id;

        // Clear cart
        await clearCart();

        // Redirect to order confirmation
        navigate(`/order-confirmation/${orderId}`);
      }
    } catch (err) {
      console.error('Order error:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.error?.message || err.response?.data?.error || 'เกิดข้อผิดพลาดในการสั่งซื้อ');
    } finally {
      setLoading(false);
    }
  };

  if (!cartData || cartCount === 0) {
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">ชำระเงิน</h1>

        <form onSubmit={handleSubmitOrder} className="checkout-form">
          <div className="checkout-layout">
            {/* Left Column - Forms */}
            <div className="checkout-forms">
              {/* Shipping Address */}
              <div className="checkout-section">
                <h2 className="section-title">ที่อยู่จัดส่ง</h2>
                
                <div className="form-group">
                  <label htmlFor="shipping_name">ชื่อผู้รับ *</label>
                  <input
                    type="text"
                    id="shipping_name"
                    name="shipping_name"
                    value={formData.shipping_name}
                    onChange={handleInputChange}
                    placeholder="ชื่อ-นามสกุล"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="shipping_phone">เบอร์โทรศัพท์ *</label>
                  <input
                    type="tel"
                    id="shipping_phone"
                    name="shipping_phone"
                    value={formData.shipping_phone}
                    onChange={handleInputChange}
                    placeholder="0812345678"
                    maxLength="10"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="shipping_address">ที่อยู่ *</label>
                  <textarea
                    id="shipping_address"
                    name="shipping_address"
                    value={formData.shipping_address}
                    onChange={handleInputChange}
                    placeholder="บ้านเลขที่ ถนน ซอย"
                    rows="3"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="shipping_district">เขต/อำเภอ *</label>
                    <input
                      type="text"
                      id="shipping_district"
                      name="shipping_district"
                      value={formData.shipping_district}
                      onChange={handleInputChange}
                      placeholder="เขต/อำเภอ"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="shipping_province">จังหวัด *</label>
                    <input
                      type="text"
                      id="shipping_province"
                      name="shipping_province"
                      value={formData.shipping_province}
                      onChange={handleInputChange}
                      placeholder="จังหวัด"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="shipping_postal_code">รหัสไปรษณีย์ *</label>
                  <input
                    type="text"
                    id="shipping_postal_code"
                    name="shipping_postal_code"
                    value={formData.shipping_postal_code}
                    onChange={handleInputChange}
                    placeholder="10110"
                    maxLength="5"
                    required
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="checkout-section">
                <h2 className="section-title">วิธีการชำระเงิน</h2>
                
                <div className="payment-methods">
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="payment_method"
                      value="bank_transfer"
                      checked={formData.payment_method === 'bank_transfer'}
                      onChange={handleInputChange}
                    />
                    <div className="payment-content">
                      <div className="payment-header">
                        <span className="payment-icon">🏦</span>
                        <span className="payment-label">โอนเงินผ่านธนาคาร</span>
                      </div>
                      {formData.payment_method === 'bank_transfer' && (
                        <div className="payment-details">
                          <div className="bank-info">
                            <h4>ข้อมูลบัญชีธนาคาร</h4>
                            <div className="bank-account">
                              <p><strong>ธนาคาร:</strong> ธนาคารกสิกรไทย</p>
                              <p><strong>ชื่อบัญชี:</strong> บริษัท ITKMMSHOP22 จำกัด</p>
                              <p><strong>เลขที่บัญชี:</strong> 123-4-56789-0</p>
                              <p><strong>ประเภทบัญชี:</strong> ออมทรัพย์</p>
                            </div>
                            <div className="payment-note">
                              <p>💡 โปรดโอนเงินภายใน 24 ชั่วโมง และแนบสลิปการโอนเงิน</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>

                  <label className="payment-option">
                    <input
                      type="radio"
                      name="payment_method"
                      value="promptpay"
                      checked={formData.payment_method === 'promptpay'}
                      onChange={handleInputChange}
                    />
                    <div className="payment-content">
                      <div className="payment-header">
                        <span className="payment-icon">📱</span>
                        <span className="payment-label">พร้อมเพย์</span>
                      </div>
                      {formData.payment_method === 'promptpay' && (
                        <div className="payment-details">
                          <div className="promptpay-info">
                            <h4>สแกน QR Code เพื่อชำระเงิน</h4>
                            <div className="qr-placeholder">
                              <p>📱 QR Code จะแสดงหลังยืนยันคำสั่งซื้อ</p>
                            </div>
                            <div className="payment-note">
                              <p>💡 สแกนจ่ายผ่านแอปธนาคารของคุณ</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>

                  <label className="payment-option">
                    <input
                      type="radio"
                      name="payment_method"
                      value="shopee"
                      checked={formData.payment_method === 'shopee'}
                      onChange={handleInputChange}
                    />
                    <div className="payment-content">
                      <div className="payment-header">
                        <span className="payment-icon">🛍️</span>
                        <span className="payment-label">ชำระแล้วผ่าน Shopee</span>
                      </div>
                      {formData.payment_method === 'shopee' && (
                        <div className="payment-details">
                          <div className="shopee-info">
                            <h4>สำหรับลูกค้าที่สั่งผ่าน Shopee</h4>
                            <div className="payment-note">
                              <p>✅ กรุณาระบุเลขที่คำสั่งซื้อจาก Shopee ในช่องหมายเหตุ</p>
                              <p>✅ ทางร้านจะตรวจสอบการชำระเงินจาก Shopee</p>
                              <p>✅ สินค้าจะถูกจัดส่งหลังยืนยันการชำระเงิน</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>

                  <label className="payment-option">
                    <input
                      type="radio"
                      name="payment_method"
                      value="cod"
                      checked={formData.payment_method === 'cod'}
                      onChange={handleInputChange}
                    />
                    <div className="payment-content">
                      <div className="payment-header">
                        <span className="payment-icon">💵</span>
                        <span className="payment-label">เก็บเงินปลายทาง (COD)</span>
                      </div>
                      {formData.payment_method === 'cod' && (
                        <div className="payment-details">
                          <div className="cod-info">
                            <h4>ชำระเงินเมื่อได้รับสินค้า</h4>
                            <div className="payment-note">
                              <p>💵 ชำระเงินสดเมื่อได้รับสินค้า</p>
                              <p>📦 กรุณาเตรียมเงินพอดีหรือใกล้เคียง</p>
                              <p>⚠️ ค่าบริการ COD: ฿30</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Voucher */}
              <div className="checkout-section">
                <h2 className="section-title">รหัสคูปอง</h2>
                
                <div className="voucher-input-group">
                  <input
                    type="text"
                    name="voucher_code"
                    value={formData.voucher_code}
                    onChange={handleInputChange}
                    placeholder="กรอกรหัสคูปอง"
                    disabled={voucherApplied}
                    className="voucher-input"
                  />
                  {!voucherApplied ? (
                    <button
                      type="button"
                      onClick={handleApplyVoucher}
                      disabled={voucherLoading}
                      className="btn-apply-voucher"
                    >
                      {voucherLoading ? 'กำลังตรวจสอบ...' : 'ใช้คูปอง'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="btn-remove-voucher"
                    >
                      ลบคูปอง
                    </button>
                  )}
                </div>
                {voucherError && (
                  <p className="voucher-error">{voucherError}</p>
                )}
                {voucherApplied && (
                  <p className="voucher-success">✓ ใช้คูปองสำเร็จ</p>
                )}
              </div>

              {/* Notes */}
              <div className="checkout-section">
                <h2 className="section-title">หมายเหตุ (ถ้ามี)</h2>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="ข้อความถึงผู้ขาย..."
                  rows="3"
                  className="notes-textarea"
                />
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="checkout-summary">
              <div className="summary-card">
                <h2 className="summary-title">สรุปคำสั่งซื้อ</h2>

                <div className="summary-items">
                  {cartData.items?.map(item => (
                    <div key={item.product_id} className="summary-item">
                      <div className="item-info">
                        <span className="item-name">{item.product_name}</span>
                        <span className="item-qty">x{item.quantity}</span>
                      </div>
                      <span className="item-price">
                        ฿{formatPrice(item.line_total_including_vat)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="summary-divider"></div>

                <div className="summary-totals">
                  <div className="summary-row">
                    <span>ยอดรวม (ไม่รวม VAT):</span>
                    <span>฿{formatPrice(cartData.subtotal_excluding_vat)}</span>
                  </div>

                  <div className="summary-row vat-row">
                    <span>VAT 7%:</span>
                    <span>฿{formatPrice(cartData.total_vat)}</span>
                  </div>

                  {cartData.discount_amount > 0 && (
                    <div className="summary-row discount-row">
                      <span>ส่วนลด:</span>
                      <span className="discount-amount">
                        -฿{formatPrice(cartData.discount_amount)}
                      </span>
                    </div>
                  )}

                  <div className="summary-divider"></div>

                  <div className="summary-row total-row">
                    <span>ยอดรวมทั้งหมด:</span>
                    <span className="total-amount">
                      ฿{formatPrice(cartData.total_amount)}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="checkout-error">
                    <span className="error-icon">⚠️</span>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-place-order"
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span>
                      กำลังดำเนินการ...
                    </>
                  ) : (
                    <>
                      <span>🛒</span>
                      ยืนยันการสั่งซื้อ
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="btn-back-to-cart"
                >
                  ← กลับไปที่ตะกร้า
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
