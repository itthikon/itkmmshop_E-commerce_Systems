# Requirements Document - Product Image Auto-Rename Feature

## Introduction

ฟีเจอร์การเปลี่ยนชื่อไฟล์รูปภาพสินค้าอัตโนมัติตาม SKU เพื่อให้การจัดการรูปภาพเป็นระเบียบและง่ายต่อการค้นหา

## Glossary

- **SKU**: รหัสสินค้าที่ไม่ซ้ำกัน (Stock Keeping Unit)
- **Image Upload**: การอัพโหลดรูปภาพจากไฟล์
- **Auto Rename**: การเปลี่ยนชื่อไฟล์อัตโนมัติ
- **File Extension**: นามสกุลไฟล์ เช่น .jpg, .png

## Requirements

### Requirement 1: Automatic Image Renaming by SKU

**User Story:** As an admin, I want uploaded images to be automatically renamed using the product SKU, so that images are organized and easy to identify.

#### Acceptance Criteria

1. WHEN an image is uploaded for a product with SKU, THE System SHALL rename the file to "{SKU}.{extension}"
2. WHEN a product already has an image with the same SKU, THE System SHALL delete the old image before saving the new one
3. THE System SHALL preserve the original file extension (.jpg, .jpeg, .png)
4. THE System SHALL store the renamed file in the uploads/products directory
5. THE System SHALL update the database image_path to use the SKU-based filename

### Requirement 2: Image Preview and Validation

**User Story:** As an admin, I want to preview images before saving, so that I can ensure the image quality is acceptable.

#### Acceptance Criteria

1. WHEN an image is selected, THE System SHALL display a preview
2. THE System SHALL show the image dimensions and file size
3. WHEN an image exceeds 5MB, THE System SHALL display an error message
4. WHEN an image is not .jpg, .jpeg, or .png, THE System SHALL display an error message
5. THE System SHALL allow the admin to remove and replace the image before saving

### Requirement 3: Image Storage with SKU Names

**User Story:** As a system, I want to store images with SKU-based filenames, so that images are easily identifiable and organized.

#### Acceptance Criteria

1. THE System SHALL store images in the format: `/uploads/products/{SKU}.{ext}`
2. WHEN a product already has an image, THE System SHALL replace the old image file
3. WHEN replacing an image, THE System SHALL delete the old file from disk
4. THE System SHALL maintain the SKU-based naming convention in the database
5. THE System SHALL handle file operations atomically to prevent orphaned files

### Requirement 4: Error Handling

**User Story:** As an admin, I want clear error messages when image operations fail, so that I know how to fix the problem.

#### Acceptance Criteria

1. WHEN image upload fails, THE System SHALL display the specific error reason
2. WHEN file size exceeds limit, THE System SHALL display: "ขนาดไฟล์ต้องไม่เกิน 5MB"
3. WHEN file type is invalid, THE System SHALL display: "กรุณาเลือกไฟล์รูปภาพ .jpg, .jpeg หรือ .png เท่านั้น"
4. WHEN product is not found, THE System SHALL display: "ไม่พบสินค้า"
5. WHEN file rename fails, THE System SHALL display: "เกิดข้อผิดพลาดในการบันทึกรูปภาพ"
6. THE System SHALL log all errors for debugging purposes
7. THE System SHALL clean up temporary files when errors occur
