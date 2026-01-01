# Implementation Plan: Payment Slip Upload and Verification System

## Overview

แผนการพัฒนาระบบจัดการสลิปการชำระเงินสำหรับ itkmmshop22 โดยแบ่งเป็น 6 ส่วนหลัก: Components พื้นฐาน, หน้าลูกค้า, หน้าสตาฟ/แอดมิน, ระบบแจ้งเตือน, การทดสอบ, และการรวมทุกอย่างเข้าด้วยกัน

## Tasks

- [x] 1. สร้าง Shared Components และ Utilities
  - สร้าง components พื้นฐานที่ใช้ร่วมกันทั้งระบบ
  - _Requirements: 1.1, 1.2, 1.3, 2.2, 4.1_

- [x] 1.1 สร้าง PaymentInstructions Component
  - สร้างไฟล์ `frontend/src/components/payment/PaymentInstructions.js`
  - แสดงข้อมูลบัญชีธนาคาร (ธนาคารกสิกรไทย, เลขที่บัญชี 123-4-56789-0)
  - แสดงข้อมูล PromptPay (เบอร์โทร)
  - รองรับ props: `paymentMethod`, `orderAmount`
  - สร้างไฟล์ CSS `frontend/src/components/payment/PaymentInstructions.css`
  - _Requirements: 1.1, 2.5_

- [x] 1.2 สร้าง PaymentSlipViewer Component
  - สร้างไฟล์ `frontend/src/components/payment/PaymentSlipViewer.js`
  - แสดงรูปสลิปเต็มขนาดใน modal
  - รองรับ zoom in/out
  - แสดงรายละเอียดคำสั่งซื้อข้างๆ รูปสลิป
  - รองรับ props: `payment`, `order`, `onClose`, `onVerify`, `onReject`, `isStaff`
  - สร้างไฟล์ CSS `frontend/src/components/payment/PaymentSlipViewer.css`
  - _Requirements: 2.2, 4.1, 4.2_

- [x] 1.3 สร้าง utility functions สำหรับ file validation
  - สร้างไฟล์ `frontend/src/utils/fileValidation.js`
  - ฟังก์ชัน `validateImageFile(file)` - ตรวจสอบ type (.jpg, .jpeg, .png) และ size (max 5MB)
  - ฟังก์ชัน `generatePreview(file)` - สร้าง preview URL จาก File object
  - ฟังก์ชัน `formatFileSize(bytes)` - แปลง bytes เป็น human-readable format
  - _Requirements: 1.3, 1.6, 1.7_

- [x] 2. สร้างหน้าอัปโหลดสลิปสำหรับลูกค้า
  - พัฒนา UI สำหรับให้ลูกค้าอัปโหลดสลิปการชำระเงิน
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2.1 สร้าง PaymentSlipUpload Component
  - สร้างไฟล์ `frontend/src/components/payment/PaymentSlipUpload.js`
  - File input with drag & drop support
  - Image preview ก่อนอัปโหลด
  - Upload progress indicator
  - Success/error messages
  - รองรับ props: `orderId`, `orderAmount`, `onUploadSuccess`, `onUploadError`, `showInstructions`
  - เรียกใช้ `validateImageFile()` ก่อนอัปโหลด
  - เรียก API `POST /api/payments/upload-slip` พร้อม FormData
  - สร้างไฟล์ CSS `frontend/src/components/payment/PaymentSlipUpload.css`
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2.2 เขียน property test สำหรับ file validation
  - **Property 1: File Validation Consistency**
  - **Validates: Requirements 1.3, 1.6, 1.7**
  - สร้างไฟล์ `frontend/src/components/payment/__tests__/fileValidation.test.js`
  - Generate random files with various types and sizes
  - Verify validation correctly accepts valid files and rejects invalid files
  - Test minimum 100 iterations

- [x] 2.3 แก้ไข OrderConfirmation page เพื่อเพิ่มส่วนอัปโหลดสลิป
  - แก้ไขไฟล์ `frontend/src/pages/customer/OrderConfirmation.js`
  - เพิ่ม import `PaymentSlipUpload` และ `PaymentInstructions`
  - แสดง PaymentInstructions หลังจาก order summary
  - แสดง PaymentSlipUpload component ถ้า payment method เป็น bank_transfer หรือ promptpay
  - เพิ่ม state สำหรับ track upload status
  - แสดงปุ่ม "ข้ามไปก่อน อัปโหลดทีหลังได้" พร้อม link ไป order tracking
  - อัปเดต CSS ใน `frontend/src/pages/customer/OrderConfirmation.css`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 2.4 เขียน property test สำหรับ upload success state update
  - **Property 2: Upload Success State Update**
  - **Validates: Requirements 1.4, 1.5**
  - สร้างไฟล์ `frontend/src/components/payment/__tests__/uploadFlow.test.js`
  - Generate random successful upload responses
  - Verify state updates correctly (success message, payment record update)
  - Test minimum 100 iterations

- [x] 2.5 แก้ไข OrderTracking page เพื่อเพิ่มส่วนจัดการสลิป
  - แก้ไขไฟล์ `frontend/src/pages/customer/OrderTracking.js`
  - เพิ่ม section "การชำระเงิน" ใน tracking page
  - ถ้ายังไม่มีสลิป: แสดง PaymentSlipUpload component
  - ถ้ามีสลิปแล้ว: แสดง thumbnail, status badge, และปุ่มดูเต็มขนาด
  - ถ้าสลิปถูกปฏิเสธ: แสดง rejection reason และอนุญาตให้อัปโหลดใหม่
  - เพิ่ม state สำหรับ manage payment data
  - เรียก API `GET /api/payments/order/:orderId` เพื่อดึงข้อมูล payment
  - อัปเดต CSS ใน `frontend/src/pages/customer/OrderTracking.css`
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 2.6 เขียน property test สำหรับ conditional display logic
  - **Property 13: Conditional Upload Button Display**
  - **Validates: Requirements 8.2, 8.3**
  - สร้างไฟล์ `frontend/src/pages/customer/__tests__/orderTracking.test.js`
  - Generate random orders with/without payment slips
  - Verify correct UI elements display based on payment status
  - Test minimum 100 iterations

- [x] 3. Checkpoint - ทดสอบฟีเจอร์ลูกค้า
  - ทดสอบการอัปโหลดสลิปจากหน้า OrderConfirmation
  - ทดสอบการอัปโหลดสลิปจากหน้า OrderTracking
  - ทดสอบการแสดงสลิปที่อัปโหลดแล้ว
  - ตรวจสอบ validation errors แสดงถูกต้อง
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. สร้างหน้าตรวจสอบสลิปสำหรับสตาฟ/แอดมิน
  - พัฒนา UI สำหรับสตาฟ/แอดมินตรวจสอบและยืนยันสลิป
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 4.1 สร้าง PaymentVerification page
  - สร้างไฟล์ `frontend/src/pages/staff/PaymentVerification.js`
  - แสดงรายการ payments ที่รอตรวจสอบ (status = 'pending')
  - แสดง thumbnail, order number, customer name, amount, upload date
  - เพิ่ม filter dropdown (all, pending, verified, rejected)
  - เพิ่ม search input (order number, customer name)
  - เพิ่ม date range filter
  - เรียก API `GET /api/payments?status=pending` เพื่อดึงข้อมูล
  - Click payment item เพื่อเปิด PaymentSlipViewer modal
  - สร้างไฟล์ CSS `frontend/src/pages/staff/PaymentVerification.css`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 4.2 เขียน property test สำหรับ payment filtering
  - **Property 6: Payment Filtering Accuracy**
  - **Validates: Requirements 3.4, 3.5, 6.2**
  - สร้างไฟล์ `frontend/src/pages/staff/__tests__/paymentFiltering.test.js`
  - Generate random payment datasets and filter combinations
  - Verify filtered results match all criteria
  - Test minimum 100 iterations

- [x] 4.3 เพิ่มฟังก์ชัน Verify และ Reject ใน PaymentSlipViewer
  - แก้ไขไฟล์ `frontend/src/components/payment/PaymentSlipViewer.js`
  - เพิ่มปุ่ม "✓ ยืนยันการชำระเงิน" (สีเขียว) สำหรับ staff
  - เพิ่มปุ่ม "✕ ปฏิเสธ" (สีแดง) สำหรับ staff
  - เมื่อคลิก Verify: เรียก API `POST /api/payments/:id/verify-slip`
  - เมื่อคลิก Reject: แสดง modal ให้กรอก rejection reason
  - เมื่อ confirm reject: เรียก API `POST /api/payments/:id/confirm` with rejection data
  - แสดง loading state ระหว่างดำเนินการ
  - แสดง success/error message
  - Refresh payment list หลังจาก verify/reject สำเร็จ
  - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ]* 4.4 เขียน property test สำหรับ verification state transition
  - **Property 8: Payment Verification State Transition**
  - **Validates: Requirements 4.3, 4.6, 4.7**
  - สร้างไฟล์ `frontend/src/components/payment/__tests__/verificationFlow.test.js`
  - Generate random pending payments
  - Simulate verify action
  - Verify all state transitions (status, timestamp, order status update)
  - Test minimum 100 iterations

- [ ]* 4.5 เขียน property test สำหรับ rejection state transition
  - **Property 9: Payment Rejection State Transition**
  - **Validates: Requirements 4.5, 4.7, 8.5**
  - Extend `verificationFlow.test.js`
  - Generate random pending payments and rejection reasons
  - Simulate reject action
  - Verify all state transitions (status, reason, timestamp, re-upload allowed)
  - Test minimum 100 iterations

- [x] 4.6 เพิ่มเมนู "ตรวจสอบสลิป" ใน StaffDashboard
  - แก้ไขไฟล์ `frontend/src/pages/staff/StaffDashboard.js`
  - เพิ่ม nav item "💳 ตรวจสอบสลิป" ใน sidebar
  - เพิ่ม route `/staff/payment-verification` ใน Routes
  - เพิ่ม card "ตรวจสอบสลิป" ใน StaffHome
  - อัปเดต CSS ใน `frontend/src/pages/staff/StaffDashboard.css`
  - _Requirements: 3.1_

- [x] 4.7 เพิ่มเมนู "จัดการสลิป" ใน AdminDashboard
  - แก้ไขไฟล์ `frontend/src/pages/admin/AdminDashboard.js`
  - เพิ่ม nav link "💳 จัดการสลิป" ใน admin nav
  - เพิ่ม route `/admin/payment-verification` และ `/admin/payment-history`
  - เพิ่ม dashboard cards สำหรับ payment verification และ history
  - _Requirements: 3.1, 6.1_

- [x] 5. Checkpoint - ทดสอบฟีเจอร์สตาฟ/แอดมิน
  - ทดสอบการดูรายการสลิปที่รอตรวจสอบ
  - ทดสอบ filter และ search
  - ทดสอบการยืนยันสลิป
  - ทดสอบการปฏิเสธสลิปพร้อม reason
  - ตรวจสอบ order status อัปเดตหลัง verify
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. สร้างระบบแจ้งเตือนสำหรับสลิปใหม่
  - พัฒนาระบบแจ้งเตือนเมื่อมีสลิปใหม่
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 6.1 สร้าง NotificationBadge Component
  - สร้างไฟล์ `frontend/src/components/notifications/NotificationBadge.js`
  - แสดง badge สีแดงพร้อมจำนวน
  - เพิ่ม pulse animation สำหรับ notification ใหม่
  - รองรับ props: `count`, `onClick`
  - สร้างไฟล์ CSS `frontend/src/components/notifications/NotificationBadge.css`
  - _Requirements: 5.1, 5.2_

- [x] 6.2 สร้าง usePaymentNotifications custom hook
  - สร้างไฟล์ `frontend/src/hooks/usePaymentNotifications.js`
  - Poll API `GET /api/payments?status=pending` ทุก 30 วินาที
  - Track viewed/unviewed payments ใน localStorage
  - Return: `{ pendingCount, newPayments, markAsViewed, refresh }`
  - Implement exponential backoff สำหรับ polling
  - _Requirements: 5.1, 5.2, 5.4_

- [ ]* 6.3 เขียน property test สำหรับ notification count accuracy
  - **Property 7: Notification Count Accuracy**
  - **Validates: Requirements 3.6, 5.2, 5.4**
  - สร้างไฟล์ `frontend/src/hooks/__tests__/paymentNotifications.test.js`
  - Generate random sets of pending payments
  - Verify notification count equals pending count
  - Simulate verify/reject and verify count updates
  - Test minimum 100 iterations

- [x] 6.3 เพิ่ม NotificationBadge ใน StaffDashboard navigation
  - แก้ไขไฟล์ `frontend/src/pages/staff/StaffDashboard.js`
  - Import `usePaymentNotifications` hook
  - แสดง NotificationBadge ข้างๆ "ตรวจสอบสลิป" menu item
  - Click badge เพื่อไปหน้า PaymentVerification
  - _Requirements: 5.1, 5.2_

- [x] 6.4 เพิ่ม NotificationBadge ใน AdminDashboard navigation
  - แก้ไขไฟล์ `frontend/src/pages/admin/AdminDashboard.js`
  - Import `usePaymentNotifications` hook
  - แสดง NotificationBadge ข้างๆ "จัดการสลิป" menu item
  - _Requirements: 5.1, 5.2_

- [x] 6.5 เพิ่ม highlighting สำหรับ payments ใหม่ (< 24 ชั่วโมง)
  - แก้ไขไฟล์ `frontend/src/pages/staff/PaymentVerification.js`
  - เพิ่มฟังก์ชัน `isNewPayment(uploadDate)` - check if < 24 hours
  - เพิ่ม CSS class `new-payment` สำหรับ highlight (background สีเหลืองอ่อน, border สีเหลือง)
  - แสดง badge "ใหม่" สำหรับ payments ใหม่
  - _Requirements: 5.3_

- [x] 7. สร้างหน้าประวัติการชำระเงินสำหรับแอดมิน
  - พัฒนาหน้าประวัติและรายงานการชำระเงิน
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7.1 สร้าง PaymentHistory page
  - สร้างไฟล์ `frontend/src/pages/admin/PaymentHistory.js`
  - แสดงรายการ payments ทั้งหมดพร้อม pagination
  - เพิ่ม advanced filters: date range, status, payment method, amount range
  - แสดง payment statistics dashboard (total verified, rejected, pending)
  - เพิ่มปุ่ม "Export to CSV"
  - เรียก API `GET /api/payments` พร้อม query parameters
  - สร้างไฟล์ CSS `frontend/src/pages/admin/PaymentHistory.css`
  - _Requirements: 6.1, 6.2, 6.3_

- [ ]* 7.2 เขียน property test สำหรับ payment statistics
  - **Property 12: Payment Statistics Calculation**
  - **Validates: Requirements 6.5**
  - สร้างไฟล์ `frontend/src/pages/admin/__tests__/paymentStatistics.test.js`
  - Generate random payment datasets
  - Verify statistics calculations are accurate
  - Test minimum 100 iterations

- [x] 7.3 เพิ่มฟังก์ชัน Export to CSV
  - แก้ไขไฟล์ `frontend/src/pages/admin/PaymentHistory.js`
  - สร้างฟังก์ชัน `exportToCSV(payments)` - convert payments to CSV format
  - Include columns: order_number, customer_name, amount, status, upload_date, verified_date, verifier_name
  - Download CSV file with filename `payments_export_YYYYMMDD.csv`
  - แสดง loading state ระหว่าง export
  - _Requirements: 6.4_

- [ ]* 7.4 เขียน property test สำหรับ CSV export completeness
  - **Property 11: Payment History Export Completeness**
  - **Validates: Requirements 6.4**
  - สร้างไฟล์ `frontend/src/pages/admin/__tests__/csvExport.test.js`
  - Generate random filtered payment sets
  - Verify CSV includes all payments with complete data
  - Test minimum 100 iterations

- [x] 7.5 เพิ่ม route PaymentHistory ใน AdminDashboard
  - แก้ไขไฟล์ `frontend/src/pages/admin/AdminDashboard.js`
  - เพิ่ม route `/admin/payment-history` ใน Routes
  - เพิ่ม nav link "📊 ประวัติการชำระเงิน"
  - _Requirements: 6.1_

- [x] 8. Checkpoint - ทดสอบระบบแจ้งเตือนและประวัติ
  - ทดสอบ notification badge แสดงจำนวนถูกต้อง
  - ทดสอบ notification อัปเดตเมื่อ verify/reject
  - ทดสอบ highlighting สำหรับ payments ใหม่
  - ทดสอบ payment history filters
  - ทดสอบ CSV export
  - ทดสอบ payment statistics
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Integration และ Polish
  - รวมทุกส่วนเข้าด้วยกัน ปรับแต่ง UI/UX และทดสอบ end-to-end
  - _Requirements: All_

- [x] 9.1 เพิ่ม routes ใน App.js
  - แก้ไขไฟล์ `frontend/src/App.js`
  - Import PaymentVerification และ PaymentHistory components
  - เพิ่ม protected routes สำหรับ staff/admin
  - Verify authentication และ authorization
  - _Requirements: All_

- [x] 9.2 ปรับแต่ง responsive design
  - ตรวจสอบทุก component ใน mobile, tablet, desktop
  - ปรับ CSS สำหรับ breakpoints (< 768px, 768-1024px, > 1024px)
  - ทดสอบ drag & drop บน touch devices
  - ทดสอบ modal และ image viewer บน mobile
  - _Requirements: All_

- [x] 9.3 เพิ่ม loading states และ error handling
  - เพิ่ม loading spinners สำหรับทุก async operations
  - เพิ่ม error boundaries สำหรับ catch unexpected errors
  - แสดง user-friendly error messages
  - เพิ่ม retry buttons สำหรับ failed operations
  - _Requirements: All_

- [ ] 9.4 เขียน integration tests สำหรับ end-to-end flows
  - สร้างไฟล์ `frontend/src/__tests__/integration/paymentSlipFlow.test.js`
  - Test flow: Upload slip → Staff verifies → Order status updates
  - Test flow: Upload slip → Staff rejects → Customer re-uploads
  - Test flow: Upload slip → Notification appears → Staff views
  - Use React Testing Library และ MSW สำหรับ mock API

- [x] 9.5 เพิ่ม accessibility features
  - เพิ่ม ARIA labels สำหรับทุก interactive elements
  - ทดสอบ keyboard navigation (Tab, Enter, Escape)
  - ทดสอบ screen reader compatibility
  - เพิ่ม focus indicators ที่ชัดเจน
  - ตรวจสอบ color contrast ratios
  - _Requirements: All_

- [x] 9.6 Optimize performance
  - Implement lazy loading สำหรับ payment images
  - Add React.memo สำหรับ expensive components
  - Implement virtual scrolling สำหรับ long payment lists
  - Optimize re-renders ด้วย useMemo และ useCallback
  - Compress uploaded images ก่อนส่ง server (optional)
  - _Requirements: All_

- [x] 10. Final Testing และ Documentation
  - ทดสอบทุกฟีเจอร์อย่างละเอียด และสร้างเอกสารการใช้งาน
  - _Requirements: All_

- [x] 10.1 Manual testing checklist
  - [-] อัปโหลดสลิปจากหน้า OrderConfirmation
  - [x] อัปโหลดสลิปจากหน้า OrderTracking
  - [x] ทดสอบ file validation (invalid type, too large)
  - [x] ทดสอบ drag & drop upload
  - [x] ดูสลิปเต็มขนาดพร้อม zoom
  - [x] สตาฟยืนยันสลิป
  - [ ] สตาฟปฏิเสธสลิปพร้อม reason
  - [ ] ลูกค้าอัปโหลดใหม่หลังถูกปฏิเสธ
  - [ ] Notification badge แสดงจำนวนถูกต้อง
  - [ ] Filter และ search payments
  - [ ] Export payment history to CSV
  - [ ] ทดสอบบน mobile, tablet, desktop
  - [ ] ทดสอบ keyboard navigation
  - [ ] ทดสอบ screen reader

- [ ] 10.2 Run all property-based tests
  - Run all property tests with minimum 100 iterations each
  - Verify all 13 correctness properties pass
  - Fix any failing tests
  - Document any edge cases discovered

- [x] 10.3 สร้างเอกสารการใช้งาน
  - สร้างไฟล์ `PAYMENT_SLIP_GUIDE.md`
  - คู่มือสำหรับลูกค้า: วิธีอัปโหลดสลิป
  - คู่มือสำหรับสตาฟ: วิธีตรวจสอบและยืนยันสลิป
  - คู่มือสำหรับแอดมิน: วิธีดูประวัติและ export ข้อมูล
  - Screenshot ประกอบทุกขั้นตอน
  - _Requirements: All_

- [x] 11. Final Checkpoint - Deployment Ready
  - ตรวจสอบทุกฟีเจอร์ทำงานถูกต้อง
  - ตรวจสอบ all tests pass
  - ตรวจสอบ performance และ accessibility
  - ตรวจสอบ security (file upload, authentication, authorization)
  - พร้อม deploy to production
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Backend API endpoints already exist - no backend changes needed
- Focus on creating clean, reusable components
- Maintain consistent styling with existing pages
- Test thoroughly on different devices and browsers
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
