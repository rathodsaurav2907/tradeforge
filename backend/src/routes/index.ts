import { Router } from 'express';
import authRoutes from './auth.routes';
import marketRoutes from './market.routes';
import ordersRoutes from './orders.routes';
import portfolioRoutes from './portfolio.routes';
import analyticsRoutes from './analytics.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/market', marketRoutes);
router.use('/orders', ordersRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
