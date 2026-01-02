# Sub-task Verification: Update image_path with SKU-based filename

## Task Information
- **Parent Task**: Task 2 - Update Product Upload Controller
- **Sub-task**: Update image_path with SKU-based filename
- **Status**: ✅ COMPLETE

## Implementation Details

### Location
File: `backend/controllers/productController.js`
Function: `exports.uploadImage` (lines 534-607)

### Implementation Code
```javascript
// Lines 571-575
// Update product with new image path
const imagePath = `/uploads/products/${newFilename}`;
const updatedProduct = await Product.update(req.params.id, { 
  image_path: imagePath 
});
```

### Complete Flow

1. **File Upload** (Line 538-547)
   - Multer receives file and saves with temporary name
   - Validates that file exists

2. **Get Product & SKU** (Lines 550-565)
   - Fetches product from database using `Product.findById(req.params.id)`
   - Retrieves the product's SKU
   - Returns 404 error if product not found
   - Cleans up temporary file if product not found

3. **Rename File to SKU Format** (Lines 568-571)
   - Calls `FileNamingService.renameToSKUFormat(req.file.path, product.sku)`
   - Service deletes any old images with same SKU
   - Service renames temp file to `{SKU}.{extension}` (e.g., `ELEC00001.jpg`)
   - Returns the new filename

4. **Update Database with SKU-based Path** (Lines 573-576) ✅ **THIS SUB-TASK**
   - Creates `imagePath` variable: `/uploads/products/${newFilename}`
   - Calls `Product.update(req.params.id, { image_path: imagePath })`
   - Updates the product record in the database
   - Stores the SKU-based path (e.g., `/uploads/products/ELEC00001.jpg`)

5. **Return Success Response** (Lines 578-585)
   - Returns JSON response with:
     - `image_path`: The SKU-based path
     - `filename`: The SKU-based filename
     - `product`: The updated product object

6. **Error Handling** (Lines 586-603)
   - Catches any errors during the process
   - Cleans up temporary file if error occurs
   - Returns appropriate error response

## Verification Tests

### Test 1: Static Code Analysis ✅
- ✓ Function retrieves product to get SKU
- ✓ Function calls FileNamingService.renameToSKUFormat
- ✓ Function creates imagePath with newFilename
- ✓ Function calls Product.update with image_path
- ✓ Function returns updated product data

### Test 2: FileNamingService Integration ✅
- ✓ Generates correct SKU-based filenames
- ✓ ELEC00001 + photo.jpg = ELEC00001.jpg
- ✓ FASH00123 + image.PNG = FASH00123.png
- ✓ MISC99999 + test.jpeg = MISC99999.jpeg

### Test 3: Flow Verification ✅
Complete upload flow verified:
1. Receive file upload (multer saves with temp name)
2. Get product from database to retrieve SKU
3. Call FileNamingService.renameToSKUFormat(req.file.path, product.sku)
4. Receive newFilename (e.g., "ELEC00001.jpg")
5. Create imagePath = `/uploads/products/${newFilename}`
6. Call Product.update(id, { image_path: imagePath })
7. Return success response with image_path

## Requirements Validation

This implementation satisfies the following requirements:

### From requirements.md:
- ✅ **Requirement 1.5**: "THE System SHALL update the database image_path to use the SKU-based filename"
- ✅ **Requirement 3.4**: "THE System SHALL maintain the SKU-based naming convention in the database"

### From design.md:
- ✅ **Backend Design - New Flow Step 7**: "Update product.image_path to `/uploads/products/{SKU}.{ext}`"

## Example Usage

### Input:
- Product ID: 123
- Product SKU: ELEC00001
- Uploaded file: temp-1234567890.jpg

### Process:
1. File renamed to: ELEC00001.jpg
2. imagePath created: `/uploads/products/ELEC00001.jpg`
3. Database updated: `UPDATE products SET image_path = '/uploads/products/ELEC00001.jpg' WHERE id = 123`

### Output:
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

## Conclusion

✅ **The sub-task "Update image_path with SKU-based filename" is COMPLETE and VERIFIED**

The implementation correctly:
1. Creates the SKU-based image path
2. Updates the database with the new path
3. Returns the updated product data
4. Handles errors appropriately
5. Satisfies all requirements

## Next Steps

According to the tasks.md file, the remaining sub-tasks for Task 2 are:
- [ ] Add cleanup logic for failed uploads (already implemented in error handler)
- [ ] Update error handling (already implemented)

Task 2 appears to be nearly complete. The next task to focus on is:
- **Task 3**: Update Multer Configuration
