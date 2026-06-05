-- ============================================
-- BUPEK Microfinance Management System
-- Seed Data
-- ============================================

-- ============================================
-- INSERT ADMIN BRANCH
-- ============================================
INSERT INTO branches (name, code, location, phone, email, status)
VALUES ('Head Office', 'HO-001', 'Nairobi', '+254701234567', 'headoffice@bupek.com', 'active');

-- ============================================
-- INSERT ADMIN USER
-- ============================================
INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role, status, branch_id)
VALUES (
  'admin',
  'admin@bupek.com',
  '$2a$10$6d8xr8J7.9J0vBF9vB9vBu9vB9vB9vB9vB9vB9vB9vB9vB9vB9vB9v',
  'System',
  'Administrator',
  '+254701234567',
  'admin',
  'active',
  1
);

-- ============================================
-- INSERT TEST MANAGER USER
-- ============================================
INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role, status, branch_id)
VALUES (
  'manager',
  'manager@bupek.com',
  '$2a$10$6d8xr8J7.9J0vBF9vB9vBu9vB9vB9vB9vB9vB9vB9vB9vB9vB9vB9v',
  'John',
  'Manager',
  '+254702345678',
  'manager',
  'active',
  1
);

-- ============================================
-- INSERT TEST OFFICER USER
-- ============================================
INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role, status, branch_id)
VALUES (
  'officer',
  'officer@bupek.com',
  '$2a$10$6d8xr8J7.9J0vBF9vB9vBu9vB9vB9vB9vB9vB9vB9vB9vB9vB9vB9v',
  'Jane',
  'Officer',
  '+254703456789',
  'officer',
  'active',
  1
);

-- ============================================
-- INSERT TEST BRANCHES
-- ============================================
INSERT INTO branches (name, code, location, phone, email, manager_id, status)
VALUES 
  ('Westlands', 'BR-WES', 'Westlands, Nairobi', '+254704567890', 'westlands@bupek.com', 2, 'active'),
  ('CBD', 'BR-CBD', 'Central Business District, Nairobi', '+254705678901', 'cbd@bupek.com', 2, 'active'),
  ('Mombasa', 'BR-MBA', 'Mombasa', '+254706789012', 'mombasa@bupek.com', NULL, 'active');

-- ============================================
-- INSERT TEST BORROWERS
-- ============================================
INSERT INTO borrowers (
  first_name, last_name, email, phone, id_number, id_type, 
  date_of_birth, gender, marital_status, occupation, 
  business_name, business_type, branch_id, status, kyc_verified, kyc_verified_date, created_by
)
VALUES 
  ('Peter', 'Kipchoge', 'peter.kipchoge@email.com', '+254712345678', '12345678', 'national_id', 
   '1985-03-15', 'M', 'married', 'Business Owner', 'Kipchoge Traders', 'retail', 1, 'active', true, CURRENT_TIMESTAMP, 2),
  
  ('Mary', 'Wanjiru', 'mary.wanjiru@email.com', '+254713456789', '23456789', 'national_id', 
   '1988-07-22', 'F', 'single', 'Entrepreneur', 'Mary\'s Cafe', 'food_service', 1, 'active', true, CURRENT_TIMESTAMP, 2),
  
  ('James', 'Okonkwo', 'james.okonkwo@email.com', '+254714567890', '34567890', 'national_id', 
   '1990-11-08', 'M', 'married', 'Salon Owner', 'Classic Styles', 'beauty_services', 2, 'active', true, CURRENT_TIMESTAMP, 2),
  
  ('Alice', 'Kariuki', 'alice.kariuki@email.com', '+254715678901', '45678901', 'national_id', 
   '1992-05-30', 'F', 'divorced', 'Farmer', 'Kariuki Farms', 'agriculture', 3, 'active', true, CURRENT_TIMESTAMP, 2),
  
  ('David', 'Mbatha', 'david.mbatha@email.com', '+254716789012', '56789012', 'national_id', 
   '1987-09-12', 'M', 'married', 'Mechanic', 'Mbatha Auto Repair', 'automotive', 2, 'active', true, CURRENT_TIMESTAMP, 2);

-- ============================================
-- INSERT TEST GUARANTORS
-- ============================================
INSERT INTO guarantors (borrower_id, first_name, last_name, email, phone, id_number, id_type, relationship, occupation, phone_verified)
VALUES 
  (1, 'Joseph', 'Kipchoge', 'joseph.kipchoge@email.com', '+254717890123', '12345679', 'national_id', 'brother', 'Accountant', true),
  (2, 'Grace', 'Wanjiru', 'grace.wanjiru@email.com', '+254718901234', '23456790', 'national_id', 'sister', 'Teacher', true),
  (3, 'Samuel', 'Okonkwo', 'samuel.okonkwo@email.com', '+254719012345', '34567891', 'national_id', 'father', 'Retired', true),
  (4, 'Margaret', 'Njoroge', 'margaret.njoroge@email.com', '+254720123456', '45678902', 'national_id', 'friend', 'Nurse', true),
  (5, 'Comfort', 'Mbatha', 'comfort.mbatha@email.com', '+254721234567', '56789013', 'national_id', 'spouse', 'Businesswoman', true);

-- ============================================
-- INSERT TEST LOANS
-- ============================================
INSERT INTO loans (
  loan_number, borrower_id, branch_id, loan_amount, currency, interest_rate, tenor_months,
  loan_purpose, status, approval_date, approved_by, disbursement_date, disbursed_by,
  expected_completion_date, created_by
)
VALUES 
  ('LN-2026-001', 1, 1, 50000.00, 'KES', 2.5, 12, 'Business expansion', 'disbursed', 
   CURRENT_TIMESTAMP, 2, CURRENT_TIMESTAMP, 2, CURRENT_DATE + INTERVAL '12 months', 2),
  
  ('LN-2026-002', 2, 1, 30000.00, 'KES', 2.5, 12, 'Equipment purchase', 'active', 
   CURRENT_TIMESTAMP, 2, CURRENT_TIMESTAMP, 2, CURRENT_DATE + INTERVAL '12 months', 2),
  
  ('LN-2026-003', 3, 2, 75000.00, 'KES', 2.5, 18, 'Shop renovation', 'disbursed', 
   CURRENT_TIMESTAMP, 2, CURRENT_TIMESTAMP, 2, CURRENT_DATE + INTERVAL '18 months', 2),
  
  ('LN-2026-004', 4, 3, 25000.00, 'KES', 2.5, 12, 'Farm inputs', 'pending', 
   CURRENT_TIMESTAMP, 2, NULL, NULL, CURRENT_DATE + INTERVAL '12 months', 2),
  
  ('LN-2026-005', 5, 2, 100000.00, 'KES', 2.5, 24, 'Vehicle purchase', 'active', 
   CURRENT_TIMESTAMP, 2, CURRENT_TIMESTAMP, 2, CURRENT_DATE + INTERVAL '24 months', 2);

-- ============================================
-- INSERT TEST REPAYMENT SCHEDULES
-- ============================================
INSERT INTO repayment_schedules (loan_id, schedule_number, due_date, principal_amount, interest_amount, total_amount, status, paid_amount, paid_date)
VALUES 
  (1, 1, CURRENT_DATE - INTERVAL '30 days', 4166.67, 104.17, 4270.84, 'completed', 4270.84, CURRENT_DATE - INTERVAL '25 days'),
  (1, 2, CURRENT_DATE, 4166.67, 104.17, 4270.84, 'pending', 0, NULL),
  (1, 3, CURRENT_DATE + INTERVAL '30 days', 4166.67, 104.17, 4270.84, 'pending', 0, NULL),
  
  (2, 1, CURRENT_DATE - INTERVAL '30 days', 2500.00, 62.50, 2562.50, 'completed', 2562.50, CURRENT_DATE - INTERVAL '20 days'),
  (2, 2, CURRENT_DATE, 2500.00, 62.50, 2562.50, 'pending', 0, NULL),
  (2, 3, CURRENT_DATE + INTERVAL '30 days', 2500.00, 62.50, 2562.50, 'pending', 0, NULL),
  
  (3, 1, CURRENT_DATE - INTERVAL '60 days', 4166.67, 104.17, 4270.84, 'overdue', 0, NULL),
  (3, 2, CURRENT_DATE - INTERVAL '30 days', 4166.67, 104.17, 4270.84, 'overdue', 0, NULL),
  (3, 3, CURRENT_DATE, 4166.67, 104.17, 4270.84, 'pending', 0, NULL),
  
  (5, 1, CURRENT_DATE - INTERVAL '30 days', 4166.67, 208.33, 4375.00, 'completed', 4375.00, CURRENT_DATE - INTERVAL '10 days'),
  (5, 2, CURRENT_DATE, 4166.67, 208.33, 4375.00, 'pending', 0, NULL),
  (5, 3, CURRENT_DATE + INTERVAL '30 days', 4166.67, 208.33, 4375.00, 'pending', 0, NULL);

-- ============================================
-- INSERT TEST REPAYMENTS
-- ============================================
INSERT INTO repayments (repayment_number, loan_id, schedule_id, amount, payment_method, reference_number, received_by)
VALUES 
  ('RP-2026-001', 1, 1, 4270.84, 'mobile_money', 'MM-123456', 2),
  ('RP-2026-002', 2, 4, 2562.50, 'bank_transfer', 'BT-789012', 2),
  ('RP-2026-003', 5, 10, 4375.00, 'mobile_money', 'MM-345678', 2);

-- ============================================
-- INSERT TEST COLLECTIONS
-- ============================================
INSERT INTO collections (collection_number, loan_id, status, total_outstanding, amount_recovered, created_by)
VALUES 
  ('CL-2026-001', 3, 'in_progress', 8541.68, 0, 2),
  ('CL-2026-002', 4, 'pending', 25000.00, 0, 2);

-- ============================================
-- INSERT TEST COLLECTION ACTIVITIES
-- ============================================
INSERT INTO collection_activities (collection_id, method, activity_date, contact_person, remarks, created_by)
VALUES 
  (1, 'call', CURRENT_TIMESTAMP - INTERVAL '2 days', 'James Okonkwo', 'Customer promises to pay within a week', 2),
  (1, 'visit', CURRENT_TIMESTAMP - INTERVAL '1 day', 'James Okonkwo', 'Visited shop, discussed payment plan', 2),
  (2, 'sms', CURRENT_TIMESTAMP - INTERVAL '3 days', 'Alice Kariuki', 'SMS reminder sent', 2);

-- ============================================
-- Seed data insertion complete
-- ============================================
