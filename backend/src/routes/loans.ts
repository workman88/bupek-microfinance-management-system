import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as loanController from '../controllers/loanController';

const router = Router();

router.use(authenticateToken);

router.post('/', loanController.createLoan);
router.get('/', loanController.getAllLoans);
router.get('/:id', loanController.getLoan);
router.get('/:id/schedule', loanController.getLoanSchedule);
router.get('/:id/balance', loanController.getLoanBalance);
router.post('/:id/appraise', loanController.appraiseLoan);
router.post('/:id/approve', loanController.approveLoan);
router.post('/:id/reject', loanController.rejectLoan);
router.post('/:id/disburse', loanController.disburseLoan);
router.get('/borrower/:borrowerId', loanController.getLoansByBorrower);

export default router;
