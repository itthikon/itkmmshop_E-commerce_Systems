import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { cartCount } = useCart();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          itkmmshop22
        </Link>

        <button 
          className={`navbar-toggle ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          <li>
            <Link to="/" className={isActive('/')} onClick={closeMenu}>
              หน้าแรก
            </Link>
          </li>
          <li>
            <Link to="/products" className={isActive('/products')} onClick={closeMenu}>
              สินค้า
            </Link>
          </li>
          <li>
            <Link to="/cart" className={`cart-link ${isActive('/cart')}`} onClick={closeMenu}>
              <span className="cart-icon">🛒</span>
              <span>ตะกร้า</span>
              {cartCount > 0 && (
                <span className="cart-badge">{cartCount}</span>
              )}
            </Link>
          </li>
          <li>
            <Link to="/track-order" className={isActive('/track-order')} onClick={closeMenu}>
              ติดตามคำสั่งซื้อ
            </Link>
          </li>
          <li>
            <Link to="/login" className={isActive('/login')} onClick={closeMenu}>
              เข้าสู่ระบบ
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
