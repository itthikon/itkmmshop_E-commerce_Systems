import React, { useState, useRef, useCallback, useMemo } from 'react';
import { validateImageFile, generatePreview, formatFileSize } from '../../utils/fileValidation';
import api from '../../config/api';
import './PaymentSlipUpload.css';

const PaymentSlipUpload = React.memo(({ 
  orderId, 
  orderAmount, 
  onUploadSuccess, 
  onUploadError,
  showInstructions = false 
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  const fileInputRef = useRef(null);

  // Handle file selection with useCallback
  const handleFileSelect = useCallback(async (file) => {
    // Reset states
    setError(null);
    setSuccess(false);
    setPreview(null);
    setSelectedFile(null);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Generate preview
    try {
      const previewUrl = await generatePreview(file);
      setPreview(previewUrl);
      setSelectedFile(file);
    } catch (err) {
      setError(err.message || 'ไม่สามารถแสดงตัวอย่างรูปภาพได้');
    }
  }, []);

  // Handle file input change with useCallback
  const handleFileInputChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle drag events with useCallback
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Handle drop with useCallback
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Handle upload with useCallback
  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setError('กรุณาเลือกไฟล์สลิปการโอนเงิน');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append('slip', selectedFile);
      formData.append('orderId', orderId);
      formData.append('amount', orderAmount);

      // Upload with progress tracking
      const response = await api.post('/payments/upload-slip', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      // Success
      setSuccess(true);
      setUploading(false);
      setUploadProgress(100);

      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(response.data.payment);
      }

    } catch (err) {
      setUploading(false);
      setUploadProgress(0);
      
      const errorMessage = err.message || 'ไม่สามารถอัปโหลดสลิปได้ กรุณาลองใหม่อีกครั้ง';
      setError(errorMessage);

      // Call error callback
      if (onUploadError) {
        onUploadError(err);
      }
    }
  }, [selectedFile, orderId, orderAmount, onUploadSuccess, onUploadError]);

  // Handle clear/reset with useCallback
  const handleClear = useCallback(() => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Trigger file input click with useCallback
  const handleBrowseClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  return (
    <div className="payment-slip-upload">
      {showInstructions && (
        <div className="upload-instructions">
          <h4 className="upload-instructions-title">📤 อัปโหลดสลิปการโอนเงิน</h4>
          <p className="upload-instructions-text">
            กรุณาอัปโหลดสลิปการโอนเงินเพื่อยืนยันการชำระเงิน
          </p>
        </div>
      )}

      {!success ? (
        <>
          {/* Drag & Drop Area */}
          <div
            className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${preview ? 'has-preview' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={!preview ? handleBrowseClick : undefined}
            role="button"
            tabIndex={!preview ? 0 : -1}
            onKeyDown={!preview ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleBrowseClick();
              }
            } : undefined}
            aria-label={!preview ? "คลิกหรือลากไฟล์มาวางเพื่ออัปโหลดสลิปการชำระเงิน" : "ตัวอย่างสลิปการชำระเงิน"}
          >
            {!preview ? (
              <div className="dropzone-content">
                <div className="dropzone-icon">📁</div>
                <p className="dropzone-text">
                  ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
                </p>
                <p className="dropzone-hint">
                  รองรับไฟล์: .jpg, .jpeg, .png (ขนาดไม่เกิน 5MB)
                </p>
              </div>
            ) : (
              <div className="preview-container">
                <img 
                  src={preview} 
                  alt="ตัวอย่างสลิปการชำระเงิน" 
                  className="preview-image"
                  role="img"
                />
                <div className="preview-overlay">
                  <button 
                    type="button"
                    className="preview-clear-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                    aria-label="เปลี่ยนรูปสลิปการชำระเงิน"
                  >
                    ✕ เปลี่ยนรูป
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            onChange={handleFileInputChange}
            className="file-input-hidden"
            aria-label="เลือกไฟล์สลิปการชำระเงิน"
          />

          {/* File info */}
          {selectedFile && !uploading && (
            <div className="file-info">
              <span className="file-name">📎 {selectedFile.name}</span>
              <span className="file-size">({formatFileSize(selectedFile.size)})</span>
            </div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="progress-text">กำลังอัปโหลด... {uploadProgress}%</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="upload-message error-message">
              <span className="message-icon">⚠️</span>
              <span className="message-text">{error}</span>
            </div>
          )}

          {/* Upload button */}
          {selectedFile && !uploading && (
            <button
              type="button"
              className="upload-btn"
              onClick={handleUpload}
              disabled={uploading}
              aria-label="อัปโหลดสลิปการชำระเงิน"
            >
              {uploading ? 'กำลังอัปโหลด...' : '✓ อัปโหลดสลิป'}
            </button>
          )}
        </>
      ) : (
        /* Success message */
        <div className="upload-success">
          <div className="success-icon">✓</div>
          <h4 className="success-title">อัปโหลดสลิปสำเร็จ!</h4>
          <p className="success-text">
            ระบบได้รับสลิปการโอนเงินของคุณแล้ว<br />
            เจ้าหน้าที่จะตรวจสอบและยืนยันการชำระเงินภายใน 24 ชั่วโมง
          </p>
          <button
            type="button"
            className="upload-another-btn"
            onClick={handleClear}
            aria-label="อัปโหลดสลิปใหม่"
          >
            อัปโหลดใหม่
          </button>
        </div>
      )}
    </div>
  );
});

PaymentSlipUpload.displayName = 'PaymentSlipUpload';

export default PaymentSlipUpload;
