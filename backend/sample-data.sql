-- Sample data for itkmmshop database

-- Insert sample categories with prefixes for auto SKU generation
INSERT IGNORE INTO product_categories (id, name, description, prefix, status) VALUES
(1, 'เสื้อผ้า', 'เสื้อผ้าแฟชั่นทุกประเภท', 'CLTH', 'active'),
(2, 'รองเท้า', 'รองเท้าแฟชั่นและกีฬา', 'SHOE', 'active'),
(3, 'กระเป๋า', 'กระเป๋าและอุปกรณ์เสริม', 'BAG', 'active'),
(4, 'เครื่องประดับ', 'เครื่องประดับและนาฬิกา', 'JWLR', 'active'),
(5, 'อิเล็กทรอนิกส์', 'อุปกรณ์อิเล็กทรอนิกส์', 'ELEC', 'active');

-- Insert sample products with valid SKU format [PREFIX][00001-99999]
-- SKUs follow the auto-generation pattern: category prefix + 5-digit sequential number
INSERT IGNORE INTO products (id, sku, name, description, category_id, price_excluding_vat, stock_quantity, status) VALUES
(1, 'CLTH00001', 'เสื้อยืดคอกลม สีขาว', 'เสื้อยืดผ้าคอตตอน 100% สีขาว ใส่สบาย', 1, 280.37, 50, 'active'),
(2, 'CLTH00002', 'เสื้อเชิ้ตแขนยาว สีฟ้า', 'เสื้อเชิ้ตผ้าคอตตอนแขนยาว สีฟ้าอ่อน', 1, 467.29, 30, 'active'),
(3, 'SHOE00001', 'รองเท้าผ้าใบ สีดำ', 'รองเท้าผ้าใบแฟชั่น สีดำ ใส่สบาย', 2, 934.58, 25, 'active'),
(4, 'BAG00001', 'กระเป๋าสะพายข้าง', 'กระเป๋าหนังแท้ สะพายข้าง สีน้ำตาล', 3, 1401.87, 15, 'active'),
(5, 'JWLR00001', 'นาฬิกาข้อมือ', 'นาฬิกาข้อมือแฟชั่น กันน้ำ', 4, 2336.45, 20, 'active'),
(6, 'ELEC00001', 'สมาร์ทโฟน', 'สมาร์ทโฟนรุ่นใหม่ล่าสุด', 5, 14953.27, 10, 'active'),
(7, 'CLTH00003', 'เสื้อโปโล สีแดง', 'เสื้อโปโลผ้าคอตตอน สีแดง', 1, 373.83, 40, 'active'),
(8, 'SHOE00002', 'รองเท้าหนัง สีน้ำตาล', 'รองเท้าหนังแท้ สีน้ำตาล สำหรับทำงาน', 2, 1869.16, 20, 'active');

-- Insert sample admin user (password: admin123)
INSERT IGNORE INTO users (id, email, password_hash, first_name, last_name, role, status) VALUES
(1, 'admin@itkmmshop.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', 'Admin', 'User', 'admin', 'active');

-- Insert sample customer user (password: customer123)
INSERT IGNORE INTO users (id, email, password_hash, first_name, last_name, role, status) VALUES
(2, 'customer@example.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', 'ลูกค้า', 'ทดสอบ', 'customer', 'active');

-- Insert sample staff user (password: staff123)
INSERT IGNORE INTO users (id, email, password_hash, first_name, last_name, role, status) VALUES
(3, 'staff@itkmmshop.com', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', 'Staff', 'User', 'staff', 'active');

-- Note: The password hashes above are placeholders. Run 'node update-passwords.js' to set proper hashed passwords.

-- Insert sample vouchers
INSERT IGNORE INTO vouchers (id, code, name, description, discount_type, discount_value, minimum_order_amount, start_date, end_date, status) VALUES
(1, 'WELCOME10', 'ส่วนลดต้อนรับ 10%', 'ส่วนลด 10% สำหรับลูกค้าใหม่', 'percentage', 10.00, 500.00, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 'active'),
(2, 'SAVE50', 'ส่วนลด 50 บาท', 'ส่วนลดคงที่ 50 บาท', 'fixed_amount', 50.00, 300.00, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), 'active'),
(3, 'BIGDEAL20', 'ส่วนลดใหญ่ 20%', 'ส่วนลด 20% สำหรับการซื้อมากกว่า 1000 บาท', 'percentage', 20.00, 1000.00, NOW(), DATE_ADD(NOW(), INTERVAL 3 MONTH), 'active');