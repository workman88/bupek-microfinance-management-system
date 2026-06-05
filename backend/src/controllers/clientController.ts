import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { query } from '../db/connection';
import { HTTP_STATUS } from '../constants/errors';
import { generateBorrowerNumber } from '../utils/helpers';

/**
 * Create borrower
 */
export const createBorrower = asyncHandler(async (req: Request, res: Response) => {
  const {
    first_name, last_name, middle_name, date_of_birth, gender,
    phone_number, email, national_id, national_id_type,
    occupation, business_name, business_type, monthly_income,
    address, city, region, postal_code, marital_status, number_of_dependents,
  } = req.body;

  if (!first_name || !last_name || !phone_number || !address) {
    throw new AppError('Missing required fields', HTTP_STATUS.BAD_REQUEST);
  }

  const borrowerNumber = generateBorrowerNumber();

  const result = await query(
    `INSERT INTO borrowers (
      borrower_number, first_name, last_name, middle_name, date_of_birth,
      gender, phone_number, email, national_id, national_id_type,
      occupation, business_name, business_type, monthly_income,
      address, city, region, postal_code, marital_status, number_of_dependents,
      branch_id, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
    RETURNING *`,
    [
      borrowerNumber, first_name, last_name, middle_name, date_of_birth,
      gender, phone_number, email, national_id, national_id_type,
      occupation, business_name, business_type, monthly_income,
      address, city, region, postal_code, marital_status, number_of_dependents,
      req.user.branch_id, req.user.id,
    ]
  );

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Borrower created successfully',
    data: result.rows[0],
  });
});

/**
 * Get all borrowers
 */
export const getAllBorrowers = asyncHandler(async (req: Request, res: Response) => {
  const { search, kyc_status, is_active, branch_id } = req.query;

  let sql = `
    SELECT b.*, b2.branch_name,
           COUNT(DISTINCT l.id) as total_loans,
           SUM(l.principal_amount) as total_borrowed
    FROM borrowers b
    LEFT JOIN branches b2 ON b.branch_id = b2.id
    LEFT JOIN loans l ON b.id = l.borrower_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (search) {
    sql += ` AND (b.first_name ILIKE $${params.length + 1} OR b.last_name ILIKE $${params.length + 1} OR b.phone_number = $${params.length + 1})`;
    params.push(`%${search}%`, `%${search}%`, search);
  }

  if (kyc_status) {
    sql += ` AND b.kyc_status = $${params.length + 1}`;
    params.push(kyc_status);
  }

  if (is_active !== undefined) {
    sql += ` AND b.is_active = $${params.length + 1}`;
    params.push(is_active === 'true');
  }

  if (branch_id) {
    sql += ` AND b.branch_id = $${params.length + 1}`;
    params.push(branch_id);
  } else {
    sql += ` AND b.branch_id = $${params.length + 1}`;
    params.push(req.user.branch_id);
  }

  sql += ' GROUP BY b.id, b2.id ORDER BY b.created_at DESC';

  const result = await query(sql, params);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result.rows,
    total: result.rows.length,
  });
});

/**
 * Get borrower by ID
 */
export const getBorrowerById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT b.*, b2.branch_name,
            COUNT(DISTINCT l.id) as total_loans,
            SUM(l.principal_amount) as total_borrowed
     FROM borrowers b
     LEFT JOIN branches b2 ON b.branch_id = b2.id
     LEFT JOIN loans l ON b.id = l.borrower_id
     WHERE b.id = $1
     GROUP BY b.id, b2.id`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Borrower not found', HTTP_STATUS.NOT_FOUND);
  }

  // Get guarantors
  const guarantorsResult = await query(
    'SELECT * FROM guarantors WHERE borrower_id = $1 ORDER BY is_primary DESC',
    [id]
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      ...result.rows[0],
      guarantors: guarantorsResult.rows,
    },
  });
});

/**
 * Update borrower
 */
export const updateBorrower = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { phone_number, email, occupation, business_name, monthly_income, kyc_status, risk_rating } = req.body;

  const updateFields: string[] = [];
  const params: any[] = [];
  let paramCount = 1;

  if (phone_number !== undefined) {
    updateFields.push(`phone_number = $${paramCount++}`);
    params.push(phone_number);
  }

  if (email !== undefined) {
    updateFields.push(`email = $${paramCount++}`);
    params.push(email);
  }

  if (occupation !== undefined) {
    updateFields.push(`occupation = $${paramCount++}`);
    params.push(occupation);
  }

  if (business_name !== undefined) {
    updateFields.push(`business_name = $${paramCount++}`);
    params.push(business_name);
  }

  if (monthly_income !== undefined) {
    updateFields.push(`monthly_income = $${paramCount++}`);
    params.push(monthly_income);
  }

  if (kyc_status !== undefined) {
    updateFields.push(`kyc_status = $${paramCount++}`);
    params.push(kyc_status);
  }

  if (risk_rating !== undefined) {
    updateFields.push(`risk_rating = $${paramCount++}`);
    params.push(risk_rating);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', HTTP_STATUS.BAD_REQUEST);
  }

  updateFields.push(`updated_at = NOW()`);
  updateFields.push(`updated_by = $${paramCount++}`);
  params.push(req.user.id);

  params.push(id);

  const result = await query(
    `UPDATE borrowers SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    throw new AppError('Borrower not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Borrower updated successfully',
    data: result.rows[0],
  });
});

/**
 * Verify KYC
 */
export const verifyKYC = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { verified } = req.body;

  if (verified === undefined) {
    throw new AppError('Verified status is required', HTTP_STATUS.BAD_REQUEST);
  }

  const result = await query(
    `UPDATE borrowers SET 
      kyc_status = $1,
      kyc_verified_by = $2,
      kyc_verified_date = NOW(),
      updated_at = NOW(),
      updated_by = $3
     WHERE id = $4
     RETURNING *`,
    [verified ? 'VERIFIED' : 'REJECTED', req.user.id, req.user.id, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Borrower not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: `Borrower KYC ${verified ? 'verified' : 'rejected'} successfully`,
    data: result.rows[0],
  });
});