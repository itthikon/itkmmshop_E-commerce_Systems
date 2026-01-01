-- Add Staff User Account
-- Password: staff123 (hashed with bcrypt)

INSERT INTO users (
  email, 
  password_hash, 
  first_name, 
  last_name, 
  role,
  created_at,
  updated_at
) VALUES (
  'staff@itkmmshop.com',
  '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', -- This will be replaced by script
  'Staff',
  'User',
  'staff',
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  updated_at = NOW();

-- Note: Run backend/add-staff-user.js to properly hash the password
