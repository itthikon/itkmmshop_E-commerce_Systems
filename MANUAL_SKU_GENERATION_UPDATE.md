# Manual SKU Generation Implementation

## Overview
Changed SKU generation from automatic (on category change) to manual (button click) based on user request.

## Changes Made

### 1. SKUPreview.js Component Logic
- **Removed auto-generation**: SKU no longer generates automatically when category changes
- **Added manual button**: User must click "สร้าง SKU" button to generate SKU
- **Button states**:
  - Disabled when no category selected
  - Shows "✨ สร้าง SKU" when no SKU exists
  - Shows "🔄 สร้างใหม่" when SKU already exists (allows regeneration)
- **Updated placeholder**: Changed to "กดปุ่มเพื่อสร้าง SKU"
- **Updated hints**:
  - Before generation: "💡 เลือกหมวดหมู่แล้วกดปุ่ม 'สร้าง SKU' เพื่อสร้างรหัสสินค้าอัตโนมัติ"
  - After generation: "✅ SKU ถูกสร้างแล้ว - สามารถกดสร้างใหม่ได้หากต้องการเปลี่ยน"

### 2. SKUPreview.css Styling
- **Added `.sku-preview-wrapper`**: Flex container for display field and button
- **Added `.generate-sku-btn`**: Beautiful gradient button with hover effects
  - Purple gradient background (#667eea to #764ba2)
  - Hover animation (lift effect)
  - Disabled state (gray gradient)
- **Added `.success-hint`**: Green color for success message
- **Responsive design**: Button stacks below display on mobile

## User Flow

### Creating New Product
1. User selects category from dropdown
2. User clicks "สร้าง SKU" button
3. SKU is generated and displayed
4. User can click "สร้างใหม่" to regenerate if desired

### Editing Existing Product
- SKU field shows existing SKU (read-only)
- No button displayed
- Shows lock message: "🔒 SKU ไม่สามารถแก้ไขได้หลังจากสร้างสินค้าแล้ว"

## Benefits
- **User control**: User decides when to generate SKU
- **Flexibility**: Can regenerate SKU multiple times before saving
- **Clear feedback**: Visual hints guide user through process
- **Better UX**: No unexpected changes when selecting category

## Testing Checklist
- [ ] Button is disabled when no category selected
- [ ] Button generates SKU when clicked
- [ ] Button text changes to "สร้างใหม่" after generation
- [ ] Can regenerate SKU multiple times
- [ ] Hints display correctly before/after generation
- [ ] Existing products show read-only SKU
- [ ] Responsive design works on mobile
- [ ] No console errors

## Files Modified
- `frontend/src/components/product/SKUPreview.js`
- `frontend/src/components/product/SKUPreview.css`
