import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import './AccountingSettings.css';

const AccountingSettings = () => {
  const [settings, setSettings] = useState({
    opening_balance: '',
    fiscal_year_start: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [lastUpdated, setLastUpdated] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/accounting/settings');
      
      if (response.data.success) {
        const settingsData = response.data.data;
        
        // Extract values and metadata
        const newSettings = {
          opening_balance: settingsData.opening_balance?.value || '0',
          fiscal_year_start: settingsData.fiscal_year_start?.value || '01-01'
        };
        
        const newLastUpdated = {
          opening_balance: settingsData.opening_balance?.updated_at,
          fiscal_year_start: settingsData.fiscal_year_start?.updated_at
        };
        
        setSettings(newSettings);
        setLastUpdated(newLastUpdated);
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    setError(null);
    setSuccess(null);
  };

  const validateOpeningBalance = (value) => {
    const balance = parseFloat(value);
    if (isNaN(balance)) {
      return 'ยอดเงินเริ่มต้นต้องเป็นตัวเลข';
    }
    return null;
  };

  const validateFiscalYearStart = (value) => {
    const datePattern = /^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
    if (!datePattern.test(value)) {
      return 'รูปแบบวันที่ไม่ถูกต้อง (ต้องเป็น MM-DD เช่น 01-01)';
    }
    return null;
  };

  const handleSaveSetting = async (key) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const value = settings[key];

      // Validate before saving
      let validationError = null;
      if (key === 'opening_balance') {
        validationError = validateOpeningBalance(value);
      } else if (key === 'fiscal_year_start') {
        validationError = validateFiscalYearStart(value);
      }

      if (validationError) {
        setError(validationError);
        return;
      }

      const response = await api.put(`/accounting/settings/${key}`, { value });

      if (response.data.success) {
        setSuccess('บันทึกการตั้งค่าสำเร็จ');
        // Refresh to get updated timestamp
        await fetchSettings();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Save setting error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Validate all settings
      const balanceError = validateOpeningBalance(settings.opening_balance);
      if (balanceError) {
        setError(balanceError);
        return;
      }

      const fiscalYearError = validateFiscalYearStart(settings.fiscal_year_start);
      if (fiscalYearError) {
        setError(fiscalYearError);
        return;
      }

      // Save all settings
      await Promise.all([
        api.put('/accounting/settings/opening_balance', { value: settings.opening_balance }),
        api.put('/accounting/settings/fiscal_year_start', { value: settings.fiscal_year_start })
      ]);

      setSuccess('บันทึกการตั้งค่าทั้งหมดสำเร็จ');
      await fetchSettings();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Save all settings error:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  if (loading) {
    return (
      <div className="accounting-settings">
        <div className="page-header">
          <h1>⚙️ ตั้งค่าระบบบัญชี</h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="accounting-settings">
      <div className="page-header">
        <h1>⚙️ ตั้งค่าระบบบัญชี</h1>
        <p className="subtitle">จัดการการตั้งค่าระบบบัญชีร้านค้า</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span className="alert-message">{error}</span>
          <button 
            className="alert-close"
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          <span className="alert-message">{success}</span>
          <button 
            className="alert-close"
            onClick={() => setSuccess(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className="settings-container">
        {/* Opening Balance Setting */}
        <div className="settings-card">
          <div className="card-header">
            <h2>💰 ยอดเงินเริ่มต้น (Opening Balance)</h2>
            <p className="card-description">
              ยอดเงินสดคงเหลือเมื่อเริ่มต้นใช้งานระบบบัญชี
            </p>
          </div>

          <div className="card-body">
            <div className="setting-group">
              <label htmlFor="opening_balance" className="setting-label">
                ยอดเงินเริ่มต้น (บาท)
              </label>
              <div className="input-with-button">
                <input
                  type="number"
                  id="opening_balance"
                  name="opening_balance"
                  value={settings.opening_balance}
                  onChange={handleInputChange}
                  className="setting-input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                <button
                  className="save-btn"
                  onClick={() => handleSaveSetting('opening_balance')}
                  disabled={saving}
                >
                  {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
                </button>
              </div>
              <p className="setting-hint">
                ยอดเงินปัจจุบัน: <strong>{formatCurrency(settings.opening_balance)} บาท</strong>
              </p>
              {lastUpdated.opening_balance && (
                <p className="setting-updated">
                  อัปเดตล่าสุด: {formatDate(lastUpdated.opening_balance)}
                </p>
              )}
            </div>

            <div className="info-box">
              <div className="info-icon">ℹ️</div>
              <div className="info-content">
                <strong>คำแนะนำ:</strong>
                <ul>
                  <li>ยอดเงินเริ่มต้นคือเงินสดที่มีอยู่ในร้านก่อนเริ่มใช้งานระบบบัญชี</li>
                  <li>ควรตรวจสอบยอดเงินจริงก่อนบันทึก</li>
                  <li>ยอดนี้จะใช้ในการคำนวณกระแสเงินสดและรายงานทางการเงิน</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Fiscal Year Start Setting */}
        <div className="settings-card">
          <div className="card-header">
            <h2>📅 วันเริ่มต้นปีบัญชี (Fiscal Year Start)</h2>
            <p className="card-description">
              กำหนดวันที่เริ่มต้นปีบัญชีของร้าน
            </p>
          </div>

          <div className="card-body">
            <div className="setting-group">
              <label htmlFor="fiscal_year_start" className="setting-label">
                วันเริ่มต้นปีบัญชี (MM-DD)
              </label>
              <div className="input-with-button">
                <input
                  type="text"
                  id="fiscal_year_start"
                  name="fiscal_year_start"
                  value={settings.fiscal_year_start}
                  onChange={handleInputChange}
                  className="setting-input"
                  placeholder="01-01"
                  pattern="(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])"
                />
                <button
                  className="save-btn"
                  onClick={() => handleSaveSetting('fiscal_year_start')}
                  disabled={saving}
                >
                  {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
                </button>
              </div>
              <p className="setting-hint">
                รูปแบบ: MM-DD (เช่น 01-01 สำหรับ 1 มกราคม)
              </p>
              {lastUpdated.fiscal_year_start && (
                <p className="setting-updated">
                  อัปเดตล่าสุด: {formatDate(lastUpdated.fiscal_year_start)}
                </p>
              )}
            </div>

            <div className="info-box">
              <div className="info-icon">ℹ️</div>
              <div className="info-content">
                <strong>คำแนะนำ:</strong>
                <ul>
                  <li>ปีบัญชีคือช่วงเวลา 12 เดือนที่ใช้ในการจัดทำรายงานทางการเงิน</li>
                  <li>ค่าเริ่มต้นคือ 01-01 (1 มกราคม) ตามปีปฏิทิน</li>
                  <li>บางธุรกิจอาจเริ่มปีบัญชีในเดือนอื่น เช่น 04-01 (1 เมษายน)</li>
                  <li>การเปลี่ยนแปลงจะมีผลกับรายงานประจำปีในอนาคต</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="settings-card">
          <div className="card-header">
            <h2>⚡ ค่าที่แนะนำ</h2>
            <p className="card-description">
              เลือกค่าที่ใช้บ่อยเพื่อความสะดวก
            </p>
          </div>

          <div className="card-body">
            <div className="preset-buttons">
              <button
                className="preset-btn"
                onClick={() => setSettings(prev => ({ ...prev, fiscal_year_start: '01-01' }))}
              >
                📅 ปีปฏิทิน (1 ม.ค.)
              </button>
              <button
                className="preset-btn"
                onClick={() => setSettings(prev => ({ ...prev, fiscal_year_start: '04-01' }))}
              >
                📅 ปีงบประมาณไทย (1 เม.ย.)
              </button>
              <button
                className="preset-btn"
                onClick={() => setSettings(prev => ({ ...prev, fiscal_year_start: '10-01' }))}
              >
                📅 ปีงบประมาณสหรัฐ (1 ต.ค.)
              </button>
            </div>
          </div>
        </div>

        {/* Save All Button */}
        <div className="settings-actions">
          <button
            className="save-all-btn"
            onClick={handleSaveAll}
            disabled={saving}
          >
            {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกการตั้งค่าทั้งหมด'}
          </button>
          <button
            className="refresh-btn"
            onClick={fetchSettings}
            disabled={saving}
          >
            🔄 รีเฟรช
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountingSettings;
