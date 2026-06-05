import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import LoanService from '../services/loanService';
import { HTTP_STATUS } from '../constants';

const loanService = new LoanService();

/**
 * Create loan application
 */
export const createLoan = asyncHandler(async (req: Request, res: Response) => {
  const loanData = {
    ...req.body,
    branch_id: (req as any).user.branch_id,
    loan_officer_id: (req as any).user.id,
    created_by: (req as any).user.id,
  };

  const loan = await loanService.createLoan(loanData);

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Loan application created successfully',
    data: loan,
  });
});

/**
 * Get loan by ID
 */
export const getLoan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const loan = await loanService.getLoanById(parseInt(id));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: loan,
  });
});

/**
 * Get all loans
 */
export const getAllLoans = asyncHandler(async (req: Request, res: Response) => {
  const { status, branch_id } = req.query;
  const branchId = branch_id ? parseInt(branch_id as string) : (req as any).user.branch_id;

  const loans = await loanService.getAllLoans(
    status as string,
    branchId
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: loans,
    total: loans.length,
  });
});

/**
 * Get loans by borrower
 */
export const getLoansByBorrower = asyncHandler(async (req: Request, res: Response) => {
  const { borrowerId } = req.params;
  const loans = await loanService.getLoansByBorrower(parseInt(borrowerId));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: loans,
    total: loans.length,
  });
});

/**
 * Appraise loan
 */
export const appraiseLoan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const appraisal = await loanService.appraiseLoan(
    parseInt(id),
    req.body,
    (req as any).user.id
  );

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Loan appraisal created successfully',
    data: appraisal,
  });
});

/**
 * Approve loan
 */
export const approveLoan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { approvedAmount, approvalComments } = req.body;

  if (!approvedAmount) {
    throw new AppError('Approved amount is required', HTTP_STATUS.BAD_REQUEST);
  }

  const loan = await loanService.approveLoan(
    parseInt(id),
    approvedAmount,
    approvalComments,
    (req as any).user.id
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Loan approved successfully',
    data: loan,
  });
});

/**
 * Reject loan
 */
export const rejectLoan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  const loan = await loanService.rejectLoan(
    parseInt(id),
    reason || '',
    (req as any).user.id
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Loan rejected successfully',
    data: loan,
  });
});

/**
 * Disburse loan
 */
export const disburseLoan = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { disbursementDate } = req.body;

  if (!disbursementDate) {
    throw new AppError('Disbursement date is required', HTTP_STATUS.BAD_REQUEST);
  }

  const loan = await loanService.disburseLoan(
    parseInt(id),
    new Date(disbursementDate),
    (req as any).user.id
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Loan disbursed successfully',
    data: loan,
  });
});

/**
 * Get loan schedule
 */
export const getLoanSchedule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const schedule = await loanService.getLoanSchedule(parseInt(id));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: schedule,
    total: schedule.length,
  });
});

/**
 * Get loan outstanding balance
 */
export const getLoanBalance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const balance = await loanService.getLoanOutstandingBalance(parseInt(id));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: balance,
  });
});
