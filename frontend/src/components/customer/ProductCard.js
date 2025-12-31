import React from 'react';
import './ProductCard.css';

const ProductCard = ({ product, onViewDetails }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="product-card" onClick={() => onViewDetails(product.id)}>
      <div className="product-image">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} />
        ) : (
          <div className="no-image">ไม่มีรูปภาพ</div>
        )}
        {product.stock_quantity === 0 && (
          <div className="out-of-stock-badge">สินค้าหมด</div>
        )}
      </div>
      
      <div className="product-info">
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
          {product.stock_quantity > 0 ? (
            <span className="in-stock">คงเหลือ {product.stock_quantity} ชิ้น</span>
          ) : (
            <span className="out-of-stock">สินค้าหมด</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
