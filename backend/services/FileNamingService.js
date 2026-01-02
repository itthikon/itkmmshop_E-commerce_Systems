const fs = require('fs');
const path = require('path');

/**
 * FileNamingService
 * 
 * Service for handling SKU-based file naming and management for product images.
 * Provides methods to generate SKU-based filenames, delete old images, and rename files.
 */
class FileNamingService {
  /**
   * Generate SKU-based filename for product images
   * 
   * @param {string} sku - Product SKU (e.g., "ELEC00001")
   * @param {string} originalFilename - Original file name with extension
   * @returns {string} - New filename in format "{SKU}.{extension}" (e.g., "ELEC00001.jpg")
   * @throws {Error} - If SKU or originalFilename is invalid
   * 
   * @example
   * generateProductImageName('ELEC00001', 'photo.jpg')
   * // Returns: 'ELEC00001.jpg'
   * 
   * @example
   * generateProductImageName('FASH00123', 'image.PNG')
   * // Returns: 'FASH00123.png'
   */
  static generateProductImageName(sku, originalFilename) {
    if (!sku || typeof sku !== 'string') {
      throw new Error('Invalid SKU: SKU must be a non-empty string');
    }

    if (!originalFilename || typeof originalFilename !== 'string') {
      throw new Error('Invalid filename: originalFilename must be a non-empty string');
    }

    const extension = path.extname(originalFilename).toLowerCase();
    
    if (!extension) {
      throw new Error('Invalid filename: No file extension found');
    }

    return `${sku}${extension}`;
  }

  /**
   * Delete old product image files with the same SKU
   * 
   * Searches for and deletes any existing image files with the given SKU
   * and common image extensions (.jpg, .jpeg, .png)
   * 
   * @param {string} sku - Product SKU
   * @param {string} uploadsDir - Upload directory path
   * @returns {Promise<string[]>} - Array of deleted filenames
   * @throws {Error} - If SKU or uploadsDir is invalid
   * 
   * @example
   * await deleteOldProductImage('ELEC00001', './uploads/products')
   * // Deletes: ELEC00001.jpg, ELEC00001.jpeg, ELEC00001.png if they exist
   * // Returns: ['ELEC00001.jpg', 'ELEC00001.png']
   */
  static async deleteOldProductImage(sku, uploadsDir) {
    if (!sku || typeof sku !== 'string') {
      throw new Error('Invalid SKU: SKU must be a non-empty string');
    }

    if (!uploadsDir || typeof uploadsDir !== 'string') {
      throw new Error('Invalid uploadsDir: uploadsDir must be a non-empty string');
    }

    const extensions = ['.jpg', '.jpeg', '.png'];
    const deletedFiles = [];

    for (const ext of extensions) {
      const filename = `${sku}${ext}`;
      const filePath = path.join(uploadsDir, filename);

      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deletedFiles.push(filename);
          console.log(`Deleted old image: ${filename}`);
        }
      } catch (err) {
        console.error(`Error deleting file ${filename}:`, err.message);
        throw new Error(`Failed to delete old image ${filename}: ${err.message}`);
      }
    }

    return deletedFiles;
  }

  /**
   * Rename uploaded file to SKU format
   * 
   * Renames the file at currentPath to use SKU-based naming.
   * Automatically deletes any old images with the same SKU before renaming.
   * 
   * @param {string} currentPath - Current file path
   * @param {string} sku - Product SKU
   * @returns {Promise<string>} - New filename (not full path, just filename)
   * @throws {Error} - If file operations fail or parameters are invalid
   * 
   * @example
   * await renameToSKUFormat('/uploads/products/temp-12345.jpg', 'ELEC00001')
   * // Returns: 'ELEC00001.jpg'
   * // File is renamed from temp-12345.jpg to ELEC00001.jpg
   */
  static async renameToSKUFormat(currentPath, sku) {
    if (!currentPath || typeof currentPath !== 'string') {
      throw new Error('Invalid currentPath: currentPath must be a non-empty string');
    }

    if (!sku || typeof sku !== 'string') {
      throw new Error('Invalid SKU: SKU must be a non-empty string');
    }

    // Check if current file exists
    if (!fs.existsSync(currentPath)) {
      throw new Error(`File not found: ${currentPath}`);
    }

    const extension = path.extname(currentPath);
    const directory = path.dirname(currentPath);
    const newFilename = `${sku}${extension}`;
    const newPath = path.join(directory, newFilename);

    try {
      // Delete old image with same SKU if exists
      await this.deleteOldProductImage(sku, directory);

      // Rename current file to SKU format
      fs.renameSync(currentPath, newPath);
      console.log(`Renamed file: ${path.basename(currentPath)} -> ${newFilename}`);

      return newFilename;
    } catch (err) {
      console.error('Error renaming file:', err.message);
      throw new Error(`Failed to rename file to SKU format: ${err.message}`);
    }
  }
}

module.exports = FileNamingService;
