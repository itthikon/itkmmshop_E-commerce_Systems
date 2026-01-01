# Manual UI Testing Guide: Auto SKU Generation

## Overview
This guide provides step-by-step instructions for manually testing the Auto SKU Generation feature in the UI.

**Requirements Tested:** 8.1, 8.2, 9.1, 10.1

---

## Prerequisites

1. **Start Backend Server:**
   ```bash
   cd backend
   npm start
   ```

2. **Start Frontend Server:**
   ```bash
   cd frontend
   npm start
   ```

3. **Login as Admin:**
   - Navigate to: http://localhost:3000/login
   - Use admin credentials from `backend/TEST_ACCOUNTS.md`

---

## Test 1: Category Management UI

### Test 1.1: Create Category with Prefix

**Steps:**
1. Navigate to Admin Dashboard
2. Click on "Category Management" or navigate to `/admin/categories`
3. Click "Add New Category" button
4. Fill in the form:
   - Name: "Test Electronics"
   - Prefix: "elec" (lowercase to test normalization)
   - Description: "Electronic products"
5. Click "Save" or "Create"

**Expected Results:**
- ✅ Category is created successfully
- ✅ Prefix is displayed as "ELEC" (uppercase)
- ✅ Success message appears
- ✅ Category appears in the list with prefix shown

**Screenshot Location:** Take screenshot and save as `test1-1-category-created.png`

---

### Test 1.2: Prefix Validation - Too Short

**Steps:**
1. Click "Add New Category"
2. Fill in:
   - Name: "Invalid Category 1"
   - Prefix: "A" (only 1 character)
3. Try to save

**Expected Results:**
- ✅ Error message appears: "Prefix must be 2-4 characters"
- ✅ Form is not submitted
- ✅ Error is displayed in real-time (if validation is on input)

**Screenshot Location:** `test1-2-prefix-too-short.png`

---

### Test 1.3: Prefix Validation - Too Long

**Steps:**
1. Fill in:
   - Name: "Invalid Category 2"
   - Prefix: "TOOLONG" (7 characters)
2. Try to save

**Expected Results:**
- ✅ Error message appears: "Prefix must be 2-4 characters"
- ✅ Form is not submitted

**Screenshot Location:** `test1-3-prefix-too-long.png`

---

### Test 1.4: Prefix Validation - Invalid Characters

**Steps:**
1. Fill in:
   - Name: "Invalid Category 3"
   - Prefix: "AB12" (contains numbers)
2. Try to save

**Expected Results:**
- ✅ Error message appears: "Prefix must contain only English letters"
- ✅ Form is not submitted

**Screenshot Location:** `test1-4-prefix-invalid-chars.png`

---

### Test 1.5: Prefix Validation - Duplicate Prefix

**Steps:**
1. Try to create another category with prefix "ELEC" (same as Test 1.1)
2. Fill in:
   - Name: "Another Electronics"
   - Prefix: "ELEC"
3. Try to save

**Expected Results:**
- ✅ Error message appears: "Prefix already exists"
- ✅ Form is not submitted

**Screenshot Location:** `test1-5-duplicate-prefix.png`

---

### Test 1.6: Update Category Prefix

**Steps:**
1. Find the "Test Electronics" category created in Test 1.1
2. Click "Edit"
3. Change prefix from "ELEC" to "ELCT"
4. Click "Save"

**Expected Results:**
- ✅ Warning message appears: "Changing prefix will only affect new products"
- ✅ Confirmation dialog appears (if implemented)
- ✅ After confirmation, category is updated
- ✅ Success message appears

**Screenshot Location:** `test1-6-prefix-change-warning.png`

---

## Test 2: Product Management UI - SKU Preview

### Test 2.1: SKU Preview on Category Selection

**Steps:**
1. Navigate to Product Management (`/admin/products`)
2. Click "Add New Product"
3. Observe the SKU field (should be empty or show placeholder)
4. Select category "Test Electronics" (ELEC prefix)
5. Observe the SKU field

**Expected Results:**
- ✅ SKU field is read-only (cannot be edited)
- ✅ SKU preview appears immediately after category selection
- ✅ SKU format is correct: ELEC00001 (or next available number)
- ✅ Loading indicator appears briefly during generation
- ✅ Hint text appears: "SKU will be generated automatically"

**Screenshot Location:** `test2-1-sku-preview.png`

---

### Test 2.2: SKU Preview Updates on Category Change

**Steps:**
1. In the Add Product form, select category "Test Electronics" (ELEC)
2. Note the SKU preview (e.g., ELEC00001)
3. Change category to another category with different prefix
4. Observe SKU field

**Expected Results:**
- ✅ SKU preview updates immediately
- ✅ New SKU has the new category's prefix
- ✅ Loading indicator appears during update
- ✅ No errors occur

**Screenshot Location:** `test2-2-sku-update-on-category-change.png`

---

### Test 2.3: SKU Preview with No Category

**Steps:**
1. In the Add Product form, ensure no category is selected
2. Observe the SKU field

**Expected Results:**
- ✅ SKU preview shows "GEN" prefix (e.g., GEN00001)
- ✅ Hint text explains default prefix usage

**Screenshot Location:** `test2-3-sku-no-category.png`

---

### Test 2.4: Create Product with Auto-Generated SKU

**Steps:**
1. Fill in product form:
   - Name: "Test Product 1"
   - Category: "Test Electronics"
   - Price: 999.99
   - Stock: 100
   - Other required fields
2. Observe SKU preview (e.g., ELEC00001)
3. Click "Save" or "Create Product"

**Expected Results:**
- ✅ Product is created successfully
- ✅ Success message shows the generated SKU
- ✅ Product appears in product list with correct SKU
- ✅ SKU matches the preview shown before saving

**Screenshot Location:** `test2-4-product-created.png`

---

### Test 2.5: Sequential SKU Numbering

**Steps:**
1. Create another product in the same category "Test Electronics"
2. Fill in:
   - Name: "Test Product 2"
   - Category: "Test Electronics"
   - Price: 1299.99
   - Stock: 50
3. Observe SKU preview
4. Save the product

**Expected Results:**
- ✅ SKU preview shows ELEC00002 (incremented from previous)
- ✅ Product is created with correct sequential SKU
- ✅ Both products have unique SKUs

**Screenshot Location:** `test2-5-sequential-sku.png`

---

### Test 2.6: Edit Product - SKU Immutable

**Steps:**
1. Find "Test Product 1" in product list
2. Click "Edit"
3. Observe the SKU field
4. Try to change the category
5. Observe the SKU field

**Expected Results:**
- ✅ SKU field is read-only and displays current SKU
- ✅ SKU cannot be edited (field is disabled)
- ✅ When category is changed, SKU remains unchanged
- ✅ Warning message appears: "SKU cannot be changed after creation"

**Screenshot Location:** `test2-6-sku-immutable.png`

---

## Test 3: Category Display in Product Form

### Test 3.1: Category Dropdown Shows Prefix

**Steps:**
1. In Add/Edit Product form, click on Category dropdown
2. Observe the category options

**Expected Results:**
- ✅ Each category shows format: "Category Name (PREFIX)"
- ✅ Example: "Test Electronics (ELEC)"
- ✅ Categories without prefix show: "Category Name (GEN)"

**Screenshot Location:** `test3-1-category-dropdown.png`

---

## Test 4: Error Handling

### Test 4.1: SKU Generation Error

**Steps:**
1. Create a category with prefix "ERR"
2. Manually insert 99999 products with SKUs ERR00001 to ERR99999 (use database script if needed)
3. Try to create a new product in this category

**Expected Results:**
- ✅ Error message appears: "Sequential number limit reached for this category"
- ✅ Suggestion appears: "Please create a new category or use a different prefix"
- ✅ Product is not created
- ✅ Form remains open for user to make changes

**Screenshot Location:** `test4-1-limit-reached-error.png`

**Note:** This test may require database manipulation. Skip if not feasible.

---

### Test 4.2: Network Error Handling

**Steps:**
1. Stop the backend server
2. Try to create a product
3. Observe error handling

**Expected Results:**
- ✅ Error message appears: "Unable to generate SKU. Please try again."
- ✅ User-friendly error message (not technical stack trace)
- ✅ Form remains usable after error

**Screenshot Location:** `test4-2-network-error.png`

---

## Test 5: Visual Design and UX

### Test 5.1: SKU Preview Styling

**Checklist:**
- ✅ SKU field is clearly marked as read-only (grayed out or disabled appearance)
- ✅ Loading indicator is visible and smooth
- ✅ Hint text is helpful and not intrusive
- ✅ SKU preview is prominently displayed
- ✅ Font and colors match the overall design

**Screenshot Location:** `test5-1-sku-styling.png`

---

### Test 5.2: Category Management Styling

**Checklist:**
- ✅ Prefix input field is clearly labeled
- ✅ Validation errors are displayed in red or warning color
- ✅ Success messages are displayed in green
- ✅ Category list shows prefix alongside name
- ✅ Edit/Delete buttons are accessible
- ✅ Overall layout is clean and intuitive

**Screenshot Location:** `test5-2-category-styling.png`

---

## Test 6: Complete User Workflow

### Test 6.1: End-to-End Workflow

**Steps:**
1. Login as admin
2. Create a new category "Fashion" with prefix "FASH"
3. Create a product "T-Shirt" in Fashion category
4. Verify SKU is FASH00001
5. Create another product "Jeans" in Fashion category
6. Verify SKU is FASH00002
7. Edit the Fashion category and change prefix to "CLTH"
8. Create a new product "Jacket" in Fashion category
9. Verify new product has SKU CLTH00001
10. Verify old products still have FASH SKUs

**Expected Results:**
- ✅ All steps complete without errors
- ✅ SKUs are generated correctly
- ✅ Prefix change is non-retroactive
- ✅ User experience is smooth and intuitive

**Screenshot Location:** `test6-1-complete-workflow.png`

---

## Test Results Summary

### Test Execution Date: _______________

### Tester Name: _______________

### Results:

| Test ID | Test Name | Status | Notes |
|---------|-----------|--------|-------|
| 1.1 | Create Category with Prefix | ⬜ Pass / ⬜ Fail | |
| 1.2 | Prefix Validation - Too Short | ⬜ Pass / ⬜ Fail | |
| 1.3 | Prefix Validation - Too Long | ⬜ Pass / ⬜ Fail | |
| 1.4 | Prefix Validation - Invalid Characters | ⬜ Pass / ⬜ Fail | |
| 1.5 | Prefix Validation - Duplicate Prefix | ⬜ Pass / ⬜ Fail | |
| 1.6 | Update Category Prefix | ⬜ Pass / ⬜ Fail | |
| 2.1 | SKU Preview on Category Selection | ⬜ Pass / ⬜ Fail | |
| 2.2 | SKU Preview Updates on Category Change | ⬜ Pass / ⬜ Fail | |
| 2.3 | SKU Preview with No Category | ⬜ Pass / ⬜ Fail | |
| 2.4 | Create Product with Auto-Generated SKU | ⬜ Pass / ⬜ Fail | |
| 2.5 | Sequential SKU Numbering | ⬜ Pass / ⬜ Fail | |
| 2.6 | Edit Product - SKU Immutable | ⬜ Pass / ⬜ Fail | |
| 3.1 | Category Dropdown Shows Prefix | ⬜ Pass / ⬜ Fail | |
| 4.1 | SKU Generation Error | ⬜ Pass / ⬜ Fail / ⬜ Skip | |
| 4.2 | Network Error Handling | ⬜ Pass / ⬜ Fail | |
| 5.1 | SKU Preview Styling | ⬜ Pass / ⬜ Fail | |
| 5.2 | Category Management Styling | ⬜ Pass / ⬜ Fail | |
| 6.1 | End-to-End Workflow | ⬜ Pass / ⬜ Fail | |

### Overall Status: ⬜ All Tests Passed / ⬜ Some Tests Failed

### Issues Found:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Recommendations:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## Requirements Validation

✅ **Requirement 8.1:** SKU field displayed correctly in product form
✅ **Requirement 8.2:** SKU preview updates on category selection
✅ **Requirement 9.1:** Category management UI displays prefixes
✅ **Requirement 10.1:** Error messages are clear and helpful

---

## Notes for Tester

- Take screenshots at each step for documentation
- Note any unexpected behavior or UI issues
- Test on different browsers (Chrome, Firefox, Safari)
- Test on different screen sizes (desktop, tablet, mobile)
- Report any performance issues (slow loading, lag)

---

## Completion Checklist

- ⬜ All tests executed
- ⬜ Screenshots captured
- ⬜ Results documented
- ⬜ Issues reported
- ⬜ Test summary completed
- ⬜ Document shared with team
