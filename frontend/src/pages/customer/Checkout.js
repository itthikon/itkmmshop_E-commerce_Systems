import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';
import CheckoutStepper from '../../components/customer/CheckoutStepper';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(2); // Start at address step
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Address form
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    subdistrict: '',
    district: '',
    province: '',
    postal_code: ''
  });
  
  // Voucher
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [voucherError, setVoucherError] = useState('');
  const [applyingVoucher, setApplyingVoucher] = useState(false);

  useEffect(() => {
    fetchCart();
    loadUserProfile();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await api.get('/cart');
      setCartItems(response.data.items || []);
      setCartSummary(response.data.summary || null);
      
      if (!response.data.items || response.data.items.length === 0) {
        navigate('/cart');
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await api.get('/auth/profile');
        const user = response.data.user;
        
        setShippingAddress(prev => ({
          ...prev,
          name: `${user.first_name} ${user.last_name}`,
          phone: user.phone || '',
          email: user.email || ''
        }));
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const handleAddressChange = (field, value) => {
    setShippingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateAddress = () => {
    const required = ['name', 'phone', 'email', 'address', 'subdistrict', 'district', 'province', 'postal_code'];
    for (const field of required) {
      if (!shippingAddress[field] || shippingAddress[field].trim() === '') {
        alert('กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน');
        return false;
      }
    }
    return true;
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('กรุณากรอกโค้ดส่วนลด');
      return;
    }
    
    setApplyingVoucher(true);
    setVoucherError('');
    
    try {
      const response = await api.post('/vouchers/apply', {
        voucher_code: voucherCode
      });
      
      setAppliedVoucher(response.data.voucher);
      await fetchCart(); // Refresh cart with discount
      setVoucherCode('');
    } catch (err) {
      setVoucherError(err.message || 'โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ');
    } finally {
      setApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = async () => {
    try {
      await api.post('/vouchers/remove');
      setAppliedVoucher(null);
      await fetchCart();
    } catch (err) {
      console.error('Error removing voucher:', err);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 2) {
      if (!validateAddress()) return;
      setCurrentStep(3);
    } else if (currentStep === 3) {
      handlePlaceOrder();
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 2) {
      navigate('/cart');
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    
    try {
      const orderData = {
        shipping_address: shippingAddress,
        voucher_code: appliedVoucher?.code
      };
      
      const response = await api.post('/orders', orderData);
      const orderId = response.data.order.id;
      
      // Navigate to payment page
      navigate(`/payment/${orderId}`);
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">กำลังโหลด...</div>;
  }

  return (
    <div className="checkout-page">
      <CheckoutStepper currentStep={currentStep} />

      <div className="checkout-content">
        {/* Address Step */}
        {currentStep === 2 && (
          <div className="checkout-step-content">
            <h2 className="step-title">ที่อยู่จัดส่ง</h2>
            
            <div className="address-form">
              <div className="form-row">
                <div className="form-group">
                  <label>ชื่อ-นามสกุล *</label>
                  <input
                    type="text"
                    value={shippingAddress.name}
                    onChange={(e) => handleAddressChange('name', e.target.value)}
                    placeholder="ชื่อ-นามสกุล"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>เบอร์โทรศัพท์ *</label>
                  <input
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => handleAddressChange('phone', e.target.value)}
                    placeholder="0812345678"
                  />
                </div>
                
                <div className="form-group">
                  <label>อีเมล *</label>
                  <input
                    type="email"
                    value={shippingAddress.email}
                    onChange={(e) => handleAddressChange('email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>ที่อยู่ *</label>
                <textarea
                  value={shippingAddress.address}
                  onChange={(e) => handleAddressChange('address', e.target.value)}
                  placeholder="บ้านเลขที่ ถนน ซอย"
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>ตำบล/แขวง *</label>
                  <input
                    type="text"
                    value={shippingAddress.subdistrict}
                    onChange={(e) => handleAddressChange('subdistrict', e.target.value)}
                    placeholder="ตำบล/แขวง"
                  />
                </div>
                
                <div className="form-group">
                  <label>อำเภอ/เขต *</label>
                  <input
                    type="text"
                    value={shippingAddress.district}
                    onChange={(e) => handleAddressChange('district', e.target.value)}
                    placeholder="อำเภอ/เขต"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>จังหวัด *</label>
                  <input
                    type="text"
                    value={shippingAddress.province}
                    onChange={(e) => handleAddressChange('province', e.target.value)}
                    placeholder="จังหวัด"
                  />
                </div>
                
                <div className="form-group">
                  <label>รหัสไปรษณีย์ *</label>
                  <input
                    type="text"
                    value={shippingAddress.postal_code}
                    onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                    placeholder="10000"
                    maxLength="5"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Review Step */}
        {currentStep === 3 && (
          <div className="checkout-step-content">
            <h2 className="step-title">ตรวจสอบคำสั่งซื้อ</h2>
            
            <div className="order-review">
              <div className="review-section">
                <h3>ที่อยู่จัดส่ง</h3>
                <div className="address-display">
                  <p><strong>{shippingAddress.name}</strong></p>
                  <p>{shippingAddress.phone}</p>
                  <p>{shippingAddress.email}</p>
                  <p>{shippingAddress.address}</p>
                  <p>
                    {shippingAddress.subdistrict} {shippingAddress.district} {shippingAddress.province} {shippingAddress.postal_code}
                  </p>
                </div>
              </div>

              <div className="review-section">
                <h3>รายการสินค้า</h3>
                <div className="review-items">
                  {cartItems.map(item => (
                    <div key={item.id} className="review-item">
                      <div className="review-item-info">
                        <span className="review-item-name">{item.product_name}</span>
                        <span className="review-item-qty">x {item.quantity}</span>
                      </div>
                      <div className="review-item-pricing">
                        <div className="review-price-line">
                          <span>ราคา/หน่วย (ไม่รวม VAT):</span>
                          <span>฿{formatPrice(item.unit_price_excluding_vat)}</span>
                        </div>
                        <div className="review-price-line vat">
                          <span>VAT 7%/หน่วย:</span>
                          <span>฿{formatPrice(item.unit_vat_amount)}</span>
                        </div>
                        <div className="review-price-line">
                          <span>ราคา/หน่วย (รวม VAT):</span>
                          <span>฿{formatPrice(item.unit_price_including_vat)}</span>
                        </div>
                        <div className="review-price-line total">
                          <span>รวม:</span>
                          <span>฿{formatPrice(item.line_total_including_vat)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="review-section">
                <h3>โค้ดส่วนลด</h3>
                {appliedVoucher ? (
                  <div className="applied-voucher">
                    <div className="voucher-info">
                      <span className="voucher-code">{appliedVoucher.code}</span>
                      <span className="voucher-discount">
                        -{appliedVoucher.discount_type === 'percentage' 
                          ? `${appliedVoucher.discount_value}%` 
                          : `฿${formatPrice(appliedVoucher.discount_value)}`}
                      </span>
                    </div>
                    <button onClick={handleRemoveVoucher} className="remove-voucher-btn">
                      ลบ
                    </button>
                  </div>
                ) : (
                  <div className="voucher-input-group">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value)}
                      placeholder="กรอกโค้ดส่วนลด"
                      className="voucher-input"
                    />
                    <button 
                      onClick={handleApplyVoucher}
                      disabled={applyingVoucher}
                      className="apply-voucher-btn"
                    >
                      {applyingVoucher ? 'กำลังตรวจสอบ...' : 'ใช้โค้ด'}
                    </button>
                  </div>
                )}
                {voucherError && <p className="voucher-error">{voucherError}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Order Summary Sidebar */}
        <div className="checkout-summary">
          <h3>สรุปคำสั่งซื้อ</h3>
          
          {cartSummary && (
            <div className="summary-details-checkout">
              <div className="summary-line">
                <span>ยอดรวม (ไม่รวม VAT):</span>
                <span>฿{formatPrice(cartSummary.subtotal_excluding_vat)}</span>
              </div>
              
              <div className="summary-line vat-line-checkout">
                <span>VAT 7%:</span>
                <span>฿{formatPrice(cartSummary.total_vat)}</span>
              </div>
              
              {cartSummary.discount_amount > 0 && (
                <div className="summary-line discount-line">
                  <span>ส่วนลด:</span>
                  <span>-฿{formatPrice(cartSummary.discount_amount)}</span>
                </div>
              )}
              
              <div className="summary-line total-line-checkout">
                <span>ยอดรวมทั้งหมด:</span>
                <span className="total-amount-checkout">
                  ฿{formatPrice(cartSummary.total_amount)}
                </span>
              </div>
            </div>
          )}

          <div className="checkout-actions">
            <button onClick={handlePreviousStep} className="btn-back">
              ย้อนกลับ
            </button>
            <button onClick={handleNextStep} className="btn-next">
              {currentStep === 3 ? 'ยืนยันคำสั่งซื้อ' : 'ถัดไป'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
