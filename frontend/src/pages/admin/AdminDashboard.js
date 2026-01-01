import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import ProductManagement from './ProductManagement';
import CategoryManagement from './CategoryManagement';
import OrderManagement from './OrderManagement';
import StaffOrderCreation from '../staff/StaffOrderCreation';
import PaymentVerification from '../staff/PaymentVerification';
import PaymentHistory from './PaymentHistory';
import AnalyticsDashboard from './AnalyticsDashboard';
import FinancialReports from './FinancialReports';
import ShopSettings from './ShopSettings';
import NotificationBadge from '../../components/notifications/NotificationBadge';
import usePaymentNotifications from '../../hooks/usePaymentNotifications';
import '../../components/admin/AdminStyles.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const { pendingCount } = usePaymentNotifications();

  useEffect(() => {
    // Check if user is authenticated and has admin/staff role
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // In a real app, you would decode the JWT or fetch user info
    // For now, we'll assume the user is authenticated
    setUser({ role: 'admin' }); // or 'staff'
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) {
    return <div className="loading">กำลังโหลด...</div>;
  }

  return (
    <div className="admin-dashboard">
      <nav className="admin-nav">
        <div className="nav-brand">
          <h1>itkmmshop Admin</h1>
        </div>
        <div className="nav-links">
          <Link to="/admin/products" className="nav-link">
            จัดการสินค้า
          </Link>
          <Link to="/admin/categories" className="nav-link">
            จัดการหมวดหมู่
          </Link>
          <Link to="/admin/orders" className="nav-link">
            จัดการคำสั่งซื้อ
          </Link>
          <Link to="/admin/payment-verification" className="nav-link">
            💳 จัดการสลิป
            {pendingCount > 0 && (
              <NotificationBadge 
                count={pendingCount} 
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/admin/payment-verification');
                }}
              />
            )}
          </Link>
          <Link to="/admin/payment-history" className="nav-link">
            📊 ประวัติการชำระเงิน
          </Link>
          <Link to="/admin/create-order" className="nav-link">
            สร้างคำสั่งซื้อ
          </Link>
          <Link to="/admin/analytics" className="nav-link">
            วิเคราะห์ข้อมูล
          </Link>
          <Link to="/admin/financial-reports" className="nav-link">
            รายงานการเงิน
          </Link>
          <Link to="/admin/settings" className="nav-link">
            ⚙️ ตั้งค่าร้านค้า
          </Link>
          <button onClick={handleLogout} className="btn btn-secondary">
            ออกจากระบบ
          </button>
        </div>
      </nav>

      <div className="admin-content">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/products" element={<ProductManagement />} />
          <Route path="/categories" element={<CategoryManagement />} />
          <Route path="/orders" element={<OrderManagement />} />
          <Route path="/payment-verification" element={<PaymentVerification />} />
          <Route path="/payment-history" element={<PaymentHistory />} />
          <Route path="/create-order" element={<StaffOrderCreation />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/financial-reports" element={<FinancialReports />} />
          <Route path="/settings" element={<ShopSettings />} />
        </Routes>
      </div>
    </div>
  );
};

const DashboardHome = () => {
  return (
    <div className="dashboard-home">
      <h1>ยินดีต้อนรับสู่ระบบจัดการ</h1>
      <div className="dashboard-cards">
        <Link to="/admin/products" className="dashboard-card">
          <div className="card-icon">📦</div>
          <h3>จัดการสินค้า</h3>
          <p>เพิ่ม แก้ไข ลบสินค้า และจัดการสต็อก</p>
        </Link>
        <Link to="/admin/categories" className="dashboard-card">
          <div className="card-icon">📂</div>
          <h3>จัดการหมวดหมู่</h3>
          <p>จัดการหมวดหมู่สินค้าและกำหนด Prefix สำหรับ SKU</p>
        </Link>
        <Link to="/admin/orders" className="dashboard-card">
          <div className="card-icon">📋</div>
          <h3>จัดการคำสั่งซื้อ</h3>
          <p>ดูและอัปเดตสถานะคำสั่งซื้อ</p>
        </Link>
        <Link to="/admin/payment-verification" className="dashboard-card">
          <div className="card-icon">💳</div>
          <h3>ตรวจสอบสลิป</h3>
          <p>ตรวจสอบและยืนยันสลิปการชำระเงิน</p>
        </Link>
        <Link to="/admin/payment-history" className="dashboard-card">
          <div className="card-icon">📊</div>
          <h3>ประวัติการชำระเงิน</h3>
          <p>ดูประวัติและรายงานการชำระเงินทั้งหมด</p>
        </Link>
        <Link to="/admin/create-order" className="dashboard-card">
          <div className="card-icon">➕</div>
          <h3>สร้างคำสั่งซื้อ</h3>
          <p>สร้างคำสั่งซื้อให้ลูกค้าจากแพลตฟอร์มอื่น</p>
        </Link>
        <Link to="/admin/analytics" className="dashboard-card">
          <div className="card-icon">📊</div>
          <h3>วิเคราะห์ข้อมูล</h3>
          <p>ดูข้อมูลประชากรศาสตร์และการกระจายตามพื้นที่</p>
        </Link>
        <Link to="/admin/financial-reports" className="dashboard-card">
          <div className="card-icon">💰</div>
          <h3>รายงานการเงิน</h3>
          <p>ดูรายงานรายได้ ค่าใช้จ่าย และกำไร</p>
        </Link>
        <Link to="/admin/settings" className="dashboard-card">
          <div className="card-icon">⚙️</div>
          <h3>ตั้งค่าร้านค้า</h3>
          <p>จัดการโลโก้และข้อมูลร้านค้า</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
