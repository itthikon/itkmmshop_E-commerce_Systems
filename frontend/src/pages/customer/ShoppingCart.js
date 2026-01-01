import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './ShoppingCart.css';

const ShoppingCart = () => {
  const navigate = useNavigate();
  const { cartData, loading: contextLoading, fetchCart, updateCartItem, removeFromCart } = useCart();
  
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    // Use cart data from context
    if (cartData) {
      setCartItems(cartData.items || []);
      setCartSummary({
        subtotal_excluding_vat: cartData.subtotal_excluding_vat || 0,
        total_vat: cartData.total_vat || 0,
        discount_amount: cartData.discount_amount || 0,
        total_amount: cartData.total_amount || 0
      });
    }
    setLoading(contextLoading);
  }, [cartData, contextLoading]);

  useEffect(() => {
    // Fetch cart on mount
    fetchCart();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating(prev => ({ ...prev, [productId]: true }));
    
    try {
      const result = await updateCartItem(productId, newQuantity);
      
      if (!result.success) {
        alert(result.error || 'เกิดข้อผิดพลาดในการอัปเดตจำนวนสินค้า');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอัปเดตจำนวนสินค้า');
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleRemoveItem = async (productId) => {
    if (!window.confirm('คุณต้องการลบสินค้านี้ออกจากตะกร้าหรือไม่?')) {
      return;
    }
    
    setUpdating(prev => ({ ...prev, [productId]: true }));
    
    try {
      const result = await removeFromCart(productId);
      
      if (!result.success) {
        alert(result.error || 'เกิดข้อผิดพลาดในการลบสินค้า');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการลบสินค้า');
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loading) {
    return <div className="loading">กำลังโหลดตะกร้าสินค้า...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
        <button onClick={() => fetchCart()} className="retry-button">
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="empty-cart">
        <div className="empty-cart-icon">🛒</div>
        <h2>ตะกร้าสินค้าว่างเปล่า</h2>
        <p>เริ่มเลือกซื้อสินค้าเพื่อเพิ่มลงในตะกร้า</p>
        <button onClick={() => navigate('/products')} className="shop-now-button">
          เลือกซื้อสินค้า
        </button>
      </div>
    );
  }

  return (
    <div className="shopping-cart">
      <h1 className="cart-title">ตะกร้าสินค้า</h1>

      <div className="cart-layout">
        <div className="cart-items-section">
          {cartItems.map(item => (
            <div key={item.product_id} className="cart-item">
              <div className="cart-item-image">
                {item.product_image_url ? (
                  <img src={item.product_image_url} alt={item.product_name} />
                ) : (
                  <div className="no-image-cart">ไม่มีรูป</div>
                )}
              </div>

              <div className="cart-item-details">
                <h3 className="cart-item-name">{item.product_name}</h3>
                
                <div className="cart-item-pricing">
                  <div className="price-line">
                    <span className="price-label">ราคา/หน่วย (ไม่รวม VAT):</span>
                    <span className="price-value">฿{formatPrice(item.unit_price_excluding_vat)}</span>
                  </div>
                  <div className="price-line vat-line">
                    <span className="price-label">VAT 7%/หน่วย:</span>
                    <span className="price-value">฿{formatPrice(item.unit_vat_amount)}</span>
                  </div>
                  <div className="price-line">
                    <span className="price-label">ราคา/หน่วย (รวม VAT):</span>
                    <span className="price-value">฿{formatPrice(item.unit_price_including_vat)}</span>
                  </div>
                </div>

                <div className="cart-item-quantity">
                  <label>จำนวน:</label>
                  <div className="quantity-controls-cart">
                    <button
                      className="qty-button"
                      onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || updating[item.product_id]}
                    >
                      -
                    </button>
                    <span className="qty-display">{item.quantity}</span>
                    <button
                      className="qty-button"
                      onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                      disabled={updating[item.product_id]}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="cart-item-total">
                  <span className="total-label">รวม:</span>
                  <span className="total-value">฿{formatPrice(item.line_total_including_vat)}</span>
                </div>
              </div>

              <button
                className="remove-item-button"
                onClick={() => handleRemoveItem(item.product_id)}
                disabled={updating[item.product_id]}
                title="ลบสินค้า"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="cart-summary-section">
          <div className="cart-summary">
            <h2 className="summary-title">สรุปคำสั่งซื้อ</h2>

            {cartSummary && (
              <div className="summary-details">
                <div className="summary-row">
                  <span className="summary-label">ยอดรวม (ไม่รวม VAT):</span>
                  <span className="summary-value">฿{formatPrice(cartSummary.subtotal_excluding_vat)}</span>
                </div>

                <div className="summary-row vat-summary">
                  <span className="summary-label">VAT 7%:</span>
                  <span className="summary-value">฿{formatPrice(cartSummary.total_vat)}</span>
                </div>

                {cartSummary.discount_amount > 0 && (
                  <div className="summary-row discount-row">
                    <span className="summary-label">ส่วนลด:</span>
                    <span className="summary-value">-฿{formatPrice(cartSummary.discount_amount)}</span>
                  </div>
                )}

                <div className="summary-row total-row">
                  <span className="summary-label">ยอดรวมทั้งหมด:</span>
                  <span className="summary-value total-amount">
                    ฿{formatPrice(cartSummary.total_amount)}
                  </span>
                </div>
              </div>
            )}

            <button className="checkout-button" onClick={handleCheckout}>
              ดำเนินการชำระเงิน
            </button>

            <button 
              className="continue-shopping-button"
              onClick={() => navigate('/products')}
            >
              เลือกซื้อสินค้าต่อ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoppingCart;
