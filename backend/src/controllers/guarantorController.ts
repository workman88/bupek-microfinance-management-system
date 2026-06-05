import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { query } from '../db/connection';
import { HTTP_STATUS } from '../constants/errors';
import { generateGuarantorNumber } from '../utils/helpers';

/**
 * Create guarantor
 */
export const createGuarantor = asyncHandler(async (req: Request, res: Response) => {
  const {
    borrower_id, first_name, last_name, relationship,
    phone_number, national_id, address, occupation, monthly_income, is_primary,
  } = req.body;

  if (!borrower_id || !first_name || !last_name) {
    throw new AppError('Missing required fields', HTTP_STATUS.BAD_REQUEST);
  }

  const guarantorNumber = generateGuarantorNumber();

  const result = await query(
    `INSERT INTO guarantors (
      borrower_id, guarantor_number, first_name, last_name, relationship,
      phone_number, national_id, address, occupation, monthly_income, is_primary
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [borrower_id, guarantorNumber, first_name, last_name, relationship, phone_number, national_id, address, occupation, monthly_income, is_primary || false]
  );

  // If this is primary, set others as non-primary
  if (is_primary) {
    await query(
      'UPDATE guarantors SET is_primary = false WHERE borrower_id = $1 AND id != $2',
      [borrower_id, result.rows[0].id]
    );
  }

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Guarantor created successfully',
    data: result.rows[0],
  });
});

/**
 * Get guarantors for borrower
 */
export const getGuarantorsByBorrower = asyncHandler(async (req: Request, res: Response) => {
  const { borrower_id } = req.params;

  const result = await query(
    'SELECT * FROM guarantors WHERE borrower_id = $1 ORDER BY is_primary DESC, created_at DESC',
    [borrower_id]
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result.rows,
    total: result.rows.length,
  });
});

/**
 * Get guarantor by ID
 */
export const getGuarantorById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT g.*, b.first_name as borrower_first_name, b.last_name as borrower_last_name
     FROM guarantors g
     LEFT JOIN borrowers b ON g.borrower_id = b.id
     WHERE g.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Guarantor not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result.rows[0],
  });
});

/**
 * Update guarantor
 */
export const updateGuarantor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { first_name, last_name, relationship, phone_number, national_id, address, occupation, monthly_income, is_primary } = req.body;

  const updateFields: string[] = [];
  const params: any[] = [];
  let paramCount = 1;

  if (first_name !== undefined) {
    updateFields.push(`first_name = $${paramCount++}`);
    params.push(first_name);
  }

  if (last_name !== undefined) {
    updateFields.push(`last_name = $${paramCount++}`);
    params.push(last_name);
  }

  if (relationship !== undefined) {
    updateFields.push(`relationship = $${paramCount++}`);
    params.push(relationship);
  }

  if (phone_number !== undefined) {
    updateFields.push(`phone_number = $${paramCount++}`);
    params.push(phone_number);
  }

  if (national_id !== undefined) {
    updateFields.push(`national_id = $${paramCount++}`);
    params.push(national_id);
  }

  if (address !== undefined) {
    updateFields.push(`address = $${paramCount++}`);
    params.push(address);
  }

  if (occupation !== undefined) {
    updateFields.push(`occupation = $${paramCount++}`);
    params.push(occupation);
  }

  if (monthly_income !== undefined) {
    updateFields.push(`monthly_income = $${paramCount++}`);
    params.push(monthly_income);
  }

  if (is_primary !== undefined) {
    updateFields.push(`is_primary = $${paramCount++}`);
    params.push(is_primary);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', HTTP_STATUS.BAD_REQUEST);
  }

  updateFields.push(`updated_at = NOW()`);
  params.push(id);

  const result = await query(
    `UPDATE guarantors SET ${updateFields.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    throw new AppError('Guarantor not found', HTTP_STATUS.NOT_FOUND);
  }

  // If set as primary, unset others
  if (is_primary) {
    await query(
      'UPDATE guarantors SET is_primary = false WHERE borrower_id = (SELECT borrower_id FROM guarantors WHERE id = $1) AND id != $1',
      [id]
    );
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Guarantor updated successfully',
    data: result.rows[0],
  });
});

/**
 * Delete guarantor
 */
export const deleteGuarantor = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    'DELETE FROM guarantors WHERE id = $1 RETURNING borrower_id',
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Guarantor not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Guarantor deleted successfully',
  });
});