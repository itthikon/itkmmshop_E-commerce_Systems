# 🧪 Manual Testing: Payment Slip Upload from OrderTracking Page

## Overview
This document provides step-by-step instructions for manually testing the payment slip upload functionality from the OrderTracking page.

## Prerequisites
✅ Backend server running on `http://localhost:5050`
✅ Frontend server running on `http://localhost:3000`
✅ Test orders created (run `node backend/test-order-tracking-payment-upload.js`)
✅ Test image files ready for upload (.jpg, .jpeg, .png)

---

## Test Scenarios

### Scenario 1: Order WITHOUT Payment Slip
**Objective:** Verify that customers can upload a payment slip for orders that don't have one yet.

#### Test Steps:
1. Open browser and navigate to: `http://localhost:3000/track-order/3`
   - Or use order number: `ORD-TEST-1767250270721-243`
   - Contact: `customer@itkmmshop22.com`

2. **Verify Initial Display:**
   - [ ] Payment section is visible
   - [ ] Payment instructions are displayed (bank account details)
   - [ ] PaymentSlipUpload component is shown
   - [ ] Message shows "📤 ยังไม่ได้อัปโหลดสลิปการโอนเงิน"
   - [ ] Upload button/area is visible

3. **Test File Selection:**
   - [ ] Click "เลือกไฟล์" button
   - [ ] File dialog opens
   - [ ] Select a valid image file (.jpg, .jpeg, or .png)
   - [ ] Image preview appears
   - [ ] File name is displayed

4. **Test Drag & Drop:**
   - [ ] Drag an image file over the upload area
   - [ ] Drop zone highlights
   - [ ] Drop the file
   - [ ] Image preview appears

5. **Test File Validation:**
   - [ ] Try uploading a .pdf file → Should show error "กรุณาเลือกไฟล์รูปภาพ (.jpg, .jpeg, .png) เท่านั้น"
   - [ ] Try uploading a file > 5MB → Should show error "ขนาดไฟล์ต้องไม่เกิน 5MB"
   - [ ] Try uploading without selecting file → Should show error

6. **Test Upload Process:**
   - [ ] Select a valid image file
   - [ ] Click "อัปโหลดสลิป" button
   - [ ] Upload progress indicator appears
   - [ ] Success message displays
   - [ ] Payment section updates to show uploaded slip

7. **Verify After Upload:**
   - [ ] Slip thumbnail is displayed
   - [ ] Status badge shows "รอตรวจสอบ" (pending)
   - [ ] Upload component is hidden
   - [ ] Can click thumbnail to view full size

---

### Scenario 2: Order WITH Pending Payment Slip
**Objective:** Verify that customers can view their uploaded payment slip and its status.

#### Test Steps:
1. Navigate to: `http://localhost:3000/track-order/4`
   - Order number: `ORD-TEST-1767250270724-247`

2. **Verify Display:**
   - [ ] Payment section is visible
   - [ ] Slip thumbnail is displayed
   - [ ] Status badge shows "⏳ รอตรวจสอบ" with yellow/amber color
   - [ ] "🔍 ดูเต็มขนาด" button is visible
   - [ ] Upload component is NOT shown

3. **Test Slip Viewer:**
   - [ ] Click on slip thumbnail
   - [ ] Modal opens with full-size image
   - [ ] Image is clear and readable
   - [ ] Order details are shown side-by-side
   - [ ] Close button (X) works
   - [ ] Can close by clicking outside modal

4. **Test Zoom (if implemented):**
   - [ ] Zoom in button works
   - [ ] Zoom out button works
   - [ ] Image quality remains good when zoomed

---

### Scenario 3: Order WITH Failed/Rejected Payment Slip
**Objective:** Verify that customers can see rejection reason and re-upload a new slip.

#### Test Steps:
1. Navigate to: `http://localhost:3000/track-order/5`
   - Order number: `ORD-TEST-1767250270727-312`

2. **Verify Display:**
   - [ ] Payment section is visible
   - [ ] Slip thumbnail is displayed
   - [ ] Status badge shows "✕ ปฏิเสธ" with red color
   - [ ] Rejection reason is displayed: "จำนวนเงินไม่ตรง กรุณาอัปโหลดสลิปใหม่"
   - [ ] Re-upload instruction is shown
   - [ ] PaymentSlipUpload component is visible below

3. **Test Re-upload:**
   - [ ] Select a new image file
   - [ ] Upload progress indicator appears
   - [ ] Success message displays
   - [ ] Payment section updates with new slip
   - [ ] Status changes to "รอตรวจสอบ"
   - [ ] Old rejection reason is cleared

4. **Verify After Re-upload:**
   - [ ] New slip thumbnail is displayed
   - [ ] Status is "pending" (not rejected anymore)
   - [ ] Can view new slip in full size

---

### Scenario 4: Order WITH Verified Payment Slip
**Objective:** Verify that verified payments are displayed correctly and upload is disabled.

#### Test Steps:
1. Navigate to: `http://localhost:3000/track-order/6`
   - Order number: `ORD-TEST-1767250270729-349`

2. **Verify Display:**
   - [ ] Payment section is visible
   - [ ] Slip thumbnail is displayed
   - [ ] Status badge shows "✓ ยืนยันแล้ว" with green color
   - [ ] Verification timestamp is displayed
   - [ ] Upload component is NOT shown
   - [ ] No re-upload option available

3. **Test Slip Viewer:**
   - [ ] Click on slip thumbnail
   - [ ] Modal opens with full-size image
   - [ ] Verification details are shown
   - [ ] Close button works

4. **Verify Order Status:**
   - [ ] Order status is "paid" or "processing"
   - [ ] Timeline shows payment completed
   - [ ] "ดูใบเสร็จ" button is available (if applicable)

---

## Additional Tests

### Responsive Design Testing
Test on different screen sizes:

#### Desktop (1920x1080)
- [ ] Payment section layout is correct
- [ ] Upload area is appropriately sized
- [ ] Slip thumbnail is clear
- [ ] Modal viewer displays properly

#### Tablet (768x1024)
- [ ] Layout adapts correctly
- [ ] Upload area is touch-friendly
- [ ] Buttons are easily clickable
- [ ] Modal is responsive

#### Mobile (375x667)
- [ ] Payment section stacks vertically
- [ ] Upload area is touch-optimized
- [ ] Slip thumbnail is appropriately sized
- [ ] Modal fits screen properly
- [ ] Text is readable

### Browser Compatibility
Test on different browsers:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Error Handling
- [ ] Network error during upload → Shows error message with retry option
- [ ] Server error → Shows user-friendly error message
- [ ] Invalid order ID → Shows "ไม่พบคำสั่งซื้อ"
- [ ] Unauthorized access → Redirects appropriately

### Performance
- [ ] Image preview loads quickly
- [ ] Upload progress is smooth
- [ ] Page doesn't freeze during upload
- [ ] Large images (< 5MB) upload successfully

---

## Checklist Summary

### Core Functionality
- [ ] Upload slip for order without payment
- [ ] View pending payment slip
- [ ] View rejection reason and re-upload
- [ ] View verified payment slip
- [ ] File validation (type and size)
- [ ] Drag & drop upload
- [ ] Image preview before upload
- [ ] Upload progress indicator
- [ ] Success/error messages

### UI/UX
- [ ] Payment instructions display correctly
- [ ] Status badges show correct colors
- [ ] Slip thumbnail displays properly
- [ ] Full-size viewer modal works
- [ ] Responsive design on all devices
- [ ] Buttons are clearly labeled
- [ ] Loading states are visible

### Integration
- [ ] API calls succeed
- [ ] Order data refreshes after upload
- [ ] Payment status updates correctly
- [ ] Timeline reflects payment status
- [ ] Receipt button appears when paid

---

## Known Issues / Notes

### Expected Behavior:
1. **Payment Method Requirement:** Payment section only shows for orders with `bank_transfer` or `promptpay` payment methods
2. **Status Mapping:** The backend uses `failed` status, but frontend may display as "rejected"
3. **Verification:** Staff/admin must verify slips from the PaymentVerification page

### Common Issues:
1. **Image Not Displaying:** Check that backend server is running and image path is correct
2. **Upload Fails:** Verify API endpoint is accessible and file size is within limits
3. **Status Not Updating:** Refresh the page or check network tab for API errors

---

## Test Results

### Test Date: _________________
### Tester Name: _________________

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. Upload without slip | ⬜ Pass ⬜ Fail | |
| 2. View pending slip | ⬜ Pass ⬜ Fail | |
| 3. Re-upload rejected slip | ⬜ Pass ⬜ Fail | |
| 4. View verified slip | ⬜ Pass ⬜ Fail | |
| Responsive Design | ⬜ Pass ⬜ Fail | |
| File Validation | ⬜ Pass ⬜ Fail | |
| Error Handling | ⬜ Pass ⬜ Fail | |

### Overall Result: ⬜ PASS ⬜ FAIL

### Issues Found:
1. _______________________________________
2. _______________________________________
3. _______________________________________

### Recommendations:
1. _______________________________________
2. _______________________________________
3. _______________________________________

---

## Cleanup

After testing, clean up test data:

```sql
-- Delete test orders and related data
DELETE FROM order_items WHERE order_id IN (3, 4, 5, 6);
DELETE FROM payments WHERE id IN (5, 6, 7);
DELETE FROM orders WHERE id IN (3, 4, 5, 6);
```

Or run:
```bash
mysql -u root -p@Zero2540 itkmmshop22 < cleanup-test-orders.sql
```

---

## Success Criteria

✅ All test scenarios pass
✅ No console errors
✅ Responsive design works on all devices
✅ File validation works correctly
✅ Upload process is smooth and intuitive
✅ Status badges display correctly
✅ Slip viewer modal works properly
✅ Error messages are user-friendly

---

## Next Steps

After manual testing is complete:
1. Document any bugs found
2. Create bug tickets if needed
3. Update implementation if issues found
4. Proceed to automated testing (if applicable)
5. Mark task as complete in tasks.md

---

**Note:** This is a manual testing task. Take your time to thoroughly test each scenario and document any issues found. The goal is to ensure the payment slip upload functionality works flawlessly for customers.
