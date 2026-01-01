import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product, onViewDetails, onAddToCart }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    if (value < 1) {
      setQuantity(1);
    } else if (value > product.stock_quantity) {
      setQuantity(product.stock_quantity);
      setError(`มีสินค้าเหลือเพียง ${product.stock_quantity} ชิ้น`);
      setTimeout(() => setError(null), 3000);
    } else {
      setQuantity(value);
      setError(null);
    }
  };

  const handleIncrement = () => {
    if (quantity < product.stock_quantity) {
      setQuantity(quantity + 1);
      setError(null);
    } else {
      setError(`มีสินค้าเหลือเพียง ${product.stock_quantity} ชิ้น`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
      setError(null);
    }
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    
    if (product.stock_quantity === 0) {
      setError('สินค้าหมด ไม่สามารถสั่งซื้อได้');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (quantity > product.stock_quantity) {
      setError(`มีสินค้าเหลือเพียง ${product.stock_quantity} ชิ้น`);
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setAdding(true);
    setError(null);
    
    try {
      const result = await addToCart(product.id, quantity);
      
      if (result.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setQuantity(1); // Reset quantity after success
        }, 2000);
        
        if (onAddToCart) {
          onAddToCart(product, quantity);
        }
      } else {
        setError(result.error || 'เกิดข้อผิดพลาดในการเพิ่มสินค้า');
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('เกิดข้อผิดพลาดในการเพิ่มสินค้า');
      setTimeout(() => setError(null), 3000);
    } finally {
      setAdding(false);
    }
  };

  const isOutOfStock = product.stock_quantity === 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 5;

  return (
    <div className={`product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      <div className="product-image" onClick={() => onViewDetails(product.id)}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <div className="no-image">ไม่มีรูปภาพ</div>
        )}
        {isOutOfStock && (
          <div className="out-of-stock-badge">สินค้าหมด</div>
        )}
        {isLowStock && !isOutOfStock && (
          <div className="low-stock-badge">เหลือน้อย!</div>
        )}
        {showSuccess && (
          <div className="success-badge">
            <span className="success-icon">✓</span>
            เพิ่ม {quantity} ชิ้นในตระกร้าแล้ว
          </div>
        )}
      </div>
      
      <div className="product-info" onClick={() => onViewDetails(product.id)}>
        <h3 className="product-name">{product.name}</h3>
        
        <div className="product-pricing">
          <div className="price-row">
            <span className="price-label">ราคา (ไม่รวม VAT):</span>
            <span className="price-value">฿{formatPrice(product.price_excluding_vat)}</span>
          </div>
          
          <div className="price-row vat-highlight">
            <span className="price-label">VAT 7%:</span>
            <span className="price-value">฿{formatPrice(product.vat_amount)}</span>
          </div>
          
          <div className="price-row total-price">
            <span className="price-label">ราคารวม VAT:</span>
            <span className="price-value">฿{formatPrice(product.price_including_vat)}</span>
          </div>
        </div>
        
        <div className="product-stock">
          {isOutOfStock ? (
            <span className="out-of-stock">❌ สินค้าหมด</span>
          ) : isLowStock ? (
            <span className="low-stock">⚠️ เหลือเพียง {product.stock_quantity} ชิ้น</span>
          ) : (
            <span className="in-stock">✓ คงเหลือ {product.stock_quantity} ชิ้น</span>
          )}
        </div>
      </div>

      <div className="product-actions">
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
        
        {!isOutOfStock && (
          <div className="quantity-selector">
            <label>จำนวน:</label>
            <div className="quantity-controls">
              <button
                className="quantity-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDecrement();
                }}
                disabled={quantity <= 1 || adding}
              >
                −
              </button>
              <input
                type="number"
                className="quantity-input"
                value={quantity}
                onChange={handleQuantityChange}
                onClick={(e) => e.stopPropagation()}
                min="1"
                max={product.stock_quantity}
                disabled={adding}
              />
              <button
                className="quantity-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleIncrement();
                }}
                disabled={quantity >= product.stock_quantity || adding}
              >
                +
              </button>
            </div>
          </div>
        )}

        <button
          className="btn btn-primary btn-add-to-cart"
          onClick={handleAddToCart}
          disabled={isOutOfStock || adding}
        >
          {adding ? (
            <>
              <span className="spinner"></span>
              กำลังเพิ่ม...
            </>
          ) : isOutOfStock ? (
            <>
              <span className="cart-icon">🚫</span>
              สินค้าหมด
            </>
          ) : (
            <>
              <span className="cart-icon">🛒</span>
              เพิ่ม {quantity} ชิ้นในตระกร้า
            </>
          )}
        </button>
        
        <button
          className="btn btn-secondary btn-view-details"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(product.id);
          }}
        >
          ดูรายละเอียด
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
