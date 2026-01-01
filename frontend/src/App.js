import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import { CartProvider } from './context/CartContext';
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import ProductCatalog from './pages/customer/ProductCatalog';
import ProductDetail from './pages/customer/ProductDetail';
import ShoppingCart from './pages/customer/ShoppingCart';
import Checkout from './pages/customer/Checkout';
import OrderConfirmation from './pages/customer/OrderConfirmation';
import Payment from './pages/customer/Payment';
import OrderTracking from './pages/customer/OrderTracking';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Placeholder components - will be implemented in later tasks
const HomePage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  return (
    <div className="page fade-in">
      <div className="home-hero">
        <h1>ยินดีต้อนรับสู่ itkmmshop22</h1>
        <p className="hero-subtitle">ระบบสั่งซื้อสินค้าออนไลน์แบบครบวงจร</p>
        <p className="hero-description">
          <span className="vat-highlight">คำนวณ VAT อัตโนมัติ</span> พร้อมระบบชำระเงินที่สะดวกและปลอดภัย
        </p>
        
        {!user && (
          <div className="hero-actions">
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/products')}
            >
              เริ่มช้อปปิ้ง
            </button>
            <button 
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/register')}
            >
              สมัครสมาชิก
            </button>
          </div>
        )}
      </div>

      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon">💰</div>
          <h3>คำนวณ VAT อัตโนมัติ</h3>
          <p>ระบบคำนวณภาษีมูลค่าเพิ่ม 7% อัตโนมัติ แสดงราคาชัดเจน</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>ชำระเงินปลอดภัย</h3>
          <p>รองรับการชำระเงินหลายช่องทาง ปลอดภัยด้วยระบบเข้ารหัส</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📦</div>
          <h3>ติดตามสถานะ</h3>
          <p>ตรวจสอบสถานะคำสั่งซื้อได้ตลอดเวลา แบบเรียลไทม์</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎁</div>
          <h3>โปรโมชั่นพิเศษ</h3>
          <p>รับส่วนลดและโปรโมชั่นสุดพิเศษสำหรับสมาชิก</p>
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => (
  <div className="page fade-in">
    <h1>โปรไฟล์</h1>
  </div>
);

const NotFoundPage = () => (
  <div className="page fade-in">
    <h1>404 - ไม่พบหน้านี้</h1>
    <div className="alert alert-error">
      <span>ขอภัย ไม่พบหน้าที่คุณต้องการ</span>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <CartProvider>
          <div className="App">
            <Navigation />
            <Routes>
              {/* Customer Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductCatalog />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<ShoppingCart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
              <Route path="/payment/:orderId" element={<Payment />} />
              <Route path="/track-order" element={<OrderTracking />} />
              <Route path="/track-order/:orderId" element={<OrderTracking />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<ProfilePage />} />
              
              {/* Admin Routes */}
              <Route path="/admin/*" element={<AdminDashboard />} />
              
              {/* Staff Routes */}
              <Route path="/staff/*" element={<StaffDashboard />} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Footer />
          </div>
        </CartProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
