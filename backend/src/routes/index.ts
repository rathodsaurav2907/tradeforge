import { Router } from 'express';
import authRoutes from './auth.routes';
import marketRoutes from './market.routes';
import ordersRoutes from './orders.routes';
import portfolioRoutes from './portfolio.routes';
import analyticsRoutes from './analytics.routes';
import watchlistRoutes from './watchlist.routes';
import journalRoutes from './journal.routes';
import brokerRoutes from './broker.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/market', marketRoutes);
router.use('/orders', ordersRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/watchlists', watchlistRoutes);
router.use('/journal', journalRoutes);
router.use('/broker', brokerRoutes);

export default router;
