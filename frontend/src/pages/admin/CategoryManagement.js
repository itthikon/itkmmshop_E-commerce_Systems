import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import './CategoryManagement.css';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showPrefixWarning, setShowPrefixWarning] = useState(false);
  const [originalPrefix, setOriginalPrefix] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prefix: '',
    status: 'active'
  });
  const [prefixError, setPrefixError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('ไม่สามารถโหลดข้อมูลหมวดหมู่ได้');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      name: '',
      description: '',
      prefix: '',
      status: 'active'
    });
    setPrefixError('');
    setShowPrefixWarning(false);
    setOriginalPrefix('');
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setModalMode('edit');
    setSelectedCategory(category);
    setOriginalPrefix(category.prefix || '');
    setFormData({
      name: category.name,
      description: category.description || '',
      prefix: category.prefix || '',
      status: category.status
    });
    setPrefixError('');
    setShowPrefixWarning(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
    setShowPrefixWarning(false);
    setPrefixError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrefixChange = (e) => {
    let value = e.target.value;
    
    // Auto-uppercase and filter only A-Z
    value = value.toUpperCase().replace(/[^A-Z]/g, '');
    
    // Limit to 4 characters
    if (value.length <= 4) {
      setFormData(prev => ({
        ...prev,
        prefix: value
      }));
      
      // Real-time validation
      validatePrefix(value);
      
      // Check if prefix is being changed (for edit mode)
      if (modalMode === 'edit' && originalPrefix && value !== originalPrefix) {
        setShowPrefixWarning(true);
      } else {
        setShowPrefixWarning(false);
      }
    }
  };

  const validatePrefix = (prefix) => {
    if (!prefix) {
      setPrefixError('');
      return true;
    }
    
    if (prefix.length < 2) {
      setPrefixError('Prefix ต้องมีอย่างน้อย 2 ตัวอักษร');
      return false;
    }
    
    if (prefix.length > 4) {
      setPrefixError('Prefix ต้องไม่เกิน 4 ตัวอักษร');
      return false;
    }
    
    if (!/^[A-Z]+$/.test(prefix)) {
      setPrefixError('Prefix ต้องเป็นตัวอักษรภาษาอังกฤษเท่านั้น (A-Z)');
      return false;
    }
    
    setPrefixError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate prefix if provided
    if (formData.prefix && !validatePrefix(formData.prefix)) {
      return;
    }
    
    // Show confirmation if prefix is being changed
    if (showPrefixWarning) {
      const confirmed = window.confirm(
        '⚠️ คำเตือน: การเปลี่ยน Prefix\n\n' +
        'การเปลี่ยน Prefix จะมีผลกับสินค้าใหม่เท่านั้น\n' +
        'สินค้าที่มีอยู่จะยังคงใช้ SKU เดิม\n\n' +
        'ต้องการดำเนินการต่อหรือไม่?'
      );
      
      if (!confirmed) {
        return;
      }
    }
    
    try {
      if (modalMode === 'add') {
        await api.post('/categories', formData);
        alert('เพิ่มหมวดหมู่สำเร็จ!');
      } else if (modalMode === 'edit') {
        const response = await api.put(`/categories/${selectedCategory.category_id}`, formData);
        
        // Show warning message if returned from backend
        if (response.data.warning) {
          alert(
            '✅ อัปเดตหมวดหมู่สำเร็จ!\n\n' +
            '⚠️ ' + response.data.warning.message + '\n' +
            '💡 ' + response.data.warning.suggestion
          );
        } else {
          alert('อัปเดตหมวดหมู่สำเร็จ!');
        }
      }
      
      closeModal();
      fetchCategories();
    } catch (err) {
      console.error('Error saving category:', err);
      const errorCode = err.response?.data?.error?.code;
      const errorMessage = err.response?.data?.error?.message;
      const errorSuggestion = err.response?.data?.error?.suggestion;
      
      if (errorCode === 'DUPLICATE_PREFIX') {
        alert(
          '❌ เกิดข้อผิดพลาด: ' + errorMessage + '\n\n' +
          '💡 ' + errorSuggestion
        );
      } else if (errorCode === 'INVALID_PREFIX') {
        alert(
          '❌ เกิดข้อผิดพลาด: ' + errorMessage + '\n\n' +
          '💡 ' + errorSuggestion
        );
      } else {
        alert('เกิดข้อผิดพลาด: ' + (errorMessage || err.message));
      }
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`ต้องการลบหมวดหมู่ "${category.name}" ใช่หรือไม่?`)) {
      return;
    }
    
    try {
      await api.delete(`/categories/${category.category_id}`);
      alert('ลบหมวดหมู่สำเร็จ!');
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      const errorCode = err.response?.data?.error?.code;
      const errorMessage = err.response?.data?.error?.message;
      
      if (errorCode === 'CATEGORY_HAS_PRODUCTS') {
        alert(
          '❌ ไม่สามารถลบหมวดหมู่ได้\n\n' +
          errorMessage + '\n\n' +
          '💡 กรุณาลบหรือย้ายสินค้าในหมวดหมู่นี้ก่อน'
        );
      } else {
        alert('เกิดข้อผิดพลาด: ' + (errorMessage || err.message));
      }
    }
  };

  if (loading) {
    return (
      <div className="category-management">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="category-management">
      <div className="page-header">
        <h1>📂 จัดการหมวดหมู่สินค้า</h1>
        <p className="subtitle">เพิ่ม แก้ไข ลบหมวดหมู่ และกำหนด Prefix สำหรับ SKU</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="action-bar">
        <button className="btn btn-add" onClick={openAddModal}>
          ➕ เพิ่มหมวดหมู่ใหม่
        </button>
      </div>

      <div className="categories-count">
        <span>พบหมวดหมู่ทั้งหมด {categories.length} รายการ</span>
      </div>

      <div className="categories-table-container">
        <table className="categories-table">
          <thead>
            <tr>
              <th>ชื่อหมวดหมู่</th>
              <th>Prefix</th>
              <th>รายละเอียด</th>
              <th>สถานะ</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category.category_id}>
                <td className="category-name">
                  <strong>{category.name}</strong>
                </td>
                <td className="category-prefix">
                  {category.prefix ? (
                    <span className="prefix-badge">{category.prefix}</span>
                  ) : (
                    <span className="no-prefix">ไม่มี Prefix</span>
                  )}
                </td>
                <td className="category-description">
                  {category.description || '-'}
                </td>
                <td className="category-status">
                  <span className={`status-badge ${category.status}`}>
                    {category.status === 'active' ? '✅ ใช้งาน' : '❌ ไม่ใช้งาน'}
                  </span>
                </td>
                <td className="category-actions">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => openEditModal(category)}
                    title="แก้ไขหมวดหมู่"
                  >
                    ✏️ แก้ไข
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(category)}
                    title="ลบหมวดหมู่"
                  >
                    🗑️ ลบ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {categories.length === 0 && !loading && (
        <div className="empty-state">
          <div className="empty-icon">📂</div>
          <h3>ยังไม่มีหมวดหมู่</h3>
          <p>เริ่มต้นด้วยการเพิ่มหมวดหมู่แรก</p>
          <button className="btn btn-add" onClick={openAddModal}>
            ➕ เพิ่มหมวดหมู่แรก
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="form-modal">
              <div className="modal-header">
                <h2>{modalMode === 'add' ? '➕ เพิ่มหมวดหมู่ใหม่' : '✏️ แก้ไขหมวดหมู่'}</h2>
                <button className="close-btn" onClick={closeModal}>✕</button>
              </div>
              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>ชื่อหมวดหมู่ *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="ชื่อหมวดหมู่"
                      maxLength="100"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>
                      Prefix สำหรับ SKU
                      <span className="label-hint"> (2-4 ตัวอักษร A-Z)</span>
                    </label>
                    <input
                      type="text"
                      name="prefix"
                      value={formData.prefix}
                      onChange={handlePrefixChange}
                      placeholder="เช่น ELEC, FASH, FOOD"
                      maxLength="4"
                      className={prefixError ? 'input-error' : ''}
                    />
                    {prefixError && (
                      <p className="field-error">❌ {prefixError}</p>
                    )}
                    {!prefixError && formData.prefix && (
                      <p className="field-hint success-hint">
                        ✅ Prefix ถูกต้อง: {formData.prefix}
                      </p>
                    )}
                    {!formData.prefix && (
                      <p className="field-hint">
                        💡 ถ้าไม่ระบุ Prefix สินค้าในหมวดหมู่นี้จะใช้ "GEN" เป็นค่าเริ่มต้น
                      </p>
                    )}
                    {showPrefixWarning && (
                      <div className="prefix-warning">
                        <p className="warning-text">
                          ⚠️ <strong>คำเตือน:</strong> การเปลี่ยน Prefix จะมีผลกับสินค้าใหม่เท่านั้น
                        </p>
                        <p className="warning-detail">
                          สินค้าที่มีอยู่จะยังคงใช้ SKU เดิม (Prefix เดิม: {originalPrefix || 'ไม่มี'})
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label>รายละเอียด</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="รายละเอียดหมวดหมู่"
                    />
                  </div>

                  <div className="form-group">
                    <label>สถานะ</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">ใช้งาน</option>
                      <option value="inactive">ไม่ใช้งาน</option>
                    </select>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-cancel" onClick={closeModal}>
                    ยกเลิก
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-submit"
                    disabled={!!prefixError}
                  >
                    {modalMode === 'add' ? '➕ เพิ่มหมวดหมู่' : '💾 บันทึก'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
