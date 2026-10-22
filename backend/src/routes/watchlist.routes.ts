import { Router } from 'express';
import { WatchlistController } from '../controllers/watchlist.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', WatchlistController.getWatchlists);
router.post('/', WatchlistController.createWatchlist);
router.post('/:id/symbols', WatchlistController.addSymbol);
router.delete('/:id/symbols/:symbol', WatchlistController.removeSymbol);
router.delete('/:id', WatchlistController.deleteWatchlist);

export default router;
