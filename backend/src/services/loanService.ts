import { query } from '../db/connection';
import { Loan, LoanSchedule } from '../types';
import { generateLoanNumber, calculateLoanSchedule, calculateInterest } from '../utils/helpers';
import logger from '../config/logger';

export class LoanService {
  /**
   * Create loan application
   */
  async createLoan(loanData: any): Promise<Loan> {
    const loanNumber = generateLoanNumber();
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + loanData.loan_term_months);

    const totalInterest = calculateInterest(
      loanData.principal_amount,
      loanData.interest_rate,
      loanData.loan_term_months
    );
    const totalAmountDue =
      loanData.principal_amount + totalInterest + (loanData.total_charges || 0);

    const result = await query(
      `INSERT INTO loans (
        loan_number, borrower_id, branch_id, loan_officer_id, principal_amount,
        interest_rate, loan_term_months, maturity_date, status, loan_purpose,
        repayment_frequency, total_interest, total_charges, total_amount_due, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        loanNumber,
        loanData.borrower_id,
        loanData.branch_id,
        loanData.loan_officer_id,
        loanData.principal_amount,
        loanData.interest_rate,
        loanData.loan_term_months,
        maturityDate,
        'PENDING',
        loanData.loan_purpose,
        loanData.repayment_frequency || 'MONTHLY',
        totalInterest,
        loanData.total_charges || 0,
        totalAmountDue,
        loanData.created_by,
      ]
    );

    logger.info(`[Loan] Loan created: ${loanNumber}`);
    return result.rows[0];
  }

  /**
   * Get loan by ID
   */
  async getLoanById(id: number): Promise<Loan> {
    const result = await query(
      `SELECT l.*, b.first_name, b.last_name, b.phone_number,
              br.branch_name, u.first_name as officer_first_name, u.last_name as officer_last_name
       FROM loans l
       LEFT JOIN borrowers b ON l.borrower_id = b.id
       LEFT JOIN branches br ON l.branch_id = br.id
       LEFT JOIN users u ON l.loan_officer_id = u.id
       WHERE l.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new Error('Loan not found');
    }
    return result.rows[0];
  }

  /**
   * Get loans by borrower
   */
  async getLoansByBorrower(borrowerId: number): Promise<Loan[]> {
    const result = await query(
      `SELECT * FROM loans WHERE borrower_id = $1 ORDER BY created_at DESC`,
      [borrowerId]
    );
    return result.rows;
  }

  /**
   * Get all loans with filters
   */
  async getAllLoans(status?: string, branchId?: number, borrowerId?: number): Promise<Loan[]> {
    let sql = `SELECT l.*, b.first_name, b.last_name, COUNT(DISTINCT r.id) as repayment_count
               FROM loans l
               LEFT JOIN borrowers b ON l.borrower_id = b.id
               LEFT JOIN repayments r ON l.id = r.loan_id
               WHERE 1=1`;
    const params: any[] = [];

    if (status) {
      sql += ` AND l.status = $${params.length + 1}`;
      params.push(status);
    }

    if (branchId) {
      sql += ` AND l.branch_id = $${params.length + 1}`;
      params.push(branchId);
    }

    if (borrowerId) {
      sql += ` AND l.borrower_id = $${params.length + 1}`;
      params.push(borrowerId);
    }

    sql += ' GROUP BY l.id, b.id ORDER BY l.created_at DESC';
    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Create loan appraisal
   */
  async appraiseLoan(
    loanId: number,
    appraisalData: any,
    userId: number
  ): Promise<any> {
    const result = await query(
      `INSERT INTO loan_appraisals (
        loan_id, appraised_by, appraisal_date, appraisal_amount,
        appraisal_comments, risk_assessment, recommendation, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        loanId,
        userId,
        new Date(),
        appraisalData.appraisal_amount,
        appraisalData.appraisal_comments,
        appraisalData.risk_assessment,
        appraisalData.recommendation,
        'PENDING',
      ]
    );

    logger.info(`[Loan] Appraisal created for loan ${loanId}`);
    return result.rows[0];
  }

  /**
   * Approve loan
   */
  async approveLoan(
    loanId: number,
    approvedAmount: number,
    approvalComments: string,
    userId: number
  ): Promise<Loan> {
    // Insert approval record
    await query(
      `INSERT INTO loan_approvals (
        loan_id, approval_date, approved_by, approval_amount,
        approval_status, approval_comments
      ) VALUES ($1, CURRENT_DATE, $2, $3, 'APPROVED', $4)`,
      [loanId, userId, approvedAmount, approvalComments]
    );

    // Update loan status
    const result = await query(
      `UPDATE loans SET status = $1, updated_at = NOW(), updated_by = $2
       WHERE id = $3 RETURNING *`,
      ['APPROVED', userId, loanId]
    );

    logger.info(`[Loan] Loan approved: ${loanId}`);
    return result.rows[0];
  }

  /**
   * Reject loan
   */
  async rejectLoan(loanId: number, reason: string, userId: number): Promise<Loan> {
    const result = await query(
      `UPDATE loans SET status = $1, updated_at = NOW(), updated_by = $2
       WHERE id = $3 RETURNING *`,
      ['REJECTED', userId, loanId]
    );

    logger.info(`[Loan] Loan rejected: ${loanId}`);
    return result.rows[0];
  }

  /**
   * Disburse loan
   */
  async disburseLoan(
    loanId: number,
    disbursementDate: Date,
    userId: number
  ): Promise<Loan> {
    const loan = await this.getLoanById(loanId);

    // Insert disbursement record
    await query(
      `INSERT INTO loan_disbursements (
        loan_id, disbursement_date, amount, created_by
      ) VALUES ($1, $2, $3, $4)`,
      [loanId, disbursementDate, loan.principal_amount, userId]
    );

    // Create loan schedule
    const schedule = calculateLoanSchedule(
      loan.principal_amount,
      loan.interest_rate,
      loan.loan_term_months
    );

    for (const item of schedule) {
      await query(
        `INSERT INTO loan_schedules (
          loan_id, schedule_number, due_date, principal_amount,
          interest_amount, total_amount, balance_after_payment, is_paid
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE)`,
        [
          loanId,
          item.schedule_number,
          item.due_date,
          item.principal_amount,
          item.interest_amount,
          item.total_amount,
          item.balance_after_payment,
        ]
      );
    }

    // Update loan status
    const result = await query(
      `UPDATE loans SET status = $1, disbursement_date = $2, updated_at = NOW(),
       updated_by = $3 WHERE id = $4 RETURNING *`,
      ['DISBURSED', disbursementDate, userId, loanId]
    );

    logger.info(`[Loan] Loan disbursed: ${loanId}`);
    return result.rows[0];
  }

  /**
   * Get loan schedule
   */
  async getLoanSchedule(loanId: number): Promise<LoanSchedule[]> {
    const result = await query(
      `SELECT * FROM loan_schedules WHERE loan_id = $1 ORDER BY schedule_number ASC`,
      [loanId]
    );
    return result.rows;
  }

  /**
   * Update loan status
   */
  async updateLoanStatus(loanId: number, status: string, userId: number): Promise<Loan> {
    const result = await query(
      `UPDATE loans SET status = $1, updated_at = NOW(), updated_by = $2
       WHERE id = $3 RETURNING *`,
      [status, userId, loanId]
    );

    if (result.rows.length === 0) {
      throw new Error('Loan not found');
    }

    return result.rows[0];
  }

  /**
   * Calculate loan outstanding balance
   */
  async getLoanOutstandingBalance(loanId: number): Promise<any> {
    const result = await query(
      `SELECT l.total_amount_due,
              COALESCE(SUM(r.amount_paid), 0) as total_paid,
              (l.total_amount_due - COALESCE(SUM(r.amount_paid), 0)) as outstanding
       FROM loans l
       LEFT JOIN repayments r ON l.id = r.loan_id
       WHERE l.id = $1
       GROUP BY l.id`,
      [loanId]
    );

    return result.rows[0] || { outstanding: 0 };
  }
}

export default LoanService;