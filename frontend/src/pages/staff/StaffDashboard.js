import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import StaffOrderCreation from './StaffOrderCreation';
import PaymentVerification from './PaymentVerification';
import NotificationBadge from '../../components/notifications/NotificationBadge';
import usePaymentNotifications from '../../hooks/usePaymentNotifications';
import './StaffDashboard.css';

const StaffHome = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todayOrders: 0,
    pendingOrders: 0,
    totalProducts: 0
  });

  useEffect(() => {
    // TODO: Fetch real stats from API
    setStats({
      todayOrders: 12,
      pendingOrders: 5,
      totalProducts: 10
    });
  }, []);

  return (
    <div className="staff-home">
      <div className="welcome-section">
        <h1>ยินดีต้อนรับสู่ระบบพนักงาน</h1>
        <p>จัดการคำสั่งซื้อและให้บริการลูกค้าอย่างมีประสิทธิภาพ</p>
      </div>

      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{stats.todayOrders}</div>
          <div className="stat-label">คำสั่งซื้อวันนี้</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{stats.pendingOrders}</div>
          <div className="stat-label">รอดำเนินการ</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{stats.totalProducts}</div>
          <div className="stat-label">สินค้าทั้งหมด</div>
        </div>
      </div>

      <div className="staff-cards">
        <div className="staff-card" onClick={() => navigate('/staff/create-order')}>
          <div className="card-icon">📝</div>
          <h3>สร้างคำสั่งซื้อ</h3>
          <p>สร้างคำสั่งซื้อให้ลูกค้าที่มาซื้อหน้าร้าน</p>
        </div>

        <div className="staff-card" onClick={() => navigate('/staff/payment-verification')}>
          <div className="card-icon">💳</div>
          <h3>ตรวจสอบสลิป</h3>
          <p>ตรวจสอบและยืนยันสลิปการชำระเงิน</p>
        </div>

        <div className="staff-card" onClick={() => navigate('/products')}>
          <div className="card-icon">🛍️</div>
          <h3>ดูสินค้า</h3>
          <p>ดูรายการสินค้าและตรวจสอบสต็อก</p>
        </div>

        <div className="staff-card" onClick={() => navigate('/track-order')}>
          <div className="card-icon">🔍</div>
          <h3>ติดตามคำสั่งซื้อ</h3>
          <p>ตรวจสอบสถานะและรายละเอียดคำสั่งซื้อ</p>
        </div>

        <div className="staff-card" onClick={() => navigate('/profile')}>
          <div className="card-icon">👤</div>
          <h3>โปรไฟล์</h3>
          <p>จัดการข้อมูลส่วนตัวของคุณ</p>
        </div>
      </div>

      <div className="recent-activity">
        <h2>กิจกรรมล่าสุด</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon">✅</div>
            <div className="activity-content">
              <div className="activity-title">สร้างคำสั่งซื้อ #ORD-2024-001</div>
              <div className="activity-time">5 นาทีที่แล้ว</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">📦</div>
            <div className="activity-content">
              <div className="activity-title">ตรวจสอบสต็อกสินค้า</div>
              <div className="activity-time">15 นาทีที่แล้ว</div>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon">👥</div>
            <div className="activity-content">
              <div className="activity-title">ให้บริการลูกค้า 3 ราย</div>
              <div className="activity-time">1 ชั่วโมงที่แล้ว</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StaffDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingCount } = usePaymentNotifications();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/staff' && location.pathname === '/staff') return true;
    if (path !== '/staff' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="staff-dashboard">
      <aside className="staff-sidebar">
        <div className="sidebar-header">
          <h2>Staff Panel</h2>
          <p className="user-role">พนักงาน</p>
        </div>

        <nav className="sidebar-nav">
          <Link 
            to="/staff" 
            className={`nav-item ${isActive('/staff') ? 'active' : ''}`}
          >
            <span className="nav-icon">🏠</span>
            <span>หน้าหลัก</span>
          </Link>
          <Link 
            to="/staff/create-order" 
            className={`nav-item ${isActive('/staff/create-order') ? 'active' : ''}`}
          >
            <span className="nav-icon">📝</span>
            <span>สร้างคำสั่งซื้อ</span>
          </Link>
          <Link 
            to="/staff/payment-verification" 
            className={`nav-item ${isActive('/staff/payment-verification') ? 'active' : ''}`}
          >
            <span className="nav-icon">💳</span>
            <span>ตรวจสอบสลิป</span>
            {pendingCount > 0 && (
              <NotificationBadge 
                count={pendingCount} 
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/staff/payment-verification');
                }}
              />
            )}
          </Link>
          <Link 
            to="/products" 
            className={`nav-item ${isActive('/products') ? 'active' : ''}`}
          >
            <span className="nav-icon">🛍️</span>
            <span>ดูสินค้า</span>
          </Link>
          <Link 
            to="/track-order" 
            className={`nav-item ${isActive('/track-order') ? 'active' : ''}`}
          >
            <span className="nav-icon">🔍</span>
            <span>ติดตามคำสั่งซื้อ</span>
          </Link>
          <Link 
            to="/profile" 
            className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
          >
            <span className="nav-icon">👤</span>
            <span>โปรไฟล์</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <span className="nav-icon">🚪</span>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      <main className="staff-content">
        <Routes>
          <Route path="/" element={<StaffHome />} />
          <Route path="/create-order" element={<StaffOrderCreation />} />
          <Route path="/payment-verification" element={<PaymentVerification />} />
        </Routes>
      </main>
    </div>
  );
};

export default StaffDashboard;
