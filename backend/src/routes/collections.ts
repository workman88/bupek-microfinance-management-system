import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as collectionController from '../controllers/collectionController';

const router = Router();

router.use(authenticateToken);

router.post('/', collectionController.createCollection);
router.get('/overdue-loans', collectionController.getOverdueLoans);
router.get('/portfolio-at-risk', collectionController.getPortfolioAtRisk);
router.get('/loan/:loanId', collectionController.getCollectionsByLoan);
router.post('/:collectionId/notes', collectionController.addCollectionNote);
router.get('/:collectionId/notes', collectionController.getCollectionNotes);
router.put('/:collectionId/status', collectionController.updateCollectionStatus);

export default router;
