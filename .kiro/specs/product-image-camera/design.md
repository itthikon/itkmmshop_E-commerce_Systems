# Design Document - Product Image Auto-Rename Feature

## Overview

ออกแบบระบบการเปลี่ยนชื่อไฟล์รูปภาพสินค้าอัตโนมัติตาม SKU เพื่อให้การจัดการรูปภาพเป็นระเบียบและง่ายต่อการค้นหา โดยไม่ต้องใช้ฟีเจอร์ถ่ายภาพจากกล้อง

## Architecture

### Component Structure

```
ProductManagement (Page)
├── ImageUploadSection (Existing)
│   ├── FileUpload (Existing)
│   └── ImagePreview (Existing)
└── SKUPreview (Existing Component)
```

### Data Flow

```
1. User selects image file
   ↓
2. Client-side Validation
   ↓
3. Image Preview
   ↓
4. Form Submit with SKU
   ↓
5. Backend: Rename file to SKU format
   ↓
6. Backend: Delete old image if exists
   ↓
7. Backend: Save to /uploads/products/{SKU}.{ext}
   ↓
8. Backend: Update database with image_path
```

## Frontend Design

### 1. Image Upload Section

**Location:** `frontend/src/pages/admin/ProductManagement.js` (existing)

**Current Implementation:** Already has file upload functionality

**No Changes Required:** The existing file upload UI will continue to work as-is

### 2. File Validation (Frontend)

```javascript
const validateImage = (file) => {
  const errors = [];
  
  // File type validation
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('กรุณาเลือกไฟล์รูปภาพ .jpg, .jpeg หรือ .png เท่านั้น');
  }
  
  // File size validation (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('ขนาดไฟล์ต้องไม่เกิน 5MB');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
```

## Backend Design

### 1. Image Upload Endpoint Enhancement

**Endpoint:** `POST /api/products/:id/image`

**Current Flow:**
1. Receive file upload
2. Save with multer-generated filename
3. Update product.image_path

**New Flow:**
1. Receive file upload (multer saves with temporary name)
2. Get product from database to retrieve SKU
3. **Rename file to `{SKU}.{extension}`**
4. Check if old image exists with same SKU
5. Delete old image if exists
6. Save new image with SKU name
7. Update product.image_path to `/uploads/products/{SKU}.{ext}`
8. Clean up temporary file on error

### 2. File Naming Service

**Location:** `backend/services/FileNamingService.js`

**Purpose:** Handle SKU-based file naming and management

```javascript
class FileNamingService {
  /**
   * Generate SKU-based filename
   * @param {string} sku - Product SKU
   * @param {string} originalFilename - Original file name
   * @returns {string} - New filename (e.g., "ELEC00001.jpg")
   */
  static generateProductImageName(sku, originalFilename) {
    const extension = path.extname(originalFilename).toLowerCase();
    return `${sku}${extension}`;
  }
  
  /**
   * Delete old product image if exists
   * @param {string} sku - Product SKU
   * @param {string} uploadsDir - Upload directory path
   */
  static async deleteOldProductImage(sku, uploadsDir) {
    const extensions = ['.jpg', '.jpeg', '.png'];
    
    for (const ext of extensions) {
      const filePath = path.join(uploadsDir, `${sku}${ext}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old image: ${sku}${ext}`);
      }
    }
  }
  
  /**
   * Rename uploaded file to SKU format
   * @param {string} currentPath - Current file path
   * @param {string} sku - Product SKU
   * @returns {string} - New filename
   */
  static async renameToSKUFormat(currentPath, sku) {
    const extension = path.extname(currentPath);
    const directory = path.dirname(currentPath);
    const newFilename = `${sku}${extension}`;
    const newPath = path.join(directory, newFilename);
    
    // Delete old image with same SKU if exists
    await this.deleteOldProductImage(sku, directory);
    
    // Rename current file
    fs.renameSync(currentPath, newPath);
    
    return newFilename;
  }
}
```

### 3. Updated Upload Controller

```javascript
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'ไม่พบไฟล์รูปภาพ'
        }
      });
    }

    // Check if product exists and get SKU
    const product = await Product.findById(req.params.id);
    if (!product) {
      // Delete uploaded file if product not found
      fs.unlinkSync(req.file.path);
      
      return res.status(404).json({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: 'ไม่พบสินค้า'
        }
      });
    }

    // Rename file to SKU format
    const newFilename = await FileNamingService.renameToSKUFormat(
      req.file.path,
      product.sku
    );

    // Update product with new image path
    const imagePath = `/uploads/products/${newFilename}`;
    const updatedProduct = await Product.update(req.params.id, { 
      image_path: imagePath 
    });

    res.json({
      success: true,
      data: {
        image_path: imagePath,
        filename: newFilename,
        product: updatedProduct
      },
      message: 'อัปโหลดรูปภาพสำเร็จ'
    });
  } catch (err) {
    console.error('Upload image error:', err);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ'
      }
    });
  }
};
```

### 4. Multer Configuration

**Location:** `backend/middleware/upload.js`

**Strategy:** Use temporary filenames during upload, rename after validation

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    // Temporary filename - will be renamed to SKU format after validation
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('กรุณาอัปโหลดไฟล์รูปภาพ .jpg, .jpeg หรือ .png เท่านั้น'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

module.exports = upload;
```

## Error Handling

### Frontend Errors

| Error | Message | Action |
|-------|---------|--------|
| File too large | "ขนาดไฟล์ต้องไม่เกิน 5MB" | Clear selection, show error |
| Invalid file type | "กรุณาเลือกไฟล์รูปภาพ .jpg, .jpeg หรือ .png เท่านั้น" | Clear selection, show error |
| Upload failed | "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ" | Allow retry |

### Backend Errors

| Error | Code | HTTP Status | Message |
|-------|------|-------------|---------|
| No file uploaded | NO_FILE | 400 | "ไม่พบไฟล์รูปภาพ" |
| Product not found | PRODUCT_NOT_FOUND | 404 | "ไม่พบสินค้า" |
| File rename failed | FILE_RENAME_ERROR | 500 | "เกิดข้อผิดพลาดในการเปลี่ยนชื่อไฟล์" |
| Upload failed | SERVER_ERROR | 500 | "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ" |

## Security Considerations

### 1. File Validation
- Validate file type on both frontend and backend
- Check file size limits (5MB maximum)
- Validate file extension matches MIME type
- Prevent path traversal attacks

### 2. File Storage
- Store files in dedicated uploads directory
- Use SKU-based naming to prevent conflicts
- Validate SKU format before using in filename
- Clean up temporary files on error
- Set proper file permissions

### 3. Image Processing
- Consider adding image optimization (resize, compress)
- Strip EXIF data for privacy
- Validate image dimensions if needed

## Testing Strategy

### 1. Unit Tests
- File validation logic
- SKU-based filename generation
- Image rename functionality
- Old file deletion logic

### 2. Integration Tests
- File upload flow
- Image replacement flow
- Error handling scenarios
- Database update verification

### 3. Manual Testing
- Test with different file types (.jpg, .jpeg, .png)
- Test with different file sizes
- Test file size limits (< 5MB, > 5MB)
- Test SKU-based naming
- Test image replacement
- Test error scenarios (product not found, invalid file)

## Implementation Priority

### Phase 1: Backend Auto-Rename (High Priority)
1. Create FileNamingService
2. Update uploadImage controller
3. Update multer configuration
4. Test SKU-based naming
5. Test image replacement
6. Test error handling

## Success Metrics

1. **Functionality**
   - All images are correctly renamed to SKU format
   - No orphaned image files
   - Old images are properly deleted when replaced

2. **User Experience**
   - Image upload time < 3 seconds
   - Clear error messages for all failure cases
   - Seamless integration with existing UI

3. **Code Quality**
   - 80%+ test coverage
   - No security vulnerabilities
   - Clean, maintainable code
   - Proper error handling

## Future Enhancements

1. **Multiple Images**
   - Support multiple images per product
   - SKU-based naming: `{SKU}-1.jpg`, `{SKU}-2.jpg`, etc.

2. **Image Optimization**
   - Auto-resize large images
   - Compress images to reduce file size
   - Generate thumbnails

3. **Cloud Storage**
   - Integrate with AWS S3 or similar
   - CDN for faster image delivery
   - Automatic backups
