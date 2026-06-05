import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { query } from '../db/connection';
import { HTTP_STATUS } from '../constants/errors';

/**
 * Create branch
 */
export const createBranch = asyncHandler(async (req: Request, res: Response) => {
  const { branch_name, branch_code, location, region, phone, email, manager_id } = req.body;

  if (!branch_name || !branch_code || !location || !region) {
    throw new AppError('Missing required fields', HTTP_STATUS.BAD_REQUEST);
  }

  const result = await query(
    `INSERT INTO branches (
      branch_name, branch_code, location, region, phone, email,
      manager_id, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [branch_name, branch_code, location, region, phone, email, manager_id, req.user.id]
  );

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Branch created successfully',
    data: result.rows[0],
  });
});

/**
 * Get all branches
 */
export const getAllBranches = asyncHandler(async (req: Request, res: Response) => {
  const { is_active } = req.query;

  let sql = `
    SELECT b.*, u.first_name, u.last_name,
           COUNT(DISTINCT c.id) as total_clients,
           COUNT(DISTINCT l.id) as total_loans
    FROM branches b
    LEFT JOIN users u ON b.manager_id = u.id
    LEFT JOIN borrowers c ON b.id = c.branch_id
    LEFT JOIN loans l ON b.id = l.branch_id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (is_active !== undefined) {
    sql += ` AND b.is_active = $${params.length + 1}`;
    params.push(is_active === 'true');
  }

  sql += ' GROUP BY b.id, u.id ORDER BY b.branch_name';

  const result = await query(sql, params);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result.rows,
    total: result.rows.length,
  });
});

/**
 * Get branch by ID
 */
export const getBranchById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT b.*, u.first_name, u.last_name,
            COUNT(DISTINCT c.id) as total_clients,
            COUNT(DISTINCT l.id) as total_loans,
            SUM(l.principal_amount) as total_portfolio
     FROM branches b
     LEFT JOIN users u ON b.manager_id = u.id
     LEFT JOIN borrowers c ON b.id = c.branch_id
     LEFT JOIN loans l ON b.id = l.branch_id
     WHERE b.id = $1
     GROUP BY b.id, u.id`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Branch not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result.rows[0],
  });
});

/**
 * Update branch
 */
export const updateBranch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { branch_name, location, region, phone, email, manager_id, is_active } = req.body;

  const updateFields: string[] = [];
  const params: any[] = [];
  let paramCount = 1;

  if (branch_name !== undefined) {
    updateFields.push(`branch_name = $${paramCount++}`);
    params.push(branch_name);
  }

  if (location !== undefined) {
    updateFields.push(`location = $${paramCount++}`);
    params.push(location);
  }

  if (region !== undefined) {
    updateFields.push(`region = $${paramCount++}`);
    params.push(region);
  }

  if (phone !== undefined) {
    updateFields.push(`phone = $${paramCount++}`);
    params.push(phone);
  }

  if (email !== undefined) {
    updateFields.push(`email = $${paramCount++}`);
    params.push(email);
  }

  if (manager_id !== undefined) {
    updateFields.push(`manager_id = $${paramCount++}`);
    params.push(manager_id);
  }

  if (is_active !== undefined) {
    updateFields.push(`is_active = $${paramCount++}`);
    params.push(is_active);
  }

  if (updateFields.length === 0) {
    throw new AppError('No fields to update', HTTP_STATUS.BAD_REQUEST);
  }

  updateFields.push(`updated_at = NOW()`);
  updateFields.push(`updated_by = $${paramCount++}`);
  params.push(req.user.id);

  params.push(id);

  const result = await query(
    `UPDATE branches SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    throw new AppError('Branch not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Branch updated successfully',
    data: result.rows[0],
  });
});

/**
 * Delete branch
 */
export const deleteBranch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if branch has active clients or loans
  const checkResult = await query(
    `SELECT COUNT(DISTINCT c.id) as clients, COUNT(DISTINCT l.id) as loans
     FROM borrowers c
     LEFT JOIN loans l ON c.id = l.borrower_id
     WHERE c.branch_id = $1`,
    [id]
  );

  if (checkResult.rows[0].clients > 0 || checkResult.rows[0].loans > 0) {
    throw new AppError('Cannot delete branch with active clients or loans', HTTP_STATUS.BAD_REQUEST);
  }

  const result = await query(
    'UPDATE branches SET is_active = false, updated_at = NOW(), updated_by = $1 WHERE id = $2 RETURNING id',
    [req.user.id, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Branch not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Branch deactivated successfully',
  });
});