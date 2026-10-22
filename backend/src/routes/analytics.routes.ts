import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';

const router = Router();

router.get('/signals/:symbol', AnalyticsController.getSignals);
router.get('/indicators/:symbol', AnalyticsController.getIndicators);
router.get('/smart-score/:symbol', AnalyticsController.getSmartScore);
router.get('/portfolio-risk', AnalyticsController.getPortfolioRisk);

export default router;
