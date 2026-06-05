/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Error Messages
 */
export const ErrorMessages = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  BAD_REQUEST: 'Invalid request',
  INVALID_TOKEN: 'Invalid or expired token',
  TOKEN_REQUIRED: 'Authentication token required',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  DATABASE_ERROR: 'Database operation failed',
  VALIDATION_ERROR: 'Validation failed',
};

/**
 * User Roles
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  OFFICER: 'officer',
  VIEWER: 'viewer',
};

/**
 * Loan Status
 */
export const LOAN_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DISBURSED: 'disbursed',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DEFAULTED: 'defaulted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

/**
 * Repayment Status
 */
export const REPAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  PARTIAL: 'partial',
  OVERDUE: 'overdue',
  DEFAULTED: 'defaulted',
};

/**
 * Collection Status
 */
export const COLLECTION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RECOVERED: 'recovered',
  WRITTEN_OFF: 'written_off',
};

/**
 * Payment Methods
 */
export const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  CHEQUE: 'cheque',
  MOBILE_MONEY: 'mobile_money',
};

/**
 * Repayment Frequency
 */
export const REPAYMENT_FREQUENCY = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  ANNUALLY: 'annually',
};
