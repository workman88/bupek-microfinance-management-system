import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import CollectionService from '../services/collectionService';
import { HTTP_STATUS } from '../constants/errors';

const collectionService = new CollectionService();

/**
 * Create collection record
 */
export const createCollection = asyncHandler(async (req: Request, res: Response) => {
  const { loan_id, borrower_id, collection_date, days_overdue, overdue_amount, arrears_amount } = req.body;

  if (!loan_id || !borrower_id || !collection_date) {
    throw new AppError('Missing required fields', HTTP_STATUS.BAD_REQUEST);
  }

  const collection = await collectionService.createCollection(
    {
      loan_id,
      borrower_id,
      collection_date,
      days_overdue,
      overdue_amount,
      arrears_amount,
    },
    req.user.id
  );

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Collection record created successfully',
    data: collection,
  });
});

/**
 * Get collections by loan
 */
export const getCollectionsByLoan = asyncHandler(async (req: Request, res: Response) => {
  const { loanId } = req.params;
  const collections = await collectionService.getCollectionsByLoan(parseInt(loanId));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: collections,
    total: collections.length,
  });
});

/**
 * Get overdue loans
 */
export const getOverdueLoans = asyncHandler(async (req: Request, res: Response) => {
  const { branch_id } = req.query;
  const branchId = branch_id ? parseInt(branch_id as string) : req.user.branch_id;

  const overdueLoans = await collectionService.getOverdueLoans(branchId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: overdueLoans,
    total: overdueLoans.length,
  });
});

/**
 * Get portfolio at risk
 */
export const getPortfolioAtRisk = asyncHandler(async (req: Request, res: Response) => {
  const { branch_id } = req.query;
  const branchId = branch_id ? parseInt(branch_id as string) : req.user.branch_id;

  const par = await collectionService.getPortfolioAtRisk(branchId);

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: par,
  });
});

/**
 * Add collection note
 */
export const addCollectionNote = asyncHandler(async (req: Request, res: Response) => {
  const { collectionId } = req.params;
  const { notes, follow_up_date } = req.body;

  if (!notes) {
    throw new AppError('Notes are required', HTTP_STATUS.BAD_REQUEST);
  }

  const note = await collectionService.addCollectionNote(
    parseInt(collectionId),
    notes,
    follow_up_date ? new Date(follow_up_date) : null,
    req.user.id
  );

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Collection note added successfully',
    data: note,
  });
});

/**
 * Get collection notes
 */
export const getCollectionNotes = asyncHandler(async (req: Request, res: Response) => {
  const { collectionId } = req.params;
  const notes = await collectionService.getCollectionNotes(parseInt(collectionId));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: notes,
    total: notes.length,
  });
});

/**
 * Update collection status
 */
export const updateCollectionStatus = asyncHandler(async (req: Request, res: Response) => {
  const { collectionId } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new AppError('Status is required', HTTP_STATUS.BAD_REQUEST);
  }

  const collection = await collectionService.updateCollectionStatus(
    parseInt(collectionId),
    status
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Collection status updated successfully',
    data: collection,
  });
});