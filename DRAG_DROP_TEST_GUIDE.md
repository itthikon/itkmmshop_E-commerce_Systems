# Drag & Drop Upload Testing Guide

## Overview
This guide provides step-by-step instructions for manually testing the drag & drop upload functionality in the Payment Slip Upload component.

## Prerequisites
- Backend server running on http://localhost:5000
- Frontend server running on http://localhost:3000
- Test account credentials (customer account)
- Test image files ready:
  - Valid: `test-slip-valid.jpg` (< 5MB, .jpg/.jpeg/.png)
  - Invalid type: `test-document.pdf`
  - Invalid size: `test-slip-large.jpg` (> 5MB)

## Test Scenarios

### Scenario 1: Basic Drag & Drop with Valid File

**Steps:**
1. Navigate to Order Confirmation page after placing an order
   - Or navigate to Order Tracking page for an existing order
2. Locate the payment slip upload section
3. Prepare a valid image file (test-slip-valid.jpg)
4. Drag the file from your file explorer
5. Hover over the upload dropzone area
6. Drop the file onto the dropzone

**Expected Results:**
- ✅ Dropzone should highlight with `drag-active` class when file is dragged over
- ✅ Dropzone highlight should disappear when file is dragged away
- ✅ After drop, image preview should appear immediately
- ✅ File name and size should display below preview
- ✅ "✓ อัปโหลดสลิป" button should appear
- ✅ No error messages should display

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________

---

### Scenario 2: Drag & Drop with Invalid File Type

**Steps:**
1. Navigate to payment slip upload section
2. Prepare an invalid file (test-document.pdf)
3. Drag the PDF file over the dropzone
4. Drop the file

**Expected Results:**
- ✅ Dropzone should highlight during drag
- ✅ After drop, error message should appear: "กรุณาเลือกไฟล์รูปภาพ (.jpg, .jpeg, .png) เท่านั้น"
- ✅ Error icon (⚠️) should display
- ✅ No preview should appear
- ✅ Upload button should NOT appear

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________

---

### Scenario 3: Drag & Drop with Oversized File

**Steps:**
1. Navigate to payment slip upload section
2. Prepare a large image file (> 5MB)
3. Drag the file over the dropzone
4. Drop the file

**Expected Results:**
- ✅ Dropzone should highlight during drag
- ✅ After drop, error message should appear: "ขนาดไฟล์ต้องไม่เกิน 5MB (ไฟล์ของคุณมีขนาด X.XX MB)"
- ✅ Error icon (⚠️) should display
- ✅ No preview should appear
- ✅ Upload button should NOT appear

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________

---

### Scenario 4: Drag Enter/Leave Visual Feedback

**Steps:**
1. Navigate to payment slip upload section
2. Prepare a valid image file
3. Drag the file over the dropzone (don't drop)
4. Observe the visual feedback
5. Drag the file away from the dropzone
6. Observe the visual feedback change

**Expected Results:**
- ✅ When dragging over: dropzone should have yellow/highlighted border and background
- ✅ When dragging away: dropzone should return to normal appearance
- ✅ Visual feedback should be smooth and immediate
- ✅ Cursor should indicate drop is possible

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________

---

### Scenario 5: Multiple Drag & Drop Operations

**Steps:**
1. Navigate to payment slip upload section
2. Drag and drop a valid file (File A)
3. Wait for preview to appear
4. Click "✕ เปลี่ยนรูป" button
5. Drag and drop a different valid file (File B)

**Expected Results:**
- ✅ First file preview should appear correctly
- ✅ After clicking clear, preview should disappear
- ✅ Dropzone should return to initial state
- ✅ Second file can be dragged and dropped successfully
- ✅ Second file preview should appear correctly
- ✅ File info should update to show second file's name and size

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________

---

### Scenario 6: Drag & Drop After Upload Success

**Steps:**
1. Navigate to payment slip upload section
2. Drag and drop a valid file
3. Click "✓ อัปโหลดสลิป" button
4. Wait for upload to complete
5. After success message appears, click "อัปโหลดใหม่"
6. Try to drag and drop another file

**Expected Results:**
- ✅ Upload should complete successfully
- ✅ Success message should display
- ✅ After clicking "อัปโหลดใหม่", dropzone should reappear
- ✅ New file can be dragged and dropped
- ✅ New file preview should appear correctly

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________

---

### Scenario 7: Drag & Drop with Multiple Files

**Steps:**
1. Navigate to payment slip upload section
2. Select multiple image files in file explorer
3. Drag all files over the dropzone
4. Drop the files

**Expected Results:**
- ✅ Only the first file should be processed
- ✅ Preview should show only the first file
- ✅ No errors should occur
- ✅ System should handle gracefully

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________

---

### Scenario 8: Drag & Drop During Upload

**Steps:**
1. Navigate to payment slip upload section
2. Drag and drop a valid file
3. Click "✓ อัปโหลดสลิป" button
4. While upload is in progress, try to drag another file over the dropzone

**Expected Results:**
- ✅ Upload progress should display
- ✅ Dropzone should not be interactive during upload
- ✅ Drag operation should not interfere with ongoing upload
- ✅ Upload should complete successfully

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________

---

### Scenario 9: Keyboard Accessibility with Drag & Drop

**Steps:**
1. Navigate to payment slip upload section
2. Use Tab key to focus on the dropzone
3. Press Enter or Space key
4. File dialog should open
5. Select a file and confirm
6. Verify the file is processed

**Expected Results:**
- ✅ Dropzone should be focusable with Tab key
- ✅ Focus indicator should be visible
- ✅ Enter/Space should trigger file dialog
- ✅ Selected file should be processed correctly
- ✅ Drag & drop should still work after keyboard interaction

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________

---

### Scenario 10: Touch Device Simulation (Mobile/Tablet)

**Steps:**
1. Open browser DevTools
2. Enable device emulation (mobile/tablet)
3. Navigate to payment slip upload section
4. Try to interact with the dropzone
5. Click the dropzone to open file picker
6. Select a file from the simulated device

**Expected Results:**
- ✅ Dropzone should be clickable on touch devices
- ✅ File picker should open on tap
- ✅ Selected file should be processed correctly
- ✅ Preview should display properly on mobile
- ✅ Upload button should be easily tappable

**Status:** [ ] Pass [ ] Fail

**Notes:**
_______________________________________________________

---

## Browser Compatibility Testing

Test drag & drop functionality in the following browsers:

### Chrome/Edge (Chromium)
- [ ] Drag & drop works correctly
- [ ] Visual feedback is smooth
- [ ] File validation works
- [ ] Upload completes successfully

### Firefox
- [ ] Drag & drop works correctly
- [ ] Visual feedback is smooth
- [ ] File validation works
- [ ] Upload completes successfully

### Safari (macOS/iOS)
- [ ] Drag & drop works correctly
- [ ] Visual feedback is smooth
- [ ] File validation works
- [ ] Upload completes successfully

---

## Summary

**Total Scenarios:** 10
**Passed:** _____
**Failed:** _____
**Pass Rate:** _____%

**Critical Issues Found:**
_______________________________________________________
_______________________________________________________
_______________________________________________________

**Minor Issues Found:**
_______________________________________________________
_______________________________________________________
_______________________________________________________

**Recommendations:**
_______________________________________________________
_______________________________________________________
_______________________________________________________

**Tested By:** _____________________
**Date:** _____________________
**Environment:** Development / Staging / Production
