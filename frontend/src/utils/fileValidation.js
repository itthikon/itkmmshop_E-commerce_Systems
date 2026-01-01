/**
 * File validation utilities for payment slip uploads
 */

// Allowed image file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Validates an image file for payment slip upload
 * @param {File} file - The file to validate
 * @returns {Object} - { valid: boolean, error: string|null }
 */
export const validateImageFile = (file) => {
  // Check if file exists
  if (!file) {
    return {
      valid: false,
      error: 'กรุณาเลือกไฟล์สลิปการโอนเงิน'
    };
  }

  // Check file type by MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'กรุณาเลือกไฟล์รูปภาพ (.jpg, .jpeg, .png) เท่านั้น'
    };
  }

  // Additional check: validate file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  
  if (!hasValidExtension) {
    return {
      valid: false,
      error: 'กรุณาเลือกไฟล์รูปภาพ (.jpg, .jpeg, .png) เท่านั้น'
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `ขนาดไฟล์ต้องไม่เกิน 5MB (ไฟล์ของคุณมีขนาด ${formatFileSize(file.size)})`
    };
  }

  // All validations passed
  return {
    valid: true,
    error: null
  };
};

/**
 * Generates a preview URL from a File object
 * @param {File} file - The file to generate preview for
 * @returns {Promise<string>} - Promise that resolves to the preview URL
 */
export const generatePreview = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    // Validate that it's an image file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      reject(new Error(validation.error));
      return;
    }

    // Create FileReader to read the file
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target.result);
    };

    reader.onerror = () => {
      reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
    };

    // Read file as data URL
    reader.readAsDataURL(file);
  });
};

/**
 * Formats file size from bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Format to 2 decimal places
  const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(2));

  return `${formattedSize} ${sizes[i]}`;
};

/**
 * Checks if a file is an image based on its type
 * @param {File} file - The file to check
 * @returns {boolean} - True if file is an image
 */
export const isImageFile = (file) => {
  if (!file) return false;
  return ALLOWED_IMAGE_TYPES.includes(file.type);
};

/**
 * Gets the file extension from a filename
 * @param {string} filename - The filename
 * @returns {string} - The file extension (e.g., ".jpg")
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot).toLowerCase();
};

/**
 * Validates multiple files at once
 * @param {FileList|Array<File>} files - The files to validate
 * @returns {Object} - { valid: boolean, errors: Array<string>, validFiles: Array<File> }
 */
export const validateMultipleFiles = (files) => {
  const errors = [];
  const validFiles = [];

  Array.from(files).forEach((file, index) => {
    const validation = validateImageFile(file);
    if (validation.valid) {
      validFiles.push(file);
    } else {
      errors.push(`ไฟล์ ${index + 1} (${file.name}): ${validation.error}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    validFiles
  };
};

// Export constants for use in other components
export const FILE_VALIDATION_CONSTANTS = {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_MB: MAX_FILE_SIZE / (1024 * 1024)
};
