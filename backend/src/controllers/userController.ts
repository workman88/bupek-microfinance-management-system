import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { query } from '../db/connection';
import AuthService from '../services/authService';
import { HTTP_STATUS } from '../constants/errors';

/**
 * Create user
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { first_name, last_name, email, phone, password, role_id, branch_id } = req.body;

  if (!first_name || !last_name || !email || !password || !role_id) {
    throw new AppError('Missing required fields', HTTP_STATUS.BAD_REQUEST);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', HTTP_STATUS.BAD_REQUEST);
  }

  const user = await AuthService.createUser({
    first_name,
    last_name,
    email,
    phone,
    password,
    role_id,
    branch_id,
    created_by: req.user.id,
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'User created successfully',
    data: user,
  });
});

/**
 * Get all users
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { branch_id, role_id, is_active } = req.query;

  let sql = `
    SELECT u.id, u.employee_id, u.first_name, u.last_name, u.email, 
           u.phone, u.is_active, u.last_login, u.created_at,
           r.name as role_name, b.branch_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (branch_id) {
    sql += ` AND u.branch_id = $${params.length + 1}`;
    params.push(branch_id);
  }

  if (role_id) {
    sql += ` AND u.role_id = $${params.length + 1}`;
    params.push(role_id);
  }

  if (is_active !== undefined) {
    sql += ` AND u.is_active = $${params.length + 1}`;
    params.push(is_active === 'true');
  }

  sql += ' ORDER BY u.created_at DESC';

  const result = await query(sql, params);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result.rows,
    total: result.rows.length,
  });
});

/**
 * Get user by ID
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await query(
    `SELECT u.id, u.employee_id, u.first_name, u.last_name, u.email,
            u.phone, u.is_active, u.last_login, u.created_at,
            r.name as role_name, b.branch_name, b.id as branch_id
     FROM users u
     LEFT JOIN roles r ON u.role_id = r.id
     LEFT JOIN branches b ON u.branch_id = b.id
     WHERE u.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: result.rows[0],
  });
});

/**
 * Update user
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { first_name, last_name, phone, role_id, branch_id, is_active } = req.body;

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

  if (phone !== undefined) {
    updateFields.push(`phone = $${paramCount++}`);
    params.push(phone);
  }

  if (role_id !== undefined) {
    updateFields.push(`role_id = $${paramCount++}`);
    params.push(role_id);
  }

  if (branch_id !== undefined) {
    updateFields.push(`branch_id = $${paramCount++}`);
    params.push(branch_id);
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
    `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User updated successfully',
    data: result.rows[0],
  });
});

/**
 * Delete user
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Prevent deleting self
  if (parseInt(id) === req.user.id) {
    throw new AppError('Cannot delete your own user account', HTTP_STATUS.BAD_REQUEST);
  }

  const result = await query(
    'UPDATE users SET is_active = false, updated_at = NOW(), updated_by = $1 WHERE id = $2 RETURNING id',
    [req.user.id, id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User deactivated successfully',
  });
});