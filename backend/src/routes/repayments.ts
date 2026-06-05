import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as repaymentController from '../controllers/repaymentController';

const router = Router();

router.use(authenticateToken);

router.post('/', repaymentController.recordRepayment);
router.get('/:id', repaymentController.getRepaymentById);
router.get('/loan/:loanId', repaymentController.getRepaymentsByLoan);
router.get('/borrower/:borrowerId', repaymentController.getRepaymentsByBorrower);
router.get('/loan/:loanId/total-repaid', repaymentController.getTotalRepaid);

export default router;
