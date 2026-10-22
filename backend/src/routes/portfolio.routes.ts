import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolio.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/summary', PortfolioController.getSummary);
router.get('/ledger', PortfolioController.getLedger);

export default router;
