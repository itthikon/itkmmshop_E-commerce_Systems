const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const FileNamingService = require('../services/FileNamingService');
const { uploadImage } = require('../controllers/productController');

// Mock dependencies
jest.mock('../models/Product');
jest.mock('../services/FileNamingService');
jest.mock('fs');

describe('Product Controller - Upload Image Integration Tests', () => {
  const mockProductId = 1;
  const mockSKU = 'ELEC00001';
  const mockProduct = {
    id: mockProductId,
    sku: mockSKU,
    name: 'Test Product',
    image_path: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockImplementation(() => {});
  });

  describe('Successful Upload Flow', () => {
    test('should successfully upload and rename image to SKU format', async () => {
      const mockFile = {
        path: 'uploads/products/temp-123456789.jpg',
        originalname: 'product-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      const newFilename = `${mockSKU}.jpg`;
      const expectedImagePath = `/uploads/products/${newFilename}`;

      // Mock Product.findById to return product
      Product.findById.mockResolvedValue(mockProduct);

      // Mock FileNamingService.renameToSKUFormat
      FileNamingService.renameToSKUFormat.mockResolvedValue(newFilename);

      // Mock Product.update to return updated product
      const updatedProduct = { ...mockProduct, image_path: expectedImagePath };
      Product.update.mockResolvedValue(updatedProduct);

      const req = {
        params: { id: mockProductId },
        file: mockFile
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await uploadImage(req, res);

      // Verify Product.findById was called
      expect(Product.findById).toHaveBeenCalledWith(mockProductId);

      // Verify FileNamingService.renameToSKUFormat was called
      expect(FileNamingService.renameToSKUFormat).toHaveBeenCalledWith(
        mockFile.path,
        mockSKU
      );

      // Verify Product.update was called with correct image path
      expect(Product.update).toHaveBeenCalledWith(mockProductId, {
        image_path: expectedImagePath
      });

      // Verify response
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          image_path: expectedImagePath,
          filename: newFilename,
          product: updatedProduct
        },
        message: 'อัปโหลดรูปภาพสำเร็จ'
      });
    });

    test('should handle different file extensions (.jpeg, .png)', async () => {
      const extensions = ['jpeg', 'png'];

      for (const ext of extensions) {
        jest.clearAllMocks();

        const mockFile = {
          path: `uploads/products/temp-123456789.${ext}`,
          originalname: `product-image.${ext}`,
          mimetype: `image/${ext}`,
          size: 1024000
        };

        const newFilename = `${mockSKU}.${ext}`;
        const expectedImagePath = `/uploads/products/${newFilename}`;

        Product.findById.mockResolvedValue(mockProduct);
        FileNamingService.renameToSKUFormat.mockResolvedValue(newFilename);
        Product.update.mockResolvedValue({ ...mockProduct, image_path: expectedImagePath });

        const req = {
          params: { id: mockProductId },
          file: mockFile
        };

        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn()
        };

        await uploadImage(req, res);

        expect(FileNamingService.renameToSKUFormat).toHaveBeenCalledWith(
          mockFile.path,
          mockSKU
        );

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            data: expect.objectContaining({
              filename: newFilename
            })
          })
        );
      }
    });

    test('should replace existing image when uploading new one', async () => {
      const mockFile = {
        path: 'uploads/products/temp-123456789.jpg',
        originalname: 'new-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      const productWithImage = {
        ...mockProduct,
        image_path: '/uploads/products/ELEC00001.png'
      };

      const newFilename = `${mockSKU}.jpg`;
      const expectedImagePath = `/uploads/products/${newFilename}`;

      Product.findById.mockResolvedValue(productWithImage);
      FileNamingService.renameToSKUFormat.mockResolvedValue(newFilename);
      Product.update.mockResolvedValue({ ...productWithImage, image_path: expectedImagePath });

      const req = {
        params: { id: mockProductId },
        file: mockFile
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await uploadImage(req, res);

      // Verify old image was replaced (FileNamingService handles deletion)
      expect(FileNamingService.renameToSKUFormat).toHaveBeenCalled();
      expect(Product.update).toHaveBeenCalledWith(mockProductId, {
        image_path: expectedImagePath
      });
    });
  });

  describe('Error Handling', () => {
    test('should return error when no file is uploaded', async () => {
      const req = {
        params: { id: mockProductId },
        file: null
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await uploadImage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'ไม่พบไฟล์รูปภาพ'
        }
      });
    });

    test('should return error and cleanup file when product not found', async () => {
      const mockFile = {
        path: 'uploads/products/temp-123456789.jpg',
        originalname: 'product-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      Product.findById.mockResolvedValue(null);
      fs.existsSync.mockReturnValue(true);

      const req = {
        params: { id: mockProductId },
        file: mockFile
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await uploadImage(req, res);

      // Verify file was deleted
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockFile.path);

      // Verify error response
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'ไม่พบสินค้า'
        }
      });
    });

    test('should cleanup temp file when rename fails', async () => {
      const mockFile = {
        path: 'uploads/products/temp-123456789.jpg',
        originalname: 'product-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      Product.findById.mockResolvedValue(mockProduct);
      FileNamingService.renameToSKUFormat.mockRejectedValue(new Error('Rename failed'));
      fs.existsSync.mockReturnValue(true);

      const req = {
        params: { id: mockProductId },
        file: mockFile
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await uploadImage(req, res);

      // Verify temp file was cleaned up
      expect(fs.unlinkSync).toHaveBeenCalledWith(mockFile.path);

      // Verify error response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ'
        }
      });
    });

    test('should cleanup renamed file when database update fails', async () => {
      const mockFile = {
        path: 'uploads/products/temp-123456789.jpg',
        originalname: 'product-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      const newFilename = `${mockSKU}.jpg`;
      const renamedFilePath = `uploads/products/${newFilename}`;

      Product.findById.mockResolvedValue(mockProduct);
      FileNamingService.renameToSKUFormat.mockResolvedValue(newFilename);
      Product.update.mockRejectedValue(new Error('Database update failed'));

      // Mock fs.existsSync to return true for renamed file
      fs.existsSync.mockImplementation((filePath) => {
        return filePath === renamedFilePath;
      });

      const req = {
        params: { id: mockProductId },
        file: mockFile
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await uploadImage(req, res);

      // Verify renamed file was cleaned up
      expect(fs.unlinkSync).toHaveBeenCalledWith(renamedFilePath);

      // Verify error response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ'
        }
      });
    });

    test('should handle cleanup errors gracefully', async () => {
      const mockFile = {
        path: 'uploads/products/temp-123456789.jpg',
        originalname: 'product-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      Product.findById.mockResolvedValue(mockProduct);
      FileNamingService.renameToSKUFormat.mockRejectedValue(new Error('Rename failed'));
      fs.existsSync.mockReturnValue(true);
      fs.unlinkSync.mockImplementation(() => {
        throw new Error('Cleanup failed');
      });

      const req = {
        params: { id: mockProductId },
        file: mockFile
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      // Should not throw error even if cleanup fails
      await uploadImage(req, res);

      // Verify error response is still sent
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ'
        }
      });
    });
  });

  describe('Integration with FileNamingService', () => {
    test('should pass correct parameters to FileNamingService', async () => {
      const mockFile = {
        path: 'uploads/products/temp-123456789.jpg',
        originalname: 'product-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      const newFilename = `${mockSKU}.jpg`;

      Product.findById.mockResolvedValue(mockProduct);
      FileNamingService.renameToSKUFormat.mockResolvedValue(newFilename);
      Product.update.mockResolvedValue({ ...mockProduct, image_path: `/uploads/products/${newFilename}` });

      const req = {
        params: { id: mockProductId },
        file: mockFile
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await uploadImage(req, res);

      // Verify FileNamingService was called with correct parameters
      expect(FileNamingService.renameToSKUFormat).toHaveBeenCalledWith(
        mockFile.path,
        mockSKU
      );
    });

    test('should use returned filename from FileNamingService', async () => {
      const mockFile = {
        path: 'uploads/products/temp-123456789.jpg',
        originalname: 'product-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      const returnedFilename = `${mockSKU}.jpg`;

      Product.findById.mockResolvedValue(mockProduct);
      FileNamingService.renameToSKUFormat.mockResolvedValue(returnedFilename);
      Product.update.mockResolvedValue(mockProduct);

      const req = {
        params: { id: mockProductId },
        file: mockFile
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await uploadImage(req, res);

      // Verify the returned filename is used in image path
      expect(Product.update).toHaveBeenCalledWith(mockProductId, {
        image_path: `/uploads/products/${returnedFilename}`
      });

      // Verify response contains the filename
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            filename: returnedFilename
          })
        })
      );
    });
  });

  describe('Database Integration', () => {
    test('should update product with correct image path format', async () => {
      const mockFile = {
        path: 'uploads/products/temp-123456789.jpg',
        originalname: 'product-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      const newFilename = `${mockSKU}.jpg`;
      const expectedImagePath = `/uploads/products/${newFilename}`;

      Product.findById.mockResolvedValue(mockProduct);
      FileNamingService.renameToSKUFormat.mockResolvedValue(newFilename);
      Product.update.mockResolvedValue({ ...mockProduct, image_path: expectedImagePath });

      const req = {
        params: { id: mockProductId },
        file: mockFile
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await uploadImage(req, res);

      // Verify Product.update was called with correct format
      expect(Product.update).toHaveBeenCalledWith(mockProductId, {
        image_path: expectedImagePath
      });

      // Verify image path starts with /uploads/products/
      const updateCall = Product.update.mock.calls[0][1];
      expect(updateCall.image_path).toMatch(/^\/uploads\/products\//);
    });

    test('should return updated product in response', async () => {
      const mockFile = {
        path: 'uploads/products/temp-123456789.jpg',
        originalname: 'product-image.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
      };

      const newFilename = `${mockSKU}.jpg`;
      const expectedImagePath = `/uploads/products/${newFilename}`;
      const updatedProduct = {
        ...mockProduct,
        image_path: expectedImagePath,
        updated_at: new Date()
      };

      Product.findById.mockResolvedValue(mockProduct);
      FileNamingService.renameToSKUFormat.mockResolvedValue(newFilename);
      Product.update.mockResolvedValue(updatedProduct);

      const req = {
        params: { id: mockProductId },
        file: mockFile
      };

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await uploadImage(req, res);

      // Verify response contains updated product
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            product: updatedProduct
          })
        })
      );
    });
  });
});
