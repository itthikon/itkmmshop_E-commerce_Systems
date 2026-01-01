import React, { useState, useEffect } from 'react';
import './ShopSettings.css';

const ShopSettings = () => {
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [hasLogo, setHasLogo] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkExistingLogo();
  }, []);

  const checkExistingLogo = () => {
    // Check if logo exists
    const img = new Image();
    img.onload = () => {
      setHasLogo(true);
      setLogoPreview('/logo.svg');
    };
    img.onerror = () => {
      setHasLogo(false);
      setLogoPreview(null);
    };
    img.src = '/logo.svg?' + new Date().getTime(); // Add timestamp to avoid cache
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('กรุณาเลือกไฟล์รูปภาพ .svg, .png หรือ .jpg เท่านั้น');
        e.target.value = '';
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('ขนาดไฟล์ต้องไม่เกิน 2MB');
        e.target.value = '';
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      alert('กรุณาเลือกไฟล์โลโก้ก่อน');
      return;
    }

    setLoading(true);
    try {
      // Save logo to localStorage for demo purposes
      // In production, you would upload to server
      const reader = new FileReader();
      reader.onloadend = () => {
        localStorage.setItem('shopLogo', reader.result);
        localStorage.setItem('shopLogoType', logoFile.type);
        setHasLogo(true);
        alert('อัพโหลดโลโก้สำเร็จ!');
        setLogoFile(null);
      };
      reader.readAsDataURL(logoFile);
    } catch (error) {
      console.error('Upload error:', error);
      alert('เกิดข้อผิดพลาดในการอัพโหลด: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLogo = () => {
    if (!window.confirm('ต้องการลบโลโก้ร้านค้าใช่หรือไม่?')) {
      return;
    }

    try {
      localStorage.removeItem('shopLogo');
      localStorage.removeItem('shopLogoType');
      setLogoPreview(null);
      setLogoFile(null);
      setHasLogo(false);
      alert('ลบโลโก้สำเร็จ!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    }
  };

  const handleResetToDefault = () => {
    if (!window.confirm('ต้องการใช้โลโก้เริ่มต้นใช่หรือไม่?')) {
      return;
    }

    try {
      localStorage.removeItem('shopLogo');
      localStorage.removeItem('shopLogoType');
      setLogoPreview('/logo.svg');
      setLogoFile(null);
      setHasLogo(true);
      alert('เปลี่ยนเป็นโลโก้เริ่มต้นสำเร็จ!');
    } catch (error) {
      console.error('Reset error:', error);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  return (
    <div className="shop-settings">
      <div className="page-header">
        <h1>⚙️ ตั้งค่าร้านค้า</h1>
        <p className="subtitle">จัดการโลโก้และข้อมูลร้านค้า</p>
      </div>

      <div className="settings-container">
        <div className="settings-card">
          <div className="card-header">
            <h2>🏪 โลโก้ร้านค้า</h2>
            <p className="card-description">
              โลโก้จะแสดงในบาร์โค้ดสินค้า แนะนำขนาด 120x120 pixels หรือสัดส่วน 1:1
            </p>
          </div>

          <div className="card-body">
            <div className="logo-preview-section">
              <div className="preview-label">ตัวอย่างโลโก้ปัจจุบัน:</div>
              {logoPreview ? (
                <div className="logo-preview-container">
                  <img 
                    src={logoPreview} 
                    alt="Shop Logo" 
                    className="logo-preview"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      setHasLogo(false);
                    }}
                  />
                </div>
              ) : (
                <div className="logo-placeholder">
                  <div className="placeholder-icon">🏪</div>
                  <p>ยังไม่มีโลโก้</p>
                </div>
              )}
            </div>

            <div className="logo-upload-section">
              <input
                type="file"
                id="logo-upload"
                accept=".svg,.png,.jpg,.jpeg"
                onChange={handleLogoChange}
                className="file-input"
              />
              <label htmlFor="logo-upload" className="upload-btn">
                📁 เลือกไฟล์โลโก้
              </label>
              <p className="file-hint">
                รองรับไฟล์ .svg, .png, .jpg (ขนาดไม่เกิน 2MB)
              </p>
            </div>

            {logoFile && (
              <div className="selected-file-info">
                <span className="file-icon">📄</span>
                <span className="file-name">{logoFile.name}</span>
                <span className="file-size">
                  ({(logoFile.size / 1024).toFixed(2)} KB)
                </span>
              </div>
            )}

            <div className="logo-actions">
              <button
                className="action-btn upload-btn-action"
                onClick={handleUploadLogo}
                disabled={!logoFile || loading}
              >
                {loading ? '⏳ กำลังอัพโหลด...' : '⬆️ อัพโหลดโลโก้'}
              </button>
              
              {hasLogo && (
                <>
                  <button
                    className="action-btn delete-btn"
                    onClick={handleDeleteLogo}
                    disabled={loading}
                  >
                    🗑️ ลบโลโก้
                  </button>
                  
                  <button
                    className="action-btn reset-btn"
                    onClick={handleResetToDefault}
                    disabled={loading}
                  >
                    🔄 ใช้โลโก้เริ่มต้น
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="card-header">
            <h2>ℹ️ คำแนะนำ</h2>
          </div>
          <div className="card-body">
            <div className="info-list">
              <div className="info-item">
                <span className="info-icon">✅</span>
                <div className="info-content">
                  <strong>ขนาดที่แนะนำ:</strong> 120x120 pixels หรือสัดส่วน 1:1
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">✅</span>
                <div className="info-content">
                  <strong>รูปแบบไฟล์:</strong> SVG (แนะนำ), PNG, JPG
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">✅</span>
                <div className="info-content">
                  <strong>ขนาดไฟล์:</strong> ไม่เกิน 2MB
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">✅</span>
                <div className="info-content">
                  <strong>พื้นหลัง:</strong> ควรใช้พื้นหลังโปร่งใส (PNG/SVG) เพื่อความสวยงาม
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">✅</span>
                <div className="info-content">
                  <strong>การใช้งาน:</strong> โลโก้จะแสดงในบาร์โค้ดที่ดาวน์โหลด
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopSettings;
