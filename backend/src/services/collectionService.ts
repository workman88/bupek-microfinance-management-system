import { query } from '../db/connection';
import logger from '../config/logger';

export class CollectionService {
  /**
   * Create collection record
   */
  async createCollection(collectionData: any, userId: number): Promise<any> {
    const result = await query(
      `INSERT INTO collections (
        loan_id, borrower_id, collection_date, days_overdue,
        overdue_amount, arrears_amount, collection_officer_id,
        collection_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        collectionData.loan_id,
        collectionData.borrower_id,
        new Date(collectionData.collection_date),
        collectionData.days_overdue,
        collectionData.overdue_amount,
        collectionData.arrears_amount,
        userId,
        'PENDING',
      ]
    );

    logger.info(`[Collection] Collection created for loan ${collectionData.loan_id}`);
    return result.rows[0];
  }

  /**
   * Get collections by loan
   */
  async getCollectionsByLoan(loanId: number): Promise<any[]> {
    const result = await query(
      `SELECT c.*, u.first_name, u.last_name
       FROM collections c
       LEFT JOIN users u ON c.collection_officer_id = u.id
       WHERE c.loan_id = $1
       ORDER BY c.collection_date DESC`,
      [loanId]
    );

    return result.rows;
  }

  /**
   * Get overdue loans
   */
  async getOverdueLoans(branchId?: number): Promise<any[]> {
    let sql = `
      SELECT l.id, l.loan_number, b.first_name, b.last_name, b.phone_number,
             l.total_amount_due, COALESCE(SUM(r.amount_paid), 0) as total_paid,
             (l.total_amount_due - COALESCE(SUM(r.amount_paid), 0)) as outstanding,
             EXTRACT(DAY FROM (NOW() - ls.due_date)) as days_overdue,
             l.status, b2.branch_name
      FROM loans l
      LEFT JOIN borrowers b ON l.borrower_id = b.id
      LEFT JOIN branches b2 ON l.branch_id = b2.id
      LEFT JOIN repayments r ON l.id = r.loan_id
      LEFT JOIN loan_schedules ls ON l.id = ls.loan_id AND ls.is_paid = false
      WHERE l.status = 'DISBURSED' AND ls.due_date < NOW()
    `;

    const params: any[] = [];

    if (branchId) {
      sql += ` AND l.branch_id = $${params.length + 1}`;
      params.push(branchId);
    }

    sql += ` GROUP BY l.id, b.id, ls.due_date, b2.id
             ORDER BY days_overdue DESC`;

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * Get portfolio at risk (PAR)
   */
  async getPortfolioAtRisk(branchId?: number): Promise<any> {
    let sql = `
      SELECT
        COUNT(DISTINCT l.id) as total_loans,
        SUM(l.total_amount_due) as total_portfolio,
        COUNT(DISTINCT CASE WHEN l.status = 'DISBURSED' AND ls.due_date < NOW() THEN l.id END) as overdue_loans,
        COALESCE(SUM(CASE WHEN l.status = 'DISBURSED' AND ls.due_date < NOW()
                         THEN (l.total_amount_due - COALESCE(SUM(r.amount_paid), 0))
                    END), 0) as overdue_amount,
        ROUND(100.0 * COUNT(DISTINCT CASE WHEN l.status = 'DISBURSED' AND ls.due_date < NOW() THEN l.id END)
              / NULLIF(COUNT(DISTINCT l.id), 0), 2) as par_percentage
      FROM loans l
      LEFT JOIN loan_schedules ls ON l.id = ls.loan_id AND ls.is_paid = false
      LEFT JOIN repayments r ON l.id = r.loan_id
    `;

    const params: any[] = [];

    if (branchId) {
      sql += ` WHERE l.branch_id = $${params.length + 1}`;
      params.push(branchId);
    }

    const result = await query(sql, params);
    return result.rows[0];
  }

  /**
   * Add collection note
   */
  async addCollectionNote(
    collectionId: number,
    notes: string,
    followUpDate: Date,
    userId: number
  ): Promise<any> {
    const result = await query(
      `INSERT INTO collection_notes (
        collection_id, note_date, notes, follow_up_date, created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [collectionId, new Date(), notes, followUpDate, userId]
    );

    return result.rows[0];
  }

  /**
   * Get collection notes
   */
  async getCollectionNotes(collectionId: number): Promise<any[]> {
    const result = await query(
      `SELECT cn.*, u.first_name, u.last_name
       FROM collection_notes cn
       LEFT JOIN users u ON cn.created_by = u.id
       WHERE cn.collection_id = $1
       ORDER BY cn.note_date DESC`,
      [collectionId]
    );

    return result.rows;
  }

  /**
   * Update collection status
   */
  async updateCollectionStatus(
    collectionId: number,
    status: string
  ): Promise<any> {
    const result = await query(
      `UPDATE collections SET collection_status = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [status, collectionId]
    );

    if (result.rows.length === 0) {
      throw new Error('Collection not found');
    }

    return result.rows[0];
  }
}

export default CollectionService;