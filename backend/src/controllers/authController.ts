import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import AuthService from '../services/authService';
import { HTTP_STATUS } from '../constants/errors';

/**
 * User login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', HTTP_STATUS.BAD_REQUEST);
  }

  const result = await AuthService.login(email, password);

  res.status(HTTP_STATUS.OK).json(result);
});

/**
 * Get current user
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await AuthService.getCurrentUser(req.user.id);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: user,
  });
});

/**
 * Change password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    throw new AppError('All fields are required', HTTP_STATUS.BAD_REQUEST);
  }

  if (newPassword !== confirmPassword) {
    throw new AppError('Passwords do not match', HTTP_STATUS.BAD_REQUEST);
  }

  if (newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters', HTTP_STATUS.BAD_REQUEST);
  }

  await AuthService.changePassword(req.user.id, oldPassword, newPassword);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Password changed successfully',
  });
});

/**
 * Refresh token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const payload = AuthService.verifyRefreshToken(refreshToken);
    const newToken = AuthService.generateToken(payload);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      token: newToken,
    });
  } catch (error: any) {
    throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
  }
});

/**
 * Logout (handled on client)
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Logout successful',
  });
});