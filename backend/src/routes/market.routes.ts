import { Router } from 'express';
import { MarketController } from '../controllers/market.controller';

const router = Router();

router.get('/quotes', MarketController.getQuotes);
router.get('/quotes/:symbol', MarketController.getQuoteBySymbol);
router.get('/bars/:symbol', MarketController.getHistoricalBars);
router.get('/orderbook/:symbol', MarketController.getOrderBook);

export default router;
