# Quick Test: Staff Verify Payment Slip

## 🚀 Quick Start

### Automated Test (30 seconds)
```bash
# Terminal 1: Start backend
cd backend && npm start

# Terminal 2: Run test
cd backend && node test-staff-verify-slip.js
```

### Manual Test (5 minutes)
1. **Start servers:**
   ```bash
   # Terminal 1
   cd backend && npm start
   
   # Terminal 2
   cd frontend && npm start
   ```

2. **Create test data (if needed):**
   - Login as customer: `customer@itkmmshop22.com` / `customer123`
   - Create order with bank transfer
   - Upload payment slip

3. **Test verification:**
   - Login as staff: `staff@itkmmshop22.com` / `staff123`
   - Go to "ตรวจสอบสลิป" (Payment Verification)
   - Click on pending payment
   - Click "✓ ยืนยันการชำระเงิน"
   - Verify success message

4. **Verify results:**
   - ✅ Payment status = "verified"
   - ✅ Order status = "processing"
   - ✅ Notification count decreased
   - ✅ Verification details recorded

## 📋 Expected Results

| Check | Before | After |
|-------|--------|-------|
| Payment Status | pending | verified |
| Order Status | pending | processing |
| Notification Count | N | N - 1 |
| Verified By | null | Staff Name |
| Verified At | null | Timestamp |

## 🔍 What to Check

### Frontend
- [ ] Pending payments list displays
- [ ] Click payment opens viewer
- [ ] Slip image displays correctly
- [ ] Zoom in/out works
- [ ] Verify button works
- [ ] Success message appears
- [ ] Payment disappears from pending list

### Backend
- [ ] API endpoint responds
- [ ] Payment record updates
- [ ] Order status updates
- [ ] Verification details saved
- [ ] Timestamp recorded

### Integration
- [ ] Customer sees verified status
- [ ] Notification count updates
- [ ] Real-time updates work

## 🐛 Troubleshooting

**No pending payments?**
→ Create order and upload slip first

**Verify button doesn't work?**
→ Check browser console and network tab

**Order status not updating?**
→ Check backend logs

## 📚 Full Documentation

- **Automated Test:** `backend/test-staff-verify-slip.js`
- **Manual Guide:** `MANUAL_TEST_STAFF_VERIFY_SLIP.md`
- **Summary:** `STAFF_VERIFY_SLIP_TEST_SUMMARY.md`

## ✅ Success Criteria

All of these should be true:
- ✅ Staff can login
- ✅ Pending payments visible
- ✅ Slip viewer opens
- ✅ Verify button works
- ✅ Payment status updates
- ✅ Order status updates
- ✅ Details recorded
- ✅ Notification updates
- ✅ Customer sees changes

---

**Quick Test Status:** ⬜ Not Run  ⬜ Pass  ⬜ Fail

**Notes:** ___________________________
