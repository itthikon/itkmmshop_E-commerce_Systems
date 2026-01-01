-- อัพเดทหมวดหมู่สินค้าให้เป็นภาษาไทย พร้อม Prefix ภาษาอังกฤษ
-- Update product categories to Thai names with English prefixes

-- อัพเดทหมวดหมู่ที่มีอยู่
UPDATE product_categories SET name = 'เสื้อผ้า', prefix = 'CLTH' WHERE id = 1;
UPDATE product_categories SET name = 'รองเท้า', prefix = 'SHOE' WHERE id = 2;
UPDATE product_categories SET name = 'กระเป๋า', prefix = 'BAG' WHERE id = 3;
UPDATE product_categories SET name = 'เครื่องประดับ', prefix = 'JWLR' WHERE id = 4;
UPDATE product_categories SET name = 'อิเล็กทรอนิกส์', prefix = 'ELEC' WHERE id = 5;

-- แสดงผลลัพธ์
SELECT 
  id as 'รหัส',
  name as 'ชื่อหมวดหมู่',
  prefix as 'Prefix',
  status as 'สถานะ'
FROM product_categories
ORDER BY id;
