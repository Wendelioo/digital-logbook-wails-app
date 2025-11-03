-- Insert Admin Account Script
-- This script creates a new admin user account with complete profile information

-- Step 1: Insert into users table
INSERT INTO users (username, password, user_type, is_active) 
VALUES ('ADMIN001', 'admin123', 'admin', TRUE);

-- Get the user_id of the newly created user
SET @admin_user_id = LAST_INSERT_ID();

-- Step 2: Insert into admins table with profile information
INSERT INTO admins (
    user_id, 
    admin_id, 
    first_name, 
    middle_name, 
    last_name, 
    gender, 
    email
) VALUES (
    @admin_user_id,
    'ADMIN001',
    'John',
    'Michael',
    'Doe',
    'Male',
    'admin@school.edu'
);

-- Verify the admin account was created successfully
SELECT 
    u.id as user_id,
    u.username,
    u.user_type,
    u.is_active,
    u.created_at,
    a.admin_id,
    CONCAT(a.first_name, ' ', COALESCE(a.middle_name, ''), ' ', a.last_name) as full_name,
    a.gender,
    a.email
FROM users u
JOIN admins a ON u.id = a.user_id
WHERE u.username = 'ADMIN001';

-- Alternative: Create admin with different details
-- Uncomment and modify the following section to create another admin:

/*
-- Insert second admin account
INSERT INTO users (username, password, user_type, is_active) 
VALUES ('ADMIN002', 'admin456', 'admin', TRUE);

SET @admin_user_id_2 = LAST_INSERT_ID();

INSERT INTO admins (
    user_id, 
    admin_id, 
    first_name, 
    middle_name, 
    last_name, 
    gender, 
    email
) VALUES (
    @admin_user_id_2,
    'ADMIN002',
    'Jane',
    'Elizabeth',
    'Smith',
    'Female',
    'jane.smith@school.edu'
);
*/
