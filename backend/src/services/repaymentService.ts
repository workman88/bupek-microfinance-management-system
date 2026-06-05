import { query } from '../db/connection';
import { generateReceiptNumber, generateRepaymentNumber } from '../utils/helpers';
import logger from '../config/logger';

export class RepaymentService {
  /**
   * Record repayment
   */
  async recordRepayment(repaymentData: any, userId: number): Promise<any> {
    const repaymentNumber = generateRepaymentNumber();
    const receiptNumber = generateReceiptNumber();

    // Get loan details
    const loanResult = await query(
      `SELECT l.id, l.borrower_id, l.principal_amount, l.total_interest,
              l.total_amount_due, l.status
       FROM loans l WHERE l.id = $1`,
      [repaymentData.loan_id]
    );

    if (loanResult.rows.length === 0) {
      throw new Error('Loan not found');
    }

    const loan = loanResult.rows[0];

    // Calculate interest and principal breakdown
    const totalPaid = await this.getTotalRepaid(repaymentData.loan_id);
    const principalRemaining = loan.principal_amount - (totalPaid.principal_paid || 0);
    const interestRemaining = loan.total_interest - (totalPaid.interest_paid || 0);

    let principal_paid = Math.min(repaymentData.amount_paid, principalRemaining);
    let interest_paid = Math.min(
      repaymentData.amount_paid - principal_paid,
      interestRemaining
    );
    let charges_paid = repaymentData.amount_paid - principal_paid - interest_paid;

    const result = await query(
      `INSERT INTO repayments (
        repayment_number, loan_id, borrower_id, repayment_date,
        amount_paid, principal_paid, interest_paid, charges_paid,
        payment_method, reference_number, receipt_number, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        repaymentNumber,
        repaymentData.loan_id,
        loan.borrower_id,
        new Date(repaymentData.repayment_date),
        repaymentData.amount_paid,
        principal_paid,
        interest_paid,
        charges_paid,
        repaymentData.payment_method || 'CASH',
        repaymentData.reference_number,
        receiptNumber,
        userId,
      ]
    );

    // Update loan schedule
    await this.updateLoanSchedule(repaymentData.loan_id, principal_paid + interest_paid);

    // Check if loan is fully paid
    const outstandingResult = await query(
      `SELECT l.total_amount_due,
              COALESCE(SUM(r.amount_paid), 0) as total_paid
       FROM loans l
       LEFT JOIN repayments r ON l.id = r.loan_id
       WHERE l.id = $1
       GROUP BY l.id`,
      [repaymentData.loan_id]
    );

    const outstanding = outstandingResult.rows[0];
    if (outstanding.total_paid >= outstanding.total_amount_due) {
      await query(
        'UPDATE loans SET status = $1, updated_at = NOW() WHERE id = $2',
        ['PAID', repaymentData.loan_id]
      );
    }

    logger.info(`[Repayment] Repayment recorded: ${repaymentNumber}`);
    return result.rows[0];
  }

  /**
   * Get total repaid for loan
   */
  async getTotalRepaid(loanId: number): Promise<any> {
    const result = await query(
      `SELECT
        COALESCE(SUM(principal_paid), 0) as principal_paid,
        COALESCE(SUM(interest_paid), 0) as interest_paid,
        COALESCE(SUM(charges_paid), 0) as charges_paid,
        COALESCE(SUM(amount_paid), 0) as total_paid
       FROM repayments WHERE loan_id = $1`,
      [loanId]
    );

    return result.rows[0];
  }

  /**
   * Get repayments by loan
   */
  async getRepaymentsByLoan(loanId: number): Promise<any[]> {
    const result = await query(
      `SELECT r.*, u.first_name, u.last_name
       FROM repayments r
       LEFT JOIN users u ON r.recorded_by = u.id
       WHERE r.loan_id = $1
       ORDER BY r.repayment_date DESC`,
      [loanId]
    );

    return result.rows;
  }

  /**
   * Get repayments by borrower
   */
  async getRepaymentsByBorrower(borrowerId: number): Promise<any[]> {
    const result = await query(
      `SELECT r.*, l.loan_number, u.first_name, u.last_name
       FROM repayments r
       LEFT JOIN loans l ON r.loan_id = l.id
       LEFT JOIN users u ON r.recorded_by = u.id
       WHERE r.borrower_id = $1
       ORDER BY r.repayment_date DESC`,
      [borrowerId]
    );

    return result.rows;
  }

  /**
   * Get repayment by ID
   */
  async getRepaymentById(id: number): Promise<any> {
    const result = await query(
      `SELECT r.*, l.loan_number, b.first_name, b.last_name,
              u.first_name as recorded_by_first_name, u.last_name as recorded_by_last_name
       FROM repayments r
       LEFT JOIN loans l ON r.loan_id = l.id
       LEFT JOIN borrowers b ON r.borrower_id = b.id
       LEFT JOIN users u ON r.recorded_by = u.id
       WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Repayment not found');
    }

    return result.rows[0];
  }

  /**
   * Update loan schedule after repayment
   */
  private async updateLoanSchedule(loanId: number, amountPaid: number): Promise<void> {
    // Get unpaid schedules ordered by due date
    const schedules = await query(
      `SELECT * FROM loan_schedules
       WHERE loan_id = $1 AND is_paid = false
       ORDER BY due_date ASC`,
      [loanId]
    );

    let remainingAmount = amountPaid;

    for (const schedule of schedules.rows) {
      if (remainingAmount <= 0) break;

      const amountToApply = Math.min(remainingAmount, schedule.total_amount);
      const balance = schedule.balance_after_payment - amountToApply;

      await query(
        `UPDATE loan_schedules
         SET paid_amount = COALESCE(paid_amount, 0) + $1,
             balance_after_payment = GREATEST(0, $2),
             is_paid = CASE WHEN $2 <= 0 THEN true ELSE false END,
             paid_date = CASE WHEN $2 <= 0 THEN NOW() ELSE paid_date END
         WHERE id = $3`,
        [amountToApply, balance, schedule.id]
      );

      remainingAmount -= amountToApply;
    }
  }
}

export default RepaymentService;