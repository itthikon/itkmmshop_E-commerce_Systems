/**
 * Integration Tests for PaymentSlipUpload Component
 * Tests validation error display and upload flow
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PaymentSlipUpload from '../PaymentSlipUpload';
import api from '../../../config/api';
import * as fileValidation from '../../../utils/fileValidation';

// Mock the API
jest.mock('../../../config/api');

// Mock file validation
jest.mock('../../../utils/fileValidation', () => ({
  validateImageFile: jest.fn(),
  generatePreview: jest.fn(),
  formatFileSize: jest.fn((bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`)
}));

describe('PaymentSlipUpload - Validation Errors', () => {
  const mockProps = {
    orderId: 123,
    orderAmount: 1500.00,
    onUploadSuccess: jest.fn(),
    onUploadError: jest.fn(),
    showInstructions: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display error for invalid file type', async () => {
    // Mock validation to return error
    fileValidation.validateImageFile.mockReturnValue({
      valid: false,
      error: 'กรุณาเลือกไฟล์รูปภาพ (.jpg, .jpeg, .png) เท่านั้น'
    });

    render(<PaymentSlipUpload {...mockProps} />);

    // Create a PDF file
    const pdfFile = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });

    // Get file input - it's hidden
    const fileInput = document.querySelector('input[type="file"]');

    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });

    // Should display error message
    await waitFor(() => {
      expect(screen.getByText('กรุณาเลือกไฟล์รูปภาพ (.jpg, .jpeg, .png) เท่านั้น')).toBeInTheDocument();
    });

    // Should show error icon
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  test('should display error for oversized file', async () => {
    // Mock validation to return size error
    fileValidation.validateImageFile.mockReturnValue({
      valid: false,
      error: 'ขนาดไฟล์ต้องไม่เกิน 5MB (ไฟล์ของคุณมีขนาด 7.50 MB)'
    });

    render(<PaymentSlipUpload {...mockProps} />);

    // Create a large file
    const largeFile = new File(['x'.repeat(7 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    // Should display error message
    await waitFor(() => {
      expect(screen.getByText(/ขนาดไฟล์ต้องไม่เกิน 5MB/)).toBeInTheDocument();
    });
  });

  test('should display preview for valid file', async () => {
    // Mock validation to succeed
    fileValidation.validateImageFile.mockReturnValue({
      valid: true,
      error: null
    });

    // Mock preview generation
    fileValidation.generatePreview.mockResolvedValue('data:image/jpeg;base64,mockpreview');

    render(<PaymentSlipUpload {...mockProps} />);

    // Create a valid file
    const validFile = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    // Should display preview
    await waitFor(() => {
      const previewImage = document.querySelector('.preview-image');
      expect(previewImage).toBeInTheDocument();
      expect(previewImage).toHaveAttribute('src', 'data:image/jpeg;base64,mockpreview');
    });

    // Should show file info
    expect(screen.getByText('📎 test.jpg')).toBeInTheDocument();

    // Should show upload button
    expect(screen.getByText('✓ อัปโหลดสลิป')).toBeInTheDocument();
  });

  test('should handle upload success', async () => {
    // Mock validation to succeed
    fileValidation.validateImageFile.mockReturnValue({
      valid: true,
      error: null
    });

    fileValidation.generatePreview.mockResolvedValue('data:image/jpeg;base64,mockpreview');

    // Mock API success
    api.post.mockResolvedValue({
      data: {
        success: true,
        payment: { id: 1, status: 'pending' }
      }
    });

    render(<PaymentSlipUpload {...mockProps} />);

    // Select file
    const validFile = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(screen.getByText('✓ อัปโหลดสลิป')).toBeInTheDocument();
    });

    // Click upload button
    const uploadButton = screen.getByText('✓ อัปโหลดสลิป');
    fireEvent.click(uploadButton);

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('อัปโหลดสลิปสำเร็จ!')).toBeInTheDocument();
      expect(screen.getByText(/ระบบได้รับสลิปการโอนเงินของคุณแล้ว/)).toBeInTheDocument();
    });

    // Should call success callback
    expect(mockProps.onUploadSuccess).toHaveBeenCalledWith({ id: 1, status: 'pending' });
  });

  test('should handle upload error', async () => {
    // Mock validation to succeed
    fileValidation.validateImageFile.mockReturnValue({
      valid: true,
      error: null
    });

    fileValidation.generatePreview.mockResolvedValue('data:image/jpeg;base64,mockpreview');

    // Mock API error
    api.post.mockRejectedValue({
      message: 'Network error'
    });

    render(<PaymentSlipUpload {...mockProps} />);

    // Select file
    const validFile = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(screen.getByText('✓ อัปโหลดสลิป')).toBeInTheDocument();
    });

    // Click upload button
    const uploadButton = screen.getByText('✓ อัปโหลดสลิป');
    fireEvent.click(uploadButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Should call error callback
    expect(mockProps.onUploadError).toHaveBeenCalled();
  });

  test('should show upload progress during upload', async () => {
    // Mock validation to succeed
    fileValidation.validateImageFile.mockReturnValue({
      valid: true,
      error: null
    });

    fileValidation.generatePreview.mockResolvedValue('data:image/jpeg;base64,mockpreview');

    // Mock API with progress
    api.post.mockImplementation((url, data, config) => {
      // Simulate progress
      if (config.onUploadProgress) {
        config.onUploadProgress({ loaded: 50, total: 100 });
      }
      return new Promise((resolve) => {
        setTimeout(() => {
          if (config.onUploadProgress) {
            config.onUploadProgress({ loaded: 100, total: 100 });
          }
          resolve({
            data: {
              success: true,
              payment: { id: 1, status: 'pending' }
            }
          });
        }, 100);
      });
    });

    render(<PaymentSlipUpload {...mockProps} />);

    // Select file
    const validFile = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(screen.getByText('✓ อัปโหลดสลิป')).toBeInTheDocument();
    });

    // Click upload button
    const uploadButton = screen.getByText('✓ อัปโหลดสลิป');
    fireEvent.click(uploadButton);

    // Should show progress
    await waitFor(() => {
      expect(screen.getByText(/กำลังอัปโหลด\.\.\./)).toBeInTheDocument();
    });
  });

  test('should allow clearing and re-selecting file', async () => {
    // Mock validation to succeed
    fileValidation.validateImageFile.mockReturnValue({
      valid: true,
      error: null
    });

    fileValidation.generatePreview.mockResolvedValue('data:image/jpeg;base64,mockpreview');

    render(<PaymentSlipUpload {...mockProps} />);

    // Select file
    const validFile = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(document.querySelector('.preview-image')).toBeInTheDocument();
    });

    // Click clear button
    const clearButton = screen.getByText('✕ เปลี่ยนรูป');
    fireEvent.click(clearButton);

    // Preview should be removed
    await waitFor(() => {
      expect(document.querySelector('.preview-image')).not.toBeInTheDocument();
    });

    // Should show dropzone again
    expect(screen.getByText('ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์')).toBeInTheDocument();
  });

  test('should display instructions when showInstructions is true', () => {
    render(<PaymentSlipUpload {...mockProps} showInstructions={true} />);

    expect(screen.getByText('📤 อัปโหลดสลิปการโอนเงิน')).toBeInTheDocument();
    expect(screen.getByText('กรุณาอัปโหลดสลิปการโอนเงินเพื่อยืนยันการชำระเงิน')).toBeInTheDocument();
  });

  test('should NOT display instructions when showInstructions is false', () => {
    render(<PaymentSlipUpload {...mockProps} showInstructions={false} />);

    expect(screen.queryByText('📤 อัปโหลดสลิปการโอนเงิน')).not.toBeInTheDocument();
  });

  test('should handle drag and drop', async () => {
    // Mock validation to succeed
    fileValidation.validateImageFile.mockReturnValue({
      valid: true,
      error: null
    });

    fileValidation.generatePreview.mockResolvedValue('data:image/jpeg;base64,mockpreview');

    render(<PaymentSlipUpload {...mockProps} />);

    const dropzone = screen.getByText('ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์').closest('.upload-dropzone');

    // Simulate drag enter
    fireEvent.dragEnter(dropzone);
    expect(dropzone).toHaveClass('drag-active');

    // Simulate drop
    const validFile = new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [validFile]
      }
    });

    // Should display preview
    await waitFor(() => {
      expect(document.querySelector('.preview-image')).toBeInTheDocument();
    });
  });
});
