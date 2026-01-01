# Design Document: Payment Slip Upload and Verification System

## Overview

ระบบจัดการสลิปการชำระเงินสำหรับ itkmmshop22 ที่ช่วยให้ลูกค้าสามารถอัปโหลดสลิปการโอนเงินหลังจากสั่งซื้อสินค้า และให้สตาฟ/แอดมินสามารถตรวจสอบและยืนยันการชำระเงินได้อย่างมีประสิทธิภาพ

ระบบนี้จะเชื่อมต่อกับ Backend API ที่มีอยู่แล้ว (payment controller, SlipOK service) และสร้าง UI components ใหม่สำหรับ:
- หน้าอัปโหลดสลิปสำหรับลูกค้า
- หน้าตรวจสอบและยืนยันสลิปสำหรับสตาฟ/แอดมิน
- ระบบแจ้งเตือนสำหรับสลิปใหม่

## Architecture

### Frontend Components

```
frontend/src/
├── components/
│   ├── payment/
│   │   ├── PaymentSlipUpload.js       # Component สำหรับอัปโหลดสลิป
│   │   ├── PaymentSlipUpload.css
│   │   ├── PaymentSlipViewer.js       # Component สำหรับดูสลิปเต็มขนาด
│   │   ├── PaymentSlipViewer.css
│   │   └── PaymentInstructions.js     # Component แสดงข้อมูลบัญชีธนาคาร
│   └── notifications/
│       ├── NotificationBadge.js       # Badge แสดงจำนวนการแจ้งเตือน
│       └── NotificationBadge.css
├── pages/
│   ├── customer/
│   │   ├── OrderConfirmation.js       # เพิ่มส่วนอัปโหลดสลิป (แก้ไข)
│   │   └── OrderTracking.js           # เพิ่มส่วนอัปโหลด/ดูสลิป (แก้ไข)
│   ├── staff/
│   │   ├── PaymentVerification.js     # หน้าตรวจสอบสลิป (ใหม่)
│   │   ├── PaymentVerification.css
│   │   └── StaffDashboard.js          # เพิ่ม notification badge (แก้ไข)
│   └── admin/
│       ├── PaymentHistory.js          # หน้าประวัติการชำระเงิน (ใหม่)
│       ├── PaymentHistory.css
│       └── AdminDashboard.js          # เพิ่มเมนูจัดการสลิป (แก้ไข)
└── hooks/
    └── usePaymentNotifications.js     # Custom hook สำหรับ notifications
```

### Backend API Endpoints (มีอยู่แล้ว)

```
POST   /api/payments/upload-slip          # อัปโหลดสลิป
GET    /api/payments/order/:orderId       # ดูข้อมูลการชำระเงินของคำสั่งซื้อ
GET    /api/payments                      # ดูรายการการชำระเงินทั้งหมด (staff/admin)
POST   /api/payments/:id/verify-slip     # ยืนยันสลิป (staff/admin)
POST   /api/payments/:id/confirm          # ยืนยันการชำระเงินแบบ manual (staff/admin)
GET    /api/payments/:id                  # ดูรายละเอียดการชำระเงิน
```

## Components and Interfaces

### 1. PaymentSlipUpload Component

**Purpose:** Component สำหรับให้ลูกค้าอัปโหลดสลิปการชำระเงิน

**Props:**
```typescript
interface PaymentSlipUploadProps {
  orderId: number;
  orderAmount: number;
  onUploadSuccess?: (payment: Payment) => void;
  onUploadError?: (error: Error) => void;
  showInstructions?: boolean;
}
```

**Features:**
- File input with drag & drop support
- Image preview before upload
- File validation (type, size)
- Upload progress indicator
- Success/error messages
- Payment instructions display

**State:**
```typescript
{
  selectedFile: File | null;
  preview: string | null;
  uploading: boolean;
  uploadProgress: number;
  error: string | null;
  success: boolean;
}
```

### 2. PaymentSlipViewer Component

**Purpose:** Component สำหรับดูสลิปเต็มขนาดพร้อมรายละเอียด

**Props:**
```typescript
interface PaymentSlipViewerProps {
  payment: Payment;
  order: Order;
  onClose: () => void;
  onVerify?: (paymentId: number) => void;
  onReject?: (paymentId: number, reason: string) => void;
  isStaff?: boolean;
}
```

**Features:**
- Full-size image display with zoom
- Order details side-by-side
- Verify/Reject buttons (for staff)
- Rejection reason modal
- Payment status display
- Verification history

### 3. PaymentVerification Page (Staff/Admin)

**Purpose:** หน้าสำหรับสตาฟ/แอดมินตรวจสอบและยืนยันสลิป

**Features:**
- List of pending payment slips
- Filter by status (pending, verified, rejected)
- Search by order number or customer name
- Slip thumbnail with order info
- Click to view full details
- Bulk actions (future enhancement)
- Real-time updates

**State:**
```typescript
{
  payments: Payment[];
  loading: boolean;
  filters: {
    status: 'pending' | 'verified' | 'rejected' | 'all';
    search: string;
    dateFrom: Date | null;
    dateTo: Date | null;
  };
  selectedPayment: Payment | null;
  showViewer: boolean;
}
```

### 4. PaymentHistory Page (Admin)

**Purpose:** หน้าประวัติการชำระเงินทั้งหมด

**Features:**
- Complete payment history
- Advanced filters (date range, status, payment method, amount range)
- Export to CSV
- Payment statistics dashboard
- Pagination
- Sort by various fields

### 5. NotificationBadge Component

**Purpose:** แสดงจำนวนสลิปที่รอตรวจสอบ

**Props:**
```typescript
interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
}
```

**Features:**
- Display count badge
- Pulse animation for new notifications
- Click to navigate to verification page

### 6. usePaymentNotifications Hook

**Purpose:** Custom hook สำหรับจัดการ notifications

**Returns:**
```typescript
{
  pendingCount: number;
  newPayments: Payment[];
  markAsViewed: (paymentId: number) => void;
  refresh: () => void;
}
```

**Features:**
- Poll for new payments every 30 seconds
- Track viewed/unviewed payments
- Provide notification count
- Auto-refresh on payment actions

## Data Models

### Payment Model (Frontend)

```typescript
interface Payment {
  id: number;
  order_id: number;
  payment_method: 'bank_transfer' | 'promptpay' | 'cash' | 'cod';
  amount: number;
  slip_image_path: string | null;
  status: 'pending' | 'verified' | 'rejected';
  verified: boolean;
  verified_by: number | null;
  verified_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined data
  order_number?: string;
  customer_name?: string;
  verifier_name?: string;
}
```

### Order Model (Extended)

```typescript
interface Order {
  // ... existing fields
  payment_status: 'pending' | 'paid' | 'failed';
  payment?: Payment;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File Validation Consistency
*For any* file selected for upload, the validation logic should correctly identify valid image files (.jpg, .jpeg, .png) under 5MB and reject all others with appropriate error messages.
**Validates: Requirements 1.3, 1.6, 1.7**

### Property 2: Upload Success State Update
*For any* successful payment slip upload, the system should update the order's payment record, display a success message, and refresh the payment status display.
**Validates: Requirements 1.4, 1.5**

### Property 3: Payment Status Display Accuracy
*For any* order with a payment record, the system should display the correct payment status (pending, verified, rejected) along with all relevant details (timestamp, verifier, reason).
**Validates: Requirements 2.1, 2.3, 2.4**

### Property 4: Slip Image Display Consistency
*For any* order with an uploaded payment slip, the system should display the slip image (thumbnail in lists, full-size in viewer) correctly.
**Validates: Requirements 2.2, 8.3, 8.4**

### Property 5: Pending Payments List Completeness
*For any* set of orders with pending payment slips, the staff verification page should display all of them with complete information (order number, customer name, amount, upload date, thumbnail).
**Validates: Requirements 3.1, 3.2**

### Property 6: Payment Filtering Accuracy
*For any* filter combination (status, search term, date range), the system should return only payments matching all specified criteria.
**Validates: Requirements 3.4, 3.5, 6.2**

### Property 7: Notification Count Accuracy
*For any* number of pending payments, the notification badge should display the exact count and update immediately when payments are verified or rejected.
**Validates: Requirements 3.6, 5.2, 5.4**

### Property 8: Payment Verification State Transition
*For any* pending payment, when staff clicks verify, the system should: (1) mark payment as verified, (2) record verifier and timestamp, (3) update order status to "processing", (4) update notification count.
**Validates: Requirements 4.3, 4.6, 4.7**

### Property 9: Payment Rejection State Transition
*For any* pending payment, when staff provides a rejection reason and confirms, the system should: (1) mark payment as rejected, (2) store rejection reason, (3) record rejector and timestamp, (4) allow customer to re-upload.
**Validates: Requirements 4.5, 4.7, 8.5**

### Property 10: New Payment Highlighting
*For any* payment uploaded within the last 24 hours, the system should visually highlight it in the staff verification list.
**Validates: Requirements 5.3**

### Property 11: Payment History Export Completeness
*For any* set of filtered payments, the CSV export should include all payments matching the filter with complete data fields.
**Validates: Requirements 6.4**

### Property 12: Payment Statistics Calculation
*For any* set of payments, the statistics display should show accurate counts for total verified, total rejected, and pending payments.
**Validates: Requirements 6.5**

### Property 13: Conditional Upload Button Display
*For any* order on the tracking page, the system should display an upload button if no slip exists, or display slip thumbnail and status if slip exists.
**Validates: Requirements 8.2, 8.3**

## Error Handling

### Client-Side Validation Errors

1. **Invalid File Type**
   - Error: "กรุณาเลือกไฟล์รูปภาพ (.jpg, .jpeg, .png) เท่านั้น"
   - Action: Clear file selection, show error message

2. **File Too Large**
   - Error: "ขนาดไฟล์ต้องไม่เกิน 5MB"
   - Action: Clear file selection, show error message

3. **No File Selected**
   - Error: "กรุณาเลือกไฟล์สลิปการโอนเงิน"
   - Action: Show error message, prevent upload

### Server-Side Errors

1. **Upload Failed**
   - Error: "ไม่สามารถอัปโหลดสลิปได้ กรุณาลองใหม่อีกครั้ง"
   - Action: Allow retry, show error message

2. **Order Not Found**
   - Error: "ไม่พบคำสั่งซื้อ"
   - Action: Redirect to orders page

3. **Unauthorized Access**
   - Error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้"
   - Action: Redirect to login or home page

4. **Payment Already Verified**
   - Error: "การชำระเงินนี้ได้รับการยืนยันแล้ว"
   - Action: Refresh payment status, disable verify button

### Network Errors

1. **Connection Timeout**
   - Error: "การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง"
   - Action: Show retry button

2. **Network Offline**
   - Error: "ไม่สามารถเชื่อมต่ออินเทอร์เน็ตได้"
   - Action: Show offline indicator, queue actions for retry

## Testing Strategy

### Unit Tests

**Components to Test:**
- PaymentSlipUpload: file validation, preview generation, upload flow
- PaymentSlipViewer: image display, action buttons, modal behavior
- PaymentVerification: filtering, searching, list rendering
- NotificationBadge: count display, animation triggers

**Test Cases:**
- File validation with various file types and sizes
- Upload success and error scenarios
- Filter and search functionality
- Notification count updates
- Modal open/close behavior
- Button enable/disable states

### Property-Based Tests

Each correctness property should be implemented as a property-based test with minimum 100 iterations:

**Property 1 Test:**
- Generate random files with various types and sizes
- Verify validation logic correctly accepts/rejects each file
- Tag: **Feature: payment-slip-management, Property 1: File Validation Consistency**

**Property 2 Test:**
- Generate random successful upload responses
- Verify state updates correctly for each response
- Tag: **Feature: payment-slip-management, Property 2: Upload Success State Update**

**Property 3 Test:**
- Generate random payment records with different statuses
- Verify display shows correct status and details for each
- Tag: **Feature: payment-slip-management, Property 3: Payment Status Display Accuracy**

**Property 6 Test:**
- Generate random payment datasets and filter combinations
- Verify filtered results match all criteria
- Tag: **Feature: payment-slip-management, Property 6: Payment Filtering Accuracy**

**Property 7 Test:**
- Generate random sets of pending payments
- Verify notification count equals pending count
- Simulate verify/reject actions and verify count updates
- Tag: **Feature: payment-slip-management, Property 7: Notification Count Accuracy**

**Property 8 Test:**
- Generate random pending payments
- Simulate verify action for each
- Verify all state transitions occur correctly
- Tag: **Feature: payment-slip-management, Property 8: Payment Verification State Transition**

**Property 9 Test:**
- Generate random pending payments and rejection reasons
- Simulate reject action for each
- Verify all state transitions occur correctly
- Tag: **Feature: payment-slip-management, Property 9: Payment Rejection State Transition**

### Integration Tests

1. **End-to-End Upload Flow**
   - Customer uploads slip → Staff verifies → Order status updates
   - Verify all components work together correctly

2. **Notification System**
   - Upload slip → Notification appears → Staff views → Count updates
   - Verify real-time updates work correctly

3. **Re-upload After Rejection**
   - Upload slip → Staff rejects → Customer re-uploads → Staff verifies
   - Verify rejection and re-upload flow works correctly

### Manual Testing Checklist

- [ ] Upload various image formats and sizes
- [ ] Test drag & drop functionality
- [ ] Verify image preview displays correctly
- [ ] Test upload progress indicator
- [ ] Verify success/error messages display
- [ ] Test slip viewer zoom functionality
- [ ] Verify filter and search work correctly
- [ ] Test notification badge updates in real-time
- [ ] Verify CSV export contains correct data
- [ ] Test responsive design on mobile devices
- [ ] Verify accessibility (keyboard navigation, screen readers)

## UI/UX Design Guidelines

### Color Scheme

- **Pending Status:** `#ffc107` (amber/warning)
- **Verified Status:** `#28a745` (green/success)
- **Rejected Status:** `#dc3545` (red/danger)
- **Primary Action:** `#667eea` (purple gradient)
- **Secondary Action:** `#6c757d` (gray)

### Typography

- **Headings:** Sarabun, bold, 1.5-2.5rem
- **Body Text:** Sarabun, regular, 1rem
- **Small Text:** Sarabun, regular, 0.85rem

### Spacing

- **Component Padding:** 20-30px
- **Element Margin:** 15-20px
- **Grid Gap:** 20-25px

### Animations

- **Fade In:** 0.3s ease-in
- **Slide Up:** 0.3s ease-out
- **Pulse (Notification):** 2s infinite
- **Hover Transform:** translateY(-2px), 0.2s ease

### Responsive Breakpoints

- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

## Security Considerations

1. **Authentication & Authorization**
   - Only authenticated customers can upload slips for their own orders
   - Only staff/admin can view and verify payment slips
   - Verify user permissions on every API call

2. **File Upload Security**
   - Validate file type on both client and server
   - Scan uploaded files for malware (future enhancement)
   - Generate unique filenames to prevent conflicts
   - Store files outside web root with restricted access

3. **Data Privacy**
   - Payment slips contain sensitive financial information
   - Implement proper access controls
   - Log all access to payment slips for audit trail
   - Consider encrypting slip images at rest (future enhancement)

4. **CSRF Protection**
   - Use CSRF tokens for all state-changing operations
   - Verify tokens on server-side

5. **Rate Limiting**
   - Limit upload attempts per user per time period
   - Prevent abuse of verification endpoints

## Performance Optimization

1. **Image Optimization**
   - Compress uploaded images while maintaining readability
   - Generate thumbnails for list views
   - Use lazy loading for image lists
   - Implement image caching

2. **API Optimization**
   - Implement pagination for payment lists
   - Use efficient database queries with proper indexes
   - Cache frequently accessed data (bank account info)
   - Implement debouncing for search inputs

3. **Frontend Optimization**
   - Code splitting for payment-related components
   - Memoize expensive computations
   - Use virtual scrolling for long lists
   - Optimize re-renders with React.memo

4. **Real-time Updates**
   - Use polling with exponential backoff
   - Consider WebSocket for real-time notifications (future enhancement)
   - Implement optimistic UI updates

## Future Enhancements

1. **Automatic Slip Verification**
   - Integrate SlipOK API for automatic verification
   - OCR to extract payment details from slip
   - Auto-match payment amount with order amount

2. **Mobile App**
   - Native mobile app for easier slip upload
   - Camera integration for direct photo capture
   - Push notifications for payment status updates

3. **Payment Analytics**
   - Payment success rate tracking
   - Average verification time
   - Peak upload times
   - Payment method preferences

4. **Bulk Operations**
   - Bulk verify multiple payments
   - Bulk export selected payments
   - Batch processing for efficiency

5. **Customer Notifications**
   - Email notification when payment is verified/rejected
   - SMS notification option
   - In-app notification system
