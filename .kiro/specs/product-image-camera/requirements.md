# Requirements Document - Product Image Camera Feature

## Introduction

ฟีเจอร์การจัดการรูปภาพสินค้าที่รองรับการถ่ายภาพจากกล้องและการตั้งชื่อไฟล์อัตโนมัติตาม SKU

## Glossary

- **Camera Capture**: การถ่ายภาพโดยตรงจากกล้องของอุปกรณ์
- **SKU**: รหัสสินค้าที่ไม่ซ้ำกัน (Stock Keeping Unit)
- **Image Upload**: การอัพโหลดรูปภาพจากไฟล์
- **Auto Rename**: การเปลี่ยนชื่อไฟล์อัตโนมัติ

## Requirements

### Requirement 1: Camera Capture Feature

**User Story:** As an admin, I want to capture product images directly from my device camera, so that I can quickly add product photos without needing to upload files.

#### Acceptance Criteria

1. WHEN an admin clicks the camera button, THE System SHALL activate the device camera
2. WHEN the camera is activated, THE System SHALL display a live camera preview
3. WHEN an admin captures a photo, THE System SHALL display the captured image for review
4. WHEN an admin confirms the captured photo, THE System SHALL use it as the product image
5. WHEN an admin cancels the capture, THE System SHALL close the camera and return to the upload interface

### Requirement 2: Image Upload Options

**User Story:** As an admin, I want to choose between uploading a file or taking a photo, so that I have flexibility in how I add product images.

#### Acceptance Criteria

1. THE System SHALL provide two options: "📁 เลือกรูปภาพ" and "📷 ถ่ายภาพ"
2. WHEN an admin clicks "เลือกรูปภาพ", THE System SHALL open the file picker
3. WHEN an admin clicks "ถ่ายภาพ", THE System SHALL activate the camera
4. THE System SHALL display both options clearly in the product form

### Requirement 3: Automatic Image Renaming by SKU

**User Story:** As an admin, I want uploaded images to be automatically renamed using the product SKU, so that images are organized and easy to identify.

#### Acceptance Criteria

1. WHEN an image is uploaded for a product with SKU, THE System SHALL rename the file to "{SKU}.{extension}"
2. WHEN multiple images are uploaded for the same product, THE System SHALL append a number: "{SKU}-1.{extension}", "{SKU}-2.{extension}"
3. WHEN an image is captured from camera, THE System SHALL name it using the SKU format
4. THE System SHALL preserve the original file extension (.jpg, .png)
5. THE System SHALL store the renamed file in the uploads directory

### Requirement 4: Image Preview and Validation

**User Story:** As an admin, I want to preview images before saving, so that I can ensure the image quality is acceptable.

#### Acceptance Criteria

1. WHEN an image is selected or captured, THE System SHALL display a preview
2. THE System SHALL show the image dimensions and file size
3. WHEN an image exceeds 5MB, THE System SHALL display an error message
4. WHEN an image is not .jpg or .png, THE System SHALL display an error message
5. THE System SHALL allow the admin to remove and replace the image before saving

### Requirement 5: Camera Permission Handling

**User Story:** As an admin, I want clear feedback when camera permissions are needed, so that I understand how to enable the camera feature.

#### Acceptance Criteria

1. WHEN camera access is denied, THE System SHALL display a helpful error message
2. THE System SHALL provide instructions on how to enable camera permissions
3. WHEN camera is not available on the device, THE System SHALL hide the camera button
4. THE System SHALL gracefully fall back to file upload if camera fails

### Requirement 6: Mobile and Desktop Support

**User Story:** As an admin, I want the camera feature to work on both mobile and desktop devices, so that I can use it anywhere.

#### Acceptance Criteria

1. WHEN using a mobile device, THE System SHALL access the rear camera by default
2. WHEN using a desktop with webcam, THE System SHALL access the webcam
3. THE System SHALL allow switching between front and rear cameras on mobile
4. THE System SHALL provide appropriate UI for both mobile and desktop screens

### Requirement 7: Image Storage with SKU Names

**User Story:** As a system, I want to store images with SKU-based filenames, so that images are easily identifiable and organized.

#### Acceptance Criteria

1. THE System SHALL store images in the format: `/uploads/products/{SKU}.{ext}`
2. WHEN a product already has an image, THE System SHALL replace the old image
3. WHEN replacing an image, THE System SHALL delete the old file
4. THE System SHALL maintain the SKU-based naming convention in the database

### Requirement 8: Error Handling

**User Story:** As an admin, I want clear error messages when image operations fail, so that I know how to fix the problem.

#### Acceptance Criteria

1. WHEN camera access fails, THE System SHALL display: "ไม่สามารถเข้าถึงกล้องได้ กรุณาอนุญาตการใช้งานกล้อง"
2. WHEN image upload fails, THE System SHALL display the specific error reason
3. WHEN file size exceeds limit, THE System SHALL display: "ขนาดไฟล์ต้องไม่เกิน 5MB"
4. WHEN file type is invalid, THE System SHALL display: "กรุณาเลือกไฟล์รูปภาพ .jpg หรือ .png เท่านั้น"
5. THE System SHALL log all errors for debugging purposes
