import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../config/api';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addToCartMessage, setAddToCartMessage] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data.product);
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า');
      console.error('Error fetching product:', err);
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

  const handleQuantityChange = (value) => {
    const newQuantity = parseInt(value);
    if (newQuantity > 0 && newQuantity <= product.stock_quantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!product || product.stock_quantity === 0) return;
    
    setAddingToCart(true);
    setAddToCartMessage('');
    
    try {
      await api.post('/cart/add', {
        product_id: product.id,
        quantity: quantity
      });
      
      setAddToCartMessage('เพิ่มสินค้าลงตะกร้าเรียบร้อยแล้ว');
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setAddToCartMessage('');
      }, 3000);
    } catch (err) {
      setAddToCartMessage(err.message || 'เกิดข้อผิดพลาดในการเพิ่มสินค้า');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    await handleAddToCart();
    navigate('/cart');
  };

  if (loading) {
    return <div className="loading">กำลังโหลดข้อมูลสินค้า...</div>;
  }

  if (error || !product) {
    return (
      <div className="error-message">
        <p>{error || 'ไม่พบสินค้า'}</p>
        <button onClick={() => navigate('/products')} className="back-button">
          กลับไปหน้าสินค้า
        </button>
      </div>
    );
  }

  return (
    <div className="product-detail">
      <button onClick={() => navigate('/products')} className="back-link">
        ← กลับไปหน้าสินค้า
      </button>

      <div className="product-detail-content">
        <div className="product-image-section">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="product-main-image" />
          ) : (
            <div className="no-image-large">ไม่มีรูปภาพ</div>
          )}
        </div>

        <div className="product-info-section">
          <h1 className="product-title">{product.name}</h1>
          
          {product.category_name && (
            <div className="product-category">
              หมวดหมู่: {product.category_name}
            </div>
          )}

          <div className="product-pricing-detail">
            <div className="pricing-card">
              <div className="price-row-detail">
                <span className="price-label-detail">ราคา (ไม่รวม VAT):</span>
                <span className="price-value-detail">฿{formatPrice(product.price_excluding_vat)}</span>
              </div>
              
              <div className="price-row-detail vat-row">
                <span className="price-label-detail">VAT 7%:</span>
                <span className="price-value-detail">฿{formatPrice(product.vat_amount)}</span>
              </div>
              
              <div className="price-row-detail total-row">
                <span className="price-label-detail">ราคารวม VAT:</span>
                <span className="price-value-detail total-price-value">
                  ฿{formatPrice(product.price_including_vat)}
                </span>
              </div>
            </div>
          </div>

          <div className="product-stock-info">
            {product.stock_quantity > 0 ? (
              <span className="stock-available">
                ✓ มีสินค้าในสต็อก ({product.stock_quantity} ชิ้น)
              </span>
            ) : (
              <span className="stock-unavailable">✗ สินค้าหมด</span>
            )}
          </div>

          {product.description && (
            <div className="product-description">
              <h3>รายละเอียดสินค้า</h3>
              <p>{product.description}</p>
            </div>
          )}

          {product.defects && (
            <div className="product-defects">
              <h3>⚠️ ตำหนิของสินค้า</h3>
              <p className="defects-text">{product.defects}</p>
            </div>
          )}

          {product.stock_quantity > 0 && (
            <div className="product-actions">
              <div className="quantity-selector">
                <label>จำนวน:</label>
                <div className="quantity-controls">
                  <button
                    className="quantity-button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="quantity-input"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    min="1"
                    max={product.stock_quantity}
                  />
                  <button
                    className="quantity-button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.stock_quantity}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="add-to-cart-button"
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                >
                  {addingToCart ? 'กำลังเพิ่ม...' : 'เพิ่มลงตะกร้า'}
                </button>
                
                <button
                  className="buy-now-button"
                  onClick={handleBuyNow}
                  disabled={addingToCart}
                >
                  ซื้อเลย
                </button>
              </div>

              {addToCartMessage && (
                <div className={`cart-message ${addToCartMessage.includes('เรียบร้อย') ? 'success' : 'error'}`}>
                  {addToCartMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
