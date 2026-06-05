-- BUPEK Microfinance Management System - Initial Schema
-- This creates all core tables for the system

-- Drop existing tables if they exist (be careful in production)
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS repayments CASCADE;
DROP TABLE IF EXISTS loan_schedules CASCADE;
DROP TABLE IF EXISTS loan_disbursements CASCADE;
DROP TABLE IF EXISTS loan_appraisals CASCADE;
DROP TABLE IF EXISTS loan_approvals CASCADE;
DROP TABLE IF EXISTS collection_notes CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS loans CASCADE;
DROP TABLE IF EXISTS guarantors CASCADE;
DROP TABLE IF EXISTS borrowers CASCADE;
DROP TABLE IF EXISTS branches CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ROLES AND PERMISSIONS
-- ============================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    module VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

-- ============================================
-- USERS
-- ============================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    branch_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    password_reset_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- ============================================
-- BRANCHES
-- ============================================

CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL UNIQUE,
    branch_code VARCHAR(20) UNIQUE NOT NULL,
    location VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    manager_id INTEGER REFERENCES users(id),
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- Add branch_id constraint to users
ALTER TABLE users ADD CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches(id);

-- ============================================
-- BORROWERS/CLIENTS
-- ============================================

CREATE TABLE borrowers (
    id SERIAL PRIMARY KEY,
    borrower_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(10),
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    national_id VARCHAR(50),
    national_id_type VARCHAR(50),
    occupation VARCHAR(100),
    business_name VARCHAR(100),
    business_type VARCHAR(100),
    monthly_income DECIMAL(15,2),
    address TEXT NOT NULL,
    city VARCHAR(100),
    region VARCHAR(100),
    postal_code VARCHAR(20),
    marital_status VARCHAR(20),
    number_of_dependents INTEGER,
    kyc_status VARCHAR(50) DEFAULT 'PENDING',
    kyc_verified_by INTEGER REFERENCES users(id),
    kyc_verified_date TIMESTAMP,
    risk_rating VARCHAR(20) DEFAULT 'MEDIUM',
    branch_id INTEGER NOT NULL REFERENCES branches(id),
    created_by INTEGER NOT NULL REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

-- ============================================
-- GUARANTORS
-- ============================================

CREATE TABLE guarantors (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
    guarantor_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50),
    phone_number VARCHAR(20),
    national_id VARCHAR(50),
    address TEXT,
    occupation VARCHAR(100),
    monthly_income DECIMAL(15,2),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- LOANS
-- ============================================

CREATE TABLE loans (
    id SERIAL PRIMARY KEY,
    loan_number VARCHAR(50) UNIQUE NOT NULL,
    borrower_id INTEGER NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
    branch_id INTEGER NOT NULL REFERENCES branches(id),
    loan_officer_id INTEGER NOT NULL REFERENCES users(id),
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2) NOT NULL,
    loan_term_months INTEGER NOT NULL,
    disbursement_date DATE,
    maturity_date DATE,
    loan_purpose VARCHAR(255),
    repayment_frequency VARCHAR(50) DEFAULT 'MONTHLY',
    total_interest DECIMAL(15,2),
    total_charges DECIMAL(15,2) DEFAULT 0,
    total_amount_due DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id)
);

-- ============================================
-- LOAN APPRAISALS
-- ============================================

CREATE TABLE loan_appraisals (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    appraised_by INTEGER NOT NULL REFERENCES users(id),
    appraisal_date DATE NOT NULL,
    appraisal_amount DECIMAL(15,2),
    appraisal_comments TEXT,
    risk_assessment VARCHAR(50),
    recommendation VARCHAR(50),
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- LOAN APPROVALS
-- ============================================

CREATE TABLE loan_approvals (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    approved_by INTEGER NOT NULL REFERENCES users(id),
    approval_date DATE NOT NULL,
    approval_amount DECIMAL(15,2),
    approval_status VARCHAR(50) DEFAULT 'APPROVED',
    approval_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- LOAN DISBURSEMENTS
-- ============================================

CREATE TABLE loan_disbursements (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    disbursement_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    disbursement_method VARCHAR(50),
    reference_number VARCHAR(100),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- LOAN SCHEDULES
-- ============================================

CREATE TABLE loan_schedules (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    schedule_number INTEGER,
    due_date DATE NOT NULL,
    principal_amount DECIMAL(15,2),
    interest_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2),
    balance_after_payment DECIMAL(15,2),
    is_paid BOOLEAN DEFAULT false,
    paid_date DATE,
    paid_amount DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(loan_id, schedule_number)
);

-- ============================================
-- REPAYMENTS
-- ============================================

CREATE TABLE repayments (
    id SERIAL PRIMARY KEY,
    repayment_number VARCHAR(50) UNIQUE NOT NULL,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    borrower_id INTEGER NOT NULL REFERENCES borrowers(id),
    repayment_date DATE NOT NULL,
    amount_paid DECIMAL(15,2) NOT NULL,
    principal_paid DECIMAL(15,2),
    interest_paid DECIMAL(15,2),
    charges_paid DECIMAL(15,2),
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    receipt_number VARCHAR(100) UNIQUE,
    recorded_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- COLLECTIONS
-- ============================================

CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    loan_id INTEGER NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    borrower_id INTEGER NOT NULL REFERENCES borrowers(id),
    collection_date DATE NOT NULL,
    days_overdue INTEGER,
    overdue_amount DECIMAL(15,2),
    arrears_amount DECIMAL(15,2),
    collection_officer_id INTEGER NOT NULL REFERENCES users(id),
    collection_status VARCHAR(50) DEFAULT 'PENDING',
    recovery_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE collection_notes (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    note_date DATE NOT NULL,
    notes TEXT,
    follow_up_date DATE,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ACTIVITY LOGS / AUDIT TRAIL
-- ============================================

CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    module VARCHAR(50),
    action VARCHAR(50),
    table_name VARCHAR(100),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_branch_id ON users(branch_id);
CREATE INDEX idx_users_role_id ON users(role_id);

-- Borrower indexes
CREATE INDEX idx_borrowers_borrower_number ON borrowers(borrower_number);
CREATE INDEX idx_borrowers_branch_id ON borrowers(branch_id);
CREATE INDEX idx_borrowers_national_id ON borrowers(national_id);

-- Loan indexes
CREATE INDEX idx_loans_loan_number ON loans(loan_number);
CREATE INDEX idx_loans_borrower_id ON loans(borrower_id);
CREATE INDEX idx_loans_branch_id ON loans(branch_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_loan_officer_id ON loans(loan_officer_id);

-- Repayment indexes
CREATE INDEX idx_repayments_loan_id ON repayments(loan_id);
CREATE INDEX idx_repayments_borrower_id ON repayments(borrower_id);
CREATE INDEX idx_repayments_repayment_date ON repayments(repayment_date);

-- Collection indexes
CREATE INDEX idx_collections_loan_id ON collections(loan_id);
CREATE INDEX idx_collections_collection_date ON collections(collection_date);
CREATE INDEX idx_collections_collection_officer_id ON collections(collection_officer_id);

-- Activity log indexes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- ============================================
-- DEFAULT ROLES
-- ============================================

INSERT INTO roles (name, description) VALUES
    ('CEO_ADMIN', 'Chief Executive Officer - Full System Access'),
    ('OPERATIONS_MANAGER', 'Operations Manager - Operational Oversight'),
    ('BRANCH_MANAGER', 'Branch Manager - Branch-Specific Access'),
    ('LOAN_OFFICER', 'Loan Officer - Loan Processing'),
    ('COLLECTION_OFFICER', 'Collection Officer - Collections and Follow-ups'),
    ('ACCOUNTANT', 'Accountant - Financial Reporting')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- DEFAULT PERMISSIONS
-- ============================================

INSERT INTO permissions (name, description, module) VALUES
    -- User Management
    ('user.create', 'Create users', 'users'),
    ('user.read', 'View users', 'users'),
    ('user.update', 'Update users', 'users'),
    ('user.delete', 'Delete users', 'users'),
    
    -- Branch Management
    ('branch.create', 'Create branches', 'branches'),
    ('branch.read', 'View branches', 'branches'),
    ('branch.update', 'Update branches', 'branches'),
    ('branch.delete', 'Delete branches', 'branches'),
    
    -- Client Management
    ('client.create', 'Create clients', 'clients'),
    ('client.read', 'View clients', 'clients'),
    ('client.update', 'Update clients', 'clients'),
    ('client.delete', 'Delete clients', 'clients'),
    
    -- Loan Management
    ('loan.create', 'Create loans', 'loans'),
    ('loan.read', 'View loans', 'loans'),
    ('loan.update', 'Update loans', 'loans'),
    ('loan.approve', 'Approve loans', 'loans'),
    ('loan.disburse', 'Disburse loans', 'loans'),
    
    -- Repayment Management
    ('repayment.create', 'Record repayments', 'repayments'),
    ('repayment.read', 'View repayments', 'repayments'),
    
    -- Collections Management
    ('collection.create', 'Create collections', 'collections'),
    ('collection.read', 'View collections', 'collections'),
    ('collection.update', 'Update collections', 'collections'),
    
    -- Reports
    ('report.view', 'View reports', 'reports'),
    ('report.export', 'Export reports', 'reports'),
    
    -- Dashboard
    ('dashboard.view', 'View dashboard', 'dashboard')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ASSIGN DEFAULT PERMISSIONS TO ROLES
-- ============================================

-- CEO_ADMIN - All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'CEO_ADMIN'
ON CONFLICT DO NOTHING;

-- LOAN_OFFICER - Loan-related permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'LOAN_OFFICER' 
AND p.name IN ('loan.create', 'loan.read', 'loan.update', 'client.read', 'client.create', 'dashboard.view')
ON CONFLICT DO NOTHING;

-- COLLECTION_OFFICER - Collection permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'COLLECTION_OFFICER'
AND p.name IN ('collection.create', 'collection.read', 'collection.update', 'loan.read', 'client.read', 'repayment.read')
ON CONFLICT DO NOTHING;

-- ACCOUNTANT - Report and read permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'ACCOUNTANT'
AND p.name IN ('report.view', 'report.export', 'loan.read', 'client.read', 'repayment.read', 'dashboard.view')
ON CONFLICT DO NOTHING;
