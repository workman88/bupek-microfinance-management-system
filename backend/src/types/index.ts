/**
 * User Types
 */
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: string;
  branch_id: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Borrower/Client Types
 */
export interface Borrower {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  email?: string;
  national_id: string;
  date_of_birth?: Date;
  gender?: string;
  marital_status?: string;
  employment_status: string;
  business_type?: string;
  monthly_income: number;
  branch_id: number;
  loan_officer_id?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Loan Types
 */
export interface Loan {
  id: number;
  loan_number: string;
  borrower_id: number;
  branch_id: number;
  loan_officer_id?: number;
  principal_amount: number;
  interest_rate: number;
  loan_term_months: number;
  maturity_date: Date;
  status: string;
  loan_purpose: string;
  repayment_frequency: string;
  total_interest: number;
  total_charges: number;
  total_amount_due: number;
  disbursement_date?: Date;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  updated_by?: number;
}

/**
 * Loan Schedule Types
 */
export interface LoanSchedule {
  id: number;
  loan_id: number;
  schedule_number: number;
  due_date: Date;
  principal_amount: number;
  interest_amount: number;
  total_amount: number;
  balance_after_payment: number;
  paid_amount?: number;
  is_paid: boolean;
  paid_date?: Date;
}

/**
 * Repayment Types
 */
export interface Repayment {
  id: number;
  repayment_number: string;
  loan_id: number;
  borrower_id: number;
  repayment_date: Date;
  amount_paid: number;
  principal_paid: number;
  interest_paid: number;
  charges_paid: number;
  payment_method: string;
  reference_number?: string;
  receipt_number: string;
  recorded_by: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Collection Types
 */
export interface Collection {
  id: number;
  loan_id: number;
  borrower_id: number;
  collection_date: Date;
  days_overdue: number;
  overdue_amount: number;
  arrears_amount: number;
  collection_officer_id: number;
  collection_status: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Branch Types
 */
export interface Branch {
  id: number;
  branch_name: string;
  branch_code: string;
  location: string;
  phone_number?: string;
  manager_id?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Guarantor Types
 */
export interface Guarantor {
  id: number;
  loan_id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  national_id: string;
  relationship: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Express Request with User
 */
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
