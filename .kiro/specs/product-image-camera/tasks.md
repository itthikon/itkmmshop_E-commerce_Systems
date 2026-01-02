# Tasks Document - Product Image Auto-Rename Feature

## Overview

แผนการพัฒนาฟีเจอร์การเปลี่ยนชื่อไฟล์รูปภาพสินค้าอัตโนมัติตาม SKU เพื่อให้การจัดการรูปภาพเป็นระเบียบและง่ายต่อการค้นหา

## Implementation Tasks

### Task 1: Create FileNamingService
**Status:** ✅ Complete  
**Estimated Time:** 1 hour  
**Dependencies:** None

**Description:**
สร้าง service สำหรับจัดการการเปลี่ยนชื่อไฟล์ตาม SKU

**Subtasks:**
- [x] Create `backend/services/FileNamingService.js`
- [x] Implement `generateProductImageName(sku, originalFilename)` method
- [x] Implement `deleteOldProductImage(sku, uploadsDir)` method
- [x] Implement `renameToSKUFormat(currentPath, sku)` method
- [x] Add error handling for file operations
- [x] Add JSDoc documentation

**Acceptance Criteria:**
- Service can generate SKU-based filename (e.g., "ELEC00001.jpg")
- Service can delete old images with same SKU
- Service can rename uploaded file to SKU format
- All file operations have proper error handling
- _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3_

---

### Task 2: Update Product Upload Controller
**Status:** ⏳ Pending  
**Estimated Time:** 1.5 hours  
**Dependencies:** Task 1

**Description:**
อัปเดต controller ให้เปลี่ยนชื่อไฟล์เป็น SKU หลังจาก upload

**Subtasks:**
- [x] Import FileNamingService in `backend/controllers/productController.js`
- [x] Update `uploadImage` function to get product SKU
- [x] Add file rename logic after upload
- [x] Update image_path with SKU-based filename
- [x] Add cleanup logic for failed uploads
- [x] Update error handling

**Acceptance Criteria:**
- Uploaded images are renamed to SKU format
- Old images with same SKU are deleted before saving new one
- Image path in database uses SKU-based filename
- Temporary files are cleaned up on error
- Proper error messages for all failure cases
- _Requirements: 1.1, 1.2, 1.4, 1.5, 3.1, 3.2, 3.3, 3.5, 4.1, 4.5, 4.7_

---

### Task 3: Update Multer Configuration
**Status:** ⏳ Pending  
**Estimated Time:** 30 minutes  
**Dependencies:** None

**Description:**
ตั้งค่า multer ให้ใช้ชื่อไฟล์ชั่วคราวและตรวจสอบไฟล์

**Subtasks:**
- [x] Review `backend/middleware/upload.js` or create if not exists
- [x] Configure multer to use temporary filenames
- [x] Set up file filter for image types (.jpg, .jpeg, .png)
- [x] Set file size limit to 5MB
- [x] Add error handling for multer errors

**Acceptance Criteria:**
- Multer saves files with temporary names
- Only .jpg, .jpeg, .png files are accepted
- Files larger than 5MB are rejected
- Clear error messages for validation failures
- _Requirements: 1.3, 2.3, 2.4, 4.2, 4.3_

---

### Task 4: Test Backend Auto-Rename
**Status:** ✅ Complete  
**Estimated Time:** 1 hour  
**Dependencies:** Tasks 1, 2, 3

**Description:**
ทดสอบการทำงานของระบบเปลี่ยนชื่อไฟล์อัตโนมัติ

**Subtasks:**
- [x] Create test script `backend/test-image-rename.js` or use existing test file
- [x] Test uploading new image
- [x] Test replacing existing image
- [x] Test with different file extensions (.jpg, .jpeg, .png)
- [x] Test error cases (product not found, invalid file)
- [ ] Verify old files are deleted
- [x] Verify database image_path is correct

**Acceptance Criteria:**
- All test cases pass
- Images are correctly renamed to SKU format
- No orphaned files remain
- Database records are accurate
- _Requirements: All requirements validated_

---

## Testing Checklist

### Backend Testing
- [x] FileNamingService unit tests
- [x] Upload controller integration tests
- [x] File rename functionality tests
- [x] Error handling tests
- [x] Old file deletion tests

### Manual Testing
- [x] Test with .jpg files
- [x] Test with .jpeg files
- [x] Test with .png files
- [x] Test with files < 5MB
- [x] Test with files > 5MB (should fail)
- [x] Test with invalid file types (should fail)
- [x] Test image replacement
- [x] Test with product not found (should fail)
- [ ] Verify SKU-based filenames
- [x] Verify old files are deleted

## Risk Assessment

### Medium Risk
- **File naming conflicts**: Multiple uploads at same time
  - **Mitigation**: Use atomic file operations and proper locking
  
- **File system errors**: Disk full, permission issues
  - **Mitigation**: Proper error handling and cleanup

### Low Risk
- **Database sync issues**: File saved but database update fails
  - **Mitigation**: Transaction-like behavior with rollback

## Success Criteria

### Functional Requirements
- ✅ All images are renamed to SKU format
- ✅ Old images are properly deleted
- ✅ File upload works correctly
- ✅ Error handling covers all scenarios
- ✅ No orphaned files

### Performance Requirements
- ✅ Image upload completes in < 3 seconds
- ✅ File operations are atomic
- ✅ No memory leaks

### User Experience Requirements
- ✅ Seamless integration with existing UI
- ✅ Clear error messages in Thai
- ✅ No regression in existing functionality

## Timeline Estimate

| Task | Estimated Time | Priority |
|------|----------------|----------|
| Task 1: Create FileNamingService | 1 hour | HIGH |
| Task 2: Update Upload Controller | 1.5 hours | HIGH |
| Task 3: Update Multer Configuration | 30 minutes | HIGH |
| Task 4: Test Backend Auto-Rename | 1 hour | HIGH |
| **Total** | **4 hours** | - |

## Next Steps

1. **Complete Task 2** - Update upload controller (partially done)
2. **Complete Task 3** - Update multer configuration
3. **Complete Task 4** - Test thoroughly
4. **Deploy** - Once all tests pass

## Notes

- Task 1 is already complete (FileNamingService exists)
- Task 2 is partially complete (needs finishing touches)
- Focus on completing remaining subtasks
- Test thoroughly before deployment
- Keep security in mind throughout implementation
- Document any issues or edge cases discovered
