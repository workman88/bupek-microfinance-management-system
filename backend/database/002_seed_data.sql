-- BUPEK Microfinance Management System - Seed Data
-- Creates initial admin user and test data

-- Insert default admin user
-- Email: admin@bupek.com
-- Password: Admin@123456 (bcrypt hash)
INSERT INTO users (
    employee_id, first_name, last_name, email, phone, 
    password_hash, role_id, is_active, created_at
) VALUES (
    'EMP001',
    'System',
    'Administrator',
    'admin@bupek.com',
    '+255657000000',
    '$2a$10$YourBcryptHashHere1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', -- This will be updated in migration
    (SELECT id FROM roles WHERE name = 'CEO_ADMIN'),
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert test branch
INSERT INTO branches (
    branch_name, branch_code, location, region, 
    phone, email, is_active, created_at, created_by
) VALUES (
    'Head Office',
    'HQ001',
    'Dar es Salaam',
    'Dar es Salaam',
    '+255657000001',
    'headquarters@bupek.com',
    true,
    CURRENT_TIMESTAMP,
    (SELECT id FROM users WHERE email = 'admin@bupek.com')
) ON CONFLICT (branch_code) DO NOTHING;

-- Update admin user with branch assignment
UPDATE users 
SET branch_id = (SELECT id FROM branches WHERE branch_code = 'HQ001')
WHERE email = 'admin@bupek.com';

-- Insert test borrowers
INSERT INTO borrowers (
    borrower_number, first_name, last_name, date_of_birth,
    phone_number, email, national_id, national_id_type,
    occupation, business_name, business_type, monthly_income,
    address, city, region, marital_status, number_of_dependents,
    branch_id, created_by, is_active, created_at
) VALUES 
(
    'BRW001',
    'John',
    'Doe',
    '1985-05-15',
    '+255755123456',
    'john.doe@example.com',
    '1234567890',
    'NATIONAL_ID',
    'Merchant',
    'John Supermarket',
    'Retail',
    2500000.00,
    '123 Main Street',
    'Dar es Salaam',
    'Dar es Salaam',
    'MARRIED',
    3,
    (SELECT id FROM branches WHERE branch_code = 'HQ001'),
    (SELECT id FROM users WHERE email = 'admin@bupek.com'),
    true,
    CURRENT_TIMESTAMP
),
(
    'BRW002',
    'Jane',
    'Smith',
    '1990-08-20',
    '+255755234567',
    'jane.smith@example.com',
    '0987654321',
    'NATIONAL_ID',
    'Tailor',
    'Jane Fashion',
    'Tailoring',
    1800000.00,
    '456 Second Avenue',
    'Dar es Salaam',
    'Dar es Salaam',
    'SINGLE',
    1,
    (SELECT id FROM branches WHERE branch_code = 'HQ001'),
    (SELECT id FROM users WHERE email = 'admin@bupek.com'),
    true,
    CURRENT_TIMESTAMP
),
(
    'BRW003',
    'Ahmed',
    'Hassan',
    '1988-03-10',
    '+255755345678',
    'ahmed.hassan@example.com',
    '5555666666',
    'NATIONAL_ID',
    'Transporter',
    'Ahmed Transport',
    'Transportation',
    3500000.00,
    '789 Third Road',
    'Dar es Salaam',
    'Dar es Salaam',
    'MARRIED',
    4,
    (SELECT id FROM branches WHERE branch_code = 'HQ001'),
    (SELECT id FROM users WHERE email = 'admin@bupek.com'),
    true,
    CURRENT_TIMESTAMP
)
ON CONFLICT (borrower_number) DO NOTHING;

-- Insert guarantors
INSERT INTO guarantors (
    borrower_id, guarantor_number, first_name, last_name,
    relationship, phone_number, national_id, address,
    occupation, monthly_income, is_primary, created_at
) VALUES 
(
    (SELECT id FROM borrowers WHERE borrower_number = 'BRW001'),
    'GTR001',
    'Mary',
    'Doe',
    'SPOUSE',
    '+255755111111',
    '1111111111',
    '123 Main Street',
    'Housewife',
    1000000.00,
    true,
    CURRENT_TIMESTAMP
),
(
    (SELECT id FROM borrowers WHERE borrower_number = 'BRW002'),
    'GTR002',
    'Peter',
    'Johnson',
    'BROTHER',
    '+255755222222',
    '2222222222',
    '456 Park Road',
    'Teacher',
    2000000.00,
    true,
    CURRENT_TIMESTAMP
),
(
    (SELECT id FROM borrowers WHERE borrower_number = 'BRW003'),
    'GTR003',
    'Fatima',
    'Hassan',
    'SISTER',
    '+255755333333',
    '3333333333',
    '789 Market Street',
    'Nurse',
    2500000.00,
    true,
    CURRENT_TIMESTAMP
)
ON CONFLICT (guarantor_number) DO NOTHING;

-- Insert test loans
INSERT INTO loans (
    loan_number, borrower_id, branch_id, loan_officer_id,
    principal_amount, interest_rate, loan_term_months,
    loan_purpose, repayment_frequency, total_interest,
    total_amount_due, status, created_at, created_by
) VALUES 
(
    'LN001',
    (SELECT id FROM borrowers WHERE borrower_number = 'BRW001'),
    (SELECT id FROM branches WHERE branch_code = 'HQ001'),
    (SELECT id FROM users WHERE email = 'admin@bupek.com'),
    1000000.00,
    18.00,
    12,
    'Business Expansion',
    'MONTHLY',
    180000.00,
    1180000.00,
    'PENDING',
    CURRENT_TIMESTAMP,
    (SELECT id FROM users WHERE email = 'admin@bupek.com')
),
(
    'LN002',
    (SELECT id FROM borrowers WHERE borrower_number = 'BRW002'),
    (SELECT id FROM branches WHERE branch_code = 'HQ001'),
    (SELECT id FROM users WHERE email = 'admin@bupek.com'),
    500000.00,
    20.00,
    6,
    'Equipment Purchase',
    'MONTHLY',
    50000.00,
    550000.00,
    'PENDING',
    CURRENT_TIMESTAMP,
    (SELECT id FROM users WHERE email = 'admin@bupek.com')
)
ON CONFLICT (loan_number) DO NOTHING;
