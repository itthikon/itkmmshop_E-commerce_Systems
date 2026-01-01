-- Create test payment slips for testing staff/admin features

-- Insert test payments with different statuses
INSERT INTO payments (order_id, payment_method, amount, slip_image_path, status, notes, created_at)
VALUES 
  (1, 'bank_transfer', 7200.00, '/uploads/payment-slips/test-slip-1.jpg', 'pending', 'Test payment slip 1', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
  (1, 'promptpay', 7200.00, '/uploads/payment-slips/test-slip-2.jpg', 'pending', 'Test payment slip 2', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
  (1, 'bank_transfer', 7200.00, '/uploads/payment-slips/test-slip-3.jpg', 'verified', 'Test payment slip 3 - already verified', DATE_SUB(NOW(), INTERVAL 3 DAY)),
  (1, 'bank_transfer', 7200.00, '/uploads/payment-slips/test-slip-4.jpg', 'pending', 'Test payment slip 4', DATE_SUB(NOW(), INTERVAL 30 MINUTE));

-- Update the verified payment to have verification details
UPDATE payments 
SET slipok_verified = 1, 
    verified_at = DATE_SUB(NOW(), INTERVAL 3 DAY),
    payment_date = DATE_SUB(NOW(), INTERVAL 3 DAY)
WHERE status = 'verified';

SELECT 'Test payments created successfully!' as message;
SELECT id, order_id, payment_method, amount, status, created_at FROM payments;
