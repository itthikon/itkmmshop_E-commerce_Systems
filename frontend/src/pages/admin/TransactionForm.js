import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TransactionForm.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

const TransactionForm = ({ transaction, categories, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    transaction_type: 'expense',
    category_id: '',
    amount: '',
    transaction_date: new Date().toISOString().split('T')[0],
    description: ''
  });
  
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filteredCategories, setFilteredCategories] = useState([]);

  useEffect(() => {
    // If editing, populate form with transaction data
    if (transaction) {
      setFormData({
        transaction_type: transaction.transaction_type,
        category_id: transaction.category_id,
        amount: Math.abs(transaction.amount).toString(),
        transaction_date: transaction.transaction_date.split('T')[0],
        description: transaction.description || ''
      });
    }
  }, [transaction]);

  useEffect(() => {
    // Filter categories based on transaction type
    const filtered = categories.filter(cat => 
      cat.type === formData.transaction_type && cat.is_active
    );
    setFilteredCategories(filtered);
    
    // Reset category if it doesn't match the new type
    if (formData.category_id) {
      const categoryExists = filtered.find(cat => cat.id === parseInt(formData.category_id));
      if (!categoryExists) {
        setFormData(prev => ({ ...prev, category_id: '' }));
      }
    }
  }, [formData.transaction_type, categories]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 5MB)');
        e.target.value = '';
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError('ประเภทไฟล์ไม่ถูกต้อง (รองรับเฉพาะ PDF, JPG, PNG)');
        e.target.value = '';
        return;
      }
      
      setAttachment(file);
      setError(null);
    }
  };

  const validateForm = () => {
    if (!formData.transaction_type) {
      setError('กรุณาเลือกประเภทรายการ');
      return false;
    }
    
    if (!formData.category_id) {
      setError('กรุณาเลือกหมวดหมู่');
      return false;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('กรุณากรอกจำนวนเงินที่มากกว่า 0');
      return false;
    }
    
    if (!formData.transaction_date) {
      setError('กรุณาเลือกวันที่');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      let response;
      if (transaction) {
        // Update existing transaction
        response = await axios.put(
          `${API_URL}/accounting/transactions/${transaction.id}`,
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        // Create new transaction
        response = await axios.post(
          `${API_URL}/accounting/transactions`,
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      if (response.data.success) {
        const transactionId = transaction ? transaction.id : response.data.data.id;
        
        // Upload attachment if provided
        if (attachment) {
          const formDataAttachment = new FormData();
          formDataAttachment.append('attachment', attachment);
          
          await axios.post(
            `${API_URL}/accounting/transactions/${transactionId}/attachment`,
            formDataAttachment,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          );
        }
        
        alert(transaction ? 'แก้ไขรายการสำเร็จ' : 'เพิ่มรายการสำเร็จ');
        onSuccess();
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
      setError(err.response?.data?.error || 'ไม่สามารถบันทึกรายการได้');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content transaction-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{transaction ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="transaction-form">
          {error && (
            <div className="error-message">{error}</div>
          )}

          {/* Transaction Type */}
          <div className="form-group">
            <label className="form-label required">ประเภทรายการ</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="transaction_type"
                  value="income"
                  checked={formData.transaction_type === 'income'}
                  onChange={(e) => handleInputChange('transaction_type', e.target.value)}
                  disabled={!!transaction}
                />
                <span className="radio-text income">รายรับ</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="transaction_type"
                  value="expense"
                  checked={formData.transaction_type === 'expense'}
                  onChange={(e) => handleInputChange('transaction_type', e.target.value)}
                  disabled={!!transaction}
                />
                <span className="radio-text expense">รายจ่าย</span>
              </label>
            </div>
            {transaction && (
              <p className="form-hint">ไม่สามารถเปลี่ยนประเภทรายการได้</p>
            )}
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label required">หมวดหมู่</label>
            <select
              value={formData.category_id}
              onChange={(e) => handleInputChange('category_id', e.target.value)}
              className="form-input"
              required
            >
              <option value="">-- เลือกหมวดหมู่ --</option>
              {filteredCategories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label required">จำนวนเงิน (บาท)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className="form-input"
              placeholder="0.00"
              required
            />
          </div>

          {/* Date */}
          <div className="form-group">
            <label className="form-label required">วันที่</label>
            <input
              type="date"
              value={formData.transaction_date}
              onChange={(e) => handleInputChange('transaction_date', e.target.value)}
              className="form-input"
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">รายละเอียด</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="form-input form-textarea"
              placeholder="บันทึกรายละเอียดเพิ่มเติม..."
              rows="4"
            />
          </div>

          {/* Attachment */}
          <div className="form-group">
            <label className="form-label">แนบไฟล์ (ถ้ามี)</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="form-input file-input"
            />
            <p className="form-hint">
              รองรับไฟล์ PDF, JPG, PNG ขนาดไม่เกิน 5MB
            </p>
            {attachment && (
              <p className="file-selected">
                ✓ เลือกไฟล์: {attachment.name}
              </p>
            )}
            {transaction && transaction.attachment_path && (
              <p className="file-existing">
                📎 มีไฟล์แนบอยู่แล้ว
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'กำลังบันทึก...' : (transaction ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
