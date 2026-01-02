import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import './AccountingCategoryManagement.css';

const AccountingCategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('income'); // 'income' or 'expense'
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'income',
    description: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/accounting/categories');
      const categoriesData = response.data.data || [];
      
      // Fetch usage count for each category
      const categoriesWithUsage = await Promise.all(
        categoriesData.map(async (category) => {
          try {
            const usageResponse = await api.get(`/accounting/categories/${category.id}/can-delete`);
            return {
              ...category,
              usage_count: usageResponse.data.usageCount || 0
            };
          } catch (err) {
            console.error(`Error fetching usage for category ${category.id}:`, err);
            return {
              ...category,
              usage_count: 0
            };
          }
        })
      );
      
      setCategories(categoriesWithUsage);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('ไม่สามารถโหลดข้อมูลหมวดหมู่ได้');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.type === activeTab && cat.is_active
  );

  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      alert('กรุณากรอกชื่อหมวดหมู่');
      return;
    }

    try {
      await api.post('/accounting/categories', {
        ...newCategory,
        type: activeTab
      });
      
      alert('เพิ่มหมวดหมู่สำเร็จ!');
      setNewCategory({ name: '', type: activeTab, description: '' });
      setShowAddForm(false);
      fetchCategories();
    } catch (err) {
      console.error('Error adding category:', err);
      const errorMessage = err.response?.data?.error?.message || err.message;
      alert('เกิดข้อผิดพลาด: ' + errorMessage);
    }
  };

  const handleEditClick = (category) => {
    setEditingId(category.id);
    setEditFormData({
      name: category.name,
      description: category.description || ''
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleEditSave = async (categoryId) => {
    try {
      await api.put(`/accounting/categories/${categoryId}`, editFormData);
      
      alert('อัปเดตหมวดหมู่สำเร็จ!');
      setEditingId(null);
      setEditFormData({});
      fetchCategories();
    } catch (err) {
      console.error('Error updating category:', err);
      const errorMessage = err.response?.data?.error?.message || err.message;
      alert('เกิดข้อผิดพลาด: ' + errorMessage);
    }
  };

  const handleDeactivate = async (category) => {
    // Check if category can be deleted
    try {
      const canDeleteResponse = await api.get(`/accounting/categories/${category.id}/can-delete`);
      const canDelete = canDeleteResponse.data.canDelete;
      const usageCount = canDeleteResponse.data.usageCount || 0;

      if (!canDelete && usageCount > 0) {
        if (!window.confirm(
          `หมวดหมู่ "${category.name}" มีการใช้งานอยู่ ${usageCount} รายการ\n\n` +
          'คุณต้องการปิดการใช้งานหมวดหมู่นี้หรือไม่?\n' +
          '(หมวดหมู่จะไม่ถูกลบ แต่จะไม่สามารถเลือกใช้งานใหม่ได้)'
        )) {
          return;
        }
      } else {
        if (!window.confirm(`ต้องการปิดการใช้งานหมวดหมู่ "${category.name}" ใช่หรือไม่?`)) {
          return;
        }
      }

      await api.delete(`/accounting/categories/${category.id}`);
      alert('ปิดการใช้งานหมวดหมู่สำเร็จ!');
      fetchCategories();
    } catch (err) {
      console.error('Error deactivating category:', err);
      const errorCode = err.response?.data?.error?.code;
      const errorMessage = err.response?.data?.error?.message;
      
      if (errorCode === 'CATEGORY_IN_USE') {
        alert(
          '❌ ไม่สามารถลบหมวดหมู่ได้\n\n' +
          errorMessage + '\n\n' +
          '💡 หมวดหมู่จะถูกปิดการใช้งานแทน'
        );
      } else {
        alert('เกิดข้อผิดพลาด: ' + (errorMessage || err.message));
      }
    }
  };

  if (loading) {
    return (
      <div className="accounting-category-management">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="accounting-category-management">
      <div className="page-header">
        <h1>📁 จัดการหมวดหมู่รายรับ-รายจ่าย</h1>
        <p className="subtitle">จัดการหมวดหมู่สำหรับบันทึกรายรับและรายจ่ายของร้าน</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="category-tabs">
        <button
          className={`tab-btn ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('income');
            setShowAddForm(false);
            setEditingId(null);
          }}
        >
          💰 รายรับ ({categories.filter(c => c.type === 'income' && c.is_active).length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'expense' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('expense');
            setShowAddForm(false);
            setEditingId(null);
          }}
        >
          💸 รายจ่าย ({categories.filter(c => c.type === 'expense' && c.is_active).length})
        </button>
      </div>

      {/* Add Category Button */}
      <div className="action-bar">
        <button 
          className="btn btn-add" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? '❌ ยกเลิก' : '➕ เพิ่มหมวดหมู่ใหม่'}
        </button>
      </div>

      {/* Add Category Form */}
      {showAddForm && (
        <div className="add-category-form">
          <h3>➕ เพิ่มหมวดหมู่{activeTab === 'income' ? 'รายรับ' : 'รายจ่าย'}ใหม่</h3>
          <form onSubmit={handleAddCategory}>
            <div className="form-row">
              <div className="form-group">
                <label>ชื่อหมวดหมู่ *</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="เช่น ค่าเช่า, ค่าไฟ, ขายสินค้า"
                  required
                  maxLength="100"
                />
              </div>
              <div className="form-group">
                <label>รายละเอียด</label>
                <input
                  type="text"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
                  maxLength="255"
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-cancel" onClick={() => setShowAddForm(false)}>
                ยกเลิก
              </button>
              <button type="submit" className="btn btn-submit">
                ➕ เพิ่มหมวดหมู่
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="categories-list">
        {filteredCategories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h3>ยังไม่มีหมวดหมู่{activeTab === 'income' ? 'รายรับ' : 'รายจ่าย'}</h3>
            <p>เริ่มต้นด้วยการเพิ่มหมวดหมู่แรก</p>
            <button className="btn btn-add" onClick={() => setShowAddForm(true)}>
              ➕ เพิ่มหมวดหมู่แรก
            </button>
          </div>
        ) : (
          <table className="categories-table">
            <thead>
              <tr>
                <th>ชื่อหมวดหมู่</th>
                <th>รายละเอียด</th>
                <th>ประเภท</th>
                <th className="usage-col">จำนวนการใช้งาน</th>
                <th className="actions-col">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map(category => (
                <tr key={category.id} className={category.is_system ? 'system-category' : ''}>
                  <td className="category-name">
                    {editingId === category.id ? (
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="inline-edit-input"
                      />
                    ) : (
                      <>
                        <strong>{category.name}</strong>
                        {category.is_system && (
                          <span className="system-badge" title="หมวดหมู่ระบบ">🔒</span>
                        )}
                      </>
                    )}
                  </td>
                  <td className="category-description">
                    {editingId === category.id ? (
                      <input
                        type="text"
                        value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        className="inline-edit-input"
                        placeholder="รายละเอียด"
                      />
                    ) : (
                      category.description || '-'
                    )}
                  </td>
                  <td className="category-type">
                    <span className={`type-badge ${category.type}`}>
                      {category.type === 'income' ? '💰 รายรับ' : '💸 รายจ่าย'}
                    </span>
                  </td>
                  <td className="usage-count">
                    <span className="usage-badge">
                      {category.usage_count || 0} รายการ
                    </span>
                  </td>
                  <td className="category-actions">
                    {editingId === category.id ? (
                      <>
                        <button
                          className="action-btn save-btn"
                          onClick={() => handleEditSave(category.id)}
                          title="บันทึก"
                        >
                          💾 บันทึก
                        </button>
                        <button
                          className="action-btn cancel-btn"
                          onClick={handleEditCancel}
                          title="ยกเลิก"
                        >
                          ❌ ยกเลิก
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEditClick(category)}
                          title="แก้ไข"
                          disabled={category.is_system}
                        >
                          ✏️ แก้ไข
                        </button>
                        <button
                          className="action-btn deactivate-btn"
                          onClick={() => handleDeactivate(category)}
                          title="ปิดการใช้งาน"
                          disabled={category.is_system}
                        >
                          🚫 ปิดใช้งาน
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Box */}
      <div className="info-box">
        <h4>💡 คำแนะนำ</h4>
        <ul>
          <li>หมวดหมู่ที่มีไอคอน 🔒 เป็นหมวดหมู่ระบบที่ไม่สามารถแก้ไขหรือลบได้</li>
          <li>หมวดหมู่ที่มีการใช้งานแล้วจะไม่สามารถลบได้ แต่สามารถปิดการใช้งานได้</li>
          <li>การปิดการใช้งานหมวดหมู่จะทำให้ไม่สามารถเลือกใช้งานใหม่ได้ แต่ข้อมูลเดิมยังคงอยู่</li>
          <li>คุณสามารถเพิ่มหมวดหมู่ใหม่ได้ตามความต้องการของร้าน</li>
        </ul>
      </div>
    </div>
  );
};

export default AccountingCategoryManagement;
