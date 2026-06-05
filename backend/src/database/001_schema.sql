-- ============================================
-- BUPEK Microfinance Management System
-- Database Schema
-- ============================================

-- Roles Enumeration
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'officer', 'viewer');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE branch_status AS ENUM ('active', 'inactive');
CREATE TYPE borrower_status AS ENUM ('active', 'inactive', 'blocked');
CREATE TYPE loan_status AS ENUM ('pending', 'approved', 'disbursed', 'active', 'completed', 'defaulted', 'rejected', 'cancelled');
CREATE TYPE repayment_status AS ENUM ('pending', 'partial', 'completed', 'overdue', 'defaulted');
CREATE TYPE collection_status AS ENUM ('pending', 'in_progress', 'recovered', 'written_off');
CREATE TYPE collection_method AS ENUM ('visit', 'call', 'sms', 'letter', 'legal_action');

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'officer',
  status user_status NOT NULL DEFAULT 'active',
  branch_id INTEGER,
  last_login TIMESTAMP,
  password_changed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_email_unique UNIQUE (email)
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ============================================
-- BRANCHES TABLE
-- ============================================
CREATE TABLE branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  location VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(100),
  manager_id INTEGER,
  status branch_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_branches_code ON branches(code);
CREATE INDEX idx_branches_status ON branches(status);
CREATE INDEX idx_branches_manager ON branches(manager_id);

-- ============================================
-- BORROWERS TABLE
-- ============================================
CREATE TABLE borrowers (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  id_number VARCHAR(50) UNIQUE,
  id_type VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(10),
  marital_status VARCHAR(20),
  occupation VARCHAR(100),
  business_name VARCHAR(100),
  business_type VARCHAR(100),
  branch_id INTEGER NOT NULL,
  status borrower_status NOT NULL DEFAULT 'active',
  kyc_verified BOOLEAN DEFAULT FALSE,
  kyc_verified_date TIMESTAMP,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_borrowers_phone ON borrowers(phone);
CREATE INDEX idx_borrowers_id_number ON borrowers(id_number);
CREATE INDEX idx_borrowers_branch ON borrowers(branch_id);
CREATE INDEX idx_borrowers_status ON borrowers(status);
CREATE INDEX idx_borrowers_kyc ON borrowers(kyc_verified);

-- ============================================
-- GUARANTORS TABLE
-- ============================================
CREATE TABLE guarantors (
  id SERIAL PRIMARY KEY,
  borrower_id INTEGER NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20) NOT NULL,
  id_number VARCHAR(50),
  id_type VARCHAR(50),
  relationship VARCHAR(50),
  occupation VARCHAR(100),
  phone_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (borrower_id) REFERENCES borrowers(id) ON DELETE CASCADE
);

CREATE INDEX idx_guarantors_borrower ON guarantors(borrower_id);

-- ============================================
-- LOANS TABLE
-- ============================================
CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  loan_number VARCHAR(50) UNIQUE NOT NULL,
  borrower_id INTEGER NOT NULL,
  branch_id INTEGER NOT NULL,
  loan_amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KES',
  interest_rate DECIMAL(5,2) NOT NULL,
  tenor_months INTEGER NOT NULL,
  loan_purpose VARCHAR(255),
  status loan_status NOT NULL DEFAULT 'pending',
  approval_date TIMESTAMP,
  approved_by INTEGER,
  disbursement_date TIMESTAMP,
  disbursed_by INTEGER,
  expected_completion_date DATE,
  actual_completion_date DATE,
  notes TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (borrower_id) REFERENCES borrowers(id) ON DELETE RESTRICT,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (disbursed_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_loans_number ON loans(loan_number);
CREATE INDEX idx_loans_borrower ON loans(borrower_id);
CREATE INDEX idx_loans_branch ON loans(branch_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_created_date ON loans(created_at);

-- ============================================
-- LOAN REPAYMENT SCHEDULES TABLE
-- ============================================
CREATE TABLE repayment_schedules (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER NOT NULL,
  schedule_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal_amount DECIMAL(15,2) NOT NULL,
  interest_amount DECIMAL(15,2) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  status repayment_status NOT NULL DEFAULT 'pending',
  paid_amount DECIMAL(15,2) DEFAULT 0,
  paid_date TIMESTAMP,
  days_overdue INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
  UNIQUE(loan_id, schedule_number)
);

CREATE INDEX idx_schedules_loan ON repayment_schedules(loan_id);
CREATE INDEX idx_schedules_status ON repayment_schedules(status);
CREATE INDEX idx_schedules_due_date ON repayment_schedules(due_date);

-- ============================================
-- REPAYMENTS TABLE
-- ============================================
CREATE TABLE repayments (
  id SERIAL PRIMARY KEY,
  repayment_number VARCHAR(50) UNIQUE NOT NULL,
  loan_id INTEGER NOT NULL,
  schedule_id INTEGER,
  amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  notes TEXT,
  received_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE RESTRICT,
  FOREIGN KEY (schedule_id) REFERENCES repayment_schedules(id) ON DELETE SET NULL,
  FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_repayments_number ON repayments(repayment_number);
CREATE INDEX idx_repayments_loan ON repayments(loan_id);
CREATE INDEX idx_repayments_schedule ON repayments(schedule_id);
CREATE INDEX idx_repayments_created_date ON repayments(created_at);

-- ============================================
-- COLLECTIONS TABLE
-- ============================================
CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  collection_number VARCHAR(50) UNIQUE NOT NULL,
  loan_id INTEGER NOT NULL,
  status collection_status NOT NULL DEFAULT 'pending',
  total_outstanding DECIMAL(15,2) NOT NULL,
  amount_recovered DECIMAL(15,2) DEFAULT 0,
  last_method collection_method,
  last_attempt_date TIMESTAMP,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_collections_number ON collections(collection_number);
CREATE INDEX idx_collections_loan ON collections(loan_id);
CREATE INDEX idx_collections_status ON collections(status);

-- ============================================
-- COLLECTION ACTIVITIES TABLE
-- ============================================
CREATE TABLE collection_activities (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL,
  method collection_method NOT NULL,
  activity_date TIMESTAMP NOT NULL,
  amount_recovered DECIMAL(15,2),
  contact_person VARCHAR(100),
  remarks TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_activities_collection ON collection_activities(collection_id);
CREATE INDEX idx_activities_date ON collection_activities(activity_date);

-- ============================================
-- REPORTS TABLE
-- ============================================
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  report_type VARCHAR(50) NOT NULL,
  report_name VARCHAR(100) NOT NULL,
  report_date DATE NOT NULL,
  branch_id INTEGER,
  total_loans INTEGER DEFAULT 0,
  total_amount_issued DECIMAL(15,2) DEFAULT 0,
  total_amount_repaid DECIMAL(15,2) DEFAULT 0,
  total_outstanding DECIMAL(15,2) DEFAULT 0,
  defaulted_loans INTEGER DEFAULT 0,
  active_borrowers INTEGER DEFAULT 0,
  generated_by INTEGER,
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_reports_type ON reports(report_type);
CREATE INDEX idx_reports_date ON reports(report_date);
CREATE INDEX idx_reports_branch ON reports(branch_id);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);

-- ============================================
-- Update branch foreign key for users
-- ============================================
ALTER TABLE users ADD CONSTRAINT users_branch_fk 
  FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL;

-- ============================================
-- Create updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Apply updated_at triggers to all tables
-- ============================================
CREATE TRIGGER users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER branches_updated_at BEFORE UPDATE ON branches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER borrowers_updated_at BEFORE UPDATE ON borrowers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER guarantors_updated_at BEFORE UPDATE ON guarantors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER loans_updated_at BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER repayment_schedules_updated_at BEFORE UPDATE ON repayment_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER repayments_updated_at BEFORE UPDATE ON repayments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Schema creation complete
-- ============================================
