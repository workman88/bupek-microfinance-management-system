import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import RepaymentService from '../services/repaymentService';
import { HTTP_STATUS } from '../constants/errors';

const repaymentService = new RepaymentService();

/**
 * Record repayment
 */
export const recordRepayment = asyncHandler(async (req: Request, res: Response) => {
  const { loan_id, amount_paid, repayment_date, payment_method, reference_number } = req.body;

  if (!loan_id || !amount_paid || !repayment_date) {
    throw new AppError('Missing required fields', HTTP_STATUS.BAD_REQUEST);
  }

  const repayment = await repaymentService.recordRepayment(
    {
      loan_id,
      amount_paid,
      repayment_date,
      payment_method,
      reference_number,
    },
    req.user.id
  );

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Repayment recorded successfully',
    data: repayment,
  });
});

/**
 * Get repayments by loan
 */
export const getRepaymentsByLoan = asyncHandler(async (req: Request, res: Response) => {
  const { loanId } = req.params;
  const repayments = await repaymentService.getRepaymentsByLoan(parseInt(loanId));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: repayments,
    total: repayments.length,
  });
});

/**
 * Get repayments by borrower
 */
export const getRepaymentsByBorrower = asyncHandler(async (req: Request, res: Response) => {
  const { borrowerId } = req.params;
  const repayments = await repaymentService.getRepaymentsByBorrower(parseInt(borrowerId));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: repayments,
    total: repayments.length,
  });
});

/**
 * Get repayment by ID
 */
export const getRepaymentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const repayment = await repaymentService.getRepaymentById(parseInt(id));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: repayment,
  });
});

/**
 * Get total repaid for loan
 */
export const getTotalRepaid = asyncHandler(async (req: Request, res: Response) => {
  const { loanId } = req.params;
  const totalRepaid = await repaymentService.getTotalRepaid(parseInt(loanId));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: totalRepaid,
  });
});