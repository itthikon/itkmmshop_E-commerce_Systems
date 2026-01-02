/**
 * Unit Tests for FileNamingService
 * Feature: product-image-camera
 * Tests SKU-based file naming and management for product images
 */

const fs = require('fs');
const path = require('path');
const FileNamingService = require('../services/FileNamingService');

describe('FileNamingService - Unit Tests', () => {
  const testUploadsDir = path.join(__dirname, 'test-uploads');

  // Setup: Create test uploads directory
  beforeAll(() => {
    if (!fs.existsSync(testUploadsDir)) {
      fs.mkdirSync(testUploadsDir, { recursive: true });
    }
  });

  // Cleanup: Remove test uploads directory and all files
  afterAll(() => {
    if (fs.existsSync(testUploadsDir)) {
      const files = fs.readdirSync(testUploadsDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(testUploadsDir, file));
      });
      fs.rmdirSync(testUploadsDir);
    }
  });

  // Clean up test files after each test
  afterEach(() => {
    if (fs.existsSync(testUploadsDir)) {
      const files = fs.readdirSync(testUploadsDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(testUploadsDir, file));
      });
    }
  });

  describe('generateProductImageName', () => {
    test('should generate SKU-based filename with .jpg extension', () => {
      const result = FileNamingService.generateProductImageName('ELEC00001', 'photo.jpg');
      expect(result).toBe('ELEC00001.jpg');
    });

    test('should generate SKU-based filename with .jpeg extension', () => {
      const result = FileNamingService.generateProductImageName('FASH00123', 'image.jpeg');
      expect(result).toBe('FASH00123.jpeg');
    });

    test('should generate SKU-based filename with .png extension', () => {
      const result = FileNamingService.generateProductImageName('GEN00001', 'picture.png');
      expect(result).toBe('GEN00001.png');
    });

    test('should convert extension to lowercase', () => {
      const result = FileNamingService.generateProductImageName('ELEC00001', 'photo.JPG');
      expect(result).toBe('ELEC00001.jpg');
    });

    test('should handle uppercase PNG extension', () => {
      const result = FileNamingService.generateProductImageName('FASH00123', 'image.PNG');
      expect(result).toBe('FASH00123.png');
    });

    test('should handle mixed case extension', () => {
      const result = FileNamingService.generateProductImageName('GEN00001', 'picture.JpEg');
      expect(result).toBe('GEN00001.jpeg');
    });

    test('should throw error for invalid SKU (empty string)', () => {
      expect(() => {
        FileNamingService.generateProductImageName('', 'photo.jpg');
      }).toThrow('Invalid SKU: SKU must be a non-empty string');
    });

    test('should throw error for invalid SKU (null)', () => {
      expect(() => {
        FileNamingService.generateProductImageName(null, 'photo.jpg');
      }).toThrow('Invalid SKU: SKU must be a non-empty string');
    });

    test('should throw error for invalid SKU (undefined)', () => {
      expect(() => {
        FileNamingService.generateProductImageName(undefined, 'photo.jpg');
      }).toThrow('Invalid SKU: SKU must be a non-empty string');
    });

    test('should throw error for invalid SKU (number)', () => {
      expect(() => {
        FileNamingService.generateProductImageName(12345, 'photo.jpg');
      }).toThrow('Invalid SKU: SKU must be a non-empty string');
    });

    test('should throw error for invalid filename (empty string)', () => {
      expect(() => {
        FileNamingService.generateProductImageName('ELEC00001', '');
      }).toThrow('Invalid filename: originalFilename must be a non-empty string');
    });

    test('should throw error for invalid filename (null)', () => {
      expect(() => {
        FileNamingService.generateProductImageName('ELEC00001', null);
      }).toThrow('Invalid filename: originalFilename must be a non-empty string');
    });

    test('should throw error for invalid filename (undefined)', () => {
      expect(() => {
        FileNamingService.generateProductImageName('ELEC00001', undefined);
      }).toThrow('Invalid filename: originalFilename must be a non-empty string');
    });

    test('should throw error for filename without extension', () => {
      expect(() => {
        FileNamingService.generateProductImageName('ELEC00001', 'photo');
      }).toThrow('Invalid filename: No file extension found');
    });

    test('should handle complex filenames with multiple dots', () => {
      const result = FileNamingService.generateProductImageName('ELEC00001', 'my.photo.image.jpg');
      expect(result).toBe('ELEC00001.jpg');
    });

    test('should handle filenames with spaces', () => {
      const result = FileNamingService.generateProductImageName('ELEC00001', 'my photo.jpg');
      expect(result).toBe('ELEC00001.jpg');
    });

    test('should handle filenames with special characters', () => {
      const result = FileNamingService.generateProductImageName('ELEC00001', 'photo-2024_01.jpg');
      expect(result).toBe('ELEC00001.jpg');
    });
  });

  describe('deleteOldProductImage', () => {
    test('should delete existing .jpg file', async () => {
      // Create test file
      const testFile = path.join(testUploadsDir, 'ELEC00001.jpg');
      fs.writeFileSync(testFile, 'test content');
      expect(fs.existsSync(testFile)).toBe(true);

      // Delete old image
      const deleted = await FileNamingService.deleteOldProductImage('ELEC00001', testUploadsDir);

      // Verify file was deleted
      expect(fs.existsSync(testFile)).toBe(false);
      expect(deleted).toContain('ELEC00001.jpg');
      expect(deleted.length).toBe(1);
    });

    test('should delete existing .jpeg file', async () => {
      // Create test file
      const testFile = path.join(testUploadsDir, 'FASH00123.jpeg');
      fs.writeFileSync(testFile, 'test content');
      expect(fs.existsSync(testFile)).toBe(true);

      // Delete old image
      const deleted = await FileNamingService.deleteOldProductImage('FASH00123', testUploadsDir);

      // Verify file was deleted
      expect(fs.existsSync(testFile)).toBe(false);
      expect(deleted).toContain('FASH00123.jpeg');
      expect(deleted.length).toBe(1);
    });

    test('should delete existing .png file', async () => {
      // Create test file
      const testFile = path.join(testUploadsDir, 'GEN00001.png');
      fs.writeFileSync(testFile, 'test content');
      expect(fs.existsSync(testFile)).toBe(true);

      // Delete old image
      const deleted = await FileNamingService.deleteOldProductImage('GEN00001', testUploadsDir);

      // Verify file was deleted
      expect(fs.existsSync(testFile)).toBe(false);
      expect(deleted).toContain('GEN00001.png');
      expect(deleted.length).toBe(1);
    });

    test('should delete multiple files with same SKU', async () => {
      // Create multiple test files
      const testFile1 = path.join(testUploadsDir, 'ELEC00001.jpg');
      const testFile2 = path.join(testUploadsDir, 'ELEC00001.jpeg');
      const testFile3 = path.join(testUploadsDir, 'ELEC00001.png');
      
      fs.writeFileSync(testFile1, 'test content 1');
      fs.writeFileSync(testFile2, 'test content 2');
      fs.writeFileSync(testFile3, 'test content 3');

      // Delete old images
      const deleted = await FileNamingService.deleteOldProductImage('ELEC00001', testUploadsDir);

      // Verify all files were deleted
      expect(fs.existsSync(testFile1)).toBe(false);
      expect(fs.existsSync(testFile2)).toBe(false);
      expect(fs.existsSync(testFile3)).toBe(false);
      expect(deleted).toContain('ELEC00001.jpg');
      expect(deleted).toContain('ELEC00001.jpeg');
      expect(deleted).toContain('ELEC00001.png');
      expect(deleted.length).toBe(3);
    });

    test('should return empty array when no files exist', async () => {
      // Don't create any files
      const deleted = await FileNamingService.deleteOldProductImage('ELEC00001', testUploadsDir);

      // Verify empty array returned
      expect(deleted).toEqual([]);
      expect(deleted.length).toBe(0);
    });

    test('should not delete files with different SKU', async () => {
      // Create test files with different SKUs
      const testFile1 = path.join(testUploadsDir, 'ELEC00001.jpg');
      const testFile2 = path.join(testUploadsDir, 'ELEC00002.jpg');
      
      fs.writeFileSync(testFile1, 'test content 1');
      fs.writeFileSync(testFile2, 'test content 2');

      // Delete only ELEC00001
      const deleted = await FileNamingService.deleteOldProductImage('ELEC00001', testUploadsDir);

      // Verify only ELEC00001 was deleted
      expect(fs.existsSync(testFile1)).toBe(false);
      expect(fs.existsSync(testFile2)).toBe(true);
      expect(deleted).toContain('ELEC00001.jpg');
      expect(deleted.length).toBe(1);
    });

    test('should throw error for invalid SKU (empty string)', async () => {
      await expect(
        FileNamingService.deleteOldProductImage('', testUploadsDir)
      ).rejects.toThrow('Invalid SKU: SKU must be a non-empty string');
    });

    test('should throw error for invalid SKU (null)', async () => {
      await expect(
        FileNamingService.deleteOldProductImage(null, testUploadsDir)
      ).rejects.toThrow('Invalid SKU: SKU must be a non-empty string');
    });

    test('should throw error for invalid uploadsDir (empty string)', async () => {
      await expect(
        FileNamingService.deleteOldProductImage('ELEC00001', '')
      ).rejects.toThrow('Invalid uploadsDir: uploadsDir must be a non-empty string');
    });

    test('should throw error for invalid uploadsDir (null)', async () => {
      await expect(
        FileNamingService.deleteOldProductImage('ELEC00001', null)
      ).rejects.toThrow('Invalid uploadsDir: uploadsDir must be a non-empty string');
    });
  });

  describe('renameToSKUFormat', () => {
    test('should rename file to SKU format with .jpg extension', async () => {
      // Create test file
      const tempFile = path.join(testUploadsDir, 'temp-12345.jpg');
      fs.writeFileSync(tempFile, 'test content');
      expect(fs.existsSync(tempFile)).toBe(true);

      // Rename to SKU format
      const newFilename = await FileNamingService.renameToSKUFormat(tempFile, 'ELEC00001');

      // Verify file was renamed
      expect(newFilename).toBe('ELEC00001.jpg');
      expect(fs.existsSync(tempFile)).toBe(false);
      expect(fs.existsSync(path.join(testUploadsDir, 'ELEC00001.jpg'))).toBe(true);
    });

    test('should rename file to SKU format with .png extension', async () => {
      // Create test file
      const tempFile = path.join(testUploadsDir, 'temp-67890.png');
      fs.writeFileSync(tempFile, 'test content');

      // Rename to SKU format
      const newFilename = await FileNamingService.renameToSKUFormat(tempFile, 'FASH00123');

      // Verify file was renamed
      expect(newFilename).toBe('FASH00123.png');
      expect(fs.existsSync(tempFile)).toBe(false);
      expect(fs.existsSync(path.join(testUploadsDir, 'FASH00123.png'))).toBe(true);
    });

    test('should delete old image before renaming', async () => {
      // Create old image
      const oldFile = path.join(testUploadsDir, 'ELEC00001.jpg');
      fs.writeFileSync(oldFile, 'old content');

      // Create new temp file
      const tempFile = path.join(testUploadsDir, 'temp-12345.jpg');
      fs.writeFileSync(tempFile, 'new content');

      // Rename to SKU format
      const newFilename = await FileNamingService.renameToSKUFormat(tempFile, 'ELEC00001');

      // Verify old file was deleted and new file exists
      expect(newFilename).toBe('ELEC00001.jpg');
      expect(fs.existsSync(tempFile)).toBe(false);
      
      const newFile = path.join(testUploadsDir, 'ELEC00001.jpg');
      expect(fs.existsSync(newFile)).toBe(true);
      
      // Verify content is from new file
      const content = fs.readFileSync(newFile, 'utf8');
      expect(content).toBe('new content');
    });

    test('should delete old images with different extensions', async () => {
      // Create old images with different extensions
      const oldFile1 = path.join(testUploadsDir, 'ELEC00001.jpg');
      const oldFile2 = path.join(testUploadsDir, 'ELEC00001.png');
      fs.writeFileSync(oldFile1, 'old content 1');
      fs.writeFileSync(oldFile2, 'old content 2');

      // Create new temp file
      const tempFile = path.join(testUploadsDir, 'temp-12345.jpeg');
      fs.writeFileSync(tempFile, 'new content');

      // Rename to SKU format
      const newFilename = await FileNamingService.renameToSKUFormat(tempFile, 'ELEC00001');

      // Verify old files were deleted and new file exists
      expect(newFilename).toBe('ELEC00001.jpeg');
      expect(fs.existsSync(oldFile1)).toBe(false);
      expect(fs.existsSync(oldFile2)).toBe(false);
      expect(fs.existsSync(tempFile)).toBe(false);
      expect(fs.existsSync(path.join(testUploadsDir, 'ELEC00001.jpeg'))).toBe(true);
    });

    test('should preserve file content after rename', async () => {
      // Create test file with specific content
      const tempFile = path.join(testUploadsDir, 'temp-12345.jpg');
      const testContent = 'This is test image content';
      fs.writeFileSync(tempFile, testContent);

      // Rename to SKU format
      await FileNamingService.renameToSKUFormat(tempFile, 'ELEC00001');

      // Verify content is preserved
      const newFile = path.join(testUploadsDir, 'ELEC00001.jpg');
      const content = fs.readFileSync(newFile, 'utf8');
      expect(content).toBe(testContent);
    });

    test('should throw error for invalid currentPath (empty string)', async () => {
      await expect(
        FileNamingService.renameToSKUFormat('', 'ELEC00001')
      ).rejects.toThrow('Invalid currentPath: currentPath must be a non-empty string');
    });

    test('should throw error for invalid currentPath (null)', async () => {
      await expect(
        FileNamingService.renameToSKUFormat(null, 'ELEC00001')
      ).rejects.toThrow('Invalid currentPath: currentPath must be a non-empty string');
    });

    test('should throw error for invalid SKU (empty string)', async () => {
      const tempFile = path.join(testUploadsDir, 'temp-12345.jpg');
      fs.writeFileSync(tempFile, 'test content');

      await expect(
        FileNamingService.renameToSKUFormat(tempFile, '')
      ).rejects.toThrow('Invalid SKU: SKU must be a non-empty string');
    });

    test('should throw error for invalid SKU (null)', async () => {
      const tempFile = path.join(testUploadsDir, 'temp-12345.jpg');
      fs.writeFileSync(tempFile, 'test content');

      await expect(
        FileNamingService.renameToSKUFormat(tempFile, null)
      ).rejects.toThrow('Invalid SKU: SKU must be a non-empty string');
    });

    test('should throw error when file does not exist', async () => {
      const nonExistentFile = path.join(testUploadsDir, 'non-existent.jpg');

      await expect(
        FileNamingService.renameToSKUFormat(nonExistentFile, 'ELEC00001')
      ).rejects.toThrow('File not found');
    });

    test('should handle files with uppercase extensions', async () => {
      // Create test file with uppercase extension
      const tempFile = path.join(testUploadsDir, 'temp-12345.JPG');
      fs.writeFileSync(tempFile, 'test content');

      // Rename to SKU format
      const newFilename = await FileNamingService.renameToSKUFormat(tempFile, 'ELEC00001');

      // Verify file was renamed (extension case preserved from original)
      expect(newFilename).toBe('ELEC00001.JPG');
      expect(fs.existsSync(path.join(testUploadsDir, 'ELEC00001.JPG'))).toBe(true);
    });
  });

  describe('Integration scenarios', () => {
    test('should handle complete upload workflow', async () => {
      // Simulate upload workflow
      // 1. Create temp file (simulating multer upload)
      const tempFile = path.join(testUploadsDir, 'temp-' + Date.now() + '.jpg');
      fs.writeFileSync(tempFile, 'uploaded image content');

      // 2. Generate SKU-based filename
      const newFilename = FileNamingService.generateProductImageName('ELEC00001', 'photo.jpg');
      expect(newFilename).toBe('ELEC00001.jpg');

      // 3. Rename file to SKU format
      const renamedFilename = await FileNamingService.renameToSKUFormat(tempFile, 'ELEC00001');
      expect(renamedFilename).toBe('ELEC00001.jpg');

      // 4. Verify final state
      expect(fs.existsSync(tempFile)).toBe(false);
      expect(fs.existsSync(path.join(testUploadsDir, 'ELEC00001.jpg'))).toBe(true);
    });

    test('should handle image replacement workflow', async () => {
      // 1. Create existing image
      const existingFile = path.join(testUploadsDir, 'ELEC00001.jpg');
      fs.writeFileSync(existingFile, 'old image content');

      // 2. Upload new image (temp file)
      const tempFile = path.join(testUploadsDir, 'temp-' + Date.now() + '.jpg');
      fs.writeFileSync(tempFile, 'new image content');

      // 3. Rename to SKU format (should delete old image)
      const newFilename = await FileNamingService.renameToSKUFormat(tempFile, 'ELEC00001');
      expect(newFilename).toBe('ELEC00001.jpg');

      // 4. Verify old image was replaced
      expect(fs.existsSync(tempFile)).toBe(false);
      expect(fs.existsSync(existingFile)).toBe(true);
      
      const content = fs.readFileSync(existingFile, 'utf8');
      expect(content).toBe('new image content');
    });

    test('should handle changing image format', async () => {
      // 1. Create existing .jpg image
      const existingFile = path.join(testUploadsDir, 'ELEC00001.jpg');
      fs.writeFileSync(existingFile, 'jpg image content');

      // 2. Upload new .png image
      const tempFile = path.join(testUploadsDir, 'temp-' + Date.now() + '.png');
      fs.writeFileSync(tempFile, 'png image content');

      // 3. Rename to SKU format
      const newFilename = await FileNamingService.renameToSKUFormat(tempFile, 'ELEC00001');
      expect(newFilename).toBe('ELEC00001.png');

      // 4. Verify old .jpg was deleted and new .png exists
      expect(fs.existsSync(existingFile)).toBe(false);
      expect(fs.existsSync(tempFile)).toBe(false);
      expect(fs.existsSync(path.join(testUploadsDir, 'ELEC00001.png'))).toBe(true);
    });
  });
});
