# SKU Seed Data Update Note

## Changes Made

The seed data files have been updated to use the new auto-generated SKU format.

### Updated Files:

1. **backend/sample-data.sql**
   - Updated category prefixes: CLTH, SHOE, BAG, JWLR, ELEC
   - Updated product SKUs to match format: [PREFIX][00001-99999]

2. **backend/seed-products-updated.js** (NEW)
   - New seed file with corrected SKU format
   - Replaces old format (CLOTH001, SHOE001, etc.)
   - Uses new format (CLTH00001, SHOE00001, etc.)

### SKU Format Changes:

**Old Format:**
- CLOTH001, CLOTH002, ...
- SHOE001, SHOE002, ...
- BAG001, BAG002, ...
- JEWEL001, JEWEL002, ...
- ELEC001, ELEC002, ...

**New Format (Correct):**
- CLTH00001, CLTH00002, ...
- SHOE00001, SHOE00002, ...
- BAG00001, BAG00002, ...
- JWLR00001, JWLR00002, ...
- ELEC00001, ELEC00002, ...

### Category Prefix Mapping:

| Category | Thai Name | Old Prefix | New Prefix |
|----------|-----------|------------|------------|
| Clothing | เสื้อผ้า | CLOTH | CLTH |
| Shoes | รองเท้า | SHOE | SHOE |
| Bags | กระเป๋า | BAG | BAG |
| Jewelry | เครื่องประดับ | JEWEL | JWLR |
| Electronics | อิเล็กทรอนิกส์ | ELEC | ELEC |

### Migration Instructions:

If you have existing data with old SKU format:

1. **Option 1: Fresh Database**
   ```bash
   # Drop and recreate database
   node backend/setup-database.js
   
   # Run updated seed data
   node backend/seed-products-updated.js
   ```

2. **Option 2: Update Existing Data**
   ```sql
   -- Update category prefixes
   UPDATE product_categories SET prefix = 'CLTH' WHERE id = 1;
   UPDATE product_categories SET prefix = 'SHOE' WHERE id = 2;
   UPDATE product_categories SET prefix = 'BAG' WHERE id = 3;
   UPDATE product_categories SET prefix = 'JWLR' WHERE id = 4;
   UPDATE product_categories SET prefix = 'ELEC' WHERE id = 5;
   
   -- Note: Existing product SKUs will remain unchanged
   -- New products will use the new prefix format
   ```

3. **Option 3: Keep Old Data**
   - Existing products keep their old SKUs
   - New products will use the new auto-generated format
   - Both formats can coexist in the system

### Validation:

To verify SKU format compliance:

```sql
-- Check all SKUs match the pattern [A-Z]{2,4}\d{5}
SELECT sku, name 
FROM products 
WHERE sku NOT REGEXP '^[A-Z]{2,4}[0-9]{5}$';

-- Should return empty result if all SKUs are valid
```

### Notes:

- The auto SKU generation system enforces the new format
- Old SKUs in the database will continue to work
- Manual SKU entry is no longer allowed for new products
- SKUs are immutable once created

### Files to Use:

- **For new installations:** Use `backend/seed-products-updated.js`
- **For SQL imports:** Use updated `backend/sample-data.sql`
- **For reference:** Keep `backend/seed-products.js` for comparison

---

**Date:** 2026-01-01  
**Feature:** Auto SKU Generation  
**Version:** 1.0.0
