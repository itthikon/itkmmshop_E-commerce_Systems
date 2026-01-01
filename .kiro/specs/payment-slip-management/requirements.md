# Requirements Document: Payment Slip Upload and Verification

## Introduction

ระบบจัดการสลิปการชำระเงินสำหรับร้านค้า itkmmshop22 เพื่อให้ลูกค้าสามารถอัปโหลดสลิปการโอนเงินหลังจากสั่งซื้อสินค้า และให้แอดมิน/สตาฟสามารถตรวจสอบและยืนยันการชำระเงินได้

## Glossary

- **System**: ระบบจัดการสลิปการชำระเงิน
- **Customer**: ลูกค้าที่สั่งซื้อสินค้า
- **Staff**: พนักงานที่มีสิทธิ์ตรวจสอบการชำระเงิน
- **Admin**: ผู้ดูแลระบบที่มีสิทธิ์เต็ม
- **Payment_Slip**: รูปภาพสลิปการโอนเงิน
- **Order**: คำสั่งซื้อสินค้า
- **Payment_Record**: บันทึกการชำระเงิน

## Requirements

### Requirement 1: อัปโหลดสลิปการชำระเงิน

**User Story:** As a customer, I want to upload my payment slip after placing an order, so that the shop can verify my payment and process my order.

#### Acceptance Criteria

1. WHEN a customer completes an order, THE System SHALL display payment instructions with bank account details
2. WHEN a customer clicks upload payment slip button, THE System SHALL open a file selection dialog
3. WHEN a customer selects an image file (.jpg, .jpeg, .png), THE System SHALL validate the file type and size (max 5MB)
4. WHEN a customer uploads a valid payment slip, THE System SHALL save the slip image and associate it with the order
5. WHEN a payment slip is uploaded successfully, THE System SHALL display a success message and update the order status
6. IF a customer uploads an invalid file type, THEN THE System SHALL display an error message
7. IF a customer uploads a file exceeding 5MB, THEN THE System SHALL display an error message

### Requirement 2: แสดงข้อมูลการชำระเงิน

**User Story:** As a customer, I want to see my payment information and status, so that I know whether my payment has been verified.

#### Acceptance Criteria

1. WHEN a customer views their order details, THE System SHALL display payment status (pending, verified, rejected)
2. WHEN a payment slip has been uploaded, THE System SHALL display the uploaded slip image
3. WHEN payment is verified, THE System SHALL display verification timestamp and verified by information
4. WHEN payment is rejected, THE System SHALL display rejection reason
5. THE System SHALL display bank account information for payment reference

### Requirement 3: รายการสลิปที่รอตรวจสอบ

**User Story:** As a staff member, I want to see a list of pending payment slips, so that I can verify payments efficiently.

#### Acceptance Criteria

1. WHEN staff accesses the payment verification page, THE System SHALL display all orders with pending payment slips
2. THE System SHALL display order number, customer name, order amount, upload date, and slip thumbnail for each pending payment
3. WHEN staff clicks on a pending payment, THE System SHALL display full slip image and order details
4. THE System SHALL allow staff to filter payments by status (pending, verified, rejected)
5. THE System SHALL allow staff to search payments by order number or customer name
6. THE System SHALL display payment count badges for pending payments

### Requirement 4: ตรวจสอบและยืนยันสลิป

**User Story:** As a staff member, I want to verify payment slips manually, so that I can confirm legitimate payments.

#### Acceptance Criteria

1. WHEN staff views a payment slip, THE System SHALL display the slip image in full size
2. WHEN staff views a payment slip, THE System SHALL display order amount and payment details side by side
3. WHEN staff clicks verify button, THE System SHALL mark the payment as verified and update order status to paid
4. WHEN staff clicks reject button, THE System SHALL prompt for rejection reason
5. WHEN staff provides rejection reason and confirms, THE System SHALL mark payment as rejected and notify customer
6. WHEN payment is verified, THE System SHALL automatically update order status to "processing"
7. THE System SHALL record who verified/rejected the payment and when

### Requirement 5: การแจ้งเตือน

**User Story:** As a staff member, I want to receive notifications for new payment slips, so that I can verify them promptly.

#### Acceptance Criteria

1. WHEN a customer uploads a payment slip, THE System SHALL display a notification badge on staff dashboard
2. WHEN staff has unverified payments, THE System SHALL display the count in navigation menu
3. THE System SHALL highlight new payments uploaded within the last 24 hours
4. WHEN payment is verified or rejected, THE System SHALL update notification counts immediately

### Requirement 6: ประวัติการชำระเงิน

**User Story:** As an admin, I want to view payment history, so that I can track all payment transactions.

#### Acceptance Criteria

1. WHEN admin accesses payment history, THE System SHALL display all payments with filters
2. THE System SHALL allow filtering by date range, status, payment method, and amount range
3. THE System SHALL display payment details including order number, amount, status, upload date, and verification date
4. THE System SHALL allow exporting payment history to CSV
5. THE System SHALL display payment statistics (total verified, total rejected, pending count)

### Requirement 7: หน้ายืนยันการสั่งซื้อ

**User Story:** As a customer, I want to upload my payment slip immediately after placing an order, so that my order can be processed quickly.

#### Acceptance Criteria

1. WHEN a customer completes checkout, THE System SHALL redirect to order confirmation page
2. THE Order confirmation page SHALL display payment instructions prominently
3. THE Order confirmation page SHALL include an upload payment slip button
4. WHEN customer uploads slip on confirmation page, THE System SHALL save it and display success message
5. THE System SHALL allow customers to skip uploading and do it later from order tracking page

### Requirement 8: การแสดงสลิปในหน้าติดตามคำสั่งซื้อ

**User Story:** As a customer, I want to upload or view my payment slip from order tracking page, so that I can manage my payment conveniently.

#### Acceptance Criteria

1. WHEN customer views order tracking page, THE System SHALL display payment section
2. IF payment slip not uploaded, THE System SHALL display upload button
3. IF payment slip uploaded, THE System SHALL display slip thumbnail and status
4. WHEN customer clicks slip thumbnail, THE System SHALL display full size image
5. THE System SHALL allow re-uploading slip if previous one was rejected

## Special Requirements Guidance

### Image Upload and Storage

- THE System SHALL store uploaded slip images in `/uploads/payment-slips/` directory
- THE System SHALL generate unique filenames to prevent conflicts
- THE System SHALL validate image dimensions (minimum 300x300 pixels)
- THE System SHALL compress images if they exceed 2MB while maintaining readability

### Security

- THE System SHALL only allow authenticated customers to upload slips for their own orders
- THE System SHALL only allow staff and admin to view and verify payment slips
- THE System SHALL log all payment verification actions for audit trail
- THE System SHALL prevent unauthorized access to slip images

### Performance

- THE System SHALL load slip thumbnails efficiently using lazy loading
- THE System SHALL cache slip images for faster subsequent loads
- THE System SHALL handle concurrent slip uploads without data loss
