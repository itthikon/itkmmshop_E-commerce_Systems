import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import Footer from './components/Footer';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductCatalog from './pages/customer/ProductCatalog';
import ProductDetail from './pages/customer/ProductDetail';
import ShoppingCart from './pages/customer/ShoppingCart';
import Checkout from './pages/customer/Checkout';
import Payment from './pages/customer/Payment';
import OrderTracking from './pages/customer/OrderTracking';

// Placeholder components - will be implemented in later tasks
const HomePage = () => (
  <div className="page fade-in">
    <h1>ยินดีต้อนรับสู่ itkmmshop</h1>
    <div className="card">
      <p>ระบบสั่งซื้อสินค้าออนไลน์แบบครบวงจร</p>
      <p className="mt-md">
        <span className="vat-highlight">คำนวณ VAT อัตโนมัติ</span> พร้อมระบบชำระเงินที่สะดวกและปลอดภัย
      </p>
    </div>
  </div>
);

const LoginPage = () => (
  <div className="page fade-in">
    <h1>เข้าสู่ระบบ</h1>
  </div>
);

const RegisterPage = () => (
  <div className="page fade-in">
    <h1>สมัครสมาชิก</h1>
  </div>
);

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
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductCatalog />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<ShoppingCart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment/:orderId" element={<Payment />} />
          <Route path="/track-order" element={<OrderTracking />} />
          <Route path="/track-order/:orderId" element={<OrderTracking />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/*" element={<AdminDashboard />} />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
