import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import './SKUPreview.css';

/**
 * SKU Preview Component
 * Displays auto-generated SKU based on selected category
 * Requirements: 1.5, 8.1, 8.4
 */
const SKUPreview = ({ categoryId, onSKUGenerated, existingSKU = null }) => {
  const [sku, setSku] = useState(existingSKU || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If editing existing product, show existing SKU
    if (existingSKU) {
      setSku(existingSKU);
      return;
    }

    // Clear SKU when category changes (don't auto-generate)
    if (categoryId !== undefined && sku) {
      setSku('');
      setError(null);
      if (onSKUGenerated) {
        onSKUGenerated('');
      }
    }
  }, [categoryId, existingSKU]);

  const generateSKUPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      // Convert empty string to null for API call
      const categoryIdValue = categoryId === '' || categoryId === undefined ? null : parseInt(categoryId);
      
      const response = await api.post('/products/generate-sku', {
        category_id: categoryIdValue
      });

      const generatedSKU = response.data.data.sku;
      setSku(generatedSKU);

      // Notify parent component
      if (onSKUGenerated) {
        onSKUGenerated(generatedSKU);
      }
    } catch (err) {
      console.error('SKU generation error:', err);
      const errorMessage = err.response?.data?.error?.message || err.message || 'ไม่สามารถสร้าง SKU ได้';
      setError(errorMessage);
      setSku('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sku-preview-container">
      <label className="sku-preview-label">
        SKU (สร้างอัตโนมัติ)
        <span className="required-indicator">*</span>
      </label>
      
      <div className="sku-preview-wrapper">
        <div className={`sku-display ${loading ? 'loading' : ''} ${error ? 'error' : ''}`}>
          {loading ? (
            <div className="sku-loading">
              <span className="loading-spinner"></span>
              <span className="loading-text">กำลังสร้าง SKU...</span>
            </div>
          ) : error ? (
            <span className="sku-error">{error}</span>
          ) : sku ? (
            <span className="sku-value">{sku}</span>
          ) : (
            <span className="sku-placeholder">กดปุ่มเพื่อสร้าง SKU</span>
          )}
        </div>

        {!existingSKU && (
          <button
            type="button"
            className="generate-sku-btn"
            onClick={generateSKUPreview}
            disabled={loading || !categoryId}
            title={!categoryId ? 'กรุณาเลือกหมวดหมู่ก่อน' : 'สร้าง SKU อัตโนมัติ'}
          >
            {sku ? '🔄 สร้างใหม่' : '✨ สร้าง SKU'}
          </button>
        )}
      </div>

      {!existingSKU && !sku && (
        <p className="sku-hint">
          💡 เลือกหมวดหมู่แล้วกดปุ่ม "สร้าง SKU" เพื่อสร้างรหัสสินค้าอัตโนมัติ
        </p>
      )}

      {!existingSKU && sku && (
        <p className="sku-hint success-hint">
          ✅ SKU ถูกสร้างแล้ว - สามารถกดสร้างใหม่ได้หากต้องการเปลี่ยน
        </p>
      )}

      {existingSKU && (
        <p className="sku-hint sku-immutable">
          🔒 SKU ไม่สามารถแก้ไขได้หลังจากสร้างสินค้าแล้ว
        </p>
      )}
    </div>
  );
};

export default SKUPreview;
