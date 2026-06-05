import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/connection';
import logger from '../config/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const REFRESH_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '7d';

export class AuthService {
  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  static generateToken(payload: any): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION,
    });
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload: any): string {
    return jwt.sign(payload, REFRESH_SECRET, {
      expiresIn: REFRESH_EXPIRATION,
    });
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      throw new Error('Invalid token');
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, REFRESH_SECRET);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * User login
   */
  static async login(email: string, password: string): Promise<any> {
    const result = await query(
      `SELECT u.*, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.email = $1 AND u.is_active = true`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];
    const passwordMatch = await this.comparePassword(password, user.password_hash);

    if (!passwordMatch) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    const payload = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role_name,
      branch_id: user.branch_id,
    };

    const token = this.generateToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role_name,
        branch_id: user.branch_id,
      },
      token,
      refreshToken,
    };
  }

  /**
   * Get current user
   */
  static async getCurrentUser(userId: number): Promise<any> {
    const result = await query(
      `SELECT u.*, r.name as role_name, b.branch_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN branches b ON u.branch_id = b.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role_name,
      branch_id: user.branch_id,
      branch_name: user.branch_name,
    };
  }

  /**
   * Change password
   */
  static async changePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];
    const passwordMatch = await this.comparePassword(oldPassword, user.password_hash);

    if (!passwordMatch) {
      throw new Error('Old password is incorrect');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );

    logger.info(`[Auth] Password changed for user ${userId}`);
  }

  /**
   * Reset password
   */
  static async resetPassword(email: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);

    const result = await query(
      'UPDATE users SET password_hash = $1, password_reset_required = false, updated_at = NOW() WHERE email = $2 RETURNING id',
      [hashedPassword, email]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    logger.info(`[Auth] Password reset for user ${result.rows[0].id}`);
  }

  /**
   * Create user
   */
  static async createUser(userData: any): Promise<any> {
    const hashedPassword = await this.hashPassword(userData.password);

    const result = await query(
      `INSERT INTO users (
        employee_id, first_name, last_name, email, phone,
        password_hash, role_id, branch_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, first_name, last_name`,
      [
        userData.employee_id || `EMP${Date.now()}`,
        userData.first_name,
        userData.last_name,
        userData.email,
        userData.phone,
        hashedPassword,
        userData.role_id,
        userData.branch_id,
        userData.created_by,
      ]
    );

    if (result.rows.length === 0) {
      throw new Error('Failed to create user');
    }

    logger.info(`[Auth] User created: ${result.rows[0].email}`);
    return result.rows[0];
  }
}

export default AuthService;