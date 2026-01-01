# Manual Test Guide: Staff Verify Payment Slip

## Overview
This guide provides step-by-step instructions for manually testing the staff payment slip verification functionality.

## Prerequisites

### 1. Backend Server Running
```bash
cd backend
npm start
```
Server should be running on `http://localhost:5000`

### 2. Frontend Server Running
```bash
cd frontend
npm start
```
Frontend should be running on `http://localhost:3000`

### 3. Test Accounts
- **Staff Account:**
  - Email: `staff@itkmmshop22.com`
  - Password: `staff123`
  
- **Customer Account:**
  - Email: `customer@itkmmshop22.com`
  - Password: `customer123`

### 4. Test Data
You need at least one order with a pending payment slip. If none exists:
1. Login as customer
2. Add items to cart
3. Complete checkout with bank transfer or PromptPay
4. Upload a payment slip

---

## Test Procedure

### Part 1: Prepare Test Data (If Needed)

#### Step 1.1: Create Order as Customer
1. Open browser and go to `http://localhost:3000`
2. Login with customer credentials
3. Browse products and add items to cart
4. Go to checkout
5. Fill in delivery information
6. Select payment method: **Bank Transfer** or **PromptPay**
7. Complete order

#### Step 1.2: Upload Payment Slip
1. After order confirmation, you should see payment instructions
2. Click **"อัปโหลดสลิปการโอนเงิน"** button
3. Select a test image file (JPG, PNG, max 5MB)
4. Or use drag & drop to upload
5. Wait for upload to complete
6. Verify success message appears
7. Note the **Order Number** for later reference

---

### Part 2: Staff Verification Test

#### Step 2.1: Login as Staff
1. Logout from customer account
2. Go to `http://localhost:3000/login`
3. Login with staff credentials:
   - Email: `staff@itkmmshop22.com`
   - Password: `staff123`
4. Verify you're redirected to Staff Dashboard

#### Step 2.2: Navigate to Payment Verification
1. In Staff Dashboard, look for **"💳 ตรวจสอบสลิป"** menu item
2. Check if there's a notification badge showing pending count
3. Click on **"ตรวจสอบสลิป"** menu item
4. Verify you're redirected to `/staff/payment-verification`

#### Step 2.3: View Pending Payments List
1. Verify the page displays pending payment slips
2. Check that each payment shows:
   - ✅ Thumbnail image of slip
   - ✅ Order number
   - ✅ Customer name
   - ✅ Amount
   - ✅ Upload date/time
   - ✅ Status badge (should be "รอตรวจสอบ" - Pending)

#### Step 2.4: Test Filters (Optional)
1. Try the status filter dropdown:
   - Select "ทั้งหมด" (All)
   - Select "รอตรวจสอบ" (Pending)
   - Select "ยืนยันแล้ว" (Verified)
   - Select "ปฏิเสธ" (Rejected)
2. Try the search box:
   - Search by order number
   - Search by customer name
3. Verify filtering works correctly

#### Step 2.5: View Payment Slip Details
1. Click on a pending payment item
2. Verify PaymentSlipViewer modal opens
3. Check that the modal displays:
   - ✅ Full-size slip image
   - ✅ Zoom controls (+ and - buttons)
   - ✅ Order details on the side:
     - Order number
     - Customer name
     - Order amount
     - Payment method
     - Upload date
   - ✅ Two action buttons:
     - **"✓ ยืนยันการชำระเงิน"** (green button)
     - **"✕ ปฏิเสธ"** (red button)

#### Step 2.6: Test Zoom Functionality
1. Click the **"+"** button to zoom in
2. Verify image zooms in
3. Click the **"-"** button to zoom out
4. Verify image zooms out
5. Try clicking and dragging to pan the zoomed image

#### Step 2.7: Verify Payment Slip ⭐ **MAIN TEST**
1. Review the payment slip image carefully
2. Verify the amount matches the order amount
3. Click the **"✓ ยืนยันการชำระเงิน"** button
4. Wait for the verification to process
5. Check for success message
6. Verify the modal closes automatically

#### Step 2.8: Verify Results
After verification, check the following:

**A. Payment List Updates:**
1. The verified payment should disappear from pending list
2. Or if viewing "All", status should change to "ยืนยันแล้ว"
3. Notification badge count should decrease by 1

**B. Order Status Updates:**
1. Navigate to Order Management (if available)
2. Find the order you just verified
3. Verify order status changed to **"Processing"** or **"Paid"**

**C. Payment Record Updates:**
1. If you can view payment history, check:
   - Status: "verified"
   - Verified by: Your staff name
   - Verified at: Current timestamp

---

### Part 3: Verify from Customer Side

#### Step 3.1: Login as Customer
1. Logout from staff account
2. Login with customer credentials
3. Go to Order Tracking page

#### Step 3.2: Check Order Status
1. Find the order you just verified
2. Verify payment status shows as **"ยืนยันแล้ว"** (Verified)
3. Check that verification details are displayed:
   - Verified by staff name
   - Verification timestamp
4. Verify order status updated to "Processing"

---

## Expected Results Summary

### ✅ Successful Verification Should:
1. **Payment Status:** Change from "pending" to "verified"
2. **Order Status:** Change to "processing" or "paid"
3. **Notification Count:** Decrease by 1
4. **Verification Record:** Store staff name and timestamp
5. **Customer View:** Show verified status with details
6. **Payment List:** Remove from pending or update status

### ❌ Common Issues to Check:
- Payment not disappearing from pending list
- Order status not updating
- Notification count not decreasing
- Verification timestamp not recorded
- Staff name not recorded

---

## Automated Test Script

For automated testing, you can run:

```bash
cd backend
node test-staff-verify-slip.js
```

This script will:
1. Login as staff
2. Fetch pending payments
3. Verify a payment slip
4. Check all status updates
5. Verify notification count

---

## Test Checklist

Use this checklist to track your testing:

- [ ] Backend server running
- [ ] Frontend server running
- [ ] Test order with payment slip exists
- [ ] Staff login successful
- [ ] Navigate to Payment Verification page
- [ ] Pending payments list displays correctly
- [ ] Payment details modal opens
- [ ] Slip image displays correctly
- [ ] Zoom in/out works
- [ ] Verify button works
- [ ] Success message appears
- [ ] Payment status updates to verified
- [ ] Order status updates to processing
- [ ] Notification count decreases
- [ ] Customer can see verified status
- [ ] Verification details recorded (staff name, timestamp)

---

## Troubleshooting

### Issue: No pending payments found
**Solution:** Create a test order and upload a payment slip first

### Issue: Verify button doesn't work
**Possible causes:**
- Backend server not running
- API endpoint not responding
- Authentication token expired
- Database connection issue

**Check:**
1. Browser console for errors
2. Network tab for failed requests
3. Backend logs for errors

### Issue: Order status not updating
**Possible causes:**
- Backend logic not updating order status
- Database transaction failed

**Check:**
1. Backend logs
2. Database records directly
3. API response in network tab

### Issue: Notification count not decreasing
**Possible causes:**
- Frontend not refreshing data
- Polling not working
- State not updating

**Check:**
1. Refresh the page manually
2. Check browser console for errors
3. Verify usePaymentNotifications hook is working

---

## Notes

- This test validates **Requirement 4.3**: Staff can verify payment slips
- This test validates **Requirement 4.6**: Order status updates after verification
- This test validates **Requirement 4.7**: Verification details are recorded
- This test validates **Requirement 5.4**: Notification count updates

## Related Files

- Frontend: `frontend/src/pages/staff/PaymentVerification.js`
- Frontend: `frontend/src/components/payment/PaymentSlipViewer.js`
- Backend: `backend/controllers/paymentController.js`
- Backend: `backend/routes/payments.js`

---

## Test Status

**Date:** _____________

**Tester:** _____________

**Result:** ⬜ Pass  ⬜ Fail

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________
