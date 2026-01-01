import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../config/api';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', formData);
      
      if (response.data.success) {
        // Save token and user data
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        // Redirect based on role
        const user = response.data.data.user;
        if (user.role === 'admin') {
          navigate('/admin');
        } else if (user.role === 'staff') {
          navigate('/staff');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message || 
        err.response?.data?.error?.details ||
        'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>เข้าสู่ระบบ</h1>
        <p className="auth-subtitle">ยินดีต้อนรับกลับมา</p>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">อีเมล</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">รหัสผ่าน</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link>
          </p>
        </div>

        <div className="demo-accounts">
          <p className="demo-title">บัญชีทดสอบ:</p>
          <div className="demo-list">
            <div className="demo-item">
              <strong>Admin:</strong> admin@itkmmshop22.com / admin123
            </div>
            <div className="demo-item">
              <strong>Staff:</strong> staff@itkmmshop22.com / staff123
            </div>
            <div className="demo-item">
              <strong>Customer:</strong> customer@example.com / customer123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
