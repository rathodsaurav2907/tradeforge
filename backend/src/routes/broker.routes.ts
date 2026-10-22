import { Router } from 'express';
import { BrokerController } from '../controllers/broker.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/status', BrokerController.getStatus);
router.post('/mode', BrokerController.setMode);
router.post('/connect', BrokerController.connect);
router.get('/funds', BrokerController.getFunds);
router.get('/positions', BrokerController.getPositions);
router.get('/holdings', BrokerController.getHoldings);
router.post('/orders', BrokerController.placeOrder);
router.post('/square-off', BrokerController.squareOffPosition);
router.post('/kill-switch', BrokerController.triggerKillSwitch);
router.get('/risk-settings', BrokerController.getRiskSettings);
router.post('/risk-settings', BrokerController.updateRiskSettings);
router.post('/unlock-kill-switch', BrokerController.unlockKillSwitch);

export default router;
