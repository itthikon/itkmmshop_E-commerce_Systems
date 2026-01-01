-- Update shop branding to itkmmshop22
-- This script updates all references to the shop name in the database

USE itkmmshop22;

-- Update user emails to match new branding
UPDATE users 
SET email = 'admin@itkmmshop22.com',
    first_name = 'Admin',
    last_name = 'itkmmshop22'
WHERE role = 'admin' AND email LIKE '%admin%';

UPDATE users 
SET email = 'staff@itkmmshop22.com',
    first_name = 'Staff',
    last_name = 'itkmmshop22'
WHERE role = 'staff' AND email LIKE '%staff%';

UPDATE users 
SET email = 'customer@itkmmshop22.com',
    first_name = 'Customer',
    last_name = 'Test'
WHERE role = 'customer' AND email LIKE '%customer%example%';

-- Display updated accounts
SELECT 
    id,
    email,
    CONCAT(first_name, ' ', last_name) as full_name,
    role,
    created_at
FROM users
WHERE email LIKE '%itkmmshop22%' OR email LIKE '%customer%'
ORDER BY role, id;

-- Summary
SELECT 
    'Total Users' as metric,
    COUNT(*) as count
FROM users
UNION ALL
SELECT 
    'Admin Users',
    COUNT(*)
FROM users
WHERE role = 'admin'
UNION ALL
SELECT 
    'Staff Users',
    COUNT(*)
FROM users
WHERE role = 'staff'
UNION ALL
SELECT 
    'Customer Users',
    COUNT(*)
FROM users
WHERE role = 'customer';
