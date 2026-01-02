# Task 1.2: Update uploadImage Function - Implementation Summary

## Task Completed
✅ Updated `uploadImage` function to get product SKU and rename files accordingly

## Changes Made

### File: `backend/controllers/productController.js`

#### Updated `uploadImage` function with the following enhancements:

1. **Get Product SKU**
   - After verifying product exists, now retrieves the product's SKU
   - Uses `product.sku` for file naming

2. **File Rename Logic**
   - Integrated `FileNamingService.renameToSKUFormat()` to rename uploaded files
   - Files are renamed from temporary names to `{SKU}.{extension}` format
   - Old images with the same SKU are automatically deleted

3. **Updated image_path**
   - Image path now uses SKU-based filename: `/uploads/products/{SKU}.{ext}`
   - Returns the new filename in the response for verification

4. **Cleanup Logic for Failed Uploads**
   - Added file cleanup when product is not found
   - Added file cleanup in catch block for any errors
   - Uses `fs.unlinkSync()` to remove temporary files

5. **Enhanced Error Handling**
   - Product not found: Deletes uploaded file before returning 404
   - Server errors: Cleans up uploaded file before returning 500
   - All error responses maintain consistent format

## Implementation Details

### Before (Old Code)
```javascript
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({...});
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({...});
    }

    // Used multer's generated filename
    const imagePath = `/uploads/products/${req.file.filename}`;
    const updatedProduct = await Product.update(req.params.id, { image_path: imagePath });

    res.json({...});
  } catch (err) {
    // No cleanup
    res.status(500).json({...});
  }
};
```

### After (New Code)
```javascript
exports.uploadImage = async (req, res) => {
  const fs = require('fs');
  
  try {
    if (!req.file) {
      return res.status(400).json({...});
    }

    // Get product and SKU
    const product = await Product.findById(req.params.id);
    if (!product) {
      // Cleanup on product not found
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({...});
    }

    // Rename file to SKU format
    const newFilename = await FileNamingService.renameToSKUFormat(
      req.file.path,
      product.sku
    );

    // Update with SKU-based path
    const imagePath = `/uploads/products/${newFilename}`;
    const updatedProduct = await Product.update(req.params.id, { 
      image_path: imagePath 
    });

    res.json({
      success: true,
      data: {
        image_path: imagePath,
        filename: newFilename,  // Added for verification
        product: updatedProduct
      },
      message: 'อัปโหลดรูปภาพสำเร็จ'
    });
  } catch (err) {
    console.error('Upload image error:', err);
    
    // Cleanup on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({...});
  }
};
```

## Key Improvements

1. **Automatic SKU-based Naming**: Images are now automatically renamed to match the product SKU
2. **Old Image Cleanup**: When uploading a new image, old images with the same SKU are deleted
3. **Error Recovery**: Temporary files are cleaned up if upload fails
4. **Better Response**: Returns the new filename for verification

## Testing

Created test script: `backend/test-image-upload-sku.js`

### Test Results
✅ FileNamingService import verified
✅ Product model loaded successfully
✅ uploadImage function exists
✅ Function uses product.sku
✅ Function calls FileNamingService.renameToSKUFormat
✅ Function includes cleanup logic (fs.unlinkSync)
✅ Function handles product not found error

## Example Usage

### Request
```http
POST /api/products/123/image
Content-Type: multipart/form-data

file: photo.jpg
```

### Response (Success)
```json
{
  "success": true,
  "data": {
    "image_path": "/uploads/products/ELEC00001.jpg",
    "filename": "ELEC00001.jpg",
    "product": {
      "id": 123,
      "sku": "ELEC00001",
      "name": "Product Name",
      "image_path": "/uploads/products/ELEC00001.jpg",
      ...
    }
  },
  "message": "อัปโหลดรูปภาพสำเร็จ"
}
```

### Response (Product Not Found)
```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "ไม่พบสินค้า"
  }
}
```

## Next Steps

The following subtasks from Task 1.2 are now complete:
- ✅ Import FileNamingService in `backend/controllers/productController.js`
- ✅ Update `uploadImage` function to get product SKU
- ✅ Add file rename logic after upload
- ✅ Update image_path with SKU-based filename
- ✅ Add cleanup logic for failed uploads
- ✅ Update error handling

Ready to proceed with Task 1.3: Update Multer Configuration (if needed) or Task 1.4: Test Backend Auto-Rename

## Notes

- The FileNamingService handles the actual file renaming and old file deletion
- Multer still generates temporary filenames, which are then renamed to SKU format
- All file operations include proper error handling and cleanup
- The implementation follows the design document specifications
