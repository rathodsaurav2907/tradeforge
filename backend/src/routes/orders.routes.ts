import { Router } from 'express';
import { OrdersController } from '../controllers/orders.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateOrderInput } from '../middleware/validation.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', validateOrderInput, OrdersController.placeOrder);
router.get('/', OrdersController.getOrders);
router.delete('/:id', OrdersController.cancelOrder);

export default router;
