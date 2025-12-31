const fs = require('fs').promises;
const path = require('path');
const logger = require('../config/logger');

/**
 * Image optimization utilities
 * Note: For production, consider using sharp library for actual image processing
 * This is a basic implementation focusing on file management
 */

/**
 * Validate image file
 * @param {Object} file - Multer file object
 * @returns {boolean}
 */
const validateImage = (file) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
  }

  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit.');
  }

  return true;
};

/**
 * Generate optimized filename
 * @param {string} originalName - Original filename
 * @param {string} prefix - Prefix for filename (e.g., product ID)
 * @returns {string}
 */
const generateOptimizedFilename = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const ext = path.extname(originalName).toLowerCase();
  const sanitizedPrefix = prefix.replace(/[^a-z0-9]/gi, '_');
  
  return `${sanitizedPrefix}_${timestamp}${ext}`;
};

/**
 * Get image dimensions from file
 * Note: This is a placeholder. In production, use sharp or image-size library
 * @param {string} filePath - Path to image file
 * @returns {Object}
 */
const getImageDimensions = async (filePath) => {
  try {
    // Placeholder implementation
    // In production, use: const sharp = require('sharp');
    // const metadata = await sharp(filePath).metadata();
    // return { width: metadata.width, height: metadata.height };
    
    return { width: 0, height: 0 };
  } catch (error) {
    logger.error('Error getting image dimensions', { error: error.message });
    return { width: 0, height: 0 };
  }
};

/**
 * Clean up old image files
 * @param {string} directory - Directory to clean
 * @param {number} maxAge - Maximum age in days
 */
const cleanupOldImages = async (directory, maxAge = 30) => {
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();
    const maxAgeMs = maxAge * 24 * 60 * 60 * 1000;
    let cleaned = 0;

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      
      if (stats.isFile() && (now - stats.mtimeMs) > maxAgeMs) {
        await fs.unlink(filePath);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} old images from ${directory}`);
    }

    return cleaned;
  } catch (error) {
    logger.error('Error cleaning up old images', { error: error.message });
    return 0;
  }
};

/**
 * Ensure upload directories exist
 * @param {Array<string>} directories - Array of directory paths
 */
const ensureUploadDirectories = async (directories) => {
  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
      logger.debug(`Ensured directory exists: ${dir}`);
    } catch (error) {
      logger.error(`Error creating directory ${dir}`, { error: error.message });
    }
  }
};

/**
 * Get file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string}
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Delete image file safely
 * @param {string} filePath - Path to file
 */
const deleteImage = async (filePath) => {
  try {
    await fs.unlink(filePath);
    logger.info(`Deleted image: ${filePath}`);
    return true;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error('Error deleting image', { filePath, error: error.message });
    }
    return false;
  }
};

module.exports = {
  validateImage,
  generateOptimizedFilename,
  getImageDimensions,
  cleanupOldImages,
  ensureUploadDirectories,
  formatFileSize,
  deleteImage
};
